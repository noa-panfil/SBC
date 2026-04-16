"use client";

import React, { useEffect, useState } from 'react';

export default function AdminCoachPlanningManager() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return <div className="text-gray-500 font-medium">Chargement des disponibilités...</div>;
  }

  if (data.length === 0) {
    return <div className="text-gray-500 bg-gray-50 px-6 py-8 rounded-2xl border border-gray-100 text-center font-medium">Aucune disponibilité n'a encore été renseignée.</div>;
  }

  return (
    <div className="space-y-6">
      {data.map((coach: any) => {
        // Group slots by day
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(grouped).map(([day, slots]) => (
                <div key={day} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">{day}</h4>
                  <div className="space-y-2">
                    {slots.sort((a,b) => a.start_time.localeCompare(b.start_time)).map((slot: any) => (
                      <div key={slot.id} className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium border ${slot.is_unavailable ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                        <span>{slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</span>
                        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md ${slot.is_unavailable ? 'bg-red-100' : 'bg-green-100'}`}>
                          {slot.is_unavailable ? 'Indispo' : 'Dispo'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(grouped).length === 0 && (
                <div className="col-span-full text-sm text-gray-500 italic">Aucun créneau sélectionné.</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
