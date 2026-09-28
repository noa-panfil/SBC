"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export type AdminPalmaresItem = {
    id: number | null;
    year: number;
    title: string;
    description: string;
    category: string;
    imageId: number | null;
    image: string | null;
    isHighlight: boolean;
    awardLevel: "gold" | "silver" | "bronze";
};

const currentYear = new Date().getFullYear();

const emptyItem: AdminPalmaresItem = {
    id: null,
    year: currentYear,
    title: "",
    description: "",
    category: "Séniors",
    imageId: null,
    image: null,
    isHighlight: false,
    awardLevel: "gold",
};

async function responseJson(response: Response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
    return data;
}

export default function AdminPalmaresManager() {
    const [items, setItems] = useState<AdminPalmaresItem[]>([]);
    const [draft, setDraft] = useState<AdminPalmaresItem>(emptyItem);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

    const notify = useCallback((text: string, error = false) => {
        setMessage({ text, error });
        window.setTimeout(() => setMessage(null), 4000);
    }, []);

    const loadPalmares = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/admin/palmares", { cache: "no-store" });
            setItems(await responseJson(response));
        } catch (error) {
            notify(error instanceof Error ? error.message : "Chargement impossible.", true);
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        void loadPalmares();
    }, [loadPalmares]);

    const highlightCount = items.filter((i) => i.isHighlight).length;

    const patchItem = (id: number, patch: Partial<AdminPalmaresItem>) => {
        setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
    };

    const uploadImage = async (file: File, item: AdminPalmaresItem) => {
        const key = `upload-${item.id ?? "new"}`;
        setBusy(key);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("scope", "palmares");
            const data = await responseJson(await fetch("/api/admin/upload", { method: "POST", body: formData }));
            const patch = { imageId: Number(data.id), image: String(data.url) };
            if (item.id === null) setDraft((current) => ({ ...current, ...patch }));
            else patchItem(item.id, patch);
            notify("Image importée avec succès. N'oubliez pas d'enregistrer.");
        } catch (error) {
            notify(error instanceof Error ? error.message : "Import d'image impossible.", true);
        } finally {
            setBusy(null);
        }
    };

    const saveItem = async (item: AdminPalmaresItem) => {
        const key = `save-${item.id ?? "new"}`;
        setBusy(key);
        try {
            await responseJson(await fetch("/api/admin/palmares", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item),
            }));
            notify(item.id === null ? "Titre / trophée ajouté au palmarès." : "Palmarès mis à jour.");
            if (item.id === null) setDraft(emptyItem);
            await loadPalmares();
        } catch (error) {
            notify(error instanceof Error ? error.message : "Enregistrement impossible.", true);
        } finally {
            setBusy(null);
        }
    };

    const deleteItem = async (item: AdminPalmaresItem) => {
        if (item.id === null || !window.confirm(`Supprimer « ${item.title} » (${item.year}) du palmarès ?`)) return;
        setBusy(`delete-${item.id}`);
        try {
            await responseJson(await fetch(`/api/admin/palmares?id=${item.id}`, { method: "DELETE" }));
            setItems((current) => current.filter((i) => i.id !== item.id));
            notify("Élément supprimé du palmarès.");
        } catch (error) {
            notify(error instanceof Error ? error.message : "Suppression impossible.", true);
        } finally {
            setBusy(null);
        }
    };

    const renderForm = (item: AdminPalmaresItem, isNew = false) => {
        const update = (patch: Partial<AdminPalmaresItem>) => {
            if (isNew) setDraft((current) => ({ ...current, ...patch }));
            else if (item.id !== null) patchItem(item.id, patch);
        };
        const suffix = item.id ?? "new";

        const badgeLabel = {
            gold: "🥇 Champion (Or)",
            silver: "🥈 Finaliste (Argent)",
            bronze: "🥉 Épopée (Bronze)",
        }[item.awardLevel || "gold"];

        const canToggleHighlight = item.isHighlight || highlightCount < 3;

        const handleHighlightChange = (checked: boolean) => {
            if (checked && highlightCount >= 3 && !item.isHighlight) {
                notify("Limite atteinte (3/3 pièces maîtresses). Décochez d'abord un autre titre avant d'en sélectionner un nouveau.", true);
                return;
            }
            update({ isHighlight: checked });
        };

        return <article key={suffix} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${isNew ? "border-green-300 ring-2 ring-green-100" : "border-gray-200"}`}>
            <div className="relative aspect-[16/10] bg-gray-900 text-white">
                {item.image
                    ? <Image src={item.image} alt={item.title || "Photo du palmarès"} fill sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" unoptimized className="object-cover" />
                    : <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-500"><i className="fas fa-trophy text-4xl text-amber-400/80" /><span className="text-xs font-semibold">Aucune photo</span></div>}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur border border-white/10">
                    {badgeLabel}
                </span>

                {item.isHighlight && <span className="absolute left-3 top-11 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-950 shadow">
                    <i className="fas fa-star mr-1" /> En Une (Pièce maîtresse)
                </span>}

                <span className="absolute right-3 top-3 rounded-xl bg-black/60 px-3 py-1 text-sm font-black tracking-tight text-green-300 backdrop-blur">
                    {item.year || "—"}
                </span>

                <label className="absolute bottom-3 right-3 cursor-pointer rounded-xl bg-white px-3.5 py-2 text-xs font-black text-gray-900 shadow-lg transition hover:scale-105">
                    <i className={`fas ${busy === `upload-${suffix}` ? "fa-spinner fa-spin" : "fa-camera"} mr-1.5`} />
                    {item.image ? "Changer photo" : "Ajouter photo"}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" disabled={busy !== null} onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadImage(file, item);
                        event.target.value = "";
                    }} />
                </label>
            </div>

            <div className="space-y-4 p-5">
                <div className="grid grid-cols-3 gap-3">
                    <label className="col-span-2 block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Nom / Titre du succès
                        <input value={item.title} maxLength={255} onChange={(event) => update({ title: event.target.value })} placeholder="ex: Champion Régional U17M" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-bold text-gray-900 outline-none focus:border-sbc" />
                    </label>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Année
                        <input type="number" min="1950" max="2100" value={item.year || ""} onChange={(event) => update({ year: Number(event.target.value) })} placeholder="2024" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-bold text-gray-900 outline-none focus:border-sbc" />
                    </label>
                </div>

                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Catégorie / Équipe
                    <input value={item.category} maxLength={100} onChange={(event) => update({ category: event.target.value })} placeholder="ex: Séniors Garçons, U15, Club..." className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-medium outline-none focus:border-sbc" />
                </label>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                        Classement / Niveau de distinction
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => update({ awardLevel: "gold" })}
                            className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-black transition ${item.awardLevel === "gold" ? "border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-300" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                        >
                            <span className="text-base mb-0.5">🥇</span>
                            <span>Champion</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => update({ awardLevel: "silver" })}
                            className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-black transition ${item.awardLevel === "silver" ? "border-slate-400 bg-slate-100 text-slate-900 ring-2 ring-slate-300" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                        >
                            <span className="text-base mb-0.5">🥈</span>
                            <span>Finaliste</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => update({ awardLevel: "bronze" })}
                            className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-black transition ${item.awardLevel === "bronze" ? "border-amber-700/50 bg-orange-50 text-orange-950 ring-2 ring-orange-300" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                        >
                            <span className="text-base mb-0.5">🥉</span>
                            <span>Épopée</span>
                        </button>
                    </div>
                </div>

                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Description
                    <textarea rows={2} value={item.description} maxLength={1000} onChange={(event) => update({ description: event.target.value })} placeholder="ex: Saison invaincue, finale remportée face à..." className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 font-medium text-sm outline-none focus:border-sbc" />
                </label>

                <div className={`rounded-xl border p-3 transition ${item.isHighlight ? "border-amber-300 bg-amber-50/80" : !canToggleHighlight ? "border-gray-200 bg-gray-50 opacity-75" : "border-gray-200 bg-gray-50/60"}`}>
                    <label className="flex cursor-pointer items-center justify-between gap-2 text-xs font-black text-amber-950">
                        <span className="flex items-center gap-2">
                            <i className="fas fa-star text-amber-500" />
                            Mettre en une (Pièce maîtresse en haut de page)
                        </span>
                        <input
                            type="checkbox"
                            checked={item.isHighlight}
                            onChange={(event) => handleHighlightChange(event.target.checked)}
                            className="h-5 w-5 accent-amber-600 rounded cursor-pointer"
                        />
                    </label>
                    {!canToggleHighlight && !item.isHighlight && (
                        <p className="mt-1.5 text-[11px] font-semibold text-amber-800">
                            ⚠️ Limite de 3 pièces maîtresses atteinte (3/3). Décochez-en une autre pour pouvoir ajouter celle-ci.
                        </p>
                    )}
                </div>

                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => void saveItem(item)} disabled={busy !== null || !item.title.trim() || !item.year} className="flex-1 rounded-xl bg-sbc px-4 py-3 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-sbc/90">
                        <i className={`fas ${busy === `save-${suffix}` ? "fa-spinner fa-spin" : "fa-save"} mr-2`} />
                        {isNew ? "Ajouter au palmarès" : "Enregistrer"}
                    </button>
                    {!isNew && <button type="button" title="Supprimer du palmarès" aria-label={`Supprimer ${item.title}`} onClick={() => void deleteItem(item)} disabled={busy !== null} className="h-12 w-12 rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"><i className="fas fa-trash" /></button>}
                </div>
            </div>
        </article>;
    };

    return <div className="relative space-y-6">
        {message && <div role="status" className={`fixed bottom-24 right-4 z-[120] max-w-sm rounded-xl px-5 py-4 font-bold text-white shadow-2xl md:bottom-8 ${message.error ? "bg-red-600" : "bg-green-700"}`}>{message.text}</div>}
        
        <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-900 to-[#072418] p-6 text-white shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 text-green-300"><i className="fas fa-trophy text-xl" /></div>
                    <div>
                        <h3 className="text-lg font-black">Gestion de la salle des trophées & du palmarès</h3>
                        <p className="text-xs text-green-200/80">Seuls <strong>3 titres maximum</strong> peuvent être mis en "Pièce maîtresse" (En une).</p>
                    </div>
                </div>
                <div className="shrink-0 rounded-xl bg-white/10 px-4 py-2 text-xs font-black backdrop-blur border border-white/15">
                    Pièces maîtresses : <span className={highlightCount === 3 ? "text-amber-400 font-black text-sm" : "text-green-300 font-black text-sm"}>{highlightCount}/3</span>
                </div>
            </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <div className="col-span-full">
                <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-sbc flex items-center gap-2">
                    <i className="fas fa-plus-circle" /> Ajouter une nouvelle distinction
                </h4>
                {renderForm(draft, true)}
            </div>

            <div className="col-span-full mt-4">
                <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-gray-700 flex items-center justify-between">
                    <span><i className="fas fa-list mr-2" /> Distinctions existantes ({items.length})</span>
                </h4>
                {loading ? <div className="flex min-h-48 items-center justify-center rounded-2xl border bg-white text-gray-400"><i className="fas fa-spinner fa-spin mr-2" />Chargement du palmarès…</div> : (
                    items.length === 0 ? <p className="text-sm text-gray-500 italic">Aucun palmarès enregistré pour le moment.</p> : (
                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {items.map((item) => renderForm(item))}
                        </div>
                    )
                )}
            </div>
        </div>
    </div>;
}
