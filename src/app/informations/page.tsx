import { Metadata } from "next";
import Link from "next/link";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export const metadata: Metadata = {
    title: "Informations pratiques | Seclin Basket Club",
    description: "Tarifs des licences, organigramme et salle Jesse Owens : toutes les informations pratiques du SBC.",
};

export const dynamic = "force-dynamic";

type BureauMember = RowDataPacket & {
    role: string;
    image_id: number | null;
    fullname: string;
};

const prices = [
    { category: "Seniors", years: "Avant 2006", standard: "135 €", club: "115 €", transfer: "195 €" },
    { category: "U21", years: "2006 / 2007 / 2008", standard: "135 €", club: "115 €", transfer: "195 €" },
    { category: "U18", years: "2009 / 2010 / 2011", standard: "120 €", club: "100 €", transfer: "180 €" },
    { category: "U15", years: "2012 / 2013", standard: "105 €", club: "85 €", transfer: "165 €" },
    { category: "U13", years: "2014 / 2015", standard: "100 €", club: "80 €", transfer: "100 €" },
    { category: "U11", years: "2016 / 2017", standard: "85 €", club: "75 €", transfer: "85 €" },
    { category: "U9", years: "2018 / 2019", standard: "75 €", club: "75 €", transfer: "75 €" },
    { category: "U7", years: "2020 / 2021", standard: "65 €", club: "65 €", transfer: "65 €" },
];

