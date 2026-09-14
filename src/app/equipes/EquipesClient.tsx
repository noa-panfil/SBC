"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getTeamPath } from "@/lib/teamUrl";

interface Team {
    name: string;
    category: string;
    image: string;
    trainingSlots: string[];
    widgetId: string;
    coaches: unknown[];
    players: unknown[];
}

const getTeamWeight = (name: string) => {
    let score = 0;
    const normalizedName = name.toUpperCase();
    if (normalizedName.includes("BABY")) score = 100;
    else if (normalizedName.includes("U7") || normalizedName.includes("MINI")) score = 200;
    else if (normalizedName.includes("U9") || normalizedName.includes("POUSSIN")) score = 300;
    else if (normalizedName.includes("U11") || normalizedName.includes("BENJAMIN")) score = 400;
    else if (normalizedName.includes("U13") || normalizedName.includes("MINIME")) score = 500;
    else if (normalizedName.includes("U15") || normalizedName.includes("CADET")) score = 600;
    else if (normalizedName.includes("U17")) score = 700;
    else if (normalizedName.includes("U18")) score = 800;
    else if (normalizedName.includes("U20") || normalizedName.includes("U21") || normalizedName.includes("JUNIOR") || normalizedName.includes("ESPOIR")) score = 900;
    else if (normalizedName.includes("SENIOR")) score = 1000;
    else if (normalizedName.includes("LOISIR")) score = 1100;
    else score = 9999;
    if (normalizedName.includes(" M") || normalizedName.includes("-M") || normalizedName.includes("GARCON") || normalizedName.includes(" MASC")) score += 5;
    else if (!(normalizedName.includes(" F") || normalizedName.includes("-F") || normalizedName.includes("FILLE"))) score += 2;
    if (normalizedName.includes(" 2") || normalizedName.includes("-2")) score += 1;
    else if (normalizedName.includes(" 3") || normalizedName.includes("-3")) score += 2;
    else if (normalizedName.includes(" 4") || normalizedName.includes("-4")) score += 3;
    return score;
};

function TeamCard({ id, team, isFavorite, onToggleFavorite }: { id: string; team: Team; isFavorite: boolean; onToggleFavorite: (event: React.MouseEvent, id: string) => void }) {
    return (
        <article className="group relative overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-white shadow-[0_8px_35px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(8,43,29,0.16)]">
            <Link href={getTeamPath(team.name)} className="block focus:outline-none focus:ring-4 focus:ring-inset focus:ring-sbc/25">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#e8ebe5]">
                    <img src={team.image} alt={`Équipe ${team.name} du Seclin Basket Club`} className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.045]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#061d14] via-[#082b1d]/10 to-transparent" />
                    <span className="absolute left-5 top-5 rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-sbc-dark shadow-sm backdrop-blur">{team.category}</span>
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                        <h3 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">{team.name}</h3>
                        <div className="mt-3 flex items-center gap-4 text-xs font-bold text-white/75"><span><i className="fas fa-users mr-1.5 text-green-300" />{team.players.length} joueur{team.players.length > 1 ? "s" : ""}</span><span><i className="fas fa-user-tie mr-1.5 text-green-300" />{team.coaches.length} coach{team.coaches.length > 1 ? "s" : ""}</span></div>
                    </div>
                </div>
                <div className="flex items-center justify-between px-5 py-4 sm:px-6"><span className="text-sm font-black text-gray-950">Découvrir l’équipe</span><span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-950 text-white transition group-hover:bg-sbc"><i className="fas fa-arrow-right text-xs" /></span></div>
            </Link>
            <button type="button" onClick={(event) => onToggleFavorite(event, id)} aria-label={isFavorite ? `Retirer ${team.name} des favoris` : `Ajouter ${team.name} aux favoris`} aria-pressed={isFavorite} className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black/65 focus:outline-none focus:ring-4 focus:ring-white/40"><i className={`${isFavorite ? "fas text-yellow-300" : "far"} fa-star`} /></button>
        </article>
    );
}

