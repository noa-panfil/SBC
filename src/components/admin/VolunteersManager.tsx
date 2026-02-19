
"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import ImageCropper from "@/components/ImageCropper";

interface Volunteer {
    id: number;
    name: string;
    birth_date: string; // DD/MM/YYYY
    image: string | null;
    image_id?: number;
    role: string;
    sexe: string;
}

export default function VolunteersManager() {
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<{
        name: string;
        birth_date: string;
        image: string;
        image_id?: number | null;
        role: string;
        sexe: string;
    }>({
        name: "",
        birth_date: "",
        image: "",
        image_id: null,
        role: "Bénévole",
        sexe: "M"
    });

    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchVolunteers();
    }, []);

    const fetchVolunteers = async () => {
        try {
            const res = await fetch('/api/volunteers');
            if (res.ok) {
                const data = await res.json();
                setVolunteers(data);
            }
        } catch (error) {
            console.error("Error fetching volunteers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            return data.id as number;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [modifyingId, setModifyingId] = useState<number | null>(null);

    const handleModifyImage = (volunteer: Volunteer) => {
        setModifyingId(volunteer.id);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    const handleModifyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setCropImageSrc(url);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setModifyingId(null);
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        setCropImageSrc(url);
        // Reset input
        e.target.value = "";
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
        const previewUrl = URL.createObjectURL(croppedBlob);

        // Upload
        const newImageId = await handleUpload(file);

        if (newImageId) {
            if (modifyingId) {
                // Update existing
                try {
                    await fetch(`/api/volunteers/${modifyingId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image_id: newImageId })
                    });
                    setVolunteers(prev => prev.map(v => v.id === modifyingId ? { ...v, image: previewUrl, image_id: newImageId } : v));
                } catch (e) {
                    console.error("Update failed", e);
                }
                setModifyingId(null);
            } else {
                // New volunteer
                setFormData(prev => ({
                    ...prev,
                    image: previewUrl,
                    image_id: newImageId
                }));
            }
        }
        setCropImageSrc(null);
    };

    const handleCropCancel = () => {
        setCropImageSrc(null);
        setModifyingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                image: formData.image_id ? null : formData.image, // Prefer image_id logic on server or keep consistent
                // Actually my updated API uses image_id if provided.
            };

            const res = await fetch('/api/volunteers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setFormData({ name: "", birth_date: "", image: "", image_id: null, role: "Bénévole", sexe: "M" });
                fetchVolunteers();
            } else {
                alert("Erreur lors de l'ajout");
            }
        } catch (error) {
            console.error("Error adding volunteer:", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce bénévole ?")) return;

        try {
            const res = await fetch(`/api/volunteers/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setVolunteers(prev => prev.filter(v => v.id !== id));
            } else {
                alert("Erreur lors de la suppression");
            }
        } catch (error) {
            console.error("Error deleting volunteer:", error);
        }
    };

    if (loading) return <div className="text-center py-10">Chargement...</div>;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
            {mounted && cropImageSrc && typeof document !== 'undefined' && createPortal(
                <ImageCropper
                    imageSrc={cropImageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />,
                document.body
            )}

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleModifyFileChange}
            />

            <h3 className="text-xl font-bold mb-6 text-gray-800">Ajouter un bénévole</h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 items-start">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sbc focus:border-sbc outline-none transition"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                    <input
                        type="text"
                        name="birth_date"
                        value={formData.birth_date}
                        onChange={handleChange}
                        placeholder="JJ/MM/AAAA"
                        pattern="\d{2}/\d{2}/\d{4}"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sbc focus:border-sbc outline-none transition"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                            {formData.image ? (
                                <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                                <img src="/logo.png" className="w-full h-full object-contain p-1 opacity-50" alt="Default" />
                            )}
                        </div>
                        <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide border border-gray-200 transition">
                            <i className="fas fa-camera mr-2"></i> Choisir
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                        {formData.image && (
                            <button type="button" onClick={() => setFormData(p => ({ ...p, image: "", image_id: null }))} className="text-red-400 hover:text-red-500">
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">* Si vide, affiche le logo</p>
                </div>
                <div className="flex items-end h-full pt-6">
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, sexe: "M" }))}
                                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${formData.sexe === 'M' ? 'bg-white text-sbc shadow-sm' : 'text-gray-500'}`}
                            >
                                Homme
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, sexe: "F" }))}
                                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${formData.sexe === 'F' ? 'bg-white text-sbc shadow-sm' : 'text-gray-500'}`}
                            >
                                Femme
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex items-end h-full pt-6">
                    <button type="submit" className="w-full bg-sbc text-white font-bold py-2.5 px-4 rounded-lg hover:bg-sbc-dark transition shadow-md hover:shadow-lg uppercase tracking-wider text-sm">
                        Ajouter
                    </button>
                </div>
            </form>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bénévole</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de naissance</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sexe</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {volunteers.map((volunteer) => (
                            <tr key={volunteer.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="relative group/avatar cursor-pointer mr-4" onClick={() => handleModifyImage(volunteer)} title="Modifier la photo">
                                            <div className="flex-shrink-0 h-10 w-10 relative rounded-full overflow-hidden border border-gray-100">
                                                <img
                                                    className="h-full w-full object-cover"
                                                    src={volunteer.image || "/logo.png"}
                                                    alt=""
                                                />
                                            </div>
                                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition duration-200">
                                                <i className="fas fa-camera text-white text-xs"></i>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{volunteer.name}</div>
                                            <div className="text-sm text-gray-500">{volunteer.role}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {volunteer.birth_date}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <button
                                        onClick={async () => {
                                            const newSexe = volunteer.sexe === 'M' ? 'F' : 'M';
                                            try {
                                                await fetch(`/api/volunteers/${volunteer.id}`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ sexe: newSexe })
                                                });
                                                setVolunteers(prev => prev.map(v => v.id === volunteer.id ? { ...v, sexe: newSexe } : v));
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }}
                                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${volunteer.sexe === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}
                                    >
                                        {volunteer.sexe === 'F' ? 'Femme' : 'Homme'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleDelete(volunteer.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 w-8 h-8 rounded-full transition flex items-center justify-center ml-auto">
                                        <i className="fas fa-trash text-xs"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {volunteers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">
                                    Aucun bénévole enregistré
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
