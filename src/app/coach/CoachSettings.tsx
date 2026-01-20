'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function CoachSettings() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/coach/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Une erreur est survenue');
            }

            setMessage({ type: 'success', text: 'Mot de passe mis à jour !' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setIsOpen(false);
                setMessage({ type: '', text: '' });
            }, 2000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 font-bold text-sm hover:bg-gray-100 transition shadow-sm border border-gray-100 whitespace-nowrap"
            >
                <i className="fas fa-cog"></i>
                <span className="hidden md:inline">Paramètres</span>
            </button>

            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
                            <h3 className="text-xl font-black uppercase tracking-tight">Paramètres Compte</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <h4 className="text-sm font-black text-gray-900 uppercase mb-4 flex items-center gap-2">
                                    <i className="fas fa-key text-sbc"></i>
                                    Changer de mot de passe
                                </h4>

                                {message.text && (
                                    <div className={`p-4 rounded-xl text-sm font-bold mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                                        }`}>
                                        {message.text}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mot de passe actuel</label>
                                        <input
                                            type="password"
                                            required
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-sbc/20 focus:border-sbc transition bg-gray-50/50"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nouveau mot de passe</label>
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-sbc/20 focus:border-sbc transition bg-gray-50/50"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Confirmer le nouveau mot de passe</label>
                                        <input
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-sbc/20 focus:border-sbc transition bg-gray-50/50"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-3 px-8 py-3 rounded-xl bg-sbc text-white font-bold hover:bg-sbc-dark transition shadow-lg shadow-sbc/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <i className="fas fa-spinner fa-spin"></i>
                                    ) : (
                                        <i className="fas fa-save"></i>
                                    )}
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

