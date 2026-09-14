"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useMemo, useState } from "react";
import {
    PalmaresError,
    PalmaresHero,
    PalmaresItem,
    PalmaresLightbox,
    PalmaresLoading,
    PalmaresPhoto,
    usePalmaresData,
} from "../PalmaresShared";

function FeaturedMoment({ item, primary, onOpen }: { item: PalmaresItem; primary?: boolean; onOpen: (item: PalmaresItem) => void }) {
    return <article className={`group relative isolate overflow-hidden rounded-[2rem] bg-[#082b1d] text-white shadow-[0_22px_65px_rgba(8,43,29,.18)] ${primary ? "min-h-[500px] lg:col-span-7 lg:row-span-2" : "min-h-[300px] lg:col-span-5"}`}>
        {item.image ? <button type="button" onClick={() => onOpen(item)} className="absolute inset-0 h-full w-full outline-none focus:ring-4 focus:ring-inset focus:ring-green-300/50" aria-label={`Agrandir la photo : ${item.title}`}><img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" /></button> : <div className="absolute inset-0 flex items-center justify-center text-8xl text-white/10"><i className="fas fa-trophy" /></div>}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#041a11] via-[#082b1d]/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <div className="flex items-end justify-between gap-5"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-300">Chapitre emblématique · {item.category}</p><h3 className={`mt-2 font-black leading-none tracking-[-0.05em] ${primary ? "text-4xl sm:text-5xl" : "text-3xl"}`}>{item.title}</h3><p className="mt-3 text-sm text-white/70">{item.description}</p></div><strong className="shrink-0 text-5xl font-black tracking-[-0.07em] text-green-400 sm:text-6xl">{item.year}</strong></div>
        </div>
    </article>;
}

function AwardCard({ item, tone, onOpen }: { item: PalmaresItem; tone: "gold" | "silver" | "bronze"; onOpen: (item: PalmaresItem) => void }) {
    const tones = {
        gold: { badge: "from-amber-300 to-yellow-600 text-amber-950", line: "from-transparent via-amber-300/80 to-transparent", label: "Titre" },
        silver: { badge: "from-slate-100 to-slate-400 text-slate-800", line: "from-transparent via-slate-200/80 to-transparent", label: "Finale" },
        bronze: { badge: "from-orange-300 to-orange-700 text-orange-950", line: "from-transparent via-orange-300/80 to-transparent", label: "Épopée" },
    }[tone];
    return <article className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.065] shadow-[0_20px_60px_rgba(0,0,0,.22)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/20">
        <div className={`absolute inset-x-5 bottom-0 h-px bg-gradient-to-r ${tones.line}`} />
        <div className="relative"><PalmaresPhoto item={item} onOpen={onOpen} className="aspect-[16/10] w-full" /><span className={`absolute -bottom-7 left-5 flex h-16 w-16 flex-col items-center justify-center rounded-full border-4 border-[#0a2d20] bg-gradient-to-br font-black shadow-xl ${tones.badge}`}><small className="text-[8px] uppercase tracking-widest">{tones.label}</small><strong className="text-lg leading-none">{String(item.year).slice(2)}</strong></span></div>
        <div className="px-5 pb-6 pt-11 text-white sm:px-6"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-300">{item.category}</p><h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.04em]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-white/55">{item.description}</p><div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4"><span className="text-xs font-bold text-white/45">Seclin Basket Club</span><strong className="text-xl font-black text-white/90">{item.year}</strong></div></div>
    </article>;
}

function TrophyShelf({ title, subtitle, items, tone, onOpen }: { title: string; subtitle: string; items: PalmaresItem[]; tone: "gold" | "silver" | "bronze"; onOpen: (item: PalmaresItem) => void }) {
    if (!items.length) return null;
    return <section className="relative" aria-labelledby={`shelf-${tone}`}>
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-300/70">{subtitle}</p><h2 id={`shelf-${tone}`} className="mt-2 text-3xl font-black tracking-[-0.045em] text-white md:text-5xl">{title}</h2></div><span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-white/60">{items.length} distinction{items.length > 1 ? "s" : ""}</span></div>
        <div className="relative grid gap-6 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <AwardCard key={item.id} item={item} tone={tone} onOpen={onOpen} />)}<div className="pointer-events-none absolute -bottom-5 left-2 right-2 h-5 rounded-[50%] bg-black/30 blur-xl" /></div>
    </section>;
}

export default function TrophyRoomPalmares() {
    const { history, highlights, years, loading, error } = usePalmaresData();
    const [selected, setSelected] = useState<PalmaresItem | null>(null);
    const closeLightbox = useCallback(() => setSelected(null), []);
    const collections = useMemo(() => {
        const champions: PalmaresItem[] = [];
        const finalists: PalmaresItem[] = [];
        const stories: PalmaresItem[] = [];
        history.forEach((item) => {
            const value = `${item.title} ${item.description}`.toLowerCase();
            if (value.includes("champion") && !value.includes("vice")) champions.push(item);
            else if (value.includes("vice") || value.includes("finale")) finalists.push(item);
            else stories.push(item);
        });
        return { champions, finalists, stories };
    }, [history]);

    return <main className="min-h-screen bg-[#f7f7f5]">
        <PalmaresHero eyebrow="Palmarès du club" title="Ici, chaque saison" accent="laisse une trace." description="Une salle des trophées numérique pour célébrer les titres, les finales et celles et ceux qui ont porté les couleurs du club." years={years.length} distinctions={history.length} />
        {loading ? <PalmaresLoading /> : error ? <PalmaresError message={error} /> : <>
            {highlights.length > 0 && <section className="py-14 md:py-20" aria-labelledby="featured-title"><div className="container mx-auto px-4"><div className="mb-9 max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.22em] text-sbc">Les pièces maîtresses</p><h2 id="featured-title" className="mt-2 text-3xl font-black tracking-[-0.045em] text-gray-950 md:text-5xl">Trois chapitres emblématiques</h2><p className="mt-4 leading-7 text-gray-500">Des équipes et des saisons qui occupent une place particulière dans l’histoire du club.</p></div><div className="grid gap-6 lg:grid-cols-12 lg:grid-rows-2">{highlights.map((item, index) => <FeaturedMoment key={item.id} item={item} primary={index === 0} onOpen={setSelected} />)}</div></div></section>}
            <section className="relative isolate overflow-hidden bg-[#082b1d] py-16 md:py-24"><div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_5%,rgba(74,222,128,.18),transparent_28%),radial-gradient(circle_at_80%_35%,rgba(249,115,22,.1),transparent_25%),linear-gradient(#082b1d,#061f16)]" /><div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-black/25 to-transparent" /><div className="container mx-auto space-y-24 px-4"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.22em] text-green-300">Salle des trophées</p><h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.055em] text-white md:text-6xl">Les couleurs du club, gravées dans le temps.</h2></div><TrophyShelf title="Les champions" subtitle="Or · Titres et accessions" items={collections.champions} tone="gold" onOpen={setSelected} /><TrophyShelf title="Les finalistes" subtitle="Argent · Parcours jusqu’au dernier match" items={collections.finalists} tone="silver" onOpen={setSelected} /><TrophyShelf title="Les grandes épopées" subtitle="Bronze · Saisons mémorables" items={collections.stories} tone="bronze" onOpen={setSelected} /></div></section>
        </>}
        <PalmaresLightbox item={selected} onClose={closeLightbox} />
    </main>;
}
