"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

type PersonPhoto = {
    firstname: string;
    name: string;
    img: string | null;
    celebrationImg: string | null;
};

interface Team {
    id: number;
    name: string;
    category: string;
    image: string;
    trainingSlots: string[];
    widgetId: string;
    coaches: (PersonPhoto & { role: string })[];
    players: (PersonPhoto & { num: number | null })[];
}

interface EquipeDetailClientProps {
    team: Team | null;
    logoUrl: string;
}

function PortraitLayers({ person, logoUrl }: { person: PersonPhoto; logoUrl: string }) {
    if (!person.img && !person.celebrationImg) {
        return (
            <div className="absolute inset-0 flex items-center justify-center">
                <img src={logoUrl} alt="" className="w-28 opacity-20 grayscale sm:w-36" />
            </div>
        );
    }

    const classicPhoto = person.img || person.celebrationImg;
    return (
        <>
            {classicPhoto && (
                <img
                    src={classicPhoto}
                    alt={`Portrait de ${person.firstname}`}
                    className={`absolute inset-0 h-full w-full object-cover object-top drop-shadow-[0_20px_22px_rgba(0,0,0,0.22)] transition duration-500 ease-out motion-reduce:transition-none ${person.celebrationImg ? "group-hover:scale-[1.025] group-hover:opacity-0 group-focus:scale-[1.025] group-focus:opacity-0" : "group-hover:scale-[1.025] group-focus:scale-[1.025]"}`}
                />
            )}
            {person.celebrationImg && (
                <img
                    src={person.celebrationImg}
                    alt={`${person.firstname} en célébration`}
                    className="absolute inset-0 h-full w-full scale-[0.985] object-cover object-top opacity-0 drop-shadow-[0_20px_22px_rgba(0,0,0,0.28)] transition duration-500 ease-out group-hover:scale-100 group-hover:opacity-100 group-focus:scale-100 group-focus:opacity-100 motion-reduce:transition-none"
                />
            )}
        </>
    );
}

function PlayerCard({ player, logoUrl }: { player: Team["players"][number]; logoUrl: string }) {
    const displayNumber = player.num == null ? "—" : String(player.num).padStart(2, "0");
    return (
        <article
            tabIndex={0}
            aria-label={`${player.firstname}${player.num == null ? "" : `, numéro ${player.num}`}${player.celebrationImg ? ". Survolez pour voir la célébration." : ""}`}
            className="group relative isolate aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-[#eceee8] outline-none transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(8,43,29,0.18)] focus:-translate-y-1 focus:ring-4 focus:ring-sbc/25"
        >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_14%,rgba(74,222,128,.3),transparent_27%),linear-gradient(145deg,#f4f5f1_0%,#e5e9e1_100%)]" />
            <span className="absolute -right-2 top-0 -z-10 select-none text-[7.5rem] font-black leading-none tracking-[-0.09em] text-sbc/8 sm:text-[10rem]">
                {displayNumber}
            </span>
            <div className="absolute inset-0 overflow-hidden">
                <PortraitLayers person={player} logoUrl={logoUrl} />
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#082b1d] via-[#082b1d]/95 to-transparent px-5 pb-5 pt-20 text-white sm:px-7 sm:pb-7">
                <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate text-3xl font-black tracking-[-0.05em] sm:text-4xl">{player.firstname || player.name}</h3>
                    </div>
                    <span className="shrink-0 text-6xl font-black leading-[0.72] tracking-[-0.08em] text-green-400 sm:text-7xl">{displayNumber}</span>
                </div>
            </div>
        </article>
    );
}

function CoachCard({ coach, logoUrl }: { coach: Team["coaches"][number]; logoUrl: string }) {
    return (
        <article
            tabIndex={0}
            aria-label={`${coach.firstname}, ${coach.role}${coach.celebrationImg ? ". Survolez pour voir la seconde photo." : ""}`}
            className="group relative isolate aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-[#0b3425] text-white outline-none transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(8,43,29,0.24)] focus:-translate-y-1 focus:ring-4 focus:ring-sbc/25"
        >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_10%,rgba(74,222,128,.28),transparent_30%),linear-gradient(145deg,#164d36,#082b1d)]" />
            <div className="absolute inset-0 overflow-hidden">
                <PortraitLayers person={coach} logoUrl={logoUrl} />
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#061d14] via-[#061d14]/95 to-transparent px-5 pb-5 pt-20 sm:px-7 sm:pb-7">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-300">{coach.role}</p>
                <h3 className="mt-1 truncate text-2xl font-black tracking-[-0.04em] sm:text-3xl">{coach.firstname || coach.name}</h3>
            </div>
        </article>
    );
}

