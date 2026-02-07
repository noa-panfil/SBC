"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AdminAppearanceManager() {
    const router = useRouter();
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [heroType, setHeroType] = useState<'unsplash' | 'custom'>('unsplash');
    const [customImageId, setCustomImageId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
                if (data.hero_image_type) {
                    setHeroType(data.hero_image_type as 'unsplash' | 'custom');
                }
                if (data.hero_image_id) {
                    setCustomImageId(data.hero_image_id);
                }
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

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
            return data.id as string;
        } catch (e) {
            showNotification("Erreur lors de l'upload de l'image", 'error');
            console.error(e);
            return null;
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];

        const newImageId = await handleUpload(file);
        if (newImageId) {
            setCustomImageId(newImageId);
            setHeroType('custom');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                hero_image_type: heroType,
                hero_image_id: heroType === 'custom' ? customImageId : ''
            };

            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showNotification("Apparence mise à jour avec succès !", 'success');
                router.refresh();
            } else {
                throw new Error("Failed to save settings");
            }
        } catch (error) {
            console.error(error);
            showNotification("Erreur lors de la sauvegarde.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-400">Chargement...</div>;
    }

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 relative">
            {notification && (
                <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl text-white font-bold transition-all transform animate-bounce-in z-[100] flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} text-xl`}></i>
                    {notification.message}
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                    <i className="fas fa-paint-brush text-sbc"></i> Apparence
                </h2>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-sbc hover:bg-sbc-dark text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest shadow-lg shadow-sbc/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                    Enregistrer
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div
                    onClick={() => setHeroType('unsplash')}
                    className={`relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all group ${heroType === 'unsplash' ? 'border-sbc ring-4 ring-sbc/10 scale-[1.02]' : 'border-gray-100 hover:border-gray-200'}`}
                >
                    <div className="aspect-video relative">
                        <img
                            src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1920&auto=format&fit=crop"
                            className="w-full h-full object-cover"
                            alt="Default Unsplash"
                        />
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${heroType === 'unsplash' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {heroType === 'unsplash' && <i className="fas fa-check-circle text-4xl text-white drop-shadow-lg"></i>}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <h3 className="font-bold text-gray-900">Image par défaut (Unsplash)</h3>
                        <p className="text-xs text-gray-500 mt-1">L'image classique du club.</p>
                    </div>
                </div>

                <div
                    onClick={() => setHeroType('custom')}
                    className={`relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all group ${heroType === 'custom' ? 'border-sbc ring-4 ring-sbc/10 scale-[1.02]' : 'border-gray-100 hover:border-gray-200'}`}
                >
                    <div className="aspect-video relative bg-gray-100 flex items-center justify-center">
                        {customImageId ? (
                            <img
                                src={`/api/image/${customImageId}`}
                                className="w-full h-full object-cover"
                                alt="Custom Hero"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400">
                                <i className="fas fa-image text-4xl mb-2"></i>
                                <span className="text-sm font-medium">Aucune image sélectionnée</span>
                            </div>
                        )}

                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${heroType === 'custom' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {heroType === 'custom' && customImageId && <i className="fas fa-check-circle text-4xl text-white drop-shadow-lg mr-4"></i>}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                                className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-100 transition shadow-lg"
                            >
                                <i className="fas fa-upload mr-2"></i> Changer
                            </button>
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <h3 className="font-bold text-gray-900">Image personnalisée</h3>
                        <p className="text-xs text-gray-500 mt-1">Importez votre propre photo.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
