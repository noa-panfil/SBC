"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

type SlotState = 'neutral' | 'available' | 'unavailable';

const DAYS = [
  { id: 'Monday', label: 'Lundi', start: '17:00', end: '22:30' },
  { id: 'Tuesday', label: 'Mardi', start: '17:00', end: '22:30' },
  { id: 'Wednesday', label: 'Mercredi', start: '15:30', end: '22:30' },
  { id: 'Thursday', label: 'Jeudi', start: '17:00', end: '22:30' },
  { id: 'Friday', label: 'Vendredi', start: '17:00', end: '22:30' },
  { id: 'Saturday', label: 'Samedi', start: '08:30', end: '12:00' }
];

function generateTimeSlots(start: string, end: string) {
  const slots = [];
  let [h, m] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  while (h < endH || (h === endH && m < endM)) {
    const nextM = m + 15;
    let nextH = h;
    let finalM = nextM;
    if (nextM >= 60) {
      nextH += 1;
      finalM -= 60;
    }
    const currentStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    const nextStr = `${nextH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`;
    slots.push({ start: currentStr, end: nextStr, timeInt: h * 60 + m });
    h = nextH;
    m = finalM;
  }
  return slots;
}

export default function PlanningApp() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [team, setTeam] = useState('');

  // selections[day][timeStart] = SlotState
  const [selections, setSelections] = useState<Record<string, Record<string, SlotState>>>({});
  const [brushMode, setBrushMode] = useState<SlotState>('available');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Configuration par jour
  const daySlots = useMemo(() => {
    const obj: any = {};
    DAYS.forEach(d => {
      obj[d.id] = generateTimeSlots(d.start, d.end);
    });
    return obj;
  }, []);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 5000);
  };

  const handleSlotToggle = (day: string, timeStart: string, timeInt: number) => {
    setSelections(prev => {
      const dayData = prev[day] || {};
      const currentState = dayData[timeStart] || 'neutral';

      const nextState = brushMode;
      if (currentState === nextState) return prev;

      if (nextState === 'available') {
        const nextDayData = { ...dayData, [timeStart]: 'available' };
        const availableSlots = Object.entries(nextDayData).filter(([k, v]) => v === 'available');

        if (availableSlots.length > 6) {
          showError("Maximum 1h30 (6 créneaux) consécutifs par jour.");
          return prev;
        }

        const times = availableSlots.map(([k]) => {
          const s = daySlots[day].find((ds: any) => ds.start === k);
          return s.timeInt;
        }).sort((a, b) => a - b);

        if (times.length > 1) {
          const isConsecutive = (times[times.length - 1] - times[0]) === (times.length - 1) * 15;
          if (!isConsecutive) {
            showError("Les créneaux de disponibilité doivent être consécutifs.");
            return prev;
          }
        }

        const preAvailableCount = Object.keys(prev).filter(d =>
          Object.values(prev[d] || {}).some(v => v === 'available')
        ).length;

        const isCurrentDayAlreadyHavingAvail = Object.values(dayData).some(v => v === 'available');

        if (!isCurrentDayAlreadyHavingAvail && preAvailableCount >= 3) {
          showError("Vous ne pouvez sélectionner des disponibilités que sur 3 jours maximum.");
          return prev;
        }
      }

      return { ...prev, [day]: { ...dayData, [timeStart]: nextState } };
    });
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !team.trim()) {
      showError("Veuillez remplir vos Nom, Prénom et Équipe avant de valider.");
      return;
    }

    const payloadSlots: any[] = [];
    Object.entries(selections).forEach(([day, times]) => {
      Object.entries(times).forEach(([startTime, state]) => {
        if (state !== 'neutral') {
          const slotDef = daySlots[day].find((s: any) => s.start === startTime);
          payloadSlots.push({
            dayOfWeek: day,
            startTime: startTime + ":00",
            endTime: slotDef.end + ":00",
            isUnavailable: state === 'unavailable'
          });
        }
      });
    });

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/coach-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, team, slots: payloadSlots })
      });

      if (!res.ok) throw new Error("Erreur serveur");

      setIsSuccess(true);
      window.scrollTo(0, 0);
    } catch (e) {
      showError("Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSlotStyles = (state: SlotState) => {
    switch (state) {
      case 'available':
        return "bg-green-100 text-green-700 border-green-300 ring-2 ring-green-500 ring-inset shadow-inner";
      case 'unavailable':
        return "bg-red-50 text-red-600 border-red-200 line-through opacity-70";
      default:
        return "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300";
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center transform transition-all">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <i className="fas fa-check text-4xl"></i>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Merci, {firstName} !</h1>
          <p className="text-gray-500 font-medium leading-relaxed">Vos disponibilités ont bien été enregistrées pour la saison prochaine.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-20 overflow-x-hidden p-4 md:p-8">
      {errorMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-xl border border-red-500 animate-fade-in font-bold flex items-center gap-3">
          <i className="fas fa-exclamation-triangle"></i>
          {errorMsg}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 md:space-y-10">

        {/* Header (DA SBC) */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/90 backdrop-blur-md sticky top-0 md:top-4 z-40 p-6 md:rounded-2xl shadow-sm border-b md:border border-gray-100 uppercase">
          <div className="w-full md:w-auto">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <i className="fas fa-calendar-alt text-sbc"></i>
              Planning Coach
            </h1>
            <p className="text-xs md:text-sm text-gray-500 font-bold mt-1 tracking-wider">
              Saison Prochaine
            </p>
          </div>
          <div className="flex bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-xs md:text-sm font-bold border border-orange-100 items-center gap-2">
            <i className="fas fa-info-circle"></i> Max 6 créneaux (1h30) / jour & 3 jours diff.
          </div>
        </header>

        {/* Règles d'utilisation */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 md:p-5 flex items-start gap-4">
          <div className="mt-1 bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
            <i className="fas fa-hands-helping"></i>
          </div>
          <div>
            <h4 className="text-blue-900 font-bold mb-1">Règles de sélection des disponibilités :</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside font-medium opacity-90">
              <li>Vous pouvez sélectionner <strong className="text-blue-900 font-black">au maximum 6 créneaux de 15 minutes</strong> consécutifs par jour (soit 1h30 d'entraînement).</li>
              <li>Vous ne pouvez être disponible que sur <strong className="text-blue-900 font-black">3 jours différents au maximum</strong> dans la semaine.</li>
              <li>Utilisez le mode "Indisponible" pour indiquer librement tous les autres créneaux où vous ne pourrez absolument pas entraîner.</li>
            </ul>
          </div>
        </div>

        {/* Section Informations */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center text-sbc">
              <i className="fas fa-id-card mr-3"></i>
              Vos informations
            </h2>
            <div className="h-px flex-grow bg-gray-100"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-medium">
            <div className="space-y-2">
              <label className="text-sm text-gray-500 ml-1">Prénom</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sbc/50 focus:border-sbc transition-all text-gray-900"
                placeholder="Ex: Jean" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-500 ml-1">Nom</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sbc/50 focus:border-sbc transition-all text-gray-900"
                placeholder="Ex: Dupont" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-500 ml-1">Équipe visée</label>
              <input type="text" value={team} onChange={e => setTeam(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sbc/50 focus:border-sbc transition-all text-gray-900"
                placeholder="Ex: U15 Filles" />
            </div>
          </div>
        </section>

        {/* Section Créneaux avec Affichage global des jours */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center text-orange-600">
                <i className="fas fa-clock mr-3"></i>
                Vos Disponibilités
              </h2>
              <div className="h-px flex-grow bg-gray-100 hidden md:block w-32"></div>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200 overflow-x-auto w-full md:w-auto">
              <button
                onClick={() => setBrushMode('available')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${brushMode === 'available' ? 'bg-white text-green-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <div className="w-3 h-3 rounded-sm bg-green-100 border border-green-400"></div> Disponible
              </button>
              <button
                onClick={() => setBrushMode('unavailable')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${brushMode === 'unavailable' ? 'bg-white text-red-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <div className="w-3 h-3 rounded-sm bg-red-100 border border-red-300"></div> Indisponible
              </button>
              <button
                onClick={() => setBrushMode('neutral')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${brushMode === 'neutral' ? 'bg-white text-gray-800 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <div className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300"></div> Effacer
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-8 font-medium bg-gray-50 p-4 rounded-xl border border-gray-100">
            <span className="font-bold text-gray-700 underline decoration-orange-400 decoration-2 underline-offset-2">Comment faire ?</span><br />
            1. Sélectionnez l'action dans la barre (Disponible, Indisponible ou Effacer).<br />
            2. Cliquez sur les horaires dans le calendrier pour colorier vos créneaux. <br />
            <em className="opacity-75 block mt-2 text-xs"><i className="fas fa-asterisk text-orange-500 mr-1"></i>Rappel : Pour les "Dispos", vous êtes limités à 6 créneaux consécutifs (1h30) sur 3 jours max.</em>
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
            {DAYS.map(day => (
              <div key={day.id} className="flex flex-col bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm">
                <h3 className="text-center font-black text-gray-900 uppercase tracking-widest pb-3 mb-3 border-b border-gray-200 flex items-center justify-center gap-2">
                  <i className="far fa-calendar text-gray-400"></i>
                  {day.label}
                </h3>

                <div className="flex flex-col gap-2">
                  {daySlots[day.id].map((slot: any) => {
                    const state = (selections[day.id] || {})[slot.start] || 'neutral';
                    const dynamicStyles = getSlotStyles(state);

                    return (
                      <button
                        key={`${day.id}-${slot.start}`}
                        onClick={() => handleSlotToggle(day.id, slot.start, slot.timeInt)}
                        className={`w-full py-2 px-3 rounded-xl text-sm font-bold border transition-all duration-150 flex items-center justify-between ${dynamicStyles}`}
                      >
                        <span className="font-mono">{slot.start}</span>
                        {state === 'neutral' && <i className="fas fa-plus text-[10px] text-gray-300"></i>}
                        {state === 'available' && <i className="fas fa-check text-[10px] text-green-600"></i>}
                        {state === 'unavailable' && <i className="fas fa-times text-[10px] text-red-500"></i>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bouton de Validation */}
        <div className="flex justify-center md:justify-end pt-4 pb-12">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full md:w-auto bg-sbc hover:bg-sbc-dark text-white font-black py-4 px-10 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center text-lg uppercase tracking-wider"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-3"></i> Validation...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-3"></i> Enregistrer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
