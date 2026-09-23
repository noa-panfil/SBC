"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Partner = {
    id: number | null;
    name: string;
    websiteUrl: string;
    imageId: number | null;
    image: string | null;
    displayOrder: number;
    active: boolean;
};

const emptyPartner: Partner = {
    id: null,
    name: "",
    websiteUrl: "",
    imageId: null,
    image: null,
    displayOrder: 0,
    active: true,
};

async function responseJson(response: Response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
    return data;
}

export default function AdminPartnersManager() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [draft, setDraft] = useState<Partner>(emptyPartner);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

    const notify = useCallback((text: string, error = false) => {
        setMessage({ text, error });
        window.setTimeout(() => setMessage(null), 3500);
    }, []);

    const loadPartners = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/admin/partners", { cache: "no-store" });
            setPartners(await responseJson(response));
        } catch (error) {
            notify(error instanceof Error ? error.message : "Chargement impossible.", true);
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        void loadPartners();
    }, [loadPartners]);

    const patchPartner = (id: number, patch: Partial<Partner>) => {
        setPartners((current) => current.map((partner) => partner.id === id ? { ...partner, ...patch } : partner));
    };

    const uploadImage = async (file: File, partner: Partner) => {
        const key = `upload-${partner.id ?? "new"}`;
        setBusy(key);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("scope", "partner");
            const data = await responseJson(await fetch("/api/admin/upload", { method: "POST", body: formData }));
            const patch = { imageId: Number(data.id), image: String(data.url) };
            if (partner.id === null) setDraft((current) => ({ ...current, ...patch }));
            else patchPartner(partner.id, patch);
            notify("Image importée. Enregistre le partenaire pour confirmer.");
        } catch (error) {
            notify(error instanceof Error ? error.message : "Import impossible.", true);
        } finally {
            setBusy(null);
        }
    };

    const savePartner = async (partner: Partner) => {
        const key = `save-${partner.id ?? "new"}`;
        setBusy(key);
        try {
            await responseJson(await fetch("/api/admin/partners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(partner),
            }));
            notify(partner.id === null ? "Partenaire ajouté." : "Partenaire enregistré.");
            if (partner.id === null) setDraft(emptyPartner);
            await loadPartners();
        } catch (error) {
            notify(error instanceof Error ? error.message : "Enregistrement impossible.", true);
        } finally {
            setBusy(null);
        }
    };

    const deletePartner = async (partner: Partner) => {
        if (partner.id === null || !window.confirm(`Supprimer « ${partner.name} » ?`)) return;
        setBusy(`delete-${partner.id}`);
        try {
            await responseJson(await fetch(`/api/admin/partners?id=${partner.id}`, { method: "DELETE" }));
            setPartners((current) => current.filter((item) => item.id !== partner.id));
            notify("Partenaire supprimé.");
        } catch (error) {
            notify(error instanceof Error ? error.message : "Suppression impossible.", true);
        } finally {
            setBusy(null);
        }
    };

    const partnerForm = (partner: Partner, isNew = false) => {
        const update = (patch: Partial<Partner>) => {
            if (isNew) setDraft((current) => ({ ...current, ...patch }));
            else if (partner.id !== null) patchPartner(partner.id, patch);
        };
        const suffix = partner.id ?? "new";

        return <article key={suffix} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[3/2] bg-gray-100">
                {partner.image
                    ? <Image src={partner.image} alt="" fill sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" unoptimized className="object-contain p-4" />
                    : <div className="flex h-full items-center justify-center text-gray-300"><i className="fas fa-handshake text-5xl" /></div>}
                {!partner.active && !isNew && <span className="absolute left-3 top-3 rounded-lg bg-gray-950/80 px-3 py-1 text-xs font-black uppercase text-white">Masqué</span>}
                <label className="absolute bottom-3 right-3 cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-black text-gray-900 shadow-lg">
                    <i className={`fas ${busy === `upload-${suffix}` ? "fa-spinner fa-spin" : "fa-camera"} mr-2`} />
                    Changer
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" disabled={busy !== null} onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadImage(file, partner);
                        event.target.value = "";
                    }} />
                </label>
            </div>
            <div className="space-y-4 p-5">
                <label className="block text-sm font-bold text-gray-700">Nom
                    <input value={partner.name} maxLength={255} onChange={(event) => update({ name: event.target.value })} placeholder="Nom du partenaire" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-medium outline-none focus:border-sbc" />
                </label>
                <label className="block text-sm font-bold text-gray-700">Lien du site
                    <input type="url" value={partner.websiteUrl} maxLength={2048} onChange={(event) => update({ websiteUrl: event.target.value })} placeholder="https://exemple.fr" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-medium outline-none focus:border-sbc" />
                </label>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
                    <label className="block text-sm font-bold text-gray-700">Ordre d’affichage
                        <input type="number" min="0" step="1" value={partner.displayOrder} onChange={(event) => update({ displayOrder: Math.max(0, Number(event.target.value) || 0) })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-sbc" />
                    </label>
                    <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-gray-50 px-3 text-sm font-bold text-gray-700">
                        <input type="checkbox" checked={partner.active} onChange={(event) => update({ active: event.target.checked })} className="h-5 w-5 accent-green-700" />
                        Affiché
                    </label>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => void savePartner(partner)} disabled={busy !== null || !partner.name.trim()} className="flex-1 rounded-xl bg-sbc px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
                        <i className={`fas ${busy === `save-${suffix}` ? "fa-spinner fa-spin" : "fa-save"} mr-2`} />{isNew ? "Ajouter" : "Enregistrer"}
                    </button>
                    {!isNew && <button type="button" title="Supprimer" aria-label={`Supprimer ${partner.name}`} onClick={() => void deletePartner(partner)} disabled={busy !== null} className="h-12 w-12 rounded-xl border border-red-200 text-red-600 disabled:opacity-50"><i className="fas fa-trash" /></button>}
                </div>
            </div>
        </article>;
    };

    return <div className="relative space-y-6">
        {message && <div role="status" className={`fixed bottom-24 right-4 z-[120] max-w-sm rounded-xl px-5 py-4 font-bold text-white shadow-2xl md:bottom-8 ${message.error ? "bg-red-600" : "bg-green-700"}`}>{message.text}</div>}
        <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm leading-6 text-green-950">
            Les partenaires sont affichés du plus petit au plus grand numéro. Une image importée est automatiquement optimisée au format WebP.
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {partnerForm(draft, true)}
            {loading
                ? <div className="flex min-h-72 items-center justify-center rounded-2xl border bg-white text-gray-400"><i className="fas fa-spinner fa-spin mr-2" />Chargement…</div>
                : partners.map((partner) => partnerForm(partner))}
        </div>
    </div>;
}