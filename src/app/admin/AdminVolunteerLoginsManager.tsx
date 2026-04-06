"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CoachLogin {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    volunteer_id?: number | null;
}

export default function AdminVolunteerLoginsManager({ initialLogins, volunteers }: { initialLogins: CoachLogin[], volunteers?: any[] }) {
    const router = useRouter();
    const [logins, setLogins] = useState(initialLogins);
    const [isEditing, setIsEditing] = useState(false);
    const [currentLogin, setCurrentLogin] = useState<Partial<CoachLogin>>({});
    const [password, setPassword] = useState("");

    const handleEdit = (login: CoachLogin) => {
        setCurrentLogin(login);
        setPassword("");
        setIsEditing(true);
    };

    const handleAdd = () => {
        setCurrentLogin({});
        setPassword("");
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!currentLogin.id && !currentLogin.volunteer_id) {
            alert("Veuillez sélectionner un bénévole existant.");
            return;
        }

        try {
            const method = currentLogin.id ? "PUT" : "POST";
            const url = currentLogin.id
                ? `/api/admin/volunteer-logins/${currentLogin.id}`
                : "/api/admin/volunteer-logins";

            const body = {
                firstname: currentLogin.firstname,
                lastname: currentLogin.lastname,
                email: currentLogin.email,
                password: password || undefined,
                volunteer_id: currentLogin.volunteer_id
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save");
            }

            // Refresh data
            router.refresh();
            // Optimistic update or simple reload
            window.location.reload();
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Erreur lors de la sauvegarde");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet accès ?")) return;
        try {
            const res = await fetch(`/api/admin/volunteer-logins/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la suppression");
        }
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden relative">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2 uppercase tracking-tight">
                        <i className="fas fa-hand-holding-heart text-sbc"></i> Accès Bénévoles
                    </h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                        Gérez les identifiants de connexion pour l'espace bénévole.
                    </p>
                </div>
                <button onClick={handleAdd} className="bg-sbc text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-sbc/20 hover:bg-sbc-dark transition">
                    + Ajouter
                </button>
            </div>

            {/* Desktop Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse hidden md:table">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Bénévole</th>
                            <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Email (Identifiant)</th>
                            <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logins.map(login => (
                            <tr key={login.id} className="hover:bg-gray-50 transition">
                                <td className="p-4 font-bold text-gray-900">{login.lastname.toUpperCase()} {login.firstname}</td>
                                <td className="p-4 text-gray-600 font-mono text-sm">{login.email}</td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button onClick={() => handleEdit(login)} className="text-sbc hover:bg-sbc/10 p-2 rounded-lg transition">
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button onClick={() => handleDelete(login.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {logins.map(login => (
                    <div key={login.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-black text-gray-900 uppercase text-sm">{login.lastname} {login.firstname}</h3>
                                <p className="text-xs text-gray-500 font-mono mt-1">{login.email}</p>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => handleEdit(login)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-sbc flex items-center justify-center shadow-sm">
                                    <i className="fas fa-edit text-xs"></i>
                                </button>
                                <button onClick={() => handleDelete(login.id)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-red-500 flex items-center justify-center shadow-sm">
                                    <i className="fas fa-trash text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                        <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight">
                            {currentLogin.id ? "Modifier l'accès" : "Nouvel accès"}
                        </h3>

                        <div className="space-y-4">
                            {!currentLogin.id && volunteers && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Associer un bénévole existant</label>
                                    <select 
                                        className="w-full p-2 rounded-lg border border-gray-200 focus:border-sbc outline-none font-bold text-sm bg-gray-50"
                                        onChange={(e) => {
                                            const vol = volunteers.find(v => v.id.toString() === e.target.value);
                                            if (vol) {
                                                const parts = vol.name.split(' ');
                                                const firstnameT = parts[0];
                                                const lastnameT = parts.slice(1).join(' ');
                                                setCurrentLogin({ ...currentLogin, firstname: firstnameT, lastname: lastnameT, volunteer_id: vol.id });
                                            } else {
                                                setCurrentLogin({ ...currentLogin, firstname: '', lastname: '', volunteer_id: null });
                                            }
                                        }}
                                        value={currentLogin.volunteer_id || ""}
                                    >
                                        <option value="">-- Choisir un bénévole --</option>
                                        {volunteers.map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Prénom</label>
                                    <input
                                        type="text"
                                        value={currentLogin.firstname || ""}
                                        onChange={e => setCurrentLogin({ ...currentLogin, firstname: e.target.value })}
                                        className={`w-full p-2 rounded-lg border border-gray-200 focus:border-sbc outline-none font-bold ${!currentLogin.id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        disabled={!currentLogin.id}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nom</label>
                                    <input
                                        type="text"
                                        value={currentLogin.lastname || ""}
                                        onChange={e => setCurrentLogin({ ...currentLogin, lastname: e.target.value })}
                                        className={`w-full p-2 rounded-lg border border-gray-200 focus:border-sbc outline-none font-bold ${!currentLogin.id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        disabled={!currentLogin.id}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email (Identifiant)</label>
                                <input
                                    type="email"
                                    value={currentLogin.email || ""}
                                    onChange={e => setCurrentLogin({ ...currentLogin, email: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:border-sbc outline-none font-bold font-mono text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    {currentLogin.id ? "Mot de passe (laisser vide pour conserver)" : "Mot de passe"}
                                </label>
                                <input
                                    type="text"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder={currentLogin.id ? "********" : "Ex: sbc2026@"}
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:border-sbc outline-none font-bold font-mono text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-8">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest">
                                Annuler
                            </button>
                            <button onClick={handleSave} className="bg-sbc text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-sbc-dark transition shadow-lg shadow-sbc/20">
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
