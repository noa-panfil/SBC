"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Contact = {
    id: number;
    kind: "contact" | "partnership";
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    organization: string | null;
    status: "new" | "processed";
    notificationEmailStatus: "pending" | "sending" | "sent" | "failed";
    createdAt: string;
};

type Counts = { total: number; new: number; partnerships: number };

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
});

export default function ContactsManager() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [counts, setCounts] = useState<Counts>({ total: 0, new: 0, partnerships: 0 });
    const [filters, setFilters] = useState({ search: "", status: "", kind: "" });
    const [appliedFilters, setAppliedFilters] = useState(filters);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const query = new URLSearchParams(Object.entries(appliedFilters).filter(([, value]) => value));
            const response = await fetch(`/api/admin/contacts?${query}`, { cache: "no-store" });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Impossible de charger les contacts.");
            setContacts(data.contacts);
            setCounts(data.counts);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    }, [appliedFilters]);

    useEffect(() => { void load(); }, [load]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        setAppliedFilters(filters);
    };

    return <main className="mx-auto min-h-screen w-full max-w-7xl p-4 pb-28 md:p-8">
        <header className="overflow-hidden rounded-3xl bg-sbc-dark p-7 text-white shadow-xl md:p-10">
            <div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-sbc-light">Relation club</p>
                    <h1 className="mt-2 text-3xl font-black md:text-5xl">Boîte de réception</h1>
                    <p className="mt-3 max-w-2xl text-green-50/70">Retrouvez les messages adressés au club et suivez leur traitement.</p>
                </div>
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-3xl text-green-300">
                    <i className="fas fa-inbox" />
                </div>
            </div>
        </header>

        <section className="mt-6 grid grid-cols-3 gap-3">
            {[
                { label: "À traiter", value: counts.new, color: "text-orange-600" },
                { label: "Total", value: counts.total, color: "text-gray-950" },
                { label: "Partenariats", value: counts.partnerships, color: "text-sbc" },
            ].map((item) => <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 md:text-xs">{item.label}</p>
                <p className={`mt-1 text-2xl font-black md:text-3xl ${item.color}`}>{item.value}</p>
            </div>)}
        </section>

        <form onSubmit={submit} className="mt-6 grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-[1fr_190px_190px_auto]">
            <label className="text-xs font-black uppercase tracking-wide text-gray-500">Recherche
                <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Nom, e-mail ou organisation" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-normal normal-case tracking-normal outline-none transition focus:border-sbc focus:ring-4 focus:ring-sbc/10" />
            </label>
            <label className="text-xs font-black uppercase tracking-wide text-gray-500">Statut
                <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-sbc">
                    <option value="">Tous</option><option value="new">À traiter</option><option value="processed">Traités</option>
                </select>
            </label>
            <label className="text-xs font-black uppercase tracking-wide text-gray-500">Demande
                <select value={filters.kind} onChange={(event) => setFilters({ ...filters, kind: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-sbc">
                    <option value="">Toutes</option><option value="contact">Contact simple</option><option value="partnership">Partenariat</option>
                </select>
            </label>
            <button type="submit" className="self-end rounded-xl bg-gray-950 px-5 py-3 text-sm font-black text-white transition hover:bg-sbc">Filtrer</button>
        </form>

        {error && <p role="alert" className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</p>}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="hidden grid-cols-[130px_1fr_180px_130px_90px] gap-4 border-b bg-gray-50 px-5 py-3 text-[11px] font-black uppercase tracking-wider text-gray-400 md:grid">
                <span>Demande</span><span>Expéditeur</span><span>Reçue le</span><span>Statut</span><span />
            </div>
            <div className="divide-y divide-gray-100">
                {contacts.map((contact) => <article key={contact.id} className={`grid gap-4 p-5 transition hover:bg-gray-50 md:grid-cols-[130px_1fr_180px_130px_90px] md:items-center ${contact.status === "new" ? "border-l-4 border-l-orange-400" : "border-l-4 border-l-transparent"}`}>
                    <div><span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${contact.kind === "partnership" ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-800"}`}>{contact.kind === "partnership" ? "Partenariat" : "Contact"}</span></div>
                    <div className="min-w-0"><p className="truncate font-black text-gray-950">{contact.firstName} {contact.lastName}</p><p className="truncate text-sm text-gray-500">{contact.organization || contact.email}</p></div>
                    <time className="text-sm text-gray-500" dateTime={contact.createdAt}>{dateFormatter.format(new Date(contact.createdAt))}</time>
                    <div><span className={`inline-flex items-center gap-2 text-xs font-black ${contact.status === "new" ? "text-orange-700" : "text-gray-500"}`}><span className={`h-2 w-2 rounded-full ${contact.status === "new" ? "bg-orange-500" : "bg-green-500"}`} />{contact.status === "new" ? "À traiter" : "Traité"}</span></div>
                    <Link href={`/admin/contacts/${contact.id}`} className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-sbc">Ouvrir</Link>
                </article>)}
            </div>
            {loading && <p className="p-10 text-center text-sm font-bold text-gray-400">Chargement…</p>}
            {!loading && !contacts.length && !error && <p className="p-12 text-center text-gray-400">Aucun contact ne correspond aux filtres.</p>}
        </div>
    </main>;
}
