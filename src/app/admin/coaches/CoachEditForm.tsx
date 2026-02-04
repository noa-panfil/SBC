"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Coach {
    firstname: string;
    lastname: string;
    birthdate: string | null;
    gender: string;
    image_id: number | null;
    email?: string;
}

interface Team {
    id: number;
    name: string;
}

export default function CoachEditForm({
    coach,
    id,
    assignedTeamIds,
    allTeams
}: {
    coach: Coach,
    id: number | null,
    assignedTeamIds: number[],
    allTeams: Team[]
}) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        ...coach,
        birthdate: coach.birthdate ? new Date(coach.birthdate).toISOString().split('T')[0] : ''
    });
    const [selectedTeams, setSelectedTeams] = useState<number[]>(assignedTeamIds);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(coach.image_id ? `/api/image/${coach.image_id}` : null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await fetch('/api/admin/upload', { method: 'POST', body: uploadData });
            const data = await res.json();
            if (data.id) {
                setFormData(prev => ({ ...prev, image_id: data.id }));
                showNotification("Image mise à jour", "success");
            }
        } catch (e) {
            showNotification("Erreur lors de l'upload", "error");
        }
    };

    const toggleTeam = (teamId: number) => {
        setSelectedTeams(prev =>
            prev.includes(teamId)
                ? prev.filter(id => id !== teamId)
                : [...prev, teamId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch('/api/admin/coaches/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    ...formData,
                    teamIds: selectedTeams
                })
            });

            if (res.ok) {
                showNotification("Coach enregistré avec succès", "success");
                setTimeout(() => router.push("/admin/coaches"), 1500);
            } else {
                showNotification("Erreur lors de la sauvegarde", "error");
            }
        } catch (error) {
            showNotification("Erreur réseau", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id || !confirm("Êtes-vous sûr de vouloir supprimer ce coach ? Cette action est irréversible.")) return;
        try {
            const res = await fetch(`/api/admin/coaches/delete?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push("/admin/coaches");
            } else {
                alert("Erreur lors de la suppression");
            }
        } catch (e) {
            alert("Erreur réseau");
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-4xl mx-auto">
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-bold transition-all animate-bounce ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
                {/* Photo Section */}
                <div className="flex flex-col items-center">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center transition group-hover:border-sbc">
                            {previewUrl ? (
                                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <i className="fas fa-user-tie text-4xl text-gray-300"></i>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-sbc text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition group-hover:scale-110">
                            <i className="fas fa-camera"></i>
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        className="hidden"
                        accept="image/*"
                    />
                    <p className="mt-3 text-sm font-bold text-gray-400 uppercase tracking-widest">Photo de profil</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Prénom</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sbc focus:ring-1 focus:ring-sbc outline-none transition font-bold text-gray-800"
                            value={formData.firstname}
                            onChange={e => setFormData({ ...formData, firstname: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Nom</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sbc focus:ring-1 focus:ring-sbc outline-none transition font-bold text-gray-800"
                            value={formData.lastname}
                            onChange={e => setFormData({ ...formData, lastname: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Email (Optionnel)</label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sbc focus:ring-1 focus:ring-sbc outline-none transition font-medium text-gray-700"
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Date de naissance</label>
                        <input
                            type="date"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sbc focus:ring-1 focus:ring-sbc outline-none transition font-medium text-gray-700"
                            value={formData.birthdate}
                            onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Genre</label>
                        <div className="flex gap-4">
                            <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition ${formData.gender === 'M' ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                <input type="radio" name="gender" value="M" checked={formData.gender === 'M'} onChange={() => setFormData({ ...formData, gender: 'M' })} className="hidden" />
                                <i className="fas fa-mars"></i> Masculin
                            </label>
                            <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition ${formData.gender === 'F' ? 'bg-pink-50 border-pink-200 text-pink-600 font-bold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                <input type="radio" name="gender" value="F" checked={formData.gender === 'F'} onChange={() => setFormData({ ...formData, gender: 'F' })} className="hidden" />
                                <i className="fas fa-venus"></i> Féminin
                            </label>
                        </div>
                    </div>
                </div>

                {/* Team Assignment */}
                <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                        <i className="fas fa-users-cog text-sbc"></i> Assignation aux Équipes
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {allTeams.map(team => (
                            <div
                                key={team.id}
                                onClick={() => toggleTeam(team.id)}
                                className={`
                                    p-3 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 select-none
                                    ${selectedTeams.includes(team.id) ? 'border-sbc bg-sbc/5' : 'border-gray-100 hover:border-gray-200'}
                                `}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${selectedTeams.includes(team.id) ? 'bg-sbc border-sbc text-white' : 'border-gray-300 bg-white'}`}>
                                    {selectedTeams.includes(team.id) && <i className="fas fa-check text-xs"></i>}
                                </div>
                                <span className={`font-bold ${selectedTeams.includes(team.id) ? 'text-gray-900' : 'text-gray-500'}`}>{team.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-100">
                    {id && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-6 py-4 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-trash-alt"></i> Supprimer
                        </button>
                    )}

                    <div className="flex-1 flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.push("/admin/coaches")}
                            className="flex-1 px-6 py-4 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-[2] bg-sbc text-white py-4 rounded-xl font-bold text-lg hover:bg-sbc-dark transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <><i className="fas fa-spinner fa-spin"></i> Sauvegarde...</>
                            ) : (
                                <><i className="fas fa-save"></i> Enregistrer</>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
