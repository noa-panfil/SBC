"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DBImage {
    id: number;
    mime_type: string;
}

export default function AdminImagesManager() {
    const [images, setImages] = useState<DBImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/images');
            if (res.ok) {
                const data = await res.json();
                setImages(data);
            }
        } catch (e) {
            console.error(e);
            showNotification("Erreur lors du chargement des images", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(`Supprimer l'image #${id} ? Cette action est irréversible.`)) return;

        try {
            const res = await fetch('/api/admin/images/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            const data = await res.json();

            if (res.ok) {
                showNotification("Image supprimée avec succès", "success");
                setImages(images.filter(img => img.id !== id));
            } else {
                showNotification(data.error || "Erreur lors de la suppression", "error");
            }
        } catch (e) {
            showNotification("Erreur lors de la suppression", "error");
        }
    };

    return (
        <div className="space-y-6">
            {notification && (
                <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl text-white font-bold transition-all transform animate-bounce-in z-[100] flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} text-xl`}></i>
                    {notification.message}
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <i className="fas fa-images text-sbc"></i> Médiathèque ({images.length})
                </h2>
                <Link href="/admin" className="text-gray-500 hover:text-sbc transition">
                    <i className="fas fa-arrow-left mr-2"></i> Retour Admin
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-lg"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {images.map((img) => (
                        <div key={img.id} className="group relative aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition">
                            <img
                                src={`/api/image/${img.id}`}
                                alt={`Image ${img.id}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                                <span className="text-white text-xs font-bold bg-black/30 px-2 py-1 rounded">#{img.id}</span>
                                <button
                                    onClick={() => handleDelete(img.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition"
                                    title="Supprimer"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))}

                    {images.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                            <i className="fas fa-image text-4xl mb-3"></i>
                            <p>Aucune image en base de données.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
