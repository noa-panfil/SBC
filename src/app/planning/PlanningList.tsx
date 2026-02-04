"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Match {
    id: number;
    match_date: string;
    match_time: string;
    category: string;
    designation: string;
    match_type: string;
    opponent: string;
    is_white_jersey: boolean;
    is_featured?: boolean;
}

export default function PlanningList({ matches }: { matches: Match[] }) {
    const [filter, setFilter] = useState('');

    // Group matches by month
    const groupedMatches = matches.reduce((acc, match) => {
        const date = new Date(match.match_date);
        const key = format(date, 'MMMM yyyy', { locale: fr });
        if (!acc[key]) acc[key] = [];
        acc[key].push(match);
        return acc;
    }, {} as Record<string, Match[]>);

    const filteredMatches = matches.filter(m =>
        m.category.toLowerCase().includes(filter.toLowerCase()) ||
        m.opponent.toLowerCase().includes(filter.toLowerCase())
    );

    // If filtering, don't group by month, just show list. If not, show grouped.
    const isFiltering = filter.length > 0;

    return (
        <div>
            {/* Search Bar */}
            <div className="mb-12 flex justify-center sticky top-24 z-30">
                <div className="relative w-full max-w-md group">
                    <div className="absolute inset-0 bg-sbc blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                    <div className="relative bg-gray-800 border border-white/10 rounded-full flex items-center p-2 shadow-2xl">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                            <i className="fas fa-search"></i>
                        </div>
                        <input
                            type="text"
                            placeholder="Rechercher une équipe, un adversaire..."
                            className="bg-transparent border-none outline-none text-white px-4 flex-1 font-bold placeholder-gray-500"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {matches.length === 0 && (
                <div className="text-center py-20">
                    <div className="inline-block p-6 rounded-full bg-gray-800 mb-4">
                        <i className="fas fa-calendar-times text-4xl text-gray-600"></i>
                    </div>
                    <p className="text-gray-400 font-bold text-lg">Aucun match prévu pour le moment.</p>
                </div>
            )}

            {isFiltering ? (
                <div className="grid gap-4">
                    {filteredMatches.length === 0 && (
                        <div className="text-center py-10 text-gray-500 font-bold">Aucun résultat trouvé pour "{filter}"</div>
                    )}
                    {filteredMatches.map(match => <MatchCard key={match.id} match={match} />)}
                </div>
            ) : (
                <div className="space-y-16">
                    {Object.entries(groupedMatches).map(([month, monthMatches]) => (
                        <div key={month} className="relative">
                            <div className="sticky top-24 z-20 bg-gray-900/95 backdrop-blur py-4 mb-6 border-b border-white/10 flex items-center gap-4">
                                <div className="w-2 h-8 bg-sbc rounded-full"></div>
                                <h3 className="text-2xl font-black text-white capitalize italic tracking-tight">{month}</h3>
                                <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-gray-400">{monthMatches.length} Matchs</span>
                            </div>
                            <div className="grid gap-4">
                                {monthMatches.map(match => <MatchCard key={match.id} match={match} />)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function MatchCard({ match }: { match: Match }) {
    const date = new Date(match.match_date);
    const isFeatured = !!match.is_featured;

    return (
        <div className={`group relative rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl overflow-hidden border ${isFeatured ? 'bg-gray-900 border-sbc shadow-[0_0_30px_rgba(34,197,94,0.15)] z-10 scale-[1.02] hover:shadow-[0_0_50px_rgba(34,197,94,0.3)]' : 'bg-gray-800 hover:bg-gray-700 border-white/5 hover:border-sbc/50'}`}>
            {/* Background Decor */}
            {isFeatured && <div className="absolute inset-0 bg-gradient-to-r from-sbc/10 to-transparent opacity-50 blur-xl"></div>}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-16 -mt-16 transition ${isFeatured ? 'bg-sbc/20' : 'bg-white/5 group-hover:bg-sbc/10'}`}></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                {/* Date Badge */}
                <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border transition-colors shadow-lg shrink-0 ${isFeatured ? 'bg-sbc text-black border-sbc' : 'bg-gray-900 border-white/10 group-hover:border-sbc'}`}>
                    <span className={`text-2xl font-black ${isFeatured ? 'text-black' : 'text-white'}`}>{date.getDate()}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isFeatured ? 'text-black' : 'text-sbc'}`}>{format(date, 'MMM', { locale: fr })}</span>
                </div>

                {/* Match Info */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1">
                        {isFeatured && (
                            <span className="inline-block bg-sbc text-black px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest self-center md:self-start animate-pulse">
                                <i className="fas fa-fire mr-1"></i> A la une
                            </span>
                        )}
                        {match.match_type !== 'Championnat' && (
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded self-center md:self-start ${match.match_type === 'Coupe' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                {match.match_type}
                            </span>
                        )}
                    </div>
                    <h3 className="text-3xl font-black text-white italic leading-tight mb-2">
                        {match.category} <span className="text-sbc mx-2 text-xl font-black italic align-middle">VS</span> <span className="text-gray-300">{match.opponent}</span>
                    </h3>
                    <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500 font-bold">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-map-marker-alt text-gray-600 group-hover:text-sbc transition-colors"></i>
                            Salle Jesse Owens
                        </div>
                        {match.is_white_jersey ? (
                            <div className="flex items-center gap-1.5" title="Maillot Blanc">
                                <span className="w-3 h-3 rounded-full bg-white border border-gray-500"></span> Blancs
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5" title="Maillot Vert">
                                <span className="w-3 h-3 rounded-full bg-sbc border border-transparent"></span> Verts
                            </div>
                        )}
                    </div>
                </div>

                {/* Action / Status */}
                {/* Time Display */}
                <div className="hidden md:block shrink-0 text-right">
                    <span className="text-5xl font-black text-white/10 font-mono tracking-tighter group-hover:text-sbc/20 transition-colors">
                        {match.match_time.slice(0, 5)}
                    </span>
                </div>
            </div>
        </div>
    )
}
