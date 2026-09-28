import { Metadata } from "next";
import BuvetteImage from "./BuvetteImage";

export const metadata: Metadata = {
    title: "Buvette | Seclin Basket Club",
    description: "Le menu de la buvette du SBC : boissons, snacks et convivialité les jours de match.",
};

export default function BuvettePage() {
    return <main className="min-h-screen bg-[#f7f7f5]">
        <section className="sbc-da-hero relative isolate overflow-hidden bg-[#082b1d] text-white">
            <div className="absolute inset-0 -z-20 opacity-85 [background:radial-gradient(circle_at_14%_10%,rgba(34,197,94,.3),transparent_30%),radial-gradient(circle_at_86%_78%,rgba(249,115,22,.2),transparent_29%)]" />
            <img src="/logo.png" alt="" className="pointer-events-none absolute -right-10 top-1/2 -z-10 w-72 -translate-y-1/2 object-contain opacity-[0.075] grayscale sm:w-80 lg:right-10" />
            <div className="container mx-auto flex h-full flex-col justify-center px-4">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-green-300">Le rendez-vous des jours de match</p>
                <h1 className="mt-4 max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.04em] sm:text-5xl md:text-6xl">Le goût du club, <span className="text-green-400">à chaque temps mort.</span></h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-green-50/70 md:text-lg">Boissons, snacks et bonne humeur : découvrez le menu de la buvette du Seclin Basket Club.</p>
                <a href="#menu" className="mt-7 inline-flex w-fit items-center gap-3 rounded-full bg-white px-6 py-3.5 font-black text-gray-950 transition hover:bg-green-100">Voir le menu <i className="fas fa-arrow-down text-xs" /></a>
            </div>
        </section>

        <section className="border-b border-gray-200 bg-white">
            <div className="container mx-auto grid divide-y divide-gray-100 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-basketball-ball text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Entre deux quart-temps</p><p className="text-xs text-gray-500">La pause qui rassemble</p></div></div>
                <div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-mug-hot text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Boissons & snacks</p><p className="text-xs text-gray-500">Pour petits et grands</p></div></div>
                <div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-credit-card text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Paiement par carte et espèces</p><p className="text-xs text-gray-500">Simple et pratique</p></div></div>
            </div>
        </section>

        <div className="container mx-auto px-4 py-12 md:py-20">
            <section id="menu" className="scroll-mt-24" aria-labelledby="menu-title">
                <div className="mb-8 max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.22em] text-sbc">À la carte</p><h2 id="menu-title" className="mt-2 text-3xl font-black tracking-[-0.045em] text-gray-950 md:text-5xl">Le menu de la buvette.</h2><p className="mt-4 leading-7 text-gray-500">Retrouvez toute l’offre disponible au club. Touchez l’image sur mobile pour l’ouvrir en grand.</p></div>
                <div className="mx-auto max-w-6xl"><BuvetteImage /></div>
                <p className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-gray-500"><i className="fas fa-credit-card text-sbc" />Paiement par carte bancaire accepté</p>
            </section>
        </div>
    </main>;
}
