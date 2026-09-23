"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Partner = { id: number; name: string; websiteUrl: string | null; img: string | null };

function PartnerCard({ partner, onOpen }: { partner: Partner; onOpen: (partner: Partner) => void }) {
    return <article className="group overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-white shadow-[0_8px_35px_rgba(15,23,42,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(8,43,29,.15)]">
        <button type="button" onClick={() => onOpen(partner)} disabled={!partner.img} className="relative block aspect-[3/2] w-full overflow-hidden bg-[#ecefe9] text-left outline-none focus:ring-4 focus:ring-inset focus:ring-sbc/25 disabled:cursor-default" aria-label={`Voir le visuel de ${partner.name}`}>
            {partner.img ? <img src={partner.img} alt={`Partenaire du Seclin Basket Club : ${partner.name}`} className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.035]" /> : <div className="flex h-full items-center justify-center text-5xl text-sbc/20"><i className="fas fa-handshake" /></div>}
            <div className="pointer-events-none absolute inset-3 rounded-2xl border border-white/40 opacity-0 transition duration-300 group-hover:opacity-100" />
            {partner.img && <span className="absolute bottom-4 right-4 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-white text-xs text-gray-950 opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"><i className="fas fa-expand" /></span>}
        </button>
        <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
            <h2 className="min-w-0 truncate text-2xl font-black tracking-[-0.045em] text-gray-950 sm:text-[1.7rem]">{partner.name}</h2>
            {partner.websiteUrl ? <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={`Visiter le site de ${partner.name}`} title={`Visiter le site de ${partner.name}`} className="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-sbc transition hover:bg-sbc hover:text-white focus:outline-none focus:ring-4 focus:ring-sbc/20"><svg viewBox="0 0 100 100" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M75.394 58.138 88.067 45.463c9.245-9.243 9.245-24.286 0-33.529-9.244-9.246-24.286-9.246-33.53 0L36.248 30.223c-9.245 9.243-9.245 24.286 0 33.529a23.768 23.768 0 0 0 4.44 3.486l9.791-9.792a10.72 10.72 0 0 1-5.086-2.838c-4.202-4.202-4.202-11.04 0-15.241l18.289-18.289c4.202-4.202 11.04-4.202 15.241 0 4.202 4.202 4.202 11.039 0 15.241l-5.373 5.374c2.214 5.211 2.826 10.942 1.844 16.445Z" /><path d="M24.607 41.862 11.934 54.536c-9.246 9.244-9.246 24.286 0 33.53 9.243 9.245 24.286 9.245 33.53 0l18.288-18.289c9.245-9.244 9.244-24.286 0-33.529a23.737 23.737 0 0 0-4.439-3.486l-9.791 9.792a10.72 10.72 0 0 1 5.086 2.838c4.202 4.202 4.202 11.039 0 15.241l-18.29 18.289c-4.202 4.202-11.039 4.202-15.241 0-4.202-4.202-4.202-11.039 0-15.241l5.374-5.373c-2.215-5.211-2.827-10.943-1.844-16.446Z" /></svg></a> : <span className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-sbc transition group-hover:bg-sbc group-hover:text-white"><i className="fas fa-handshake text-xs" /></span>}
        </div>
    </article>;
}

function PartnerLightbox({ partner, onClose }: { partner: Partner | null; onClose: () => void }) {
    useEffect(() => {
        if (!partner) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const listener = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
        document.addEventListener("keydown", listener);
        return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", listener); };
    }, [onClose, partner]);

    if (!partner?.img) return null;
    return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md sm:p-8" role="dialog" aria-modal="true" aria-labelledby="partner-lightbox-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <div className="relative w-full max-w-5xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
            <button type="button" onClick={onClose} aria-label="Fermer le visuel" className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-gray-950 text-white shadow-lg transition hover:scale-105 hover:bg-sbc"><i className="fas fa-times" /></button>
            <img src={partner.img} alt={partner.name} className="max-h-[75vh] w-full bg-[#f2f3ef] object-contain" />
            <div className="flex items-center justify-between gap-5 border-t border-gray-100 px-6 py-5"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-sbc">Merci pour votre confiance</p><h2 id="partner-lightbox-title" className="mt-1 text-2xl font-black tracking-tight text-gray-950">{partner.name}</h2></div><img src="/logo.png" alt="" className="h-12 w-12 object-contain opacity-30 grayscale" /></div>
        </div>
    </div>;
}

