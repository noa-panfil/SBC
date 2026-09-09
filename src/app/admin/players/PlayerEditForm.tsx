"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import ImageCropper from "@/components/ImageCropper";

type Role = { code: string; label: string };
type Team = { id: number; name: string; season: string };
type Membership = { team_id: number; membership_role: "player" | "coach" | "assistant_coach"; jersey_number: number | null };
type Person = {
    id: number | null; firstname: string; lastname: string; birthdate: string;
    gender: string; email: string; phone: string; image_id: number | null;
    active: boolean; roles: string[]; memberships: Membership[];
};

const membershipLabels = { player: "Joueur / Joueuse", coach: "Coach", assistant_coach: "Coach adjoint" };

export default function PlayerEditForm({ person, roles, teams }: { person: Person; roles: Role[]; teams: Team[] }) {
    const router = useRouter();
    const [form, setForm] = useState(person);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(person.image_id ? `/api/image/${person.image_id}?scope=person` : null);
    const fileInput = useRef<HTMLInputElement>(null);

    const toggleRole = (code: string) => setForm((current) => ({
        ...current,
        roles: current.roles.includes(code) ? current.roles.filter((role) => role !== code) : [...current.roles, code],
    }));

    const addMembership = () => {
        const firstAvailable = teams.find((team) => !form.memberships.some((item) => item.team_id === team.id && item.membership_role === "player"));
        if (firstAvailable) setForm({ ...form, memberships: [...form.memberships, { team_id: firstAvailable.id, membership_role: "player", jersey_number: null }] });
    };

    const patchMembership = (index: number, patch: Partial<Membership>) => setForm({
        ...form,
        memberships: form.memberships.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    });

    const uploadCrop = async (blob: Blob) => {
        setCropImageSrc(null);
        setPreviewUrl(URL.createObjectURL(blob));
        const data = new FormData();
        data.append("file", new File([blob], "person-avatar.jpg", { type: "image/jpeg" }));
        data.append("scope", "person");
        const response = await fetch("/api/admin/upload", { method: "POST", body: data });
        if (!response.ok) return setMessage("L’image n’a pas pu être importée.");
        const result = await response.json();
        setForm((current) => ({ ...current, image_id: result.id }));
    };

    const save = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true); setMessage("");
        const response = await fetch("/api/admin/players/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const result = await response.json().catch(() => ({}));
        setSaving(false);
        if (!response.ok) return setMessage(result.error || "Impossible d’enregistrer la personne.");
        router.push(`/admin/players/${result.id}`);
        router.refresh();
        setMessage("Fiche enregistrée.");
    };

    const remove = async () => {
        if (!form.id || !confirm("Supprimer définitivement cette personne et toutes ses affectations ?")) return;
        const response = await fetch(`/api/admin/players/save?id=${form.id}`, { method: "DELETE" });
        if (response.ok) router.push("/admin/players");
    };

    return <div className="rounded-3xl border border-gray-100 bg-white shadow-xl">
        {cropImageSrc && createPortal(<ImageCropper imageSrc={cropImageSrc} onCropComplete={uploadCrop} onCancel={() => setCropImageSrc(null)} />, document.body)}
        <form onSubmit={save} className="space-y-8 p-6 md:p-8">
            <div className="flex flex-col items-center">
                <button type="button" onClick={() => fileInput.current?.click()} className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg">
                    {previewUrl ? <img src={previewUrl} alt="" className="h-full w-full object-cover" /> : <i className="fas fa-camera text-3xl text-gray-300" />}
                </button>
                <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) setCropImageSrc(URL.createObjectURL(file)); event.target.value = ""; }} />
                <p className="mt-2 text-xs text-gray-400">Cliquer pour choisir et recadrer la photo</p>
            </div>

            <section><h2 className="mb-4 text-lg font-black">Identité</h2><div className="grid gap-4 md:grid-cols-2">
                <Field label="Prénom"><input required value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} className="input" /></Field>
                <Field label="Nom"><input required value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} className="input" /></Field>
                <Field label="Date de naissance"><input type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} className="input" /></Field>
                <Field label="Genre"><select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input"><option value="">Non renseigné</option><option value="F">Féminin</option><option value="M">Masculin</option><option value="X">Autre</option></select></Field>
                <Field label="E-mail"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" /></Field>
                <Field label="Téléphone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" /></Field>
            </div></section>

            <section><h2 className="mb-2 text-lg font-black">Fonctions dans le club</h2><p className="mb-4 text-sm text-gray-500">Une même personne peut cumuler plusieurs fonctions.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{roles.map((role) => <label key={role.code} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 font-bold ${form.roles.includes(role.code) ? "border-sbc bg-green-50 text-sbc-dark" : "border-gray-200"}`}><input type="checkbox" checked={form.roles.includes(role.code)} onChange={() => toggleRole(role.code)} />{role.label}</label>)}</div></section>

            <section><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-black">Affectations aux équipes</h2><p className="text-sm text-gray-500">Chaque équipe est liée à une saison : changez simplement la sélection lors d’une montée de catégorie.</p></div><button type="button" onClick={addMembership} className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-bold text-white"><i className="fas fa-plus mr-2" />Affecter</button></div>
                <div className="space-y-3">{form.memberships.map((membership, index) => <div key={`${membership.team_id}-${index}`} className="grid gap-3 rounded-2xl border bg-gray-50 p-4 md:grid-cols-[1fr_180px_100px_auto]">
                    <select value={membership.team_id} onChange={(e) => patchMembership(index, { team_id: Number(e.target.value) })} className="input">{teams.map((team) => <option key={team.id} value={team.id}>{team.season} — {team.name}</option>)}</select>
                    <select value={membership.membership_role} onChange={(e) => patchMembership(index, { membership_role: e.target.value as Membership["membership_role"] })} className="input">{Object.entries(membershipLabels).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select>
                    <input type="number" min="0" max="999" placeholder="N°" value={membership.jersey_number ?? ""} onChange={(e) => patchMembership(index, { jersey_number: e.target.value ? Number(e.target.value) : null })} className="input" />
                    <button type="button" onClick={() => setForm({ ...form, memberships: form.memberships.filter((_, i) => i !== index) })} className="rounded-xl bg-red-50 px-4 text-red-700"><i className="fas fa-trash" /></button>
                </div>)}{!form.memberships.length && <p className="rounded-2xl border-2 border-dashed p-6 text-center text-gray-400">Aucune équipe affectée.</p>}</div>
            </section>

            <label className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4 font-bold"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />Fiche active</label>
            {message && <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{message}</p>}
            <div className="flex flex-col gap-3 sm:flex-row"><button disabled={saving} className="flex-1 rounded-xl bg-sbc py-4 font-black text-white disabled:opacity-50">{saving ? "Enregistrement…" : "Enregistrer"}</button>{form.id && <button type="button" onClick={remove} className="rounded-xl bg-red-50 px-6 py-4 font-bold text-red-700">Supprimer</button>}<button type="button" onClick={() => router.push("/admin/players")} className="rounded-xl border px-6 py-4 font-bold">Retour</button></div>
        </form>
    </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <label className="text-sm font-bold text-gray-700">{label}{children}</label>;
}