export default function Equipes() {
    const [teamsData, setTeamsData] = useState<Record<string, Team>>({});
    const [favorites, setFavorites] = useState<string[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const stored = JSON.parse(localStorage.getItem("sbc_favorites") || "[]");
            return Array.isArray(stored) ? stored.map(String) : [];
        } catch { return []; }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/teams", { cache: "no-store" })
            .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Impossible de charger les équipes."); setTeamsData(data); })
            .catch((reason) => setError(reason instanceof Error ? reason.message : "Impossible de charger les équipes."))
            .finally(() => setLoading(false));
    }, []);

    const sortedTeams = useMemo(() => Object.entries(teamsData).sort(([, a], [, b]) => getTeamWeight(a.name) - getTeamWeight(b.name)), [teamsData]);
    const favoriteTeams = sortedTeams.filter(([id]) => favorites.includes(id));
    const otherTeams = sortedTeams.filter(([id]) => !favorites.includes(id));

    const toggleFavorite = (event: React.MouseEvent, id: string) => {
        event.preventDefault();
        event.stopPropagation();
        setFavorites((current) => {
            const next = current.includes(id) ? current.filter((favorite) => favorite !== id) : [...current, id];
            localStorage.setItem("sbc_favorites", JSON.stringify(next));
            return next;
        });
    };

    const renderGrid = (teams: [string, Team][]) => <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{teams.map(([id, team]) => <TeamCard key={id} id={id} team={team} isFavorite={favorites.includes(id)} onToggleFavorite={toggleFavorite} />)}</div>;

    return <main className="min-h-screen bg-[#f7f7f5]">
        <section className="sbc-da-hero relative isolate overflow-hidden bg-[#082b1d] text-white">
            <div className="absolute inset-0 -z-20 opacity-80 [background:radial-gradient(circle_at_14%_8%,rgba(34,197,94,.3),transparent_29%),radial-gradient(circle_at_86%_80%,rgba(249,115,22,.2),transparent_30%)]" />
            <img src="/logo.png" alt="" className="pointer-events-none absolute -right-10 top-1/2 -z-10 w-72 -translate-y-1/2 object-contain opacity-[0.075] grayscale sm:w-80 lg:right-10" />
            <div className="container mx-auto flex h-full flex-col justify-center px-4"><p className="text-xs font-black uppercase tracking-[0.24em] text-green-300">Seclin Basket Club</p><h1 className="mt-4 max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.04em] sm:text-5xl md:text-6xl">Une équipe pour <span className="text-green-400">chaque passion.</span></h1><p className="mt-5 max-w-2xl text-base leading-7 text-green-50/70 md:text-lg">Retrouvez les collectifs du club, leurs joueurs, leurs coachs et les informations de la saison 2026–2027.</p><a href="#equipes" className="mt-7 inline-flex w-fit items-center gap-3 rounded-full bg-white px-6 py-3.5 font-black text-gray-950 transition hover:bg-green-100">Voir les équipes <i className="fas fa-arrow-down text-xs" /></a></div>
        </section>
        <section className="border-b border-gray-200 bg-white"><div className="container mx-auto grid divide-y divide-gray-100 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0"><div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-users text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">{sortedTeams.length || "—"} équipes</p><p className="text-xs text-gray-500">Des plus jeunes aux seniors</p></div></div><div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-basketball-ball text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Saison 2026–2027</p><p className="text-xs text-gray-500">Effectifs et informations</p></div></div><div className="flex items-center gap-3 py-5 sm:px-5"><i className="far fa-star text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Vos favoris</p><p className="text-xs text-gray-500">Gardez vos équipes en tête</p></div></div></div></section>
        <div id="equipes" className="container mx-auto space-y-14 px-4 py-12 md:py-20">
            {loading && <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((value) => <div key={value} className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white"><div className="aspect-[4/3] animate-pulse bg-gray-200" /><div className="h-20 animate-pulse bg-white" /></div>)}</div>}
            {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900"><p className="font-black">Les équipes n’ont pas pu être chargées.</p><p className="mt-1 text-sm">{error}</p><button onClick={() => location.reload()} className="mt-4 rounded-xl bg-red-700 px-4 py-2 font-bold text-white">Réessayer</button></div>}
            {!loading && !error && favoriteTeams.length > 0 && <section><div className="mb-7 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600"><i className="fas fa-star" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-600">Accès rapide</p><h2 className="text-2xl font-black tracking-tight text-gray-950">Mes favoris</h2></div></div>{renderGrid(favoriteTeams)}</section>}
            {!loading && !error && <section><div className="mb-7"><p className="text-xs font-black uppercase tracking-[0.22em] text-sbc">Les collectifs</p><h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-gray-950 md:text-5xl">{favoriteTeams.length ? "Toutes les autres équipes" : "Toutes les équipes"}</h2></div>{otherTeams.length ? renderGrid(otherTeams) : <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white px-6 py-16 text-center text-gray-500">Aucune autre équipe à afficher.</div>}</section>}
        </div>
    </main>;
}
