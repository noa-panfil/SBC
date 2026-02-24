"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface EventRole {
    name: string;
    max: number;
}

interface EventPollOption {
    id?: number;
    option_text: string;
}

interface Event {
    id: number;
    title: string;
    event_date: string; // Technical ISO date
    formatted_date?: string; // Tech date formatted
    date_display?: string; // "Week-end du..."
    description: string;
    location: string;
    time_info: string;
    mode: 'joueur' | 'benevole' | 'public' | 'boutique' | 'sondage' | 'depot';
    image_id?: number | null;
    image?: string | null;
    allowed_teams?: string[];
    roles?: EventRole[];
    requires_file?: boolean;
    helloasso_iframe?: string | null;
    poll_options?: EventPollOption[];
}

interface Registration {
    id: number;
    event_id: number;
    user_id: number;
    firstname: string;
    lastname: string;
    email: string;
    team_id?: string;
    team_name?: string;
    role_id?: number;
    role_name?: string;
    file_name?: string;
    file_mime_type?: string;
    created_at: string;
    poll_option_text?: string;
}

export default function AdminEventsManager({ teams }: { teams: any[] }) {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    // State for Viewing Registrations
    const [registrationsModal, setRegistrationsModal] = useState<{ isOpen: boolean, eventTitle: string, data: Registration[], viewMode: 'liste' | 'galerie', currentEvent: Event | null }>({ isOpen: false, eventTitle: '', data: [], viewMode: 'liste', currentEvent: null });
    const [sortConfig, setSortConfig] = useState<{ key: keyof Registration, direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });

    // Empty Event Template
    const emptyEvent: Partial<Event> = {
        title: "",
        event_date: new Date().toISOString().split('T')[0],
        date_display: "",
        description: "",
        location: "Salle Jesse Owens",
        time_info: "20h00",
        mode: "public",
        allowed_teams: [],
        roles: [],
        requires_file: false,
        helloasso_iframe: "",
        poll_options: []
    };

    const [editingEvent, setEditingEvent] = useState<Partial<Event>>(emptyEvent);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Fetch Events on Mount
    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/events');
            const data = await res.json();

            const eventsArray = Object.values(data).map((e: any) => ({
                ...e,
                event_date: e.date_iso || new Date().toISOString().split('T')[0],
                formatted_date: e["format-date"],
                date_display: e.date_display || "",
                allowed_teams: e.allowed_teams || [],
                roles: e.roles || [],
                requires_file: e.requires_file === 1,
                helloasso_iframe: e.helloasso_iframe || "",
                poll_options: e.poll_options || []
            }));

            setEvents(eventsArray);
        } catch (e) {
            console.error(e);
            showNotification("Erreur chargement événements", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const convertFrDateToIso = (frDate: string) => {
        if (!frDate) return "";
        const parts = frDate.split('/');
        if (parts.length !== 3) return "";
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    const handleEdit = (event: Event) => {
        setEditingEvent({
            ...event,
            event_date: event.formatted_date ? convertFrDateToIso(event.formatted_date) : event.event_date,
            date_display: event.date_display || "",
            allowed_teams: event.allowed_teams || [],
            roles: event.roles || [],
            requires_file: event.mode === 'depot' || event.requires_file || false,
            helloasso_iframe: event.helloasso_iframe || "",
            poll_options: event.poll_options || []
        });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingEvent(emptyEvent);
        setIsModalOpen(true);
    };

    const handleUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            return data.id as number;
        } catch (e) {
            showNotification("Erreur upload image", 'error');
            return null;
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const previewUrl = URL.createObjectURL(file);

        setEditingEvent(prev => ({ ...prev, image: previewUrl }));

        const newId = await handleUpload(file);
        if (newId) {
            setEditingEvent(prev => ({ ...prev, image_id: newId }));
        }
    };

    const handleSave = async () => {
        try {
            const payload = {
                id: editingEvent.id,
                title: editingEvent.title,
                date: editingEvent.event_date,
                dateDisplay: editingEvent.date_display,
                description: editingEvent.description,
                location: editingEvent.location,
                time: editingEvent.time_info,
                mode: editingEvent.mode,
                imageId: editingEvent.image_id,
                allowedTeams: editingEvent.mode === 'joueur' ? editingEvent.allowed_teams : [],
                roles: editingEvent.mode === 'benevole' ? editingEvent.roles : [],
                requiresFile: editingEvent.mode === 'depot',
                helloassoIframe: editingEvent.mode === 'boutique' ? editingEvent.helloasso_iframe : null,
                pollOptions: editingEvent.mode === 'sondage' ? editingEvent.poll_options : []
            };

            const res = await fetch('/api/admin/events/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showNotification("Événement enregistré !", 'success');
                setIsModalOpen(false);
                fetchEvents();
                router.refresh();
            } else {
                throw new Error("Save failed");
            }
        } catch (e) {
            showNotification("Erreur lors de la sauvegarde", 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Supprimer cet événement définitivement ?")) return;

        try {
            const res = await fetch('/api/admin/events/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                showNotification("Événement supprimé", 'success');
                fetchEvents();
                router.refresh();
            } else {
                throw new Error("Delete failed");
            }
        } catch (e) {
            showNotification("Erreur lors de la suppression", 'error');
        }
    };

    const handleViewRegistrations = async (event: Event) => {
        try {
            const res = await fetch('/api/admin/events/registrations', {
                method: 'POST', // Using POST to send ID easily, usually GET with params is cleaner but this works fine
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId: event.id })
            });
            const data: Registration[] = await res.json();
            setRegistrationsModal({ isOpen: true, eventTitle: event.title, data: Array.isArray(data) ? data : [], viewMode: event.requires_file ? 'galerie' : 'liste', currentEvent: event });
        } catch (e) {
            showNotification("Erreur chargement inscrits", 'error');
        }
    };

    const handleSort = (key: keyof Registration) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedRegistrations = [...registrationsModal.data].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
        }
        return 0;
    });

    const addRole = () => {
        setEditingEvent(prev => ({
            ...prev,
            roles: [...(prev.roles || []), { name: "", max: 5 }]
        }));
    };

    const updateRole = (index: number, field: 'name' | 'max', value: string | number) => {
        setEditingEvent(prev => {
            const newRoles = [...(prev.roles || [])];
            newRoles[index] = { ...newRoles[index], [field]: value };
            return { ...prev, roles: newRoles };
        });
    };

    const removeRole = (index: number) => {
        setEditingEvent(prev => ({
            ...prev,
            roles: (prev.roles || []).filter((_, i) => i !== index)
        }));
    };

    const toggleTeam = (teamId: string) => {
        setEditingEvent(prev => {
            const current = (prev.allowed_teams || []) as string[];
            if (current.includes(teamId)) {
                return { ...prev, allowed_teams: current.filter(id => id !== teamId) };
            } else {
                return { ...prev, allowed_teams: [...current, teamId] };
            }
        });
    };

    const { currentEvent, data: registrations } = registrationsModal;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 relative">
            {notification && (
                <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl text-white font-bold transition-all transform animate-bounce-in z-[100] flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} text-xl`}></i>
                    {notification.message}
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <i className="fas fa-calendar-alt text-sbc"></i> Gestion des Événements
                </h2>
                <button onClick={handleCreate} className="bg-sbc text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-sbc-dark transition transform hover:scale-105">
                    <i className="fas fa-plus mr-2"></i> Ajouter
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-gray-400">Chargement...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <div key={event.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition bg-white flex flex-col group relative">
                            <div className="h-40 overflow-hidden relative bg-gray-100">
                                <img src={event.image || "/img/event-placeholder.jpg"} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt={event.title} />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button onClick={() => handleViewRegistrations(event)} className="bg-white/90 text-sbc w-8 h-8 rounded-full flex items-center justify-center hover:bg-sbc hover:text-white transition shadow-sm" title="Voir les inscrits">
                                        <i className="fas fa-users"></i>
                                    </button>
                                    <button onClick={() => handleDelete(event.id)} className="bg-white/90 text-red-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition shadow-sm">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                    <button onClick={() => handleEdit(event)} className="bg-white/90 text-blue-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-500 hover:text-white transition shadow-sm">
                                        <i className="fas fa-pen"></i>
                                    </button>
                                </div>
                                <div className="absolute bottom-2 left-2 bg-sbc text-white text-xs font-bold px-2 py-1 rounded shadow">
                                    {event.mode === 'benevole' ? 'Bénévoles' : event.mode === 'joueur' ? 'Joueurs' : event.mode === 'boutique' ? 'Boutique' : event.mode === 'sondage' ? 'Sondage' : event.mode === 'depot' ? 'Dépôt Fichier' : 'Public'}
                                </div>
                            </div>
                            <div className="p-4 flex-grow flex flex-col">
                                <div className="text-xs font-bold text-sbc uppercase mb-1">{event.date_display || event.formatted_date || event.event_date}</div>
                                <h3 className="font-bold text-gray-800 text-lg leading-tight mb-2">{event.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <div className="col-span-full text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-400 mb-4">Aucun événement planifié.</p>
                            <button onClick={handleCreate} className="text-sbc font-bold hover:underline">Créer le premier événement</button>
                        </div>
                    )}
                </div>
            )}

            {/* Registrations Modal */}
            {registrationsModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in-up">
                        <div className="bg-sbc p-4 flex justify-between items-center text-white rounded-t-xl">
                            <div>
                                <h3 className="font-bold text-xl">Inscriptions Reçues</h3>
                                <p className="text-sm text-white/80">{registrationsModal.eventTitle} - {registrationsModal.data.length} inscrit(s)</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-1 rounded-lg flex items-center">
                                    <button
                                        onClick={() => setRegistrationsModal(prev => ({ ...prev, viewMode: 'liste' }))}
                                        className={`px-3 py-1 rounded-md text-sm font-bold transition ${registrationsModal.viewMode === 'liste' ? 'bg-white text-sbc shadow' : 'text-white hover:bg-white/10'}`}
                                    >
                                        <i className="fas fa-list mr-2"></i> Liste
                                    </button>
                                    <button
                                        onClick={() => setRegistrationsModal(prev => ({ ...prev, viewMode: 'galerie' }))}
                                        className={`px-3 py-1 rounded-md text-sm font-bold transition ${registrationsModal.viewMode === 'galerie' ? 'bg-white text-sbc shadow' : 'text-white hover:bg-white/10'}`}
                                    >
                                        <i className="fas fa-th-large mr-2"></i> Galerie
                                    </button>
                                </div>
                                <button onClick={() => setRegistrationsModal({ ...registrationsModal, isOpen: false })} className="text-white/80 hover:text-white text-2xl">&times;</button>
                            </div>
                        </div>

                        <div className="p-0 overflow-auto flex-grow custom-scrollbar bg-gray-50">
                            {currentEvent?.mode === 'sondage' ? (
                                <div className="flex-grow overflow-y-auto p-6 space-y-4">
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                            <h4 className="font-bold text-gray-800 uppercase italic mb-4">
                                                <i className="fas fa-chart-bar mr-2 text-sbc"></i> Résultats du sondage ({registrations.length} votes)
                                            </h4>

                                            {(() => {
                                                const counts: Record<string, number> = {};
                                                registrations.forEach(r => {
                                                    const opt = r.poll_option_text || 'Inconnu';
                                                    counts[opt] = (counts[opt] || 0) + 1;
                                                });
                                                const totalVotes = registrations.length;
                                                const sortedOpts = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

                                                return (
                                                    <div className="space-y-4">
                                                        {totalVotes === 0 && <p className="text-gray-500 italic">Aucun vote pour le moment.</p>}
                                                        {sortedOpts.map(opt => {
                                                            const count = counts[opt];
                                                            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                                            return (
                                                                <div key={opt} className="space-y-1">
                                                                    <div className="flex justify-between text-sm font-bold text-gray-700">
                                                                        <span>{opt}</span>
                                                                        <span>{count} vote{count > 1 ? 's' : ''} ({percentage}%)</span>
                                                                    </div>
                                                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                                        <div
                                                                            className="bg-sbc h-3 rounded-full transition-all duration-500 ease-out"
                                                                            style={{ width: `${percentage}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="mt-8">
                                            <h4 className="font-bold text-gray-800 uppercase italic mb-4">Détail des votes</h4>
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-800 text-white uppercase text-xs">
                                                            <th className="p-4 rounded-tl-xl font-bold">Nom / Prénom</th>
                                                            <th className="p-4 font-bold">Vote</th>
                                                            <th className="p-4 rounded-tr-xl font-bold">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {registrations.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={3} className="p-8 text-center text-gray-500 italic font-bold">
                                                                    <i className="fas fa-ghost block text-3xl mb-2 opacity-50"></i> Aucun vote.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            registrations.map(reg => (
                                                                <tr key={reg.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                                                                    <td className="p-4 font-bold text-gray-800">{reg.lastname} {reg.firstname}</td>
                                                                    <td className="p-4 text-gray-600 font-bold">
                                                                        <span className="bg-sbc/10 text-sbc px-2 py-1 rounded inline-block text-sm">
                                                                            {reg.poll_option_text}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4 text-sm text-gray-500">
                                                                        {new Date(reg.created_at).toLocaleString('fr-FR', {
                                                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                                                            hour: '2-digit', minute: '2-digit'
                                                                        })}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : registrationsModal.viewMode === 'galerie' ? (
                                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {sortedRegistrations.map((reg: Registration) => (
                                        <div key={reg.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition group">
                                            <div className="h-48 bg-gray-100 relative custom-pattern flex items-center justify-center border-b border-gray-100">
                                                {reg.file_mime_type?.startsWith('image/') ? (
                                                    <img
                                                        src={`/api/admin/events/registration/download/${reg.id}`}
                                                        className="w-full h-full object-contain p-2"
                                                        alt="Preview"
                                                    />
                                                ) : reg.file_name ? (
                                                    <div className="text-center text-gray-400 p-4">
                                                        <i className="fas fa-file-alt text-4xl mb-2"></i>
                                                        <p className="text-xs truncate max-w-[150px]">{reg.file_name}</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-gray-300">
                                                        <i className="fas fa-image text-4xl mb-1 opacity-50"></i>
                                                        <p className="text-xs">Pas de fichier</p>
                                                    </div>
                                                )}

                                                {reg.file_name && (
                                                    <a
                                                        href={`/api/admin/events/registration/download/${reg.id}`}
                                                        target="_blank"
                                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-sm text-white font-bold"
                                                    >
                                                        <i className="fas fa-download mr-2"></i> Télécharger
                                                    </a>
                                                )}
                                            </div>
                                            <div className="p-4 flex-grow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-gray-800 leading-tight">{reg.firstname} <span className="uppercase">{reg.lastname}</span></h4>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(reg.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-3 truncate">{reg.email}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {reg.team_name && <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold border border-blue-100">{reg.team_name}</span>}
                                                    {reg.role_name && <span className="bg-green-50 text-green-600 px-2 py-1 rounded text-[10px] font-bold border border-green-100">{reg.role_name}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {sortedRegistrations.length === 0 && (
                                        <div className="col-span-full p-12 text-center text-gray-400 italic">
                                            Aucune inscription pour le moment.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <table className="w-full text-left border-collapse hidden md:table">
                                        <thead className="bg-white sticky top-0 shadow-sm z-10">
                                            <tr>
                                                <th onClick={() => handleSort('lastname')} className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-50 transition select-none">
                                                    Nom {sortConfig.key === 'lastname' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => handleSort('firstname')} className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-50 transition select-none">
                                                    Prénom {sortConfig.key === 'firstname' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => handleSort('email')} className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-50 transition select-none">
                                                    Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => handleSort('team_name')} className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-50 transition select-none">
                                                    Info (Équipe/Rôle) {sortConfig.key === 'team_name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => handleSort('created_at')} className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-50 transition select-none text-right">
                                                    Date {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th className="p-4 font-bold text-gray-600 text-right">Fichier</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {sortedRegistrations.map((reg: Registration) => (
                                                <tr key={reg.id} className="hover:bg-gray-50 transition">
                                                    <td className="p-4 font-bold text-gray-800">{reg.lastname}</td>
                                                    <td className="p-4 text-gray-700">{reg.firstname}</td>
                                                    <td className="p-4 text-gray-500 text-sm">{reg.email}</td>
                                                    <td className="p-4">
                                                        {reg.team_name && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold mr-2">{reg.team_name}</span>}
                                                        {reg.role_name && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">{reg.role_name}</span>}
                                                    </td>
                                                    <td className="p-4 text-gray-400 text-sm text-right">
                                                        {new Date(reg.created_at).toLocaleDateString('fr-FR')}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {reg.file_name ? (
                                                            <div className="flex justify-end items-center gap-2">
                                                                {reg.file_mime_type?.startsWith('image/') && (
                                                                    <div className="w-10 h-10 rounded overflow-hidden border border-gray-200 bg-gray-50">
                                                                        <img
                                                                            src={`/api/admin/events/registration/download/${reg.id}`}
                                                                            className="w-full h-full object-cover"
                                                                            alt="Preview"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <a href={`/api/admin/events/registration/download/${reg.id}`} target="_blank" className="text-sbc hover:underline font-bold text-sm">
                                                                    <i className="fas fa-file-download mr-1"></i> {reg.file_name}
                                                                </a>
                                                            </div>
                                                        ) : <span className="text-gray-300">-</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        {sortedRegistrations.length === 0 && (
                                            <div className="p-12 text-center text-gray-400 italic">
                                                Aucune inscription.
                                            </div>
                                        )}
                                    </table>

                                    {/* Mobile List View */}
                                    <div className="md:hidden divide-y divide-gray-100 bg-white">
                                        {sortedRegistrations.map((reg: Registration) => (
                                            <div key={reg.id} className="p-4 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-extrabold text-gray-900 uppercase">{reg.lastname} {reg.firstname}</p>
                                                        <p className="text-xs text-gray-400 font-bold tracking-tight">{reg.email}</p>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-black uppercase">
                                                        {new Date(reg.created_at).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {reg.team_name && <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-blue-100">{reg.team_name}</span>}
                                                    {reg.role_name && <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-emerald-100">{reg.role_name}</span>}
                                                </div>
                                                {reg.file_name && (
                                                    <div className="mt-2 text-right flex justify-end items-center gap-3">
                                                        {reg.file_mime_type?.startsWith('image/') && (
                                                            <div className="w-12 h-12 rounded overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                                                                <img
                                                                    src={`/api/admin/events/registration/download/${reg.id}`}
                                                                    className="w-full h-full object-cover"
                                                                    alt="Preview"
                                                                />
                                                            </div>
                                                        )}
                                                        <a href={`/api/admin/events/registration/download/${reg.id}`} target="_blank" className="text-sbc hover:underline font-bold text-xs inline-flex items-center">
                                                            <i className="fas fa-file-download mr-1"></i> {reg.file_name}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {sortedRegistrations.length === 0 && (
                                            <div className="p-12 text-center text-gray-400 italic">
                                                Aucune inscription.
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                            <button className="text-sbc font-bold text-sm hover:underline">
                                <i className="fas fa-download mr-1"></i> Exporter CSV (Bientôt)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit / Create Modal (Existing) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up custom-scrollbar">
                        <div className="bg-sbc p-4 flex justify-between items-center text-white sticky top-0 z-10">
                            <h3 className="font-bold text-xl">{editingEvent.id ? "Modifier l'événement" : "Nouvel Événement"}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white text-2xl">&times;</button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex justify-center">
                                <div className="relative group cursor-pointer w-full h-40 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-sbc transition"
                                    onClick={() => imageInputRef.current?.click()}>
                                    {editingEvent.image ? (
                                        <img src={editingEvent.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                            <i className="fas fa-image text-3xl mb-2"></i>
                                            <span>Ajouter une image (Bannière)</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition">
                                        <i className="fas fa-camera text-2xl mr-2"></i> Changer l'image
                                    </div>
                                    <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Titre</label>
                                    <input
                                        className="w-full p-2 border border-gray-300 rounded focus:border-sbc outline-none"
                                        value={editingEvent.title || ''}
                                        onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                                        placeholder="Ex: Tournoi de Noël"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Date Technique (Tri)</label>
                                        <input
                                            type="date"
                                            className="w-full p-2 border border-gray-300 rounded focus:border-sbc outline-none"
                                            value={editingEvent.event_date || ''}
                                            onChange={e => setEditingEvent({ ...editingEvent, event_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Date d'affichage</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded focus:border-sbc outline-none"
                                            value={editingEvent.date_display || ''}
                                            onChange={e => setEditingEvent({ ...editingEvent, date_display: e.target.value })}
                                            placeholder="Ex: Week-end du 20 Décembre"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Lieu</label>
                                    <input
                                        className="w-full p-2 border border-gray-300 rounded focus:border-sbc outline-none"
                                        value={editingEvent.location || ''}
                                        onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })}
                                        placeholder="Ex: Salle J. Owens"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Heure</label>
                                    <input
                                        className="w-full p-2 border border-gray-300 rounded focus:border-sbc outline-none"
                                        value={editingEvent.time_info || ''}
                                        onChange={e => setEditingEvent({ ...editingEvent, time_info: e.target.value })}
                                        placeholder="Ex: 20h00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 rounded focus:border-sbc outline-none"
                                    value={editingEvent.description || ''}
                                    onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })}
                                />
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Type d'Événements</label>
                                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
                                    <label className={`flex-1 p-3 rounded border text-center cursor-pointer transition ${editingEvent.mode === 'public' ? 'bg-sbc text-white border-sbc' : 'bg-white border-gray-200 hover:border-sbc'}`}>
                                        <input type="radio" name="mode" value="public" checked={editingEvent.mode === 'public'} onChange={() => setEditingEvent({ ...editingEvent, mode: 'public', allowed_teams: [], roles: [], poll_options: [], requires_file: false })} className="hidden" />
                                        <i className="fas fa-globe mr-2"></i> Public
                                    </label>
                                    <label className={`flex-1 p-3 rounded border text-center cursor-pointer transition ${editingEvent.mode === 'joueur' ? 'bg-sbc text-white border-sbc' : 'bg-white border-gray-200 hover:border-sbc'}`}>
                                        <input type="radio" name="mode" value="joueur" checked={editingEvent.mode === 'joueur'} onChange={() => setEditingEvent({ ...editingEvent, mode: 'joueur', roles: [], poll_options: [], requires_file: false })} className="hidden" />
                                        <i className="fas fa-user mr-2"></i> Joueurs
                                    </label>
                                    <label className={`flex-1 p-3 rounded border text-center cursor-pointer transition ${editingEvent.mode === 'benevole' ? 'bg-sbc text-white border-sbc' : 'bg-white border-gray-200 hover:border-sbc'}`}>
                                        <input type="radio" name="mode" value="benevole" checked={editingEvent.mode === 'benevole'} onChange={() => setEditingEvent({ ...editingEvent, mode: 'benevole', allowed_teams: [], poll_options: [], requires_file: false })} className="hidden" />
                                        <i className="fas fa-hands-helping mr-2"></i> Bénévoles
                                    </label>
                                    <label className={`flex-1 p-3 rounded border text-center cursor-pointer transition ${editingEvent.mode === 'boutique' ? 'bg-sbc text-white border-sbc' : 'bg-white border-gray-200 hover:border-sbc'}`}>
                                        <input type="radio" name="mode" value="boutique" checked={editingEvent.mode === 'boutique'} onChange={() => setEditingEvent({ ...editingEvent, mode: 'boutique', allowed_teams: [], roles: [], poll_options: [], requires_file: false })} className="hidden" />
                                        <i className="fas fa-shopping-cart mr-2"></i> Boutique
                                    </label>
                                    <label className={`flex-1 p-3 rounded border text-center cursor-pointer transition ${editingEvent.mode === 'sondage' ? 'bg-sbc text-white border-sbc' : 'bg-white border-gray-200 hover:border-sbc'}`}>
                                        <input type="radio" name="mode" value="sondage" checked={editingEvent.mode === 'sondage'} onChange={() => setEditingEvent({ ...editingEvent, mode: 'sondage', allowed_teams: [], roles: [], requires_file: false })} className="hidden" />
                                        <i className="fas fa-poll mr-2"></i> Sondage
                                    </label>
                                    <label className={`flex-1 p-3 rounded border text-center cursor-pointer transition ${editingEvent.mode === 'depot' ? 'bg-sbc text-white border-sbc' : 'bg-white border-gray-200 hover:border-sbc'}`}>
                                        <input type="radio" name="mode" value="depot" checked={editingEvent.mode === 'depot'} onChange={() => setEditingEvent({ ...editingEvent, mode: 'depot', allowed_teams: [], roles: [], poll_options: [], requires_file: true })} className="hidden" />
                                        <i className="fas fa-file-upload mr-2"></i> Dépôt
                                    </label>
                                </div>

                                {editingEvent.mode === 'sondage' && (
                                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-sm font-bold text-gray-700">Options du sondage</h4>
                                            <button
                                                onClick={() => setEditingEvent(prev => ({ ...prev, poll_options: [...(prev.poll_options || []), { option_text: "" }] }))}
                                                type="button"
                                                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded font-bold"
                                            >
                                                <i className="fas fa-plus mr-1"></i> Ajouter une option
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {editingEvent.poll_options?.map((opt, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <input
                                                        className="flex-grow p-2 text-sm border border-gray-300 rounded focus:border-sbc outline-none"
                                                        placeholder={`Ex: Option ${idx + 1}`}
                                                        value={opt.option_text}
                                                        onChange={(e) => {
                                                            const newOpts = [...(editingEvent.poll_options || [])];
                                                            newOpts[idx].option_text = e.target.value;
                                                            setEditingEvent(prev => ({ ...prev, poll_options: newOpts }));
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newOpts = [...(editingEvent.poll_options || [])];
                                                            newOpts.splice(idx, 1);
                                                            setEditingEvent(prev => ({ ...prev, poll_options: newOpts }));
                                                        }}
                                                        type="button"
                                                        className="text-red-400 hover:text-red-600 px-2"
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            ))}
                                            {(editingEvent.poll_options?.length === 0 || !editingEvent.poll_options) && (
                                                <p className="text-xs text-gray-400 italic text-center">Aucune option définie. Ajoutez-en au moins deux pour un sondage.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {editingEvent.mode === 'boutique' && (
                                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Code Iframe (HelloAsso)</label>
                                        <textarea
                                            rows={4}
                                            className="w-full p-2 border border-gray-300 rounded focus:border-sbc outline-none font-mono text-sm"
                                            value={editingEvent.helloasso_iframe || ''}
                                            onChange={e => setEditingEvent({ ...editingEvent, helloasso_iframe: e.target.value })}
                                            placeholder={'<iframe id="haWidget" allowtransparency="true" src="..." ...></iframe>'}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Copiez-collez ici le code HTML du widget ou de la page HelloAsso pour l'intégrer.</p>
                                    </div>
                                )}

                                {editingEvent.mode === 'joueur' && teams && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-bold text-gray-700 mb-3">Équipes concernées</h4>
                                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                                            {teams.map(team => (
                                                <label key={team.id} className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer select-none transition ${editingEvent.allowed_teams?.includes(team.id) ? 'bg-sbc text-white border-sbc' : 'bg-white text-gray-500 border-gray-300'}`}>
                                                    <input type="checkbox" className="hidden" checked={editingEvent.allowed_teams?.includes(team.id) || false} onChange={() => toggleTeam(team.id)} />
                                                    {team.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {editingEvent.mode === 'benevole' && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-sm font-bold text-gray-700">Rôles / Postes nécessaires</h4>
                                            <button onClick={addRole} type="button" className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded font-bold">
                                                <i className="fas fa-plus mr-1"></i> Ajouter un rôle
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {editingEvent.roles?.map((role, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <input
                                                        className="flex-grow p-2 text-sm border border-gray-300 rounded focus:border-sbc outline-none"
                                                        placeholder="Ex: Table de marque"
                                                        value={role.name}
                                                        onChange={(e) => updateRole(idx, 'name', e.target.value)}
                                                    />
                                                    <input
                                                        type="number"
                                                        className="w-16 p-2 text-sm border border-gray-300 rounded focus:border-sbc outline-none text-center"
                                                        placeholder="Max"
                                                        value={role.max}
                                                        onChange={(e) => updateRole(idx, 'max', parseInt(e.target.value))}
                                                    />
                                                    <button onClick={() => removeRole(idx)} className="text-red-400 hover:text-red-600 px-2">
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            ))}
                                            {(editingEvent.roles?.length === 0 || !editingEvent.roles) && (
                                                <p className="text-xs text-gray-400 italic text-center">Aucun rôle défini.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 sticky bottom-0 z-10">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-bold transition">Annuler</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-sbc text-white rounded-lg font-bold shadow hover:bg-sbc-dark transition transform hover:scale-105">
                                {editingEvent.id ? 'Mettre à jour' : 'Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