export default function Partenaires() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [selected, setSelected] = useState<Partner | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const closeLightbox = useCallback(() => setSelected(null), []);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/partners", { cache: "no-store" })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Impossible de charger les partenaires.");
                if (!cancelled) setPartners(Array.isArray(data) ? data : []);
            })
            .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Impossible de charger les partenaires."); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    return <main className="min-h-screen bg-[#f7f7f5]">
        <section className="sbc-da-hero relative isolate overflow-hidden bg-[#082b1d] text-white">
            <div className="absolute inset-0 -z-20 opacity-85 [background:radial-gradient(circle_at_14%_10%,rgba(34,197,94,.3),transparent_30%),radial-gradient(circle_at_86%_78%,rgba(249,115,22,.2),transparent_29%)]" />
            <img src="/logo.png" alt="" className="pointer-events-none absolute -right-10 top-1/2 -z-10 w-72 -translate-y-1/2 object-contain opacity-[0.075] grayscale sm:w-80 lg:right-10" />
            <div className="container mx-auto flex h-full flex-col justify-center px-4">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-green-300">Partenaires du SBC</p>
                <h1 className="mt-4 max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.04em] sm:text-5xl md:text-6xl">Le collectif derrière <span className="text-green-400">le collectif.</span></h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-green-50/70 md:text-lg">Entreprises, commerces et acteurs du territoire : leur engagement nous aide à faire vivre le basket à Seclin, saison après saison.</p>
            </div>
        </section>

        <section className="border-b border-gray-200 bg-white"><div className="container mx-auto grid divide-y divide-gray-100 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0"><div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-map-marker-alt text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Ancrage local</p><p className="text-xs text-gray-500">Un réseau proche du club</p></div></div><div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-users text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Projet collectif</p><p className="text-xs text-gray-500">Toutes les générations</p></div></div><div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-basketball-ball text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Même énergie</p><p className="text-xs text-gray-500">Sur et autour du terrain</p></div></div></div></section>

        <section className="relative isolate overflow-hidden py-14 md:py-20" aria-labelledby="partners-title">
            <div className="container mx-auto px-4">
                <div className="mb-9 max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.22em] text-sbc">Le mur des soutiens</p><h2 id="partners-title" className="mt-2 text-3xl font-black tracking-[-0.045em] text-gray-950 md:text-5xl">Ils jouent avec nous</h2><p className="mt-4 leading-7 text-gray-500">Plus que des logos, ce sont des partenaires qui prennent part au projet du club.</p></div>

                {loading && <div role="status" className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4"><span className="sr-only">Chargement des partenaires…</span>{[1, 2, 3, 4, 5, 6, 7, 8].map((item) => <div key={item} className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white"><div className="aspect-[3/2] animate-pulse bg-gray-200" /><div className="h-20 animate-pulse bg-white" /></div>)}</div>}
                {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900"><p className="font-black">Les partenaires n’ont pas pu être chargés.</p><p className="mt-1 text-sm">{error}</p><button type="button" onClick={() => location.reload()} className="mt-4 rounded-xl bg-red-700 px-4 py-2 font-bold text-white">Réessayer</button></div>}
                {!loading && !error && partners.length > 0 && <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">{partners.map((partner) => <PartnerCard key={partner.id} partner={partner} onOpen={setSelected} />)}</div>}
                {!loading && !error && !partners.length && <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white px-6 py-16 text-center text-gray-500">Les partenaires seront bientôt présentés ici.</div>}
            </div>
        </section>

        <section className="pb-14 md:pb-20"><div className="container mx-auto px-4"><div className="relative isolate overflow-hidden rounded-[2rem] bg-gray-950 px-6 py-10 text-white shadow-[0_24px_70px_rgba(8,43,29,.2)] sm:px-10 md:py-14 lg:px-14"><div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_86%_12%,rgba(74,222,128,.22),transparent_28%),radial-gradient(circle_at_70%_90%,rgba(249,115,22,.13),transparent_25%)]" /><img src="/logo.png" alt="" className="pointer-events-none absolute -right-8 top-1/2 -z-10 w-72 -translate-y-1/2 object-contain opacity-[0.07] grayscale sm:w-80 lg:right-8" /><div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-green-300">À vous d’entrer dans le jeu</p><h2 className="mt-3 max-w-2xl text-3xl font-black leading-[1.02] tracking-[-0.05em] sm:text-4xl md:text-5xl">Associez votre entreprise à une aventure locale et collective.</h2><p className="mt-5 max-w-xl leading-7 text-white/60">Construisons un partenariat utile au club, visible pour votre marque et adapté à vos objectifs.</p><Link href="/contact?type=partnership" className="mt-7 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 font-black text-gray-950 transition hover:bg-green-100">Devenir partenaire <i className="fas fa-arrow-right text-xs" /></Link></div><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1"><div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur"><i className="fas fa-eye mr-3 text-green-300" /><span className="text-sm font-bold">Visibilité au club et en ligne</span></div><div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur"><i className="fas fa-handshake mr-3 text-green-300" /><span className="text-sm font-bold">Formule construite ensemble</span></div><div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur"><i className="fas fa-heart mr-3 text-green-300" /><span className="text-sm font-bold">Impact associatif concret</span></div></div></div></div></div></section>

        <PartnerLightbox partner={selected} onClose={closeLightbox} />
    </main>;
}