export default function EquipeDetailClient({ team, logoUrl }: EquipeDetailClientProps) {
    if (!team) return (
        <main className="flex min-h-[60vh] items-center justify-center bg-[#f7f7f5] px-4 text-center">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-sbc">Erreur 404</p>
                <h1 className="mt-2 text-3xl font-black text-gray-950">Équipe introuvable</h1>
                <Link href="/equipes" className="mt-6 inline-flex rounded-full bg-gray-950 px-6 py-3 font-black text-white transition hover:bg-sbc">Retour aux équipes</Link>
            </div>
        </main>
    );

    return (
        <main className="min-h-screen bg-[#f7f7f5]">
            <section className="relative isolate overflow-hidden bg-[#082b1d] text-white">
                <img src={team.image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25 mix-blend-luminosity" />
                <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#082b1d_12%,rgba(8,43,29,.9)_52%,rgba(8,43,29,.45)),radial-gradient(circle_at_85%_20%,rgba(249,115,22,.25),transparent_30%)]" />
                <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
                    <Link href="/equipes" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-green-100/75 transition hover:text-white">
                        <i className="fas fa-arrow-left" />Toutes les équipes
                    </Link>
                    <div className="mt-10 max-w-4xl">
                        <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-green-200 backdrop-blur">{team.category}</span>
                        <h1 className="mt-5 text-5xl font-black leading-[0.88] tracking-[-0.06em] sm:text-6xl md:text-7xl lg:text-8xl">{team.name}</h1>
                        <p className="mt-6 max-w-xl text-base leading-7 text-green-50/70 md:text-lg">Le groupe, le staff et toutes les informations de la saison.</p>
                    </div>
                </div>
            </section>

            <section className="border-b border-gray-200 bg-white">
                <div className="container mx-auto px-4 py-7 md:py-8">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start">
                        <div className="flex shrink-0 items-center gap-3 md:w-64"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-sbc"><i className="far fa-clock" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-sbc">Cette saison</p><h2 className="font-black text-gray-950">Entraînements</h2></div></div>
                        {team.trainingSlots.length > 0 ? <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{team.trainingSlots.map((slot, index) => <div key={index} className="rounded-2xl border border-gray-200 bg-[#f7f7f5] px-4 py-3 text-sm font-bold text-gray-800"><i className="fas fa-calendar-day mr-2 text-sbc" />{slot}</div>)}</div> : <p className="py-3 text-sm text-gray-500">Horaires non communiqués.</p>}
                    </div>
                </div>
            </section>

            <div className="container mx-auto space-y-16 px-4 py-12 md:space-y-24 md:py-20">
                <section aria-labelledby="players-title">
                    <div className="mb-8 flex items-end justify-between gap-5">
                        <h2 id="players-title" className="text-3xl font-black tracking-[-0.04em] text-gray-950 md:text-5xl">L’effectif</h2>
                        <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-gray-500 shadow-sm">{team.players.length} joueur{team.players.length > 1 ? "s" : ""}</span>
                    </div>
                    {team.players.length > 0 ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">{team.players.map((player, index) => <PlayerCard key={`${player.firstname}-${index}`} player={player} logoUrl={logoUrl} />)}</div> : <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white px-6 py-16 text-center text-gray-500">Effectif non communiqué.</div>}
                </section>

                {team.coaches.length > 0 && <section aria-labelledby="staff-title">
                    <div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.22em] text-sbc">Autour du groupe</p><h2 id="staff-title" className="mt-2 text-3xl font-black tracking-[-0.04em] text-gray-950 md:text-5xl">Le staff</h2></div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">{team.coaches.map((coach, index) => <CoachCard key={`${coach.firstname}-${index}`} coach={coach} logoUrl={logoUrl} />)}</div>
                </section>}

                {team.widgetId && <section aria-labelledby="results-title"><div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.22em] text-sbc">Compétition</p><h2 id="results-title" className="mt-2 text-3xl font-black tracking-[-0.04em] text-gray-950 md:text-5xl">Résultats & classement</h2></div><div className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-sm"><iframe src={`/widget/${team.widgetId}`} className="block min-h-[800px] w-full border-0" title="Résultats et classement" /></div></section>}
            </div>
        </main>
    );
}
