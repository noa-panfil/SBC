"use client";

import React, { useEffect, useState, useMemo } from 'react';

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

export default function AdminCoachPlanningManager() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'coachs' | 'creneaux'>('creneaux');

  useEffect(() => {
    fetch('/api/admin/coach-planning')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setIsLoading(false);
      })
      .catch(e => {
        console.error(e);
        setIsLoading(false);
      });
  }, []);

  const daySlots = useMemo(() => {
    const obj: any = {};
    DAYS.forEach(d => {
      obj[d.id] = generateTimeSlots(d.start, d.end);
    });
    return obj;
  }, []);

  // Mode "Par Créneau" - Aide à l'attribution
  const renderBySlot = () => {
    return (
      <div className="space-y-12">
        {DAYS.map(day => (
          <div key={day.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-widest mb-6 pb-4 border-b border-gray-200 flex items-center gap-3">
              <i className="far fa-calendar-alt text-sbc"></i>
              {day.label}
            </h3>
            
            <div className="space-y-3">
              {daySlots[day.id].map((slot: any) => {
                // Trouver les coachs pour ce créneau
                const dispos: any[] = [];
                const indispos: any[] = [];
                const neutres: any[] = [];

                data.forEach(coach => {
                  const s = coach.slots.find((st: any) => st.day_of_week === day.id && st.start_time.startsWith(slot.start));
                  if (!s) {
                    neutres.push(coach);
                  } else if (s.is_unavailable) {
                    indispos.push(coach);
                  } else {
                    dispos.push(coach);
                  }
                });

                return (
                  <div key={slot.start} className="flex flex-col lg:flex-row border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors bg-gray-50/50">
                    <div className="bg-gray-100 px-6 py-4 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-200 lg:w-48 shrink-0 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-sbc rounded-l-2xl"></div>
                      <span className="text-lg font-black text-gray-900 font-mono tracking-tighter">
                        {slot.start} - {slot.end}
                      </span>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                      {/* Disponibles */}
                      <div className="p-4 bg-white">
                        <div className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-3 flex items-center gap-1.5 bg-green-50 w-max px-2 py-1 rounded-md">
                          <i className="fas fa-check-circle"></i> Disponibles réels ({dispos.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {dispos.length === 0 ? <span className="text-xs text-gray-400 italic">Aucun</span> : dispos.map(c => (
                            <span key={c.id} className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-lg border border-green-200">
                              {c.first_name} {c.last_name[0]}. <span className="opacity-75 font-medium ml-1">({c.team})</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Neutres (Libres) */}
                      <div className="p-4 bg-white">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 bg-gray-100 w-max px-2 py-1 rounded-md">
                          <i className="far fa-square"></i> Neutres (Attribuables) ({neutres.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {neutres.length === 0 ? <span className="text-xs text-gray-400 italic">Aucun</span> : neutres.map(c => (
                            <span key={c.id} className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                              {c.first_name} {c.last_name[0]}.
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Indisponibles */}
                      <div className="p-4 bg-red-50/20">
                        <div className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3 flex items-center gap-1.5 bg-red-50 w-max px-2 py-1 rounded-md">
                          <i className="fas fa-times-circle"></i> Indisponibles ({indispos.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {indispos.length === 0 ? <span className="text-xs text-gray-400 italic">Aucun</span> : indispos.map(c => (
                            <span key={c.id} className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-lg border border-red-200 line-through decoration-red-300 opacity-70">
                              {c.first_name} {c.last_name[0]}.
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };



  const renderByCoach = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.map((coach: any) => {
          const grouped: Record<string, any[]> = {};
          coach.slots.forEach((s: any) => {
            if (!grouped[s.day_of_week]) grouped[s.day_of_week] = [];
            grouped[s.day_of_week].push(s);
          });

          return (
            <div key={coach.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-rose-500/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900">{coach.first_name} {coach.last_name}</h3>
                  <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mt-1">Équipe: {coach.team}</p>
                </div>
                <div className="text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                  {new Date(coach.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(grouped).map(([day, slots]) => {
                  const dayObj = DAYS.find(d => d.id === day);
                  if(!dayObj) return null;
                  return (
                    <div key={day} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                        <i className="far fa-calendar text-gray-400"></i> {dayObj.label}
                      </h4>
                      <div className="space-y-1.5">
                        {slots.sort((a,b) => a.start_time.localeCompare(b.start_time)).map((slot: any) => (
                          <div key={slot.id} className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium border ${slot.is_unavailable ? 'bg-red-50 text-red-700 border-red-100 line-through opacity-80' : 'bg-green-50 text-green-700 border-green-100'}`}>
                            <span className="font-mono">{slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</span>
                            {slot.is_unavailable ? <i className="fas fa-times-circle text-[10px]"></i> : <i className="fas fa-check-circle text-[10px]"></i>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(grouped).length === 0 && (
                  <div className="col-span-full text-sm text-gray-500 italic bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">Aucun créneau sélectionné.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400">
        <i className="fas fa-circle-notch fa-spin text-4xl mb-4 text-sbc"></i>
        <p className="font-bold tracking-widest uppercase text-sm">Chargement du planning...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="text-gray-500 bg-gray-50 px-6 py-8 rounded-2xl border border-gray-100 text-center justify-center flex font-bold tracking-widest uppercase text-sm">Aucune disponibilité n'a été trouvée.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 overflow-x-auto gap-2 w-full md:w-max mx-auto shadow-sm">
        <button 
          onClick={() => setActiveTab('creneaux')} 
          className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'creneaux' ? 'bg-white text-sbc shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <i className="fas fa-columns"></i> Vue Globale (Créneaux)
        </button>
        <button 
          onClick={() => setActiveTab('coachs')} 
          className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'coachs' ? 'bg-white text-orange-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <i className="fas fa-user-friends"></i> Fiches Coachs
        </button>
      </div>

      {activeTab === 'creneaux' && renderBySlot()}
      {activeTab === 'coachs' && renderByCoach()}
    </div>
  );
}
