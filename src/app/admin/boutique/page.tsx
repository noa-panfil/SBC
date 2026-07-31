import Link from "next/link";
import { requireAdminPage } from "@/lib/shop/admin-page";

const sections = [
    { href: "/admin/boutique/produits", icon: "fas fa-tshirt", title: "Produits", text: "Catalogue, images, variantes et prix", color: "from-emerald-500 to-green-700" },
    { href: "/admin/boutique/commandes", icon: "fas fa-receipt", title: "Commandes", text: "Paiements, suivi et retrait au club", color: "from-blue-500 to-indigo-700" },
    { href: "/admin/boutique/lots", icon: "fas fa-boxes", title: "Lots fournisseur", text: "Regroupement mensuel et exports Excel", color: "from-orange-500 to-red-600" },
];

export default async function AdminShopPage() {
    await requireAdminPage();
    return <main className="mx-auto min-h-screen w-full max-w-7xl p-4 pb-28 md:p-8"><header className="rounded-3xl bg-sbc-dark p-7 text-white shadow-xl md:p-10"><p className="text-xs font-black uppercase tracking-[0.25em] text-sbc-light">Administration</p><h1 className="mt-2 text-3xl font-black md:text-5xl">Boutique du club</h1><p className="mt-3 max-w-2xl text-green-50/75">Gérez le catalogue, les commandes payées et les envois mensuels au fournisseur.</p></header><div className="mt-8 grid gap-6 md:grid-cols-3">{sections.map((section) => <Link key={section.href} href={section.href} className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sbc/20"><div className={`h-2 bg-gradient-to-r ${section.color}`} /><div className="p-7"><div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl text-white shadow-lg ${section.color}`}><i className={section.icon} /></div><h2 className="mt-5 text-2xl font-black text-gray-950">{section.title}</h2><p className="mt-2 text-sm leading-6 text-gray-500">{section.text}</p><span className="mt-6 inline-block text-sm font-black text-sbc">Ouvrir <i className="fas fa-arrow-right ml-1 transition group-hover:translate-x-1" /></span></div></Link>)}</div></main>;
}

