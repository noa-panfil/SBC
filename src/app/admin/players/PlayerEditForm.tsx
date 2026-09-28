"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import ImageCropper from "@/components/ImageCropper";

type Role = { code: string; label: string };
type Team = { id: number; name: string; season: string };
type Membership = { team_id: number; membership_role: "player" | "coach" | "assistant_coach"; jersey_number: number | null };
type RoleContext = "player" | "coach" | "bureau";
type RolePhotos = Record<RoleContext, { image_id: number | null; celebration_image_id: number | null }>;
type Person = {
    id: number | null; firstname: string; lastname: string; birthdate: string;
    gender: string; email: string; phone: string; active: boolean; roles: string[]; memberships: Membership[];
    role_images: RolePhotos;
};
type PhotoKind = "classic" | "celebration";

const membershipLabels = { player: "Joueur / Joueuse", coach: "Coach", assistant_coach: "Coach adjoint" };
const photoContexts: { code: RoleContext; label: string; description: string; icon: string }[] = [
    { code: "player", label: "Joueur", description: "Photos affichées dans l’effectif en tant que joueur.", icon: "fa-basketball-ball" },
    { code: "coach", label: "Coach", description: "Photos utilisées pour les rôles de coach et coach adjoint.", icon: "fa-user-tie" },
    { code: "bureau", label: "Bureau", description: "Portrait affiché dans l’organigramme et les espaces du bureau.", icon: "fa-users-cog" },
];

