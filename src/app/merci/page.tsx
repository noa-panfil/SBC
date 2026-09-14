import type { Metadata } from "next";
import Link from "next/link";

/* eslint-disable @next/next/no-img-element */

export const metadata: Metadata = {
    title: "Message reçu | Seclin Basket Club",
    description: "Confirmation de réception de votre message par le Seclin Basket Club.",
    robots: { index: false, follow: false },
};

export default async function Merci({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
    const { type } = await searchParams;
    const partnership = type === "partnership";
    return <main className="min-h-screen bg-[#f7f7f5]">
        <section className="sbc-da-hero relative isolate overflow-hidden bg-[#082b1d] text-white"><div className="absolute inset-0 -z-20 opacity-85 [background:radial-gradient(circle_at_14%_10%,rgba(34,197,94,.3),transparent_30%),radial-gradient(circle_at_86%_78%,rgba(249,115,22,.2),transparent_29%)]" /><img src="/logo.png" alt="" className="pointer-events-none absolute -right-10 top-1/2 -z-10 w-72 -translate-y-1/2 object-contain opacity-[0.075] grayscale sm:w-80 lg:right-10" /><div className="container mx-auto flex h-full flex-col justify-center px-4"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-400 text-xl text-green-950 shadow-lg"><i className="fas fa-check" /></span><p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-green-300">Message enregistré</p><h1 className="mt-4 max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.04em] sm:text-5xl md:text-6xl">Merci, votre demande est <span className="text-green-400">entre de bonnes mains.</span></h1></div></section>
        <section className="py-14 md:py-20"><div className="container mx-auto px-4"><div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,.09)]"><div className="p-7 sm:p-10"><p className="text-xs font-black uppercase tracking-[0.2em] text-sbc">{partnership ? "Demande de partenariat" : "Contact simple"}</p><h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-gray-950">Le club a bien reçu votre message.</h2><p className="mt-4 text-base leading-7 text-gray-600">Il est désormais enregistré dans notre espace de suivi. Un membre du SBC pourra le consulter, le traiter et vous répondre directement à l’adresse indiquée.</p><div className="mt-7 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm leading-6 text-green-950"><i className="fas fa-lock mr-2 text-sbc" /><strong>Votre demande reste interne au club.</strong> Aucun e-mail automatique ne vous sera envoyé.</div><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-6 py-3.5 font-black text-white transition hover:bg-sbc">Retour à l’accueil</Link><Link href="/equipes" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3.5 font-black text-gray-800 transition hover:border-sbc hover:text-sbc">Découvrir les équipes</Link></div></div></div></div></section>
    </main>;
}
