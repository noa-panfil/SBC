"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type MembershipRole = "player" | "coach" | "assistant_coach";

interface Member {
    person_id: number;
    name: string;
    role: MembershipRole;
    num?: number | null;
    img: string | null;
    birth: string | null;
    sexe: string;
}

interface Team {
    id: string;
    season_id?: number;
    season?: string;
    name: string;
    category: string;
    image: string | null;
    image_id?: number | null;
    storyImage?: string | null;
    story_image_id?: number | null;
    trainingSlots: string[];
    widgetId: string;
    coaches: Member[];
    players: Member[];
}

interface Candidate {
    id: number;
    name: string;
    image_id: number | null;
    img: string | null;
    birth: string | null;
    sexe: string;
    roles: string[];
}

const cloneTeam = (team: Team): Team => JSON.parse(JSON.stringify(team));

export default function AdminTeamsClient({ teams, candidates, teamToOpen }: {
    teams: Team[];
    candidates: Candidate[];
    teamToOpen?: Team | null;
}) {
    const router = useRouter();
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [playerCandidateId, setPlayerCandidateId] = useState("");
    const [coachCandidateId, setCoachCandidateId] = useState("");
    const [coachRole, setCoachRole] = useState<"coach" | "assistant_coach">("coach");
    const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const storyImageInputRef = useRef<HTMLInputElement>(null);

    const showNotification = (message: string, type: "success" | "error") => {
        setNotification({ message, type });
        window.setTimeout(() => setNotification(null), 3000);
    };

    const openTeam = (team: Team, edit = false) => {
        const copy = cloneTeam(team);
        setSelectedTeam(copy);
        setEditingTeam(copy);
        setIsEditing(edit);
        setPlayerCandidateId("");
        setCoachCandidateId("");
    };

    useEffect(() => {
        if (teamToOpen) openTeam(teamToOpen, true);
    }, [teamToOpen]);

    const availablePlayers = useMemo(() => candidates.filter((candidate) =>
        candidate.roles.includes("player") &&
        !editingTeam?.players.some((member) => member.person_id === candidate.id)
    ), [candidates, editingTeam?.players]);

    const availableCoaches = useMemo(() => candidates.filter((candidate) =>
        (candidate.roles.includes("coach") || candidate.roles.includes("assistant_coach")) &&
        !editingTeam?.coaches.some((member) => member.person_id === candidate.id && member.role === coachRole)
    ), [candidates, editingTeam?.coaches, coachRole]);

    const uploadImage = async (file: File, target: "banner" | "story") => {
        if (!editingTeam) return;
        const previewUrl = URL.createObjectURL(file);
        setEditingTeam((current) => current ? {
            ...current,
            ...(target === "banner" ? { image: previewUrl } : { storyImage: previewUrl }),
        } : null);

        const data = new FormData();
        data.append("file", file);
        data.append("scope", "team");
        const response = await fetch("/api/admin/upload", { method: "POST", body: data });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            URL.revokeObjectURL(previewUrl);
            return showNotification(result.error || `L’image n’a pas pu être importée (erreur ${response.status}).`, "error");
        }

        const associationResponse = await fetch("/api/admin/teams/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamId: Number(editingTeam.id), imageId: Number(result.id), target }),
        });
        const associationResult = await associationResponse.json().catch(() => ({}));
        if (!associationResponse.ok) {
            URL.revokeObjectURL(previewUrl);
            return showNotification(associationResult.error || "L’image a été importée, mais n’a pas pu être associée à l’équipe.", "error");
        }

        setEditingTeam((current) => current ? {
            ...current,
            ...(target === "banner"
                ? { image_id: Number(result.id), image: String(result.url) }
                : { story_image_id: Number(result.id), storyImage: String(result.url) }),
        } : null);
        setSelectedTeam((current) => current ? {
            ...current,
            ...(target === "banner"
                ? { image_id: Number(result.id), image: String(result.url) }
                : { story_image_id: Number(result.id), storyImage: String(result.url) }),
        } : null);
        URL.revokeObjectURL(previewUrl);
        showNotification("Image de l’équipe enregistrée.", "success");
        router.refresh();
    };

    const candidateToMember = (candidate: Candidate, role: MembershipRole): Member => ({
        person_id: candidate.id,
        name: candidate.name,
        role,
        num: null,
        img: candidate.img,
        birth: candidate.birth,
        sexe: candidate.sexe,
    });

    const addPlayer = () => {
        if (!editingTeam || !playerCandidateId) return;
        const candidate = candidates.find((item) => item.id === Number(playerCandidateId));
        if (!candidate) return;
        setEditingTeam({ ...editingTeam, players: [...editingTeam.players, candidateToMember(candidate, "player")] });
        setPlayerCandidateId("");
    };

    const addCoach = () => {
        if (!editingTeam || !coachCandidateId) return;
        const candidate = candidates.find((item) => item.id === Number(coachCandidateId));
        if (!candidate) return;
        setEditingTeam({ ...editingTeam, coaches: [...editingTeam.coaches, candidateToMember(candidate, coachRole)] });
        setCoachCandidateId("");
    };

    const removeMember = (type: "players" | "coaches", index: number) => {
        if (!editingTeam) return;
        setEditingTeam({ ...editingTeam, [type]: editingTeam[type].filter((_, itemIndex) => itemIndex !== index) });
    };

    const addTrainingSlot = () => {
        if (!editingTeam) return;
        setEditingTeam({ ...editingTeam, trainingSlots: [...editingTeam.trainingSlots, ""] });
    };

    const patchTrainingSlot = (index: number, value: string) => {
        if (!editingTeam) return;
        setEditingTeam({
            ...editingTeam,
            trainingSlots: editingTeam.trainingSlots.map((slot, slotIndex) => slotIndex === index ? value : slot),
        });
    };

    const removeTrainingSlot = (index: number) => {
        if (!editingTeam) return;
        setEditingTeam({
            ...editingTeam,
            trainingSlots: editingTeam.trainingSlots.filter((_, slotIndex) => slotIndex !== index),
        });
    };

    const patchMember = (type: "players" | "coaches", index: number, patch: Partial<Member>) => {
        setEditingTeam((current) => current ? {
            ...current,
            [type]: current[type].map((member, itemIndex) => itemIndex === index ? { ...member, ...patch } : member),
        } : null);
    };

    const saveChanges = async () => {
        if (!editingTeam || !editingTeam.name.trim()) return;
        setSaving(true);
        const response = await fetch("/api/admin/teams/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                teamId: Number(editingTeam.id),
                name: editingTeam.name.trim(),
                bannerId: editingTeam.image_id || null,
                storyImageId: editingTeam.story_image_id || null,
                category: editingTeam.category,
                trainingSlots: editingTeam.trainingSlots,
                widgetId: editingTeam.widgetId,
                members: [...editingTeam.players, ...editingTeam.coaches].map((member) => ({
                    person_id: member.person_id,
                    membership_role: member.role,
                    jersey_number: member.role === "player" ? member.num || null : null,
                })),
            }),
        });
        const result = await response.json().catch(() => ({}));
        setSaving(false);
        if (!response.ok) return showNotification(result.error || "Erreur lors de la sauvegarde.", "error");
        const saved = cloneTeam(editingTeam);
        setSelectedTeam(saved);
        setEditingTeam(saved);
        setIsEditing(false);
        showNotification("Équipe enregistrée.", "success");
        router.refresh();
    };

    const deleteTeam = async () => {
        if (!selectedTeam || !confirm(`Supprimer définitivement l’équipe « ${selectedTeam.name} » ?\n\nSes affectations seront retirées, mais les fiches des joueurs et coachs seront conservées.`)) return;
        setSaving(true);
        const response = await fetch(`/api/admin/teams?id=${selectedTeam.id}`, { method: "DELETE" });
        const result = await response.json().catch(() => ({}));
        setSaving(false);
        if (!response.ok) return showNotification(result.error || "Impossible de supprimer l’équipe.", "error");
        setSelectedTeam(null);
        setEditingTeam(null);
        showNotification("Équipe supprimée.", "success");
        router.refresh();
    };

    return <div className="relative mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {notification && <div className={`fixed bottom-8 right-8 z-[120] rounded-xl px-6 py-4 font-bold text-white shadow-2xl ${notification.type === "success" ? "bg-green-600" : "bg-red-600"}`}>{notification.message}</div>}

        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-800"><i className="fas fa-basketball-ball text-sbc" />Gestion des équipes</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => <button type="button" key={team.id} onClick={() => openTeam(team)} className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-left transition hover:border-sbc hover:shadow-lg md:p-5">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border bg-gray-50"><img src={team.image || "/img/default-team.png"} alt="" className="h-full w-full object-cover transition group-hover:scale-110" /></div>
                <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-black uppercase text-gray-900 group-hover:text-sbc md:text-base">{team.name}</h3><p className="mt-1 text-[10px] font-black uppercase tracking-wider text-gray-400">Saison {team.season}</p><p className="truncate text-xs font-bold uppercase tracking-widest text-gray-400">{team.category}</p></div>
                <i className="fas fa-chevron-right text-gray-300" />
            </button>)}
        </div>

        {selectedTeam && editingTeam && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-gray-900/40 p-0 backdrop-blur-md md:items-center md:p-4" onMouseDown={() => { if (!isEditing) setSelectedTeam(null); }}>
            <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[2.5rem] border bg-white shadow-2xl md:h-[88vh] md:rounded-[2rem]" onMouseDown={(event) => event.stopPropagation()}>
                <header className="flex items-center justify-between border-b px-6 py-5">
                    <div><h3 className="text-xl font-black uppercase tracking-tight md:text-2xl">{isEditing ? "Modifier l’équipe" : selectedTeam.name}</h3><p className="text-xs font-bold uppercase tracking-widest text-gray-400">Saison {editingTeam.season}</p></div>
                    <div className="flex gap-2">
                        <button type="button" disabled={saving} onClick={deleteTeam} className="h-10 w-10 rounded-xl bg-red-50 text-red-700 transition hover:bg-red-600 hover:text-white disabled:opacity-40" title="Supprimer l’équipe"><i className="fas fa-trash" /></button>
                        {isEditing ? <><button type="button" onClick={() => { setEditingTeam(cloneTeam(selectedTeam)); setIsEditing(false); }} className="rounded-xl px-4 py-2.5 text-xs font-black uppercase text-gray-500 hover:bg-gray-100">Annuler</button><button type="button" disabled={saving} onClick={saveChanges} className="rounded-xl bg-sbc px-5 py-2.5 text-xs font-black uppercase text-white disabled:opacity-50">{saving ? "Enregistrement…" : "Enregistrer"}</button></> : <><button type="button" onClick={() => setIsEditing(true)} className="rounded-xl bg-sbc/10 px-4 py-2.5 text-xs font-black uppercase text-sbc"><i className="fas fa-edit mr-2" />Éditer</button><button type="button" onClick={() => setSelectedTeam(null)} className="h-10 w-10 rounded-full hover:bg-gray-100"><i className="fas fa-times text-gray-400" /></button></>}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto bg-gray-50 p-5 md:p-7">
                    <div className="grid gap-7 lg:grid-cols-[320px_1fr]">
                        <aside className="space-y-5">
                            <ImageEditor label="Photo de l’équipe" image={editingTeam.image} editable={isEditing} onChoose={() => bannerInputRef.current?.click()} aspect="aspect-video" />
                            <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadImage(file, "banner"); event.target.value = ""; }} />
                            <ImageEditor label="Format story" image={editingTeam.storyImage || editingTeam.image} editable={isEditing} onChoose={() => storyImageInputRef.current?.click()} aspect="aspect-[9/16]" />
                            <input ref={storyImageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadImage(file, "story"); event.target.value = ""; }} />

                            <div className="space-y-4 rounded-2xl border bg-white p-5">
                                <Field label="Nom"><input disabled={!isEditing} required value={editingTeam.name} onChange={(event) => setEditingTeam({ ...editingTeam, name: event.target.value })} className="input disabled:bg-gray-50" /></Field>
                                <Field label="Catégorie"><input disabled={!isEditing} value={editingTeam.category || ""} onChange={(event) => setEditingTeam({ ...editingTeam, category: event.target.value })} className="input disabled:bg-gray-50" /></Field>
                                <Field label="Horaires d'entraînement">
                                    <div className="mt-2 space-y-2">
                                        {editingTeam.trainingSlots.map((slot, index) => <div key={index} className="flex gap-2">
                                            <input disabled={!isEditing} value={slot} onChange={(event) => patchTrainingSlot(index, event.target.value)} placeholder="Ex. Lundi 18h00 - 19h30" className="input mt-0 disabled:bg-gray-50" />
                                            {isEditing && <button type="button" onClick={() => removeTrainingSlot(index)} className="h-11 w-11 shrink-0 rounded-xl bg-red-50 text-red-700" title="Supprimer ce créneau"><i className="fas fa-trash" /></button>}
                                        </div>)}
                                        {!editingTeam.trainingSlots.length && !isEditing && <p className="text-sm font-medium text-gray-400">Aucun horaire renseigné.</p>}
                                        {isEditing && <button type="button" onClick={addTrainingSlot} className="w-full rounded-xl border border-dashed border-sbc/40 bg-green-50 px-3 py-2.5 text-sm font-black text-sbc"><i className="fas fa-plus mr-2" />Ajouter un créneau</button>}
                                    </div>
                                </Field>
                                <Field label="Identifiant widget"><input disabled={!isEditing} value={editingTeam.widgetId || ""} onChange={(event) => setEditingTeam({ ...editingTeam, widgetId: event.target.value })} className="input disabled:bg-gray-50" /></Field>
                            </div>
                        </aside>

                        <div className="space-y-7">
                            <MemberSection title="Coachs" icon="fa-user-tie">
                                {isEditing && <div className="mb-5 grid gap-3 rounded-2xl border border-dashed border-sbc/30 bg-green-50 p-4 md:grid-cols-[1fr_180px_auto]">
                                    <select value={coachCandidateId} onChange={(event) => setCoachCandidateId(event.target.value)} className="input"><option value="">Choisir un coach existant…</option>{availableCoaches.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select>
                                    <select value={coachRole} onChange={(event) => setCoachRole(event.target.value as "coach" | "assistant_coach")} className="input"><option value="coach">Coach</option><option value="assistant_coach">Coach adjoint</option></select>
                                    <button type="button" disabled={!coachCandidateId} onClick={addCoach} className="rounded-xl bg-sbc px-4 py-2.5 font-black text-white disabled:opacity-40"><i className="fas fa-file-import mr-2" />Importer</button>
                                </div>}
                                <div className="grid gap-3 md:grid-cols-2">{editingTeam.coaches.map((coach, index) => <article key={`${coach.person_id}-${coach.role}`} className="flex items-center gap-3 rounded-2xl border bg-white p-4">
                                    <Avatar member={coach} /><div className="min-w-0 flex-1"><p className="truncate font-black">{coach.name}</p>{isEditing ? <select value={coach.role} onChange={(event) => patchMember("coaches", index, { role: event.target.value as MembershipRole })} className="mt-1 rounded-lg border px-2 py-1 text-xs"><option value="coach">Coach</option><option value="assistant_coach">Coach adjoint</option></select> : <p className="text-xs font-bold uppercase text-sbc">{coach.role === "assistant_coach" ? "Coach adjoint" : "Coach"}</p>}</div>
                                    {isEditing ? <button type="button" onClick={() => removeMember("coaches", index)} className="h-9 w-9 rounded-lg bg-red-50 text-red-700"><i className="fas fa-trash" /></button> : <Link href={`/admin/players/${coach.person_id}`} className="text-gray-300 hover:text-sbc"><i className="fas fa-chevron-right" /></Link>}
                                </article>)}</div>
                                {!editingTeam.coaches.length && <EmptyMembers text="Aucun coach associé à cette équipe." />}
                            </MemberSection>

                            <MemberSection title={`Joueurs (${editingTeam.players.length})`} icon="fa-users">
                                {isEditing && <div className="mb-5 grid gap-3 rounded-2xl border border-dashed border-sbc/30 bg-green-50 p-4 md:grid-cols-[1fr_auto]">
                                    <select value={playerCandidateId} onChange={(event) => setPlayerCandidateId(event.target.value)} className="input"><option value="">Choisir un joueur existant…</option>{availablePlayers.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select>
                                    <button type="button" disabled={!playerCandidateId} onClick={addPlayer} className="rounded-xl bg-sbc px-4 py-2.5 font-black text-white disabled:opacity-40"><i className="fas fa-file-import mr-2" />Importer</button>
                                </div>}
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{editingTeam.players.map((player, index) => <article key={player.person_id} className="flex items-center gap-3 rounded-2xl border bg-white p-4">
                                    <Avatar member={player} /><div className="min-w-0 flex-1"><p className="truncate font-black">{player.name}</p>{player.birth && <p className="text-xs text-gray-400">Né(e) le {player.birth}</p>}{isEditing ? <label className="mt-2 flex items-center gap-2 text-xs font-bold text-gray-500">N°<input type="number" min="0" max="999" value={player.num ?? ""} onChange={(event) => patchMember("players", index, { num: event.target.value ? Number(event.target.value) : null })} className="w-16 rounded-lg border px-2 py-1" /></label> : <p className="text-xs font-bold text-sbc">#{player.num || "—"}</p>}</div>
                                    {isEditing ? <button type="button" onClick={() => removeMember("players", index)} className="h-9 w-9 rounded-lg bg-red-50 text-red-700"><i className="fas fa-trash" /></button> : <Link href={`/admin/players/${player.person_id}`} className="text-gray-300 hover:text-sbc"><i className="fas fa-chevron-right" /></Link>}
                                </article>)}</div>
                                {!editingTeam.players.length && <EmptyMembers text="Aucun joueur associé à cette équipe." />}
                            </MemberSection>

                            {isEditing && !availablePlayers.length && !availableCoaches.length && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Crée d’abord les joueurs et coachs depuis <Link href="/admin/players" className="font-black underline">Gestion des personnes</Link>, puis reviens les importer ici.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>}
    </div>;
}

function ImageEditor({ label, image, editable, onChoose, aspect }: { label: string; image: string | null | undefined; editable: boolean; onChoose: () => void; aspect: string }) {
    return <div className={`group relative overflow-hidden rounded-2xl border bg-gray-100 ${aspect}`}><img src={image || "/img/default-team.png"} alt="" className="h-full w-full object-cover" /><span className="absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1 text-[10px] font-black uppercase text-white">{label}</span>{editable && <button type="button" onClick={onChoose} className="absolute inset-0 flex items-center justify-center bg-black/50 font-black text-white opacity-0 transition group-hover:opacity-100"><i className="fas fa-camera mr-2" />Changer</button>}</div>;
}

function MemberSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return <section className="rounded-3xl border bg-white p-5 shadow-sm"><h4 className="mb-5 flex items-center gap-3 text-xl font-black"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-sbc text-sm text-white"><i className={`fas ${icon}`} /></span>{title}</h4>{children}</section>;
}

function Avatar({ member }: { member: Member }) {
    return <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">{member.img ? <img src={member.img} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-gray-300"><i className="fas fa-user" /></span>}</div>;
}

function EmptyMembers({ text }: { text: string }) {
    return <p className="rounded-2xl border-2 border-dashed p-7 text-center text-sm text-gray-400">{text}</p>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <label className="block text-sm font-black text-gray-700">{label}{children}</label>;
}
