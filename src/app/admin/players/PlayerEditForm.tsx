"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import ImageCropper from "@/components/ImageCropper";

interface Player {
    id: number;
    firstname: string;
    lastname: string;
    birthdate: string; // YYYY-MM-DD
    gender: string;
    image_id: number | null;
}

export default function PlayerEditForm({ player }: { player: Player }) {
    const router = useRouter();
    const [formData, setFormData] = useState(player);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(player.image_id ? `/api/image/${player.image_id}` : null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image Cropper State
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        setCropImageSrc(url);
        e.target.value = ""; // Reset to allow same file re-selection
    };

    const handleRecrop = () => {
        if (previewUrl) {
            setCropImageSrc(previewUrl);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setCropImageSrc(null);

        // Preview locally
        const objectUrl = URL.createObjectURL(croppedBlob);
        setPreviewUrl(objectUrl);

        // Upload
        const file = new File([croppedBlob], "player_avatar.jpg", { type: "image/jpeg" });
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: uploadData
            });
            const data = await res.json();
            if (data.id) {
                setFormData(prev => ({ ...prev, image_id: data.id }));
                showNotification("Image mise à jour", "success");
            }
        } catch (e) {
            showNotification("Erreur lors de l'upload", "error");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch('/api/admin/players/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showNotification("Profil mis à jour avec succès", "success");
                setTimeout(() => router.push("/admin/players"), 1500);
            } else {
                showNotification("Erreur lors de la sauvegarde", "error");
            }
        } catch (error) {
            showNotification("Erreur réseau", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-bold transform transition-all animate-bounce ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}

            {/* Image Cropper Modal */}
            {cropImageSrc && createPortal(
                <ImageCropper
                    imageSrc={cropImageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setCropImageSrc(null)}
                />,
                document.body
            )}

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* Photo Section */}
                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative group/avatar">
                            {previewUrl ? (
                                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <i className="fas fa-user text-4xl text-gray-300"></i>
                            )}

                            {/* Hover Overlay for Cropping/Changing */}
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition duration-200">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-1/2 flex items-center justify-center hover:bg-white/20 transition border-b border-white/10"
                                    title="Changer la photo"
                                >
                                    <i className="fas fa-camera text-sm"></i>
                                </button>
                                {previewUrl && (
                                    <button
                                        type="button"
                                        onClick={handleRecrop}
                                        className="w-full h-1/2 flex items-center justify-center hover:bg-white/20 transition"
                                        title="Recadrer la photo"
                                    >
                                        <i className="fas fa-crop-alt text-sm"></i>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Always visible small camera icon for clarity */}
                        <div className="absolute bottom-0 right-0 bg-sbc text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white pointer-events-none">
                            <i className="fas fa-camera text-xs"></i>
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <p className="mt-2 text-sm text-gray-400">Survolez l'image pour modifier ou recadrer</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wider">Prénom</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sbc focus:ring-1 focus:ring-sbc outline-none transition"
                            value={formData.firstname}
                            onChange={e => setFormData({ ...formData, firstname: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wider">Nom</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sbc focus:ring-1 focus:ring-sbc outline-none transition"
                            value={formData.lastname}
                            onChange={e => setFormData({ ...formData, lastname: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wider">Date de naissance</label>
                        <input
                            type="date"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sbc focus:ring-1 focus:ring-sbc outline-none transition"
                            value={formData.birthdate}
                            onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wider">Genre</label>
                        <select
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sbc focus:ring-1 focus:ring-sbc outline-none transition"
                            value={formData.gender}
                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                        >
                            <option value="M">Masculin (M)</option>
                            <option value="F">Féminin (F)</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 bg-sbc text-white py-4 rounded-xl font-bold text-lg hover:bg-sbc-dark transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <><i className="fas fa-spinner fa-spin"></i> Enregistrement...</>
                        ) : (
                            <><i className="fas fa-save"></i> Enregistrer les modifications</>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push("/admin/players")}
                        className="px-6 py-4 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition"
                    >
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    );
}