export default function PlayerEditForm({ person, roles, teams }: { person: Person; roles: Role[]; teams: Team[] }) {
    const router = useRouter();
    const [form, setForm] = useState(person);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [activePhotoContext, setActivePhotoContext] = useState<RoleContext>("player");
    const [cropRequest, setCropRequest] = useState<{ src: string; context: RoleContext; kind: PhotoKind } | null>(null);
    const [previewUrls, setPreviewUrls] = useState<Record<RoleContext, Record<PhotoKind, string | null>>>(() =>
        Object.fromEntries(Object.entries(person.role_images).map(([context, photos]) => [context, {
            classic: photos.image_id ? `/api/image/${photos.image_id}?scope=person` : null,
            celebration: photos.celebration_image_id ? `/api/image/${photos.celebration_image_id}?scope=person` : null,
        }])) as Record<RoleContext, Record<PhotoKind, string | null>>
    );
    const visiblePhotoContexts = photoContexts.filter((context) => {
        if (context.code === "player") return form.roles.includes("player") || form.memberships.some((membership) => membership.membership_role === "player");
        if (context.code === "coach") return form.roles.some((role) => ["coach", "assistant_coach"].includes(role)) || form.memberships.some((membership) => ["coach", "assistant_coach"].includes(membership.membership_role));
        return form.roles.some((role) => ["board_member", "bureau", "bureau_member"].includes(role));
    });
    const selectedPhotoContext = visiblePhotoContexts.find((context) => context.code === activePhotoContext)?.code || visiblePhotoContexts[0]?.code;

    const toggleRole = (code: string) => setForm((current) => ({ ...current, roles: current.roles.includes(code) ? current.roles.filter((role) => role !== code) : [...current.roles, code] }));
    const addMembership = () => {
        const firstAvailable = teams.find((team) => !form.memberships.some((item) => item.team_id === team.id && item.membership_role === "player"));
        if (firstAvailable) setForm({ ...form, memberships: [...form.memberships, { team_id: firstAvailable.id, membership_role: "player", jersey_number: null }] });
    };
    const patchMembership = (index: number, patch: Partial<Membership>) => setForm({ ...form, memberships: form.memberships.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });

    const choosePhoto = (file: File | undefined, context: RoleContext, kind: PhotoKind) => {
        if (file) setCropRequest({ src: URL.createObjectURL(file), context, kind });
    };

    const uploadCrop = async (blob: Blob, context: RoleContext, kind: PhotoKind) => {
        setCropRequest(null);
        const temporaryUrl = URL.createObjectURL(blob);
        setPreviewUrls((current) => ({ ...current, [context]: { ...current[context], [kind]: temporaryUrl } }));
        const data = new FormData();
        data.append("file", new File([blob], `person-${context}-${kind}.png`, { type: "image/png" }));
        data.append("scope", "person");
        const response = await fetch("/api/admin/upload", { method: "POST", body: data });
        if (!response.ok) return setMessage("L’image n’a pas pu être importée.");
        const result = await response.json();
        URL.revokeObjectURL(temporaryUrl);
        setPreviewUrls((current) => ({ ...current, [context]: { ...current[context], [kind]: result.url } }));
        const field = kind === "classic" ? "image_id" : "celebration_image_id";
        setForm((current) => ({
            ...current,
            role_images: { ...current.role_images, [context]: { ...current.role_images[context], [field]: result.id } },
        }));
        setMessage("");
    };

    const removePhoto = (context: RoleContext, kind: PhotoKind) => {
        const field = kind === "classic" ? "image_id" : "celebration_image_id";
        setPreviewUrls((current) => ({ ...current, [context]: { ...current[context], [kind]: null } }));
        setForm((current) => ({
            ...current,
            role_images: { ...current.role_images, [context]: { ...current.role_images[context], [field]: null } },
        }));
    };

    const save = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true); setMessage("");
        const response = await fetch("/api/admin/players/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const result = await response.json().catch(() => ({}));
        setSaving(false);
        if (!response.ok) return setMessage(result.error || "Impossible d’enregistrer la personne.");
        router.push(`/admin/players/${result.id}`); router.refresh(); setMessage("Fiche enregistrée.");
    };

    const remove = async () => {
        if (!form.id || !confirm("Supprimer définitivement cette personne et toutes ses affectations ?")) return;
        const response = await fetch(`/api/admin/players/save?id=${form.id}`, { method: "DELETE" });
        if (response.ok) router.push("/admin/players");
    };

    return <div className="rounded-3xl border border-gray-100 bg-white shadow-xl">
        {cropRequest && createPortal(<ImageCropper imageSrc={cropRequest.src} aspect={4 / 5} cropShape="rect" outputWidth={960} outputHeight={1200} outputMimeType="image/png" faceGuide title={cropRequest.kind === "classic" ? "Recadrer le portrait classique" : "Recadrer la célébration"} onCropComplete={(blob) => uploadCrop(blob, cropRequest.context, cropRequest.kind)} onCancel={() => setCropRequest(null)} />, document.body)}
        <form onSubmit={save} className="space-y-8 p-6 md:p-8">
            <section>
                <div className="mb-5"><h2 className="text-lg font-black">Photos par fonction</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">Chaque fonction possède désormais ses propres visuels. Le même guide de visage est utilisé pour aligner les portraits classique et célébration.</p></div>
                {visiblePhotoContexts.length ? <div className="mb-5 grid gap-3 sm:grid-cols-3">
                    {visiblePhotoContexts.map((context) => <button key={context.code} type="button" onClick={() => setActivePhotoContext(context.code)} className={`rounded-2xl border p-4 text-left transition ${selectedPhotoContext === context.code ? "border-sbc bg-green-50 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}>
                        <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${selectedPhotoContext === context.code ? "bg-sbc text-white" : "bg-gray-100 text-gray-500"}`}><i className={`fas ${context.icon}`} /></span>
                        <span className="block font-black text-gray-950">{context.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-gray-500">{context.description}</span>
                    </button>)}
                </div> : <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm font-semibold leading-6 text-gray-500">Attribuez d’abord une fonction Joueur, Coach ou Membre du bureau pour faire apparaître les photos correspondantes.</p>}
                {selectedPhotoContext && <div className={`grid gap-5 ${selectedPhotoContext === "bureau" ? "sm:max-w-[calc(50%-0.625rem)]" : "sm:grid-cols-2"}`}>
                    {(["classic", ...(selectedPhotoContext === "bureau" ? [] : ["celebration"])] as PhotoKind[]).map((kind) => {
                        const isClassic = kind === "classic";
                        return <div key={kind} className="overflow-hidden rounded-3xl border border-gray-200 bg-[#f2f3ef]">
                            <div className="relative aspect-[4/5] overflow-hidden bg-[radial-gradient(circle_at_50%_22%,rgba(74,222,128,.22),transparent_28%),linear-gradient(145deg,#f7f8f5,#e5e9e1)]">
                                {previewUrls[selectedPhotoContext][kind] ? <img src={previewUrls[selectedPhotoContext][kind]!} alt={isClassic ? "Aperçu du portrait classique" : "Aperçu de la célébration"} className="absolute inset-0 h-full w-full object-cover object-top drop-shadow-[0_18px_18px_rgba(0,0,0,.18)]" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-400"><i className={`fas ${isClassic ? "fa-user" : "fa-bolt"} text-4xl`} /><p className="mt-3 text-sm font-bold">Photo à importer</p></div>}
                                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-sbc-dark shadow-sm backdrop-blur">{selectedPhotoContext === "bureau" ? "Portrait bureau" : isClassic ? "01 · Classique" : "02 · Célébration"}</span>
                            </div>
                            <div className="bg-white p-4"><div className="flex gap-2"><label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-black text-white transition hover:bg-sbc"><i className="fas fa-camera" />{previewUrls[selectedPhotoContext][kind] ? "Remplacer" : "Choisir la photo"}<input type="file" accept="image/png,image/webp,image/jpeg,image/avif" className="hidden" onChange={(event) => { choosePhoto(event.target.files?.[0], selectedPhotoContext, kind); event.target.value = ""; }} /></label>{previewUrls[selectedPhotoContext][kind] && <button type="button" onClick={() => removePhoto(selectedPhotoContext, kind)} aria-label="Retirer cette photo" className="rounded-xl bg-red-50 px-4 text-red-700 transition hover:bg-red-100"><i className="fas fa-trash" /></button>}</div><p className="mt-2 text-center text-[11px] text-gray-400">960 × 1200 px · même ratio que le site</p></div>
                        </div>;
                    })}
                </div>}
            </section>

            <section><h2 className="mb-4 text-lg font-black">Identité</h2><div className="grid gap-4 md:grid-cols-2">
                <Field label="Prénom"><input required value={form.firstname} onChange={(event) => setForm({ ...form, firstname: event.target.value })} className="input" /></Field>
                <Field label="Nom"><input required value={form.lastname} onChange={(event) => setForm({ ...form, lastname: event.target.value })} className="input" /></Field>
                <Field label="Date de naissance"><input type="date" value={form.birthdate} onChange={(event) => setForm({ ...form, birthdate: event.target.value })} className="input" /></Field>
                <Field label="Genre"><select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} className="input"><option value="">Non renseigné</option><option value="F">Féminin</option><option value="M">Masculin</option><option value="X">Autre</option></select></Field>
                <Field label="E-mail"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="input" /></Field>
                <Field label="Téléphone"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="input" /></Field>
            </div></section>

            <section><h2 className="mb-2 text-lg font-black">Fonctions dans le club</h2><p className="mb-4 text-sm text-gray-500">Une même personne peut cumuler plusieurs fonctions.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{roles.map((role) => <label key={role.code} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 font-bold ${form.roles.includes(role.code) ? "border-sbc bg-green-50 text-sbc-dark" : "border-gray-200"}`}><input type="checkbox" checked={form.roles.includes(role.code)} onChange={() => toggleRole(role.code)} />{role.label}</label>)}</div></section>

            <section><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-black">Affectations aux équipes</h2><p className="text-sm text-gray-500">Chaque équipe est liée à une saison : changez simplement la sélection lors d’une montée de catégorie.</p></div><button type="button" onClick={addMembership} className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-bold text-white"><i className="fas fa-plus mr-2" />Affecter</button></div>
                <div className="space-y-3">{form.memberships.map((membership, index) => <div key={`${membership.team_id}-${index}`} className="grid gap-3 rounded-2xl border bg-gray-50 p-4 md:grid-cols-[1fr_180px_100px_auto]">
                    <select value={membership.team_id} onChange={(event) => patchMembership(index, { team_id: Number(event.target.value) })} className="input">{teams.map((team) => <option key={team.id} value={team.id}>{team.season} — {team.name}</option>)}</select>
                    <select value={membership.membership_role} onChange={(event) => patchMembership(index, { membership_role: event.target.value as Membership["membership_role"] })} className="input">{Object.entries(membershipLabels).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select>
                    <input type="number" min="0" max="999" aria-label="Numéro de maillot" placeholder="N°" value={membership.jersey_number ?? ""} onChange={(event) => patchMembership(index, { jersey_number: event.target.value ? Number(event.target.value) : null })} className="input" />
                    <button type="button" aria-label="Retirer cette affectation" onClick={() => setForm({ ...form, memberships: form.memberships.filter((_, itemIndex) => itemIndex !== index) })} className="rounded-xl bg-red-50 px-4 text-red-700"><i className="fas fa-trash" /></button>
                </div>)}{!form.memberships.length && <p className="rounded-2xl border-2 border-dashed p-6 text-center text-gray-400">Aucune équipe affectée.</p>}</div>
            </section>

            <label className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4 font-bold"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />Fiche active</label>
            {message && <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{message}</p>}
            <div className="flex flex-col gap-3 sm:flex-row"><button disabled={saving} className="flex-1 rounded-xl bg-sbc py-4 font-black text-white disabled:opacity-50">{saving ? "Enregistrement…" : "Enregistrer"}</button>{form.id && <button type="button" onClick={remove} className="rounded-xl bg-red-50 px-6 py-4 font-bold text-red-700">Supprimer</button>}<button type="button" onClick={() => router.push("/admin/players")} className="rounded-xl border px-6 py-4 font-bold">Retour</button></div>
        </form>
    </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <label className="text-sm font-bold text-gray-700">{label}{children}</label>;
}
