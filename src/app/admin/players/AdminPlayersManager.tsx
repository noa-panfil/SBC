"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Player {
    id: number;
    firstname: string;
    lastname: string;
    birthdate: string | null;
    gender: string;
    image_id: number | null;
    teams: string | null;
}

export default function AdminPlayersManager({ initialPlayers }: { initialPlayers: any[] }) {
    const [search, setSearch] = useState("");

    const filteredPlayers = useMemo(() => {
        if (!search.trim()) return initialPlayers;
        const s = search.toLowerCase();
        return initialPlayers.filter(p =>
            p.firstname.toLowerCase().includes(s) ||
            p.lastname.toLowerCase().includes(s) ||
            p.teams?.toLowerCase().includes(s)
        );
    }, [search, initialPlayers]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <i className="fas fa-search"></i>
                    </span>
                    <input
                        type="text"
                        placeholder="Rechercher un joueur par nom, prénom ou équipe..."
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
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joueur</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Équipes</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Genre / Né en</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredPlayers.length > 0 ? (
                            filteredPlayers.slice(0, 100).map((player) => (
                                <tr key={player.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                                {player.image_id ? (
                                                    <img src={`/api/image/${player.image_id}`} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <i className="fas fa-user"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{player.lastname.toUpperCase()} {player.firstname}</p>
                                                <p className="text-xs text-gray-400">ID: #{player.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600 italic">
                                            {player.teams || "Aucune équipe"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mr-2 ${player.gender === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {player.gender}
                                            </span>
                                            {player.birthdate ? new Date(player.birthdate).toLocaleDateString('fr-FR') : 'Non renseigné'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/players/${player.id}`}
                                            className="inline-flex items-center gap-2 bg-sbc text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-sbc-dark transition shadow-sm"
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
                    {filteredPlayers.length > 0 ? (
                        filteredPlayers.slice(0, 100).map((player) => (
                            <div key={player.id} className="p-4 flex items-center justify-between gap-4 active:bg-gray-50 transition">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                                        {player.image_id ? (
                                            <img src={`/api/image/${player.image_id}`} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <i className="fas fa-user text-xl"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 truncate tracking-tight">{player.lastname.toUpperCase()} {player.firstname}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${player.gender === 'F' ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'}`}>
                                                {player.gender}
                                            </span>
                                            <p className="text-xs text-gray-400 italic truncate max-w-[120px]">
                                                {player.teams || "Sans équipe"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    href={`/admin/players/${player.id}`}
                                    className="w-10 h-10 rounded-full bg-sbc/10 text-sbc flex items-center justify-center flex-shrink-0"
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </Link>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-gray-500 italic">
                            Aucun joueur trouvé
                        </div>
                    )}
                </div>

                {filteredPlayers.length > 100 && (
                    <div className="px-6 py-4 text-center text-[10px] uppercase font-bold tracking-widest text-gray-400 bg-gray-50 border-t border-gray-100">
                        Limite de 100 résultats
                    </div>
                )}
            </div>
        </div>
    );
}
