"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

function PlayerSelector({ players, value, onChange, label }: { players: any[], value: string, onChange: (val: string) => void, label: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isKnown = players.some(p => p.fullname === value);
    const selectedPlayer = players.find(p => p.fullname === value);
    const showInput = isTyping || (value && !isKnown);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (val: string) => {
        if (val === '___CUSTOM___') {
            setIsTyping(true);
            onChange('');
            setIsOpen(false);
        } else {
            onChange(val);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            {label}
            {showInput ? (
                <div className="flex items-center gap-2 animate-fade-in mt-1">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                        <i className="fas fa-user-edit text-xs"></i>
                    </div>
                    <input
                        className="w-full text-sm font-bold text-gray-900 border-b-2 border-sbc outline-none py-1 bg-transparent placeholder-gray-300"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder="Saisir Prénom Nom..."
                        autoFocus
                    />
                    <button
                        onClick={() => { setIsTyping(false); onChange(''); }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Revenir à la liste"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            ) : (
                <div className="relative mt-1">
                    <button
                        className="w-full text-left flex items-center justify-between py-1 border-b border-gray-100 hover:border-gray-300 transition-colors group"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            {value ? (
                                <>
                                    {selectedPlayer?.image_id ? (
                                        <img src={`/api/image/${selectedPlayer.image_id}`} className="w-6 h-6 rounded-full object-cover border border-gray-200 shadow-sm" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-sbc/10 text-sbc flex items-center justify-center text-xs font-bold border border-sbc/20">
                                            {selectedPlayer ? selectedPlayer.fullname.charAt(0) : value.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-sm font-bold text-gray-900 truncate group-hover:text-sbc transition-colors">{value}</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100"></div>
                                    <span className="text-sm text-gray-400 italic">Sélectionner...</span>
                                </>
                            )}
                        </div>
                        <i className={`fas fa-chevron-down text-xs text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                    </button>

                    {isOpen && (
                        <div className="absolute z-50 left-0 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                            {players.map((p, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                                    onClick={() => handleSelect(p.fullname)}
                                >
                                    {p.image_id ? (
                                        <img src={`/api/image/${p.image_id}`} className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-sm" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold">
                                            {p.fullname.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{p.fullname}</p>
                                        <p className="text-[10px] text-gray-400 truncate">{p.team}</p>
                                    </div>
                                </div>
                            ))}
                            <div
                                className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 cursor-pointer text-sbc font-bold bg-gray-50/50 sticky bottom-0 backdrop-blur-sm"
                                onClick={() => handleSelect('___CUSTOM___')}
                            >
                                <div className="w-8 h-8 rounded-full bg-sbc/10 flex items-center justify-center border border-sbc/20">
                                    <i className="fas fa-pen text-sbc text-xs"></i>
                                </div>
                                <span className="text-sm">Autre (Saisir un nom)</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function CoachOTMManager({ matches, myTeamNames, players, currentUser, coachImageId }: { matches: any[], myTeamNames: string[], players?: any[], currentUser?: string, coachImageId?: number | null }) {
    const router = useRouter();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const selectablePlayers = [
        ...(currentUser ? [{ fullname: currentUser, team: "Moi (Coach)", image_id: coachImageId }] : []),
        ...(players || [])
    ];

    const handleEdit = (match: any) => {
        console.log("Editing match ID:", match.id);
        setEditingId(match.id);
        setEditForm(match);
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/otm/${editForm.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm)
            });

            if (!res.ok) throw new Error("Failed");

            setEditingId(null);
            router.refresh();
        } catch (e) {
            alert("Erreur lors de la sauvegarde");
        } finally {
            setLoading(false);
        }
    };

    const groupedMatches = matches.reduce((acc: any, match) => {
        const date = new Date(match.match_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        if (!acc[date]) acc[date] = [];
        acc[date].push(match);
        return acc;
    }, {});

    return (
        <div className="space-y-12">
            {Object.entries(groupedMatches).map(([date, dateMatches]: [string, any]) => (
                <div key={date} className="relative">
                    <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-30 py-3 mb-6 border-b border-gray-200">
                        <h3 className="text-xl font-black text-gray-800 capitalize flex items-center gap-3">
                            <span className="w-2 h-8 bg-sbc rounded-r-md"></span>
                            {date}
                        </h3>
                    </div>
                    <div className="grid gap-6">
                        {dateMatches.map((match: any) => {
                            const isTargeted = myTeamNames.some(name => match.category === name || (match.designation && match.designation.includes(name)));
                            return (
                                <div key={match.id} className={`rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow group ${isTargeted ? 'bg-green-50/60 border-sbc ring-1 ring-sbc' : 'bg-white border-gray-100'}`}>
                                    <div className="grid grid-cols-1 lg:grid-cols-12">
                                        <div className={`lg:col-span-4 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r relative overflow-hidden ${isTargeted ? 'bg-green-100/30 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sbc to-blue-400 opacity-20"></div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <span className="bg-green-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">{match.category}</span>
                                                    <span className="font-mono text-[10px] text-gray-500 bg-white px-2 py-1 rounded border border-gray-200" title="Code Rencontre">
                                                        <span className="font-bold text-gray-300 mr-1">CODE MATCH:</span>
                                                        {match.match_code}
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Adversaire</p>
                                                    <h4 className="text-xl font-black text-gray-900 leading-tight uppercase">{match.opponent}</h4>
                                                </div>

                                                <div className="flex flex-col gap-2 pt-2">
                                                    <div className="flex items-center gap-3 text-gray-700 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                                        <div className="w-8 h-8 rounded-full bg-sbc/10 flex items-center justify-center text-sbc shrink-0">
                                                            <i className="fas fa-clock"></i>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] uppercase font-bold text-gray-400">Heure du Match</p>
                                                            <p className="font-black text-lg">{match.match_time}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-sbc bg-sbc/5 p-3 rounded-xl border border-sbc/10 shadow-sm">
                                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sbc shrink-0 shadow-sm">
                                                            <i className="fas fa-map-marker-alt"></i>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] uppercase font-bold text-sbc/60">Rendez-vous (OTM)</p>
                                                            <p className="font-black text-lg">{match.meeting_time}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 flex flex-wrap gap-2 text-xs">
                                                <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-bold shadow-sm ${match.is_white_jersey
                                                    ? 'bg-white border border-gray-200 text-gray-500'
                                                    : 'bg-green-50 border border-green-200 text-green-700'
                                                    }`}>
                                                    <i className="fas fa-tshirt"></i>
                                                    {match.is_white_jersey ? 'Maillots Blancs' : 'Maillots Verts'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-8 p-6 relative">
                                            <div className="flex justify-between items-center mb-6">
                                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                                    <i className="fas fa-users text-gray-400"></i>
                                                    Officiels de Table
                                                </h4>
                                                {!editingId && myTeamNames.some(name => match.category === name || (match.designation && match.designation.includes(name))) && (
                                                    <button
                                                        onClick={() => handleEdit(match)}
                                                        className="group-hover:bg-sbc group-hover:text-white bg-gray-100 text-gray-500 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                                                    >
                                                        <i className="fas fa-edit"></i> Modifier
                                                    </button>
                                                )}
                                                {match.designation && (
                                                    <span className="text-[10px] font-bold text-sbc bg-sbc/10 px-3 py-1.5 rounded-lg border border-sbc/20 max-w-[250px] truncate flex items-center gap-1.5" title={match.designation}>
                                                        <i className="fas fa-users-cog"></i>
                                                        <span className="opacity-70 font-medium">Équipe OTM:</span>
                                                        <span className="uppercase">{match.designation.replace("Table = 2 Joueurs/Parents ", "")}</span>
                                                    </span>
                                                )}
                                            </div>

                                            {editingId === match.id ? (
                                                <div className="bg-gray-50 rounded-2xl p-6 border border-sbc/20 animate-fade-in relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-16 h-16 bg-sbc opacity-5 rounded-bl-full pointer-events-none"></div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {[
                                                            { label: "Marqueur", key: "scorer", icon: "fa-pen" },
                                                            { label: "Chronométreur", key: "timer", icon: "fa-stopwatch" },
                                                            { label: "Resp. Salle", key: "hall_manager", icon: "fa-building" },
                                                            { label: "Buvette", key: "bar_manager", icon: "fa-coffee" },
                                                            { label: "Arbitre", key: "referee", icon: "fa-whistle" },
                                                        ].map(field => (
                                                            <div key={field.key} className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                                                                <PlayerSelector
                                                                    players={selectablePlayers}
                                                                    value={editForm[field.key] || ''}
                                                                    onChange={(val) => setEditForm({ ...editForm, [field.key]: val })}
                                                                    label={
                                                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-2">
                                                                            <i className={`fas ${field.icon} opacity-50`}></i> {field.label}
                                                                        </label>
                                                                    }
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-end gap-3 mt-6">
                                                        <button onClick={handleCancel} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 uppercase transition-colors">Annuler</button>
                                                        <button onClick={handleSave} disabled={loading} className="bg-sbc text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-sbc-dark shadow-lg shadow-sbc/20 transition-all transform active:scale-95 disabled:opacity-70 flex items-center gap-2">
                                                            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                                                            Enregistrer
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                    {[
                                                        { label: "Marqueur", val: match.scorer, icon: "fa-pen" },
                                                        { label: "Chronométreur", val: match.timer, icon: "fa-stopwatch" },
                                                        { label: "Resp. Salle", val: match.hall_manager, icon: "fa-building" },
                                                        { label: "Bar / Buvette", val: match.bar_manager, icon: "fa-coffee" },
                                                        { label: "Arbitre Club", val: match.referee, icon: "fa-gavel" },
                                                    ].map((item, i) => (
                                                        <div key={i} className={`p-4 rounded-xl border transition-all duration-200 ${item.val ? 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm' : 'bg-gray-50/50 border-transparent border-dashed'}`}>
                                                            <div className="flex items-start justify-between mb-2">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{item.label}</span>
                                                                <i className={`fas ${item.icon} text-xs ${item.val ? 'text-sbc' : 'text-gray-200'}`}></i>
                                                            </div>
                                                            {item.val ? (
                                                                <p className="text-sm font-bold text-gray-900 capitalize">{item.val}</p>
                                                            ) : (
                                                                <p className="text-xs italic text-gray-400 flex items-center gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> À définir
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
            {matches.length === 0 && (
                <div className="text-center py-20 px-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-calendar-times text-gray-300 text-2xl"></i>
                    </div>
                    <h3 className="text-gray-900 font-bold mb-1">Aucun match OTM</h3>
                    <p className="text-gray-400 text-sm">Le calendrier est vide pour le moment.</p>
                </div>
            )}
        </div>
    );
}
