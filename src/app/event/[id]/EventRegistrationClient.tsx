"use client";

import { useState } from "react";
import Link from "next/link";

interface EventRole {
    name: string;
    max: number;
}

interface EventData {
    id: number;
    title: string;
    date: string;
    date_display?: string;
    image?: string;
    description: string;
    location: string;
    time: string;
    mode: 'joueur' | 'benevole' | 'public';
    allowed_teams?: string[];
    roles?: EventRole[];
    available_teams?: { id: string, name: string }[];
}

export default function EventRegistrationClient({ event }: { event: EventData }) {
    const [formData, setFormData] = useState({
        lastname: "",
        firstname: "",
        email: "",
        teamName: "",
        roleName: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const res = await fetch('/api/events/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: event.id,
                    ...formData
                })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', message: "Votre inscription a bien été enregistrée ! Merci." });
                setFormData({ lastname: "", firstname: "", email: "", teamName: "", roleName: "" });
            } else {
                throw new Error(data.error || "Une erreur est survenue");
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredTeams = event.available_teams?.filter(t =>
        !event.allowed_teams || event.allowed_teams.length === 0 || event.allowed_teams.includes(t.id)
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header / Hero */}
            <div className="relative h-[300px] md:h-[400px] overflow-hidden">
                <img
                    src={event.image || "/img/event-placeholder.jpg"}
                    className="w-full h-full object-cover"
                    alt={event.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-12">
                    <div className="max-w-4xl mx-auto w-full">
                        <Link href="/" className="text-white/80 hover:text-white mb-4 inline-block text-sm font-bold uppercase tracking-wider">
                            <i className="fas fa-arrow-left mr-2"></i> Retour à l'accueil
                        </Link>
                        <h1 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase italic leading-tight">
                            {event.title}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-white font-bold text-sm md:text-base">
                            <span className="bg-sbc px-3 py-1 rounded italic uppercase">
                                <i className="fas fa-calendar-alt mr-2"></i> {event.date_display || event.date}
                            </span>
                            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded italic uppercase">
                                <i className="fas fa-map-marker-alt mr-2"></i> {event.location}
                            </span>
                            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded italic uppercase">
                                <i className="fas fa-clock mr-2"></i> {event.time}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto w-full px-6 py-12 flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Infos Column */}
                    <div className="md:col-span-1 space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 uppercase italic mb-4 border-b-4 border-sbc inline-block">
                                L'Événement
                            </h3>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {event.description}
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h4 className="font-bold text-gray-800 mb-4 uppercase text-sm">Mode de participation</h4>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-sbc/10 flex items-center justify-center text-sbc text-xl">
                                    {event.mode === 'joueur' ? <i className="fas fa-basketball-ball"></i> :
                                        event.mode === 'benevole' ? <i className="fas fa-hands-helping"></i> :
                                            <i className="fas fa-users"></i>}
                                </div>
                                <span className="font-bold text-gray-700 uppercase italic">
                                    {event.mode === 'joueur' ? 'Réservé aux joueurs' :
                                        event.mode === 'benevole' ? 'Appel aux bénévoles' :
                                            'Ouvert au public'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Form Column */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                            <div className="bg-gray-800 p-6 text-white">
                                <h3 className="text-xl font-bold uppercase italic italic">S'inscrire à l'événement</h3>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                {status && (
                                    <div className={`p-4 rounded-lg font-bold flex items-center gap-3 ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        <i className={`fas ${status.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                                        {status.message}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2">Nom</label>
                                        <input
                                            required
                                            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-sbc focus:bg-white rounded-xl outline-none transition font-bold"
                                            value={formData.lastname}
                                            onChange={e => setFormData({ ...formData, lastname: e.target.value })}
                                            placeholder="DUBOIS"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2">Prénom</label>
                                        <input
                                            required
                                            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-sbc focus:bg-white rounded-xl outline-none transition font-bold"
                                            value={formData.firstname}
                                            onChange={e => setFormData({ ...formData, firstname: e.target.value })}
                                            placeholder="Jean"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 uppercase mb-2">Adresse Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-sbc focus:bg-white rounded-xl outline-none transition font-bold"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="jean.dubois@email.com"
                                    />
                                </div>

                                {event.mode === 'joueur' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2">Votre Équipe</label>
                                        <select
                                            required
                                            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-sbc focus:bg-white rounded-xl outline-none transition font-bold appearance-none"
                                            value={formData.teamName}
                                            onChange={e => setFormData({ ...formData, teamName: e.target.value })}
                                        >
                                            <option value="">Sélectionnez votre équipe</option>
                                            {filteredTeams?.map(team => (
                                                <option key={team.id} value={team.name}>{team.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {event.mode === 'benevole' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2">Rôle souhaité</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {event.roles?.map((role, idx) => (
                                                <label key={idx} className={`p-4 border-2 rounded-xl cursor-pointer transition flex justify-between items-center ${formData.roleName === role.name ? 'border-sbc bg-sbc/5' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="radio"
                                                            name="role"
                                                            required
                                                            value={role.name}
                                                            checked={formData.roleName === role.name}
                                                            onChange={e => setFormData({ ...formData, roleName: e.target.value })}
                                                            className="mr-3 accent-sbc"
                                                        />
                                                        <span className="font-bold text-gray-700">{role.name}</span>
                                                    </div>
                                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full font-bold text-gray-500 uppercase">
                                                        Max: {role.max} pers.
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full py-5 rounded-xl font-black text-white uppercase italic text-xl shadow-lg transform transition active:scale-95 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-sbc hover:bg-sbc-dark hover:-translate-y-1 shadow-sbc/30'}`}
                                >
                                    {isSubmitting ? 'Envoi en cours...' : 'Confirmer l\'inscription'}
                                </button>

                                <p className="text-center text-xs text-gray-400 font-bold uppercase italic">
                                    En vous inscrivant, vous acceptez d'être contacté par le club pour cet événement.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
