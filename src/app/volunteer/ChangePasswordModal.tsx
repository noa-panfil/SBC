"use client";

import { useState } from "react";

export default function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (newPassword !== confirmPassword) {
            setError("Les nouveaux mots de passe ne correspondent pas");
            return;
        }

        if (newPassword.length < 6) {
            setError("Le nouveau mot de passe doit faire au moins 6 caractères");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/volunteer/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess("Mot de passe mis à jour !");
                setTimeout(() => {
                    onClose();
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setSuccess("");
                }, 2000);
            } else {
                setError(data.error || "Une erreur est survenue");
            }
        } catch (err) {
            setError("Erreur de connexion au serveur");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-fade-in-up border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Mon mot de passe</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-3">
                            <i className="fas fa-exclamation-circle text-lg"></i>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 text-green-600 p-4 rounded-xl text-xs font-bold border border-green-100 flex items-center gap-3">
                            <i className="fas fa-check-circle text-lg"></i>
                            {success}
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Mot de passe actuel</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-sbc focus:ring-1 focus:ring-sbc outline-none font-bold transition"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                        />
                    </div>

                    <div className="h-px bg-gray-100 my-2"></div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Nouveau mot de passe</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-sbc focus:ring-1 focus:ring-sbc outline-none font-bold transition"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Confirmer le nouveau</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-sbc focus:ring-1 focus:ring-sbc outline-none font-bold transition"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-sbc text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-sbc-dark transition shadow-lg shadow-sbc/20 disabled:opacity-50 mt-4"
                    >
                        {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}
                        Mettre à jour
                    </button>
                </form>
            </div>
        </div>
    );
}
