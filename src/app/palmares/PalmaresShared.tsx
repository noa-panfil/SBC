"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";

export interface PalmaresItem {
    id: number;
    year: number;
    title: string;
    description: string;
    category: string;
    image: string | null;
    is_highlight: boolean;
}

export function usePalmaresData() {
    const [items, setItems] = useState<PalmaresItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        fetch("/api/palmares", { cache: "no-store" })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Impossible de charger le palmarès.");
                if (!cancelled) setItems(Array.isArray(data) ? data : []);
            })
            .catch((reason) => {
                if (!cancelled) setError(reason instanceof Error ? reason.message : "Impossible de charger le palmarès.");
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const history = useMemo(() => items.filter((item) => !item.is_highlight), [items]);
    const highlights = useMemo(() => items.filter((item) => item.is_highlight), [items]);
    const years = useMemo(() => [...new Set(history.map((item) => item.year))], [history]);

    return { items, history, highlights, years, loading, error };
}

export function PalmaresHero({ eyebrow, title, accent, description, years, distinctions }: {
    eyebrow: string;
    title: string;
    accent: string;
    description: string;
    years: number;
    distinctions: number;
}) {
    return <section className="sbc-da-hero relative isolate overflow-hidden bg-[#082b1d] text-white">
        <div className="absolute inset-0 -z-20 opacity-90 [background:radial-gradient(circle_at_13%_8%,rgba(34,197,94,.34),transparent_29%),radial-gradient(circle_at_88%_78%,rgba(249,115,22,.23),transparent_28%)]" />
        <img src="/logo.png" alt="" className="pointer-events-none absolute -right-10 top-1/2 -z-10 w-72 -translate-y-1/2 object-contain opacity-[0.075] grayscale sm:w-80 lg:right-10" />
        <div className="container mx-auto flex h-full flex-col justify-center px-4">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-green-300">{eyebrow}</p>
            <h1 className="mt-4 max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.04em] sm:text-5xl md:text-6xl">{title} <span className="text-green-400">{accent}</span></h1>
            <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <p className="max-w-2xl text-base leading-7 text-green-50/70 md:text-lg">{description}</p>
                <div className="flex gap-3">
                    <div className="min-w-28 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur"><strong className="block text-2xl font-black text-white">{distinctions || "—"}</strong><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-green-200/70">Distinctions</span></div>
                    <div className="min-w-28 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur"><strong className="block text-2xl font-black text-white">{years || "—"}</strong><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-green-200/70">Saisons</span></div>
                </div>
            </div>
        </div>
    </section>;
}

export function PalmaresLoading() {
    return <div role="status" className="container mx-auto grid gap-6 px-4 py-16 md:grid-cols-2"><span className="sr-only">Chargement du palmarès…</span>{[1, 2, 3, 4].map((item) => <div key={item} className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white"><div className="aspect-[16/9] animate-pulse bg-gray-200" /><div className="space-y-3 p-6"><div className="h-4 w-24 animate-pulse rounded bg-gray-100" /><div className="h-7 w-2/3 animate-pulse rounded bg-gray-100" /></div></div>)}</div>;
}

export function PalmaresError({ message }: { message: string }) {
    return <div className="container mx-auto px-4 py-16"><div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900"><p className="font-black">Le palmarès n’a pas pu être chargé.</p><p className="mt-1 text-sm">{message}</p><button type="button" onClick={() => location.reload()} className="mt-4 rounded-xl bg-red-700 px-4 py-2 font-bold text-white">Réessayer</button></div></div>;
}

export function PalmaresPhoto({ item, onOpen, className }: { item: PalmaresItem; onOpen: (item: PalmaresItem) => void; className: string }) {
    if (!item.image) return <div className={`${className} flex items-center justify-center bg-[#e9ece6] text-5xl text-sbc/20`}><i className="fas fa-trophy" /></div>;
    return <button type="button" onClick={() => onOpen(item)} className={`${className} group/photo block overflow-hidden text-left outline-none focus:ring-4 focus:ring-inset focus:ring-sbc/30`} aria-label={`Agrandir la photo : ${item.title}`}><img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 ease-out group-hover/photo:scale-[1.035] group-focus/photo:scale-[1.035]" /></button>;
}

export function PalmaresLightbox({ item, onClose }: { item: PalmaresItem | null; onClose: () => void }) {
    useEffect(() => {
        if (!item) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const listener = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
        document.addEventListener("keydown", listener);
        return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", listener); };
    }, [item, onClose]);

    if (!item?.image) return null;
    return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md sm:p-8" role="dialog" aria-modal="true" aria-labelledby="palmares-lightbox-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <div className="relative w-full max-w-6xl overflow-hidden rounded-[1.75rem] bg-[#071b13] shadow-2xl">
            <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-950 shadow-lg transition hover:scale-105" aria-label="Fermer la photo"><i className="fas fa-times" /></button>
            <img src={item.image} alt={item.title} className="max-h-[76vh] w-full bg-black object-contain" />
            <div className="flex flex-col gap-2 px-6 py-5 text-white sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-green-300">{item.category}</p><h2 id="palmares-lightbox-title" className="mt-1 text-2xl font-black">{item.title}</h2></div><p className="text-4xl font-black tracking-[-0.05em] text-green-400">{item.year}</p></div>
        </div>
    </div>;
}
