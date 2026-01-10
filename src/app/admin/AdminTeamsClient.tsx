"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Member {
    person_id?: number;
    name: string;
    role?: string;
    num?: number;
    img: string | null;
    birth: string | null;
    sexe: string;
    // Local processing fields
    image_id?: number | null;
    isNew?: boolean;
    birthISO?: string | null; // For API
}

interface Team {
    id: string;
    name: string;
    category: string;
    image: string | null;
    image_id?: number; // Helper for banner update
    schedule: string;
    widgetId: string;
    coaches: Member[];
    players: Member[];
}

export default function AdminTeamsClient({ teams }: { teams: Team[] }) {
    const router = useRouter();
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Draft State
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [deletedMemberIds, setDeletedMemberIds] = useState<number[]>([]);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Helper: Convert DD/MM/YYYY to YYYY-MM-DD
    const toISO = (dateStr: string | null) => {
        if (!dateStr) return "";
        const parts = dateStr.split('/');
        if (parts.length !== 3) return "";
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    // Helper: Convert YYYY-MM-DD to DD/MM/YYYY
    const toDisplay = (isoStr: string) => {
        if (!isoStr) return "";
        const parts = isoStr.split('-');
        if (parts.length !== 3) return "";
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    // Sync selectedTeam to editingTeam when opening modal
    useEffect(() => {
        if (selectedTeam) {
            // Deep copy & Initialize birthISO
            const deepCopy = JSON.parse(JSON.stringify(selectedTeam));

            // Pre-fill birthISO for players
            deepCopy.players.forEach((p: Member) => {
                p.birthISO = toISO(p.birth);
            });
            // Pre-fill birthISO for coaches (just in case)
            deepCopy.coaches.forEach((c: Member) => {
                c.birthISO = toISO(c.birth);
            });

            setEditingTeam(deepCopy);
            setDeletedMemberIds([]);
            setIsEditing(false);
        } else {
            setEditingTeam(null);
        }
    }, [selectedTeam]);

    const handleUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            return data.id as number;
        } catch (e) {
            showNotification("Erreur lors de l'upload de l'image", 'error');
            console.error(e);
            return null;
        }
    };

    const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingTeam || !e.target.files?.[0]) return;
        const file = e.target.files[0];

        // 1. Immediate Preview
        const previewUrl = URL.createObjectURL(file);
        setEditingTeam(prev => prev ? ({ ...prev, image: previewUrl }) : null);

        // 2. Upload in background
        const newImageId = await handleUpload(file);
        if (newImageId) {
            setEditingTeam(prev => prev ? ({ ...prev, image_id: newImageId }) : null);
        }
    };

    const handleMemberImageChange = async (index: number, type: 'players' | 'coaches', e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingTeam || !e.target.files?.[0]) return;
        const file = e.target.files[0];

        // 1. Immediate Preview
        const previewUrl = URL.createObjectURL(file);

        setEditingTeam(prev => {
            if (!prev) return null;
            const list = type === 'players' ? [...prev.players] : [...prev.coaches];
            list[index] = { ...list[index], img: previewUrl };
            return { ...prev, [type]: list };
        });

        // 2. Upload in background
        const newImageId = await handleUpload(file);
        if (newImageId) {
            setEditingTeam(prev => {
                if (!prev) return null;
                const list = type === 'players' ? [...prev.players] : [...prev.coaches];
                list[index] = { ...list[index], image_id: newImageId };
                return { ...prev, [type]: list };
            });
        }
    };

    const handleMemberChange = (index: number, type: 'players' | 'coaches', field: keyof Member, value: any) => {
        setEditingTeam(prev => {
            if (!prev) return null;
            const list = type === 'players' ? [...prev.players] : [...prev.coaches];
            list[index] = { ...list[index], [field]: value };
            return { ...prev, [type]: list };
        });
    };

    const handleDeleteMember = (index: number, type: 'players' | 'coaches') => {
        if (!editingTeam) return;
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) return;

        const list = type === 'players' ? [...editingTeam.players] : [...editingTeam.coaches];
        const member = list[index];

        if (member.person_id) {
            setDeletedMemberIds(prev => [...prev, member.person_id!]);
        }

        list.splice(index, 1);
        setEditingTeam({ ...editingTeam, [type]: list });
    };

    const handleAddPlayer = () => {
        if (!editingTeam) return;
        const newPlayer: Member = {
            name: "Nouveau Joueur",
            num: 0,
            role: "Joueur",
            img: null,
            birth: null,
            sexe: "M",
            isNew: true
        };
        setEditingTeam({ ...editingTeam, players: [...editingTeam.players, newPlayer] });
    };

    const saveChanges = async () => {
        if (!editingTeam) return;

        try {
            const payload = {
                teamId: editingTeam.id,
                bannerId: editingTeam.image_id,
                category: editingTeam.category,
                schedule: editingTeam.schedule,
                deletedMemberIds,
                members: [...editingTeam.players, ...editingTeam.coaches]
            };

            const res = await fetch('/api/admin/teams/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showNotification("Modifications enregistrées avec succès !", 'success');
                setIsEditing(false);
                router.refresh();
                setSelectedTeam(null);
            } else {
                showNotification("Erreur lors de la sauvegarde.", 'error');
            }
        } catch (e) {
            console.error(e);
            showNotification("Erreur technique lors de la sauvegarde.", 'error');
        }
    };



    const handleDateChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingTeam) return;
        const val = e.target.value; // YYYY-MM-DD

        setEditingTeam(prev => {
            if (!prev) return null;
            const list = [...prev.players];
            list[index] = {
                ...list[index],
                birthISO: val,
                birth: toDisplay(val)
            };
            return { ...prev, players: list };
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 relative">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl text-white font-bold transition-all transform animate-bounce-in z-[100] flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} text-xl`}></i>
                    {notification.message}
                </div>
            )}

            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <i className="fas fa-basketball-ball text-sbc"></i> Gestion des Équipes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                    <div
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-sbc transition cursor-pointer flex items-center gap-4 group"
                    >
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex-shrink-0 overflow-hidden">
                            <img src={team.image || "/img/default-team.png"} alt={team.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow min-w-0">
                            <h3 className="font-bold text-gray-800 truncate group-hover:text-sbc transition">{team.name}</h3>
                            <p className="text-sm text-gray-500 truncate">{team.category}</p>
                        </div>
                        <div className="text-gray-400 group-hover:text-sbc">
                            <i className="fas fa-chevron-right"></i>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Détails */}
            {selectedTeam && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md z-50 flex items-center justify-center p-4 content-start"
                    onMouseDown={() => { if (!isEditing) setSelectedTeam(null); }}>
                    <div className="bg-white rounded-xl shadow-2xl w-[95%] max-w-[1600px] h-[90vh] overflow-hidden flex flex-col border border-gray-200 animate-fade-in-up"
                        onMouseDown={(e) => e.stopPropagation()}>

                        {/* Header Modal */}
                        <div className="bg-sbc p-4 flex items-center justify-between text-white shadow-md z-10">
                            <h3 className="text-xl md:text-2xl font-bold flex items-center gap-3">
                                {isEditing ? `Édition: ${editingTeam?.name}` : selectedTeam.name}
                                {isEditing && <span className="text-xs bg-yellow-400 text-sbc-dark px-2 py-1 rounded font-bold uppercase">Mode Édition</span>}
                            </h3>
                            <div className="flex items-center gap-3">
                                {isEditing ? (
                                    <>
                                        <button onClick={() => { setIsEditing(false); setEditingTeam(JSON.parse(JSON.stringify(selectedTeam))); }}
                                            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded text-sm font-bold transition">
                                            Annuler
                                        </button>
                                        <button onClick={saveChanges}
                                            className="bg-white text-sbc px-6 py-2 rounded shadow-lg hover:bg-gray-100 text-sm font-bold transition transform hover:scale-105">
                                            <i className="fas fa-save mr-2"></i> Enregistrer
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setIsEditing(true)} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded text-sm font-bold transition">
                                            <i className="fas fa-edit mr-2"></i> Éditer
                                        </button>
                                        <button onClick={() => setSelectedTeam(null)} className="text-white hover:text-gray-200 text-2xl px-2">
                                            &times;
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Body Modal */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-gray-50">
                            {editingTeam && (
                                <div className="flex flex-col lg:flex-row gap-8 h-full">
                                    {/* Left Column: Image & Info */}
                                    <div className="lg:w-1/3 flex flex-col gap-6">
                                        <div className="group relative rounded-lg shadow-md border border-gray-200 overflow-hidden bg-gray-100 flex-shrink-0">
                                            <img src={editingTeam.image || "/img/default-team.png"} className="w-full h-auto object-cover transition duration-300" alt={editingTeam.name} />
                                            {isEditing && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                                    onClick={() => bannerInputRef.current?.click()}>
                                                    <span className="text-white font-bold bg-sbc px-4 py-2 rounded-full"><i className="fas fa-camera mr-2"></i> Changer la photo</span>
                                                    <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerChange} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-white p-6 rounded-xl text-sm text-gray-700 border border-gray-200 shadow-sm space-y-3">
                                            <div className="flex items-center gap-3">
                                                <i className="fas fa-tag text-blue-500 text-xl w-8 text-center flex-shrink-0"></i>
                                                <span className="font-bold text-gray-900 w-24 flex-shrink-0">Catégorie:</span>
                                                {isEditing ? (
                                                    <input
                                                        className="flex-grow border-b border-gray-300 focus:border-sbc outline-none py-1 font-bold text-gray-800"
                                                        value={editingTeam.category || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setEditingTeam(prev => prev ? ({ ...prev, category: val }) : null);
                                                        }}
                                                    />
                                                ) : (
                                                    <span>{editingTeam.category}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <i className="fas fa-clock text-blue-500 text-xl w-8 text-center flex-shrink-0"></i>
                                                <span className="font-bold text-gray-900 w-24 flex-shrink-0">Horaires:</span>
                                                {isEditing ? (
                                                    <input
                                                        className="flex-grow border-b border-gray-300 focus:border-sbc outline-none py-1 text-gray-800"
                                                        value={editingTeam.schedule || ''}
                                                        placeholder="Ex: Mardi 18h - 20h"
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setEditingTeam(prev => prev ? ({ ...prev, schedule: val }) : null);
                                                        }}
                                                    />
                                                ) : (
                                                    <span>{editingTeam.schedule || 'Non communiqués'}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Staff & Players */}
                                    <div className="lg:w-2/3 flex flex-col gap-8 overflow-y-auto pr-2 pb-10">

                                        {/* Coaches Section */}
                                        <div className="bg-gray-100/50 p-6 rounded-2xl border border-gray-200/60">
                                            <h4 className="text-xl font-bold text-sbc-dark mb-4 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-sbc flex items-center justify-center text-white text-sm"><i className="fas fa-user-tie"></i></div>
                                                Staff Technique
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {editingTeam.coaches.map((coach, i) => (
                                                    <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                                                        {isEditing && (
                                                            <label className="absolute inset-0 z-10 cursor-pointer group-hover:bg-black/5 rounded-xl transition">
                                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMemberImageChange(i, 'coaches', e)} />
                                                            </label>
                                                        )}
                                                        <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-md relative">
                                                            {coach.img ? <img src={coach.img} className="w-full h-full object-cover" /> : <i className="fas fa-user text-gray-400 w-full h-full flex items-center justify-center"></i>}
                                                            {isEditing && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100"><i className="fas fa-camera"></i></div>}
                                                        </div>
                                                        <div className="flex-grow z-20">
                                                            {isEditing ? (
                                                                <input
                                                                    className="w-full font-bold text-gray-800 border-b border-gray-300 focus:border-sbc outline-none bg-transparent mb-1"
                                                                    value={coach.name}
                                                                    onChange={(e) => handleMemberChange(i, 'coaches', 'name', e.target.value)}
                                                                />
                                                            ) : (
                                                                <p className="font-bold text-gray-800 text-lg">{coach.name}</p>
                                                            )}
                                                            <p className="text-xs text-sbc font-bold uppercase tracking-wider">{coach.role}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Players Section */}
                                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex-grow flex flex-col">
                                            <div className="flex justify-between items-center mb-6">
                                                <h4 className="text-xl font-bold text-sbc-dark flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-sbc flex items-center justify-center text-white text-sm"><i className="fas fa-users"></i></div>
                                                    Effectif ({editingTeam.players.length})
                                                </h4>
                                                {isEditing && (
                                                    <button onClick={handleAddPlayer} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition flex items-center gap-2">
                                                        <i className="fas fa-plus"></i> Ajouter un joueur
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
                                                {editingTeam.players.map((player, i) => (
                                                    <div key={i} className={`flex flex-col items-center justify-center text-center gap-3 p-6 rounded-xl border transition group min-h-[160px] shadow-sm relative ${isEditing ? 'border-dashed border-gray-300 bg-gray-50' : 'border-gray-100 hover:border-sbc hover:bg-gray-50'}`}>

                                                        {isEditing && (
                                                            <button onClick={() => handleDeleteMember(i, 'players')} className="absolute top-2 right-2 text-red-400 hover:text-red-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition z-30">
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        )}

                                                        <div className="relative group/img cursor-pointer flex flex-col items-center">
                                                            {/* Player Image or Number if no image */}
                                                            <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-md relative mb-3">
                                                                {player.img ? (
                                                                    <img src={player.img} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-sbc text-white font-bold text-xl">
                                                                        {player.num || '-'}
                                                                    </div>
                                                                )}

                                                                {isEditing && (
                                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition z-20">
                                                                        <i className="fas fa-camera"></i>
                                                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleMemberImageChange(i, 'players', e)} />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {isEditing ? (
                                                                <input
                                                                    type="number"
                                                                    className="w-12 text-center bg-gray-100 border border-gray-200 rounded text-sm font-bold text-sbc outline-none"
                                                                    value={player.num || 0}
                                                                    onChange={(e) => handleMemberChange(i, 'players', 'num', parseInt(e.target.value))}
                                                                />
                                                            ) : (
                                                                <span className="font-mono font-bold text-sbc text-sm bg-gray-100 px-2 py-0.5 rounded">
                                                                    #{player.num || '-'}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 w-full z-20">
                                                            {isEditing ? (
                                                                <div className="flex flex-col gap-1 w-full">
                                                                    <input
                                                                        className="w-full text-center font-bold text-gray-800 text-sm border-b border-gray-300 focus:border-sbc outline-none bg-transparent"
                                                                        value={player.name}
                                                                        placeholder="Nom Prénom"
                                                                        onChange={(e) => handleMemberChange(i, 'players', 'name', e.target.value)}
                                                                    />
                                                                    <input
                                                                        type="date"
                                                                        className="w-full text-center text-xs text-gray-500 border-b border-gray-200 focus:border-sbc outline-none bg-transparent"
                                                                        value={player.birthISO || toISO(player.birth)}
                                                                        onChange={(e) => handleDateChange(i, e)}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <p className="font-bold text-gray-800 text-base truncate w-full">{player.name}</p>
                                                                    {player.birth && <p className="text-xs text-gray-400 font-medium mt-1">Né(e) le {player.birth}</p>}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
