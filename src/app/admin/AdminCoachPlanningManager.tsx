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
  const [highlightCoachId, setHighlightCoachId] = useState<number | 'global'>('global');

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

  // Mode "Par Créneau" - Aide à l'attribution (Vue Planning Visuel)
  const renderBySlot = () => {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
            <i className="far fa-calendar-alt text-sbc"></i>
            Planning Global (Demandes)
          </h3>
          <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-wider bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
            <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-green-100 border border-green-400"></div> 1 Demande</span>
            <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-100 border border-red-500"></div> Superposition</span>
            <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-300 shadow-inner"></div> Libre</span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-6">
          <div className="text-sm font-bold text-gray-600 flex items-center gap-2">
             <i className="fas fa-filter text-sbc"></i> Mettre en évidence :
          </div>
          <select 
             value={highlightCoachId} 
             onChange={(e) => setHighlightCoachId(e.target.value === 'global' ? 'global' : Number(e.target.value))}
             className="w-full md:w-max min-w-[250px] bg-white border border-gray-300 text-gray-900 text-sm rounded-xl px-4 py-2 cursor-pointer focus:ring-2 focus:ring-sbc outline-none font-medium shadow-sm transition-all"
          >
             <option value="global">🌍 Global (Tous les coachs)</option>
             {data.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.team})</option>
             ))}
          </select>
        </div>

        <p className="text-sm text-gray-500 mb-6 font-medium">Ce tableau affiche uniquement les horaires <strong>IDÉAUX (Verts)</strong> demandés par les coachs. S'il y a plusieurs coachs sur le même créneau, la case devient <strong className="text-red-500">rouge</strong> pour signaler la superposition.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {DAYS.map(day => (
            <div key={day.id} className="flex flex-col bg-gray-50 rounded-2xl p-3 border border-gray-200">
              <h4 className="text-center font-black text-gray-900 uppercase tracking-widest pb-3 mb-3 border-b border-gray-200 sticky top-0 bg-gray-50 z-10 pt-1">
                {day.label}
              </h4>
              
              <div className="flex flex-col gap-2">
                {daySlots[day.id].map((slot: any) => {
                  const dispos: any[] = [];
                  const indispos: any[] = [];

                  data.forEach(coach => {
                    const s = coach.slots.find((st: any) => st.day_of_week === day.id && st.start_time.startsWith(slot.start));
                    if (s) {
                       if (!s.is_unavailable) { dispos.push(coach); }
                       else { indispos.push(coach); }
                    }
                  });

                  // Déduire le style de la case (basé uniquement sur les dispos ou superpositions)
                  let boxStyle = "bg-white border-gray-200 text-gray-400 shadow-sm"; 
                  if (dispos.length === 1) boxStyle = "bg-green-50 border-green-300 text-green-800 shadow-sm ring-1 ring-green-500/20";
                  if (dispos.length > 1) boxStyle = "bg-red-50 border-red-400 text-red-900 shadow-sm ring-2 ring-red-500";

                  return (
                    <div key={slot.start} className={`flex flex-col py-2 px-3 rounded-xl border transition-all ${boxStyle}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-xs font-bold opacity-80">{slot.start}</span>
                        {dispos.length > 1 && (
                          <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <i className="fas fa-exclamation-triangle"></i> {dispos.length}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1 mt-1">
                        {dispos.map(c => {
                          const isHighlighted = highlightCoachId === 'global' || highlightCoachId === c.id;
                          return (
                          <div key={`d-${c.id}`} className={`text-[10px] font-black px-1.5 py-1 rounded border flex flex-col leading-tight transition-all duration-300 ${isHighlighted ? 'bg-white/90 border-black/10 shadow-sm' : 'bg-white/30 border-transparent opacity-20 grayscale'}`}>
                            <span>{c.team}</span>
                            <span className="opacity-70 font-bold">{c.first_name} {c.last_name[0]}.</span>
                          </div>
                        )})}
                      </div>
                      
                      {indispos.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-black/10 flex flex-wrap gap-1">
                          {indispos.map(c => {
                             const isHighlighted = highlightCoachId === 'global' || highlightCoachId === c.id;
                             return (
                             <span key={`i-${c.id}`} title={`Coach ${c.first_name} ${c.last_name}`} className={`text-[8px] font-bold px-1 py-0.5 rounded border line-through leading-none tracking-tight transition-all duration-300 ${isHighlighted ? 'bg-red-100 text-red-700 border-red-200 opacity-80' : 'bg-gray-100 text-gray-400 border-transparent opacity-20 grayscale'}`}>
                               {c.first_name} {c.last_name[0]}.
                             </span>
                          )})}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
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
