"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Coach {
    id: number;
    firstname: string;
    lastname: string;
    image_id: number | null;
    teams: string | null;
    email?: string;
}

export default function AdminCoachesList({ initialCoaches }: { initialCoaches: any[] }) {
    const [search, setSearch] = useState("");

    const filteredCoaches = useMemo(() => {
        if (!search.trim()) return initialCoaches;
        const s = search.toLowerCase();
        return initialCoaches.filter(c =>
            c.firstname.toLowerCase().includes(s) ||
            c.lastname.toLowerCase().includes(s) ||
            c.teams?.toLowerCase().includes(s)
        );
    }, [search, initialCoaches]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <i className="fas fa-search"></i>
                    </span>
                    <input
                        type="text"
                        placeholder="Rechercher un coach par nom, prénom ou équipe..."
                        className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:border-sbc focus:ring-1 focus:ring-sbc outline-none transition"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white md:rounded-xl md:shadow-sm md:border border-gray-100 overflow-hidden">
                {/* Desktop Table View */}
                <table className="w-full text-left border-collapse hidden md:table">
                    <thead>
                        <tr className="bg-gray-50 border-bottom border-gray-100">
                            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Coach</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Équipes assignées</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredCoaches.length > 0 ? (
                            filteredCoaches.map((coach) => (
                                <tr key={coach.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-100">
                                                {coach.image_id ? (
                                                    <img src={`/api/image/${coach.image_id}`} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <i className="fas fa-user-tie"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{coach.lastname.toUpperCase()} {coach.firstname}</p>
                                                <p className="text-xs text-gray-400">ID: #{coach.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {coach.teams ? (
                                            <div className="flex flex-wrap gap-2">
                                                {coach.teams.split(', ').map((team: string, i: number) => (
                                                    <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase border border-gray-200">
                                                        {team}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">Aucune équipe</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/coaches/${coach.id}`}
                                            className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50 hover:text-sbc transition shadow-sm"
                                        >
                                            <i className="fas fa-edit text-xs"></i> Modifier
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : null}
                    </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {filteredCoaches.length > 0 ? (
                        filteredCoaches.map((coach) => (
                            <div key={coach.id} className="p-4 flex items-center justify-between gap-4 active:bg-gray-50 transition">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                                        {coach.image_id ? (
                                            <img src={`/api/image/${coach.image_id}`} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <i className="fas fa-user-tie text-xl"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 truncate tracking-tight">{coach.lastname.toUpperCase()} {coach.firstname}</p>
                                        <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                            {coach.teams || "Sans équipe"}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={`/admin/coaches/${coach.id}`}
                                    className="w-10 h-10 rounded-full bg-sbc/10 text-sbc flex items-center justify-center flex-shrink-0"
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </Link>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-gray-500 italic">
                            Aucun coach trouvé
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