const normalizedRole = (member: BureauMember) => member.role.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function PersonPhoto({ member, icon }: { member?: BureauMember; icon: string }) {
    return <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.35rem] bg-[linear-gradient(145deg,#0b5b43,#052b1e)] text-2xl text-white shadow-lg shadow-green-950/15">
        {member?.image_id ? <img src={`/api/image/${member.image_id}?scope=person`} alt={member.fullname} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center"><i className={`fas ${icon}`} /></span>}
    </div>;
}

function BureauCard({ member, featured = false, icon = "fa-user-tie" }: { member?: BureauMember; featured?: boolean; icon?: string }) {
    return <article className={`group flex items-center gap-4 rounded-[1.5rem] border bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(8,43,29,0.12)] ${featured ? "border-green-200 ring-4 ring-green-50 sm:p-5" : "border-gray-200"}`}>
        <PersonPhoto member={member} icon={icon} />
        <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sbc">{member?.role || "À venir"}</p>
            <h3 className={`${featured ? "text-xl" : "text-lg"} mt-1 truncate font-black tracking-[-0.03em] text-gray-950`}>{member?.fullname || "Nom à venir"}</h3>
            <p className="mt-1 text-xs font-semibold text-gray-400">Seclin Basket Club</p>
        </div>
    </article>;
}

export default async function Informations() {
    let bureauMembers: BureauMember[] = [];
    try {
        const [rows] = await pool.query<BureauMember[]>(`
            SELECT b.title AS role,
                   CASE WHEN pri.person_id IS NULL THEN p.image_id ELSE pri.image_id END AS image_id,
                   TRIM(CONCAT(p.lastname, ' ', p.firstname)) AS fullname
            FROM bureau_members b
            JOIN persons p ON b.person_id = p.id
            LEFT JOIN person_role_images pri ON pri.person_id = p.id AND pri.role_context = 'bureau'
            ORDER BY b.display_order, b.id
        `);
        bureauMembers = rows;
    } catch (error) {
        console.error("Error fetching bureau members:", error);
    }

    const findRole = (startsWith: string | string[]) => {
        const prefixes = Array.isArray(startsWith) ? startsWith : [startsWith];
        return bureauMembers.find((member) => prefixes.some((prefix) => normalizedRole(member).startsWith(prefix)));
    };
    const president = findRole("president");
    const vicePresident = findRole("vice");
    const secretary = findRole("secretaire");
    const treasurer = findRole(["tresorier", "tresoriere"]);
    const leadership = new Set([president, vicePresident, secretary, treasurer].filter(Boolean));
    const otherMembers = bureauMembers.filter((member) => !leadership.has(member));

    return <main className="min-h-screen bg-[#f7f7f5]">
        <section className="sbc-da-hero relative isolate overflow-hidden bg-[#082b1d] text-white">
            <div className="absolute inset-0 -z-20 opacity-85 [background:radial-gradient(circle_at_14%_10%,rgba(34,197,94,.3),transparent_30%),radial-gradient(circle_at_86%_78%,rgba(249,115,22,.2),transparent_29%)]" />
            <img src="/logo.png" alt="" className="pointer-events-none absolute -right-10 top-1/2 -z-10 w-72 -translate-y-1/2 object-contain opacity-[0.075] grayscale sm:w-80 lg:right-10" />
            <div className="container mx-auto flex h-full flex-col justify-center px-4">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-green-300">Le SBC au quotidien</p>
                <h1 className="mt-4 max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.04em] sm:text-5xl md:text-6xl">Tout ce qui fait vivre <span className="text-green-400">le club.</span></h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-green-50/70 md:text-lg">Tarifs, équipe dirigeante et lieu de rendez-vous : retrouvez ici les repères essentiels du Seclin Basket Club.</p>
            </div>
        </section>

        <section className="border-b border-gray-200 bg-white">
            <div className="container mx-auto grid divide-y divide-gray-100 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-tag text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Licences 2026–2027</p><p className="text-xs text-gray-500">Des tarifs lisibles</p></div></div>
                <div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-users-cog text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Le bureau du club</p><p className="text-xs text-gray-500">Une équipe à votre écoute</p></div></div>
                <div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-map-marker-alt text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Salle Jesse Owens</p><p className="text-xs text-gray-500">Le point de rendez-vous</p></div></div>
            </div>
        </section>

        <div className="container mx-auto space-y-20 px-4 py-12 md:py-20">
            <section aria-labelledby="pricing-title">
                <div className="mb-8 max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.22em] text-sbc">Saison 2026–2027</p><h2 id="pricing-title" className="mt-2 text-3xl font-black tracking-[-0.045em] text-gray-950 md:text-5xl">Les tarifs, en toute clarté.</h2><p className="mt-4 leading-7 text-gray-500">Le montant dépend de la catégorie et de la situation du licencié. Le tarif club s’applique à partir de quatre années d’ancienneté.</p></div>
                <div className="hidden overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)] md:block">
                    <table className="w-full border-collapse text-left"><thead><tr className="bg-[#082b1d] text-xs font-black uppercase tracking-[0.12em] text-white"><th className="px-6 py-5">Catégorie</th><th className="px-6 py-5">Années de naissance</th><th className="bg-sbc px-6 py-5 text-center">Palier 1<span className="mt-1 block text-[10px] font-semibold normal-case tracking-normal text-green-100">Standard</span></th><th className="px-6 py-5 text-center">Palier 2<span className="mt-1 block text-[10px] font-semibold normal-case tracking-normal text-green-100">+4 ans au club</span></th><th className="px-6 py-5 text-center">Mutation<span className="mt-1 block text-[10px] font-semibold normal-case tracking-normal text-green-100">Nouveau club</span></th></tr></thead><tbody>{prices.map((price, index) => <tr key={price.category} className={`${index < prices.length - 1 ? "border-b border-gray-100" : ""} transition hover:bg-green-50/70`}><td className="px-6 py-5 font-black uppercase tracking-wide text-sbc-dark">{price.category}</td><td className="px-6 py-5 text-sm font-semibold text-gray-500">{price.years}</td><td className="bg-green-50 px-6 py-5 text-center text-lg font-black text-gray-950">{price.standard}</td><td className="px-6 py-5 text-center font-bold text-gray-700">{price.club}</td><td className="px-6 py-5 text-center font-bold text-gray-500">{price.transfer}</td></tr>)}</tbody></table>
                </div>
                <div className="grid gap-3 md:hidden">{prices.map((price) => <article key={price.category} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black uppercase tracking-wide text-sbc-dark">{price.category}</h3><p className="mt-1 text-xs font-semibold text-gray-400">Né(e) {price.years.toLowerCase()}</p></div><span className="rounded-full bg-green-50 px-3 py-1 text-sm font-black text-sbc-dark">{price.standard}</span></div><div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 text-xs"><div><p className="font-bold uppercase tracking-wide text-gray-400">Palier 2</p><p className="mt-1 font-black text-gray-800">{price.club}</p></div><div><p className="font-bold uppercase tracking-wide text-gray-400">Mutation</p><p className="mt-1 font-black text-gray-800">{price.transfer}</p></div></div></article>)}</div>
                <div className="mt-4 flex gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm leading-6 text-orange-950"><i className="fas fa-info-circle mt-1 text-orange-500" /><p><strong>À retenir :</strong> le tarif mutation correspond au tarif standard augmenté de 60 € de frais fédéraux. Pour les catégories U13 et inférieures, il reste identique au tarif standard.</p></div>
            </section>

            <section aria-labelledby="bureau-title">
                <div className="mb-8 max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.22em] text-sbc">Cellule dirigeante</p><h2 id="bureau-title" className="mt-2 text-3xl font-black tracking-[-0.045em] text-gray-950 md:text-5xl">Un club porté par des visages.</h2><p className="mt-4 leading-7 text-gray-500">Une organisation bénévole et engagée pour accompagner les licenciés, les familles et le projet sportif du SBC.</p></div>
                <div className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.06)] sm:p-8">
                    <img src="/logo.png" alt="" className="pointer-events-none absolute right-4 top-4 z-0 w-44 opacity-[0.06] grayscale sm:right-8 sm:top-8 sm:w-56" />
                    <div className="relative z-10 mx-auto max-w-4xl">
                        {president && <><div className="mx-auto max-w-md"><BureauCard member={president} featured icon="fa-crown" /></div><div className="mx-auto h-8 w-px bg-green-200" /></>}
                        {vicePresident && <><div className="mx-auto max-w-md"><BureauCard member={vicePresident} icon="fa-user-shield" /></div><div className="mx-auto h-8 w-px bg-green-200" /></>}
                        <div className="grid gap-4 md:grid-cols-2">
                            {secretary && <BureauCard member={secretary} icon="fa-pen-nib" />}
                            {treasurer && <BureauCard member={treasurer} icon="fa-coins" />}
                        </div>
                        {otherMembers.length > 0 && <><div className="mx-auto h-8 w-px bg-green-200" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{otherMembers.map((member) => <BureauCard key={`${member.role}-${member.fullname}`} member={member} icon="fa-user" />)}</div></>}
                        {!bureauMembers.length && <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm font-semibold text-gray-500">L’organigramme sera bientôt renseigné.</div>}
                    </div>
                </div>
            </section>

            <section aria-labelledby="venue-title">
                <div className="mb-8 max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.22em] text-sbc">Le terrain de jeu</p><h2 id="venue-title" className="mt-2 text-3xl font-black tracking-[-0.045em] text-gray-950 md:text-5xl">Rendez-vous à Jesse Owens.</h2></div>
                <div className="grid overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)] lg:grid-cols-[1.05fr_.95fr]">
                    <img src="/img/salle/arena.webp" alt="Salle Jesse Owens - Seclin Basket Club" className="h-72 w-full object-cover lg:h-full lg:min-h-[360px]" />
                    <div className="flex flex-col justify-center p-6 sm:p-9"><p className="text-xs font-black uppercase tracking-[0.2em] text-sbc">Salle Jesse Owens</p><h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-gray-950 sm:text-3xl">Le basket se vit ensemble.</h3><div className="mt-6 space-y-4 text-sm leading-6 text-gray-600"><p className="flex items-start gap-3"><i className="fas fa-location-dot mt-1 text-sbc" /><span>Rue Pablo Picasso<br />59113 Seclin</span></p><p className="flex items-start gap-3"><i className="fas fa-basketball-ball mt-1 text-sbc" /><span>Revêtement sportif en caoutchouc<br />Tribunes de 200 places</span></p></div><a href="https://maps.app.goo.gl/dWV2ttK7M8iynQTK6" target="_blank" rel="noreferrer" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-950 px-6 py-3.5 font-black text-white transition hover:bg-sbc sm:w-fit"><i className="fas fa-map" />Ouvrir dans Maps</a></div>
                </div>
            </section>

            <section className="relative isolate overflow-hidden rounded-[2rem] bg-gray-950 px-6 py-10 text-white shadow-[0_24px_70px_rgba(8,43,29,.2)] sm:px-10 md:py-14 lg:px-14"><div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_88%_12%,rgba(74,222,128,.22),transparent_28%),radial-gradient(circle_at_72%_90%,rgba(249,115,22,.13),transparent_25%)]" /><img src="/logo.png" alt="" className="pointer-events-none absolute -right-8 top-1/2 -z-10 w-72 -translate-y-1/2 object-contain opacity-[0.07] grayscale sm:w-80 lg:right-8" /><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.22em] text-green-300">Une question ?</p><h2 className="mt-3 text-3xl font-black leading-[1.02] tracking-[-0.05em] sm:text-4xl">Besoin d’une information sur le club ?</h2><p className="mt-5 leading-7 text-white/60">Le bureau est là pour vous répondre et vous orienter vers le bon interlocuteur.</p><Link href="/contact" className="mt-7 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 font-black text-gray-950 transition hover:bg-green-100">Nous contacter <i className="fas fa-arrow-right text-xs" /></Link></div></section>
        </div>
    </main>;
}
