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
    is_home: boolean;
    location?: string;
}

export default function PlanningList({ matches }: { matches: Match[] }) {
    const [filter, setFilter] = useState('');

    // Group matches by month
    const filteredMatches = matches.filter(m =>
        m.category.toLowerCase().includes(filter.toLowerCase()) ||
        m.opponent.toLowerCase().includes(filter.toLowerCase())
    );

    // Group filtered matches by month
    const groupedMatches = filteredMatches.reduce((acc, match) => {
        const date = new Date(match.match_date);
        const key = format(date, 'MMMM yyyy', { locale: fr });
        if (!acc[key]) acc[key] = [];
        acc[key].push(match);
        return acc;
    }, {} as Record<string, Match[]>);

    // If filtering, don't group by month, just show list. If not, show grouped.
    const isFiltering = filter.length > 0;

    return (
        <div>
            {/* Search Bar */}
            <div className="mb-12 flex justify-center sticky top-24 z-30">
                <div className="relative w-full max-w-md group">
                    <div className="absolute inset-0 bg-sbc blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                    <div className="relative bg-white border border-gray-200 rounded-full flex items-center p-2 shadow-xl">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <i className="fas fa-search"></i>
                        </div>
                        <input
                            type="text"
                            placeholder="Rechercher une équipe, un adversaire..."
                            className="bg-transparent border-none outline-none text-gray-800 px-4 flex-1 font-bold placeholder-gray-400"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {matches.length === 0 && (
                <div className="text-center py-20">
                    <div className="inline-block p-6 rounded-full bg-gray-100 mb-4">
                        <i className="fas fa-calendar-times text-4xl text-gray-400"></i>
                    </div>
                    <p className="text-gray-500 font-bold text-lg">Aucun match prévu pour le moment.</p>
                </div>
            )}

            <div className="space-y-16">
                {Object.entries(groupedMatches).length === 0 && (
                    <div className="text-center py-10 text-gray-500 font-bold">Aucun résultat trouvé{filter && ` pour "${filter}"`}</div>
                )}
                {Object.entries(groupedMatches).map(([month, monthMatches]) => (
                    <div key={month} className="relative">
                        <div className="sticky top-24 z-20 bg-white/95 backdrop-blur py-4 mb-6 border-b border-gray-200 flex items-center gap-4">
                            <div className="w-2 h-8 bg-sbc rounded-full"></div>
                            <h3 className="text-2xl font-black text-gray-800 capitalize italic tracking-tight">{month}</h3>
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-500 border border-gray-200">{monthMatches.length} Matchs</span>
                        </div>
                        <div className="grid gap-4">
                            {monthMatches.map(match => (
                                <MatchCard key={`${match.id}-${match.is_home ? 'home' : 'away'}`} match={match} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MatchCard({ match }: { match: Match }) {
    const date = new Date(match.match_date);
    const isFeatured = !!match.is_featured;
    const isHome = match.is_home;

    const cleanTeamName = (name: string) => {
        if (!name) return "";
        return name
            .split('(')[0]
            .replace(/\s+-\s+.*/, '')
            .replace(/-(\d+.*)/, '')
            .trim();
    };

    return (
        <div className={`group relative rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl overflow-hidden border ${isFeatured ? 'bg-green-50 border-sbc shadow-md z-10 scale-[1.02]' : isHome ? 'bg-white hover:bg-gray-50 border-gray-200' : 'bg-gray-50/50 hover:bg-white border-gray-100'}`}>
            {/* Background Decor */}
            {isFeatured && <div className="absolute inset-0 bg-gradient-to-r from-sbc/10 to-transparent opacity-50 blur-xl"></div>}

            {/* Context Icon Background */}
            <div className="absolute -bottom-6 -right-6 text-9xl opacity-5 transform rotate-12 pointer-events-none">
                <i className={`fas ${isHome ? 'fa-home' : 'fa-plane'}`}></i>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                {/* Date Badge */}
                <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border transition-colors shadow-sm shrink-0 ${isFeatured ? 'bg-sbc text-white border-sbc' : isHome ? 'bg-white border-gray-200 group-hover:border-sbc' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                    <span className={`text-2xl font-black ${isFeatured ? 'text-white' : 'text-gray-800'}`}>{date.getDate()}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isFeatured ? 'text-white' : 'text-sbc'}`}>{format(date, 'MMM', { locale: fr })}</span>
                </div>

                {/* Match Info */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1">
                        {isFeatured && (
                            <span className="inline-block bg-sbc text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest self-center md:self-start animate-pulse">
                                <i className="fas fa-fire mr-1"></i> A la une
                            </span>
                        )}
                        {isHome ? (
                            <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest self-center md:self-start border border-green-200">
                                <i className="fas fa-home mr-1"></i> Domicile
                            </span>
                        ) : (
                            <span className="inline-block bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest self-center md:self-start border border-gray-200">
                                <i className="fas fa-plane mr-1"></i> Extérieur
                            </span>
                        )}
                        {match.match_type !== 'Championnat' && (
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded self-center md:self-start ${match.match_type === 'Coupe' ? 'bg-yellow-100 text-yellow-600 border border-yellow-200' : 'bg-blue-100 text-blue-600 border border-blue-200'}`}>
                                {match.match_type}
                            </span>
                        )}
                    </div>
                    <h3 className="text-3xl font-black text-gray-800 italic leading-tight mb-2 flex flex-col md:block">
                        {isHome ? (
                            <>
                                <span className="text-sbc">{match.category}</span>
                                <span className="text-gray-300 mx-2 text-xl font-black italic align-middle">VS</span>
                                <span className="text-gray-500">{cleanTeamName(match.opponent)}</span>
                            </>
                        ) : (
                            <>
                                <span className="text-gray-500">{cleanTeamName(match.opponent)}</span>
                                <span className="text-gray-300 mx-2 text-xl font-black italic align-middle">VS</span>
                                <span className="text-sbc">{match.category}</span>
                            </>
                        )}
                    </h3>
                    <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500 font-bold">
                        <div className="flex items-center gap-2">
                            <i className={`fas fa-map-marker-alt ${isHome ? 'text-gray-400 group-hover:text-sbc' : 'text-gray-300'}`}></i>
                            {isHome ? "Salle Jesse Owens" : (match.location || "Extérieur")}
                        </div>
                        {isHome && (
                            match.is_white_jersey ? (
                                <div className="flex items-center gap-1.5" title="Maillot Blanc">
                                    <span className="w-3 h-3 rounded-full bg-white border border-gray-300 shadow-sm"></span> Blancs
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5" title="Maillot Vert">
                                    <span className="w-3 h-3 rounded-full bg-sbc border border-transparent shadow-sm"></span> Verts
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Time Display */}
                <div className="hidden md:block shrink-0 text-right">
                    <span className="text-5xl font-black text-sbc/20 font-mono tracking-tighter group-hover:text-sbc transition-colors duration-300">
                        {match.match_time.slice(0, 5)}
                    </span>
                </div>
            </div>
        </div>
    )
}
