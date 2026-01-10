"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface EventRole {
    name: string;
    max: number;
}

interface EventData {
    date: string;
    "format-date": string;
    title: string;
    image: string;
    description: string;
    location: string;
    time: string;
    mode: "joueur" | "benevole";
    allowed_teams?: string[];
    roles?: EventRole[];
}

interface TeamData {
    name: string;
    players: { name: string }[];
}

interface ParticipantRow {
    id: number;
    team?: string;
    player?: string;
    role?: string;
}

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwENCN404_x47WxpErXTDLic6Oai8fCdAgQrAvVxB94PwQnDgA7FdHCT_UBO8jc5ag9fA/exec';

export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id: eventId } = use(params);

    const [event, setEvent] = useState<EventData | null>(null);
    const [teamsData, setTeamsData] = useState<Record<string, TeamData>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Form State
    const [parentName, setParentName] = useState("");
    const [parentEmail, setParentEmail] = useState("");
    const [rows, setRows] = useState<ParticipantRow[]>([{ id: 1 }]);
    const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [benevoleCounts, setBenevoleCounts] = useState<Record<string, number>>({});
    const [loadingCounts, setLoadingCounts] = useState(false);

    useEffect(() => {
        const fetchEventAndTeams = async () => {
            try {
                // Fetch Event Data
                const eventRes = await fetch('/api/events');
                const eventsData = await eventRes.json();
                const ev = eventsData[eventId];

                if (ev) {
                    setEvent(ev);
                    if (ev.mode === "benevole") {
                        fetchBenevoleCounts(ev.title);
                    }
                } else {
                    setError("Événement introuvable");
                }

                // Fetch Teams Data
                const teamsRes = await fetch('/api/teams');
                const teams = await teamsRes.json();
                setTeamsData(teams);

            } catch (err) {
                console.error(err);
                setError("Impossible de charger les données");
            } finally {
                setLoading(false);
            }
        };

        fetchEventAndTeams();
    }, [eventId]);

    const fetchBenevoleCounts = async (eventTitle: string) => {
        setLoadingCounts(true);
        try {
            const response = await fetch(`${SCRIPT_URL}?event=${encodeURIComponent(eventTitle)}`);
            const counts = await response.json();
            setBenevoleCounts(counts);
        } catch (e) {
            console.error("Erreur lecture quotas", e);
        }
        setLoadingCounts(false);
    };

    const handleAddRow = () => {
        setRows([...rows, { id: Date.now() }]);
    };

    const handleRemoveRow = (id: number) => {
        setRows(rows.filter(r => r.id !== id));
    };

    const handleRowChange = (id: number, field: keyof ParticipantRow, value: string) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmissionStatus("submitting");

        try {
            const promises = rows.map(row => {
                const formData = new FormData();
                formData.append('Événement', event!.title);
                formData.append('Parent', parentName);
                formData.append('Email', parentEmail);

                if (event!.mode === "benevole") {
                    formData.append('Rôle', row.role || "");
                    formData.append('Équipes', "STAFF");
                    formData.append('Joueurs', parentName);
                } else {
                    formData.append('Équipes', row.team || "");
                    formData.append('Joueurs', row.player || "");
                    formData.append('Rôle', "Joueur");
                }

                return fetch(SCRIPT_URL, { method: 'POST', body: formData });
            });

            await Promise.all(promises);
            setSubmissionStatus("success");
        } catch (err) {
            console.error(err);
            setSubmissionStatus("error");
        }
    };

    if (loading) return <div className="text-center p-12 mt-12"><h1 className="text-2xl font-bold">Chargement...</h1></div>;

    if (error || !event) return (
        <div className="text-center p-12 mt-12">
            <h1 className="text-2xl font-bold text-red-500">{error || "Événement introuvable"}</h1>
            <Link href="/" className="text-sbc underline mt-4 inline-block">Retour à l'accueil</Link>
        </div>
    );

    // Filter teams for "joueur" mode
    let allowedTeamsList: string[] = [];
    if (event.mode !== "benevole") {
        if (event.allowed_teams && event.allowed_teams.length > 0) {
            allowedTeamsList = event.allowed_teams;
        } else {
            allowedTeamsList = Object.keys(teamsData);
        }
    }

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <img src={`/${event.image}`} alt={`Image de fond ${event.title}`} className="w-full h-full object-cover blur-sm brightness-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white px-4 fade-in">
                        <h1 className="text-4xl md:text-5xl font-bold mb-2">{event.title}</h1>
                        <p className="text-xl"><i className="far fa-calendar mr-2"></i> {event.date}</p>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-12 flex-grow fade-in -mt-16 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                            <h2 className="text-2xl font-bold text-sbc-dark mb-6 flex items-center gap-2">
                                <i className="fas fa-info-circle"></i> Détails de l'événement
                            </h2>

                            <img src={`/${event.image}`} alt={event.title} className="w-full rounded-xl mb-6 shadow-md object-cover max-h-96" />
                            <p className="text-gray-700 leading-relaxed text-lg mb-6">{event.description}</p>

                            <div className="flex flex-wrap gap-4 text-sm font-bold text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <span className="flex items-center gap-2"><i className="fas fa-calendar text-sbc"></i> {event.date}</span>
                                <span className="flex items-center gap-2"><i className="fas fa-clock text-sbc"></i> {event.time}</span>
                                <span className="flex items-center gap-2"><i className="fas fa-map-marker-alt text-sbc"></i> {event.location}</span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-24 border-t-4 border-sbc">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                {event.mode === "benevole" ? "Je participe !" : "Inscription pour l'événement"}
                            </h2>
                            <p className="text-gray-500 mb-6 text-sm">
                                {event.mode === "benevole"
                                    ? "Merci de votre aide. Choisissez votre mission ci-dessous."
                                    : "Sélectionnez l'équipe et le joueur pour valider la présence."}
                            </p>

                            {submissionStatus === "success" ? (
                                <div className="bg-green-100 text-green-700 p-6 rounded-lg border border-green-200 animate-fade-in-up text-center">
                                    <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i className="fas fa-check"></i></div>
                                    <h3 className="font-bold text-xl mb-2">Inscription Validée !</h3>
                                    <p>Merci pour votre participation.</p>
                                    <Link href="/" className="block mt-6 text-center bg-sbc text-white py-3 rounded-lg font-bold hover:bg-sbc-dark transition shadow-md">Retour à l'accueil</Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                                {event.mode === "benevole" ? "Votre Nom & Prénom" : "Parent (Nom Prénom)"}
                                            </label>
                                            <input type="text" required value={parentName} onChange={e => setParentName(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-sbc"
                                                placeholder="Responsable" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Email de contact</label>
                                            <input type="email" required value={parentEmail} onChange={e => setParentEmail(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-sbc"
                                                placeholder="Pour confirmation" />
                                        </div>
                                    </div>

                                    <hr className="border-gray-100 mb-6" />

                                    <div className="space-y-4 mb-4">
                                        {loadingCounts && <div className="text-center p-4 text-sbc font-bold animate-pulse"><i className="fas fa-spinner fa-spin mr-2"></i> Chargement des places...</div>}

                                        {rows.map((row, index) => (
                                            <div key={row.id} className={`participant-row p-4 rounded-lg border relative animate-fade-in-up transition-all duration-300 ${event.mode === "benevole" ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"}`}>
                                                {rows.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveRow(row.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition"><i className="fas fa-times"></i></button>
                                                )}

                                                <p className={`text-xs font-bold uppercase mb-2 ${event.mode === "benevole" ? "text-yellow-600" : "text-gray-400"}`}>
                                                    {event.mode === "benevole" ? <><i className="fas fa-hand-holding-heart mr-1"></i> Votre Mission</> : `Joueur ${index + 1}`}
                                                </p>

                                                <div className="space-y-3">
                                                    {event.mode === "benevole" ? (
                                                        <select required value={row.role || ""} onChange={e => handleRowChange(row.id, "role", e.target.value)}
                                                            className="w-full bg-white border border-yellow-300 rounded-lg p-2 text-sm focus:border-sbc focus:outline-none">
                                                            <option value="" disabled>Choisir une mission</option>
                                                            {event.roles?.map((role, i) => {
                                                                const current = benevoleCounts[role.name] || 0;
                                                                const remaining = role.max - current;
                                                                let label = `🟢 ${role.name} (${remaining} places)`;
                                                                let disabled = false;
                                                                if (remaining <= 0) {
                                                                    label = `🔴 ${role.name} (COMPLET)`;
                                                                    disabled = true;
                                                                } else if (remaining <= role.max / 2) {
                                                                    label = `🟠 ${role.name} (${remaining} places)`;
                                                                }
                                                                return <option key={i} value={role.name} disabled={disabled}>{label}</option>
                                                            })}
                                                        </select>
                                                    ) : (
                                                        <>
                                                            <select required value={row.team || ""} onChange={e => {
                                                                handleRowChange(row.id, "team", e.target.value);
                                                                handleRowChange(row.id, "player", ""); // Reset player when team changes
                                                            }}
                                                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:border-sbc focus:outline-none transition">
                                                                <option value="" disabled>Choisir l'équipe</option>
                                                                {allowedTeamsList.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                            <select required value={row.player || ""} onChange={e => handleRowChange(row.id, "player", e.target.value)}
                                                                disabled={!row.team}
                                                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:border-sbc focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 transition">
                                                                <option value="" disabled>Choisir le joueur</option>
                                                                {row.team && Object.values(teamsData).find(t => t.name === row.team)?.players?.map((p: any) => (
                                                                    <option key={p.name} value={p.name}>{p.name}</option>
                                                                ))}
                                                            </select>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button type="button" onClick={handleAddRow}
                                        className="text-sm text-sbc font-bold hover:underline mb-6 flex items-center gap-1">
                                        <i className="fas fa-plus-circle"></i> {event.mode === "benevole" ? "Ajouter une autre mission" : "Ajouter un autre joueur"}
                                    </button>

                                    <button type="submit" disabled={submissionStatus === "submitting"}
                                        className="w-full bg-sbc hover:bg-sbc-dark text-white font-bold py-4 rounded-xl shadow-lg transform hover:-translate-y-1 transition duration-300 disabled:opacity-75 disabled:cursor-not-allowed">
                                        {submissionStatus === "submitting" ? <><i className="fas fa-spinner fa-spin mr-2"></i> Enregistrement...</> : "Valider l'inscription"}
                                    </button>

                                    {submissionStatus === "error" && (
                                        <div className="mt-4 bg-red-100 text-red-700 p-3 rounded text-center">Erreur réseau. Veuillez réessayer.</div>
                                    )}
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
