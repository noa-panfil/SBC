"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Contact = {
    id: number;
    kind: "contact" | "partnership";
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    organization: string | null;
    message: string;
    status: "new" | "processed";
    adminNote: string | null;
    processedAt: string | null;
    processedBy: string | null;
    notificationEmailStatus: "pending" | "sending" | "sent" | "failed";
    notificationEmailSentAt: string | null;
    consentAt: string;
    createdAt: string;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });
const notificationLabels = { pending: "En attente", sending: "Envoi en cours", sent: "Notification envoyée", failed: "Échec de notification" };

export default function ContactDetail({ id }: { id: string }) {
    const [contact, setContact] = useState<Contact | null>(null);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/admin/contacts/${id}`, { cache: "no-store" });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Impossible de charger cette fiche.");
            setContact(data.contact);
            setNote(data.contact.adminNote || "");
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { void load(); }, [load]);

    const updateStatus = async (processed: boolean) => {
        setSaving(true);
        setError("");
        try {
            const response = await fetch(`/api/admin/contacts/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ processed, note }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Impossible d’enregistrer la fiche.");
            await load();
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Une erreur est survenue.");
        } finally {
            setSaving(false);
        }
    };

    if (loading && !contact) return <main className="mx-auto min-h-screen w-full max-w-5xl p-8"><p className="rounded-2xl bg-white p-10 text-center text-gray-400 shadow-sm">Chargement…</p></main>;
    if (!contact) return <main className="mx-auto min-h-screen w-full max-w-5xl p-8"><Link href="/admin/contacts" className="font-bold text-sbc">← Retour aux contacts</Link><p role="alert" className="mt-6 rounded-2xl bg-red-50 p-5 text-red-800">{error || "Contact introuvable."}</p></main>;

    const isProcessed = contact.status === "processed";
    const notificationFailed = contact.notificationEmailStatus === "failed";

    return <main className="mx-auto min-h-screen w-full max-w-5xl p-4 pb-28 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/admin/contacts" className="text-sm font-black text-sbc"><i className="fas fa-arrow-left mr-2" />Boîte de réception</Link>
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${isProcessed ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}><span className={`h-2 w-2 rounded-full ${isProcessed ? "bg-green-500" : "bg-orange-500"}`} />{isProcessed ? "Traité" : "À traiter"}</span>
        </div>

        <header className="mt-5 overflow-hidden rounded-3xl bg-sbc-dark p-7 text-white shadow-xl md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-green-300">{contact.kind === "partnership" ? "Demande de partenariat" : "Contact simple"}</p>
            <h1 className="mt-3 break-words text-3xl font-black tracking-tight md:text-5xl">{contact.firstName} {contact.lastName}</h1>
            <p className="mt-3 text-sm text-white/60">Reçu le {dateFormatter.format(new Date(contact.createdAt))}</p>
        </header>

        {error && <p role="alert" className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Message</p>
                <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-gray-800">{contact.message}</p>
            </section>

            <aside className="space-y-5">
                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Coordonnées</p>
                    <div className="mt-5 space-y-4 text-sm">
                        <a href={`mailto:${contact.email}`} className="flex items-start gap-3 font-bold text-sbc hover:underline"><i className="fas fa-envelope mt-1 w-4" /><span className="break-all">{contact.email}</span></a>
                        {contact.phone && <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 font-bold text-gray-800 hover:text-sbc"><i className="fas fa-phone w-4 text-gray-400" />{contact.phone}</a>}
                        {contact.organization && <p className="flex items-start gap-3 font-bold text-gray-800"><i className="fas fa-building mt-1 w-4 text-gray-400" /><span>{contact.organization}</span></p>}
                    </div>
                    <a href={`mailto:${contact.email}?subject=${encodeURIComponent(`Votre demande auprès du Seclin Basket Club`)}`} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-black text-white transition hover:bg-sbc"><i className="fas fa-reply" />Répondre</a>
                </section>

                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Suivi</p>
                    <label className="mt-4 block text-sm font-bold text-gray-700">Note interne
                        <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={5} placeholder="Échange téléphonique, action à prévoir…" className="mt-2 w-full resize-y rounded-xl border border-gray-200 px-3 py-3 text-sm font-normal outline-none transition focus:border-sbc focus:ring-4 focus:ring-sbc/10" />
                    </label>
                    <button type="button" disabled={saving} onClick={() => void updateStatus(!isProcessed)} className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-black text-white transition disabled:cursor-wait disabled:opacity-60 ${isProcessed ? "bg-gray-700 hover:bg-gray-950" : "bg-sbc hover:bg-sbc-dark"}`}>{saving ? "Enregistrement…" : isProcessed ? "Rouvrir la demande" : "Marquer comme traité"}</button>
                    {isProcessed && contact.processedAt && <p className="mt-4 text-xs leading-5 text-gray-400">Traité le {dateFormatter.format(new Date(contact.processedAt))}{contact.processedBy ? ` par ${contact.processedBy}` : ""}.</p>}
                </section>

                <section className={`rounded-2xl border p-4 text-xs font-bold ${notificationFailed ? "border-red-100 bg-red-50 text-red-800" : "border-green-100 bg-green-50 text-green-800"}`}>
                    <i className={`fas ${notificationFailed ? "fa-exclamation-circle" : "fa-paper-plane"} mr-2`} />
                    {notificationLabels[contact.notificationEmailStatus]}
                    {contact.notificationEmailSentAt && <span className="mt-1 block pl-6 font-normal opacity-75">{dateFormatter.format(new Date(contact.notificationEmailSentAt))}</span>}
                </section>
            </aside>
        </div>
    </main>;
}
