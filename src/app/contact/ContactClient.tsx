"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ContactKind } from "@/lib/contact/validation";

type FormState = {
    kind: ContactKind;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    organization: string;
    message: string;
    consent: boolean;
    website: string;
};

export default function Contact({ initialKind = "contact" }: { initialKind?: ContactKind }) {
    const router = useRouter();
    const [form, setForm] = useState<FormState>({ kind: initialKind, firstName: "", lastName: "", email: "", phone: "", organization: "", message: "", consent: false, website: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const patch = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => setForm((current) => ({ ...current, [key]: value }));
    const inputClass = "mt-2 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-normal text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-sbc focus:ring-4 focus:ring-sbc/10";

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true); setError("");
        try {
            const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || "Impossible d’envoyer le message.");
            router.push(`/merci?type=${form.kind}`);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Impossible d’envoyer le message.");
            setSubmitting(false);
        }
    };

    return <main className="min-h-screen bg-[#f7f7f5]">
        <section className="sbc-da-hero relative isolate overflow-hidden bg-[#082b1d] text-white">
            <div className="absolute inset-0 -z-20 opacity-85 [background:radial-gradient(circle_at_14%_10%,rgba(34,197,94,.3),transparent_30%),radial-gradient(circle_at_86%_78%,rgba(249,115,22,.2),transparent_29%)]" />
            <img src="/logo.png" alt="" className="pointer-events-none absolute -right-10 top-1/2 -z-10 w-72 -translate-y-1/2 object-contain opacity-[0.075] grayscale sm:w-80 lg:right-10" />
            <div className="container mx-auto flex h-full flex-col justify-center px-4"><p className="text-xs font-black uppercase tracking-[0.24em] text-green-300">Nous écrire</p><h1 className="mt-4 max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.04em] sm:text-5xl md:text-6xl">Une question, un projet ? <span className="text-green-400">Parlons-en.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-green-50/70 md:text-lg">Équipe, inscription, vie du club ou partenariat : votre message arrive directement auprès du Seclin Basket Club.</p></div>
        </section>

        <section className="border-b border-gray-200 bg-white"><div className="container mx-auto grid divide-y divide-gray-100 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0"><div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-database text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Message enregistré</p><p className="text-xs text-gray-500">Suivi directement par le club</p></div></div><div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-user-shield text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Équipe du SBC</p><p className="text-xs text-gray-500">Aucun intermédiaire</p></div></div><div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-reply text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Réponse personnalisée</p><p className="text-xs text-gray-500">À l’adresse indiquée</p></div></div></div></section>

        <section className="py-14 md:py-20">
            <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
                <aside className="relative isolate overflow-hidden rounded-[2rem] bg-[#082b1d] p-7 text-white shadow-[0_20px_60px_rgba(8,43,29,.16)] sm:p-9 lg:sticky lg:top-28">
                    <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_85%_10%,rgba(74,222,128,.2),transparent_32%),radial-gradient(circle_at_10%_95%,rgba(249,115,22,.13),transparent_28%)]" /><img src="/logo.png" alt="" className="pointer-events-none absolute -bottom-16 -right-14 -z-10 w-64 opacity-[0.07] grayscale" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-green-300">Le club vous répond</p><h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">Restons en contact.</h2><p className="mt-4 leading-7 text-white/60">Toutes les demandes sont centralisées et suivies par l’équipe administrative du SBC.</p>
                    <div className="mt-9 space-y-5"><a href="mailto:seclinbc@gmail.com" className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/10"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-400 text-green-950"><i className="fas fa-envelope" /></span><span><strong className="block text-sm">E-mail</strong><span className="mt-0.5 block text-sm text-white/60">seclinbc@gmail.com</span></span></a><a href="tel:+33650723763" className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/10"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-400 text-green-950"><i className="fas fa-phone" /></span><span><strong className="block text-sm">Téléphone</strong><span className="mt-0.5 block text-sm text-white/60">06 50 72 37 63</span></span></a><div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-400 text-green-950"><i className="fas fa-map-marker-alt" /></span><span><strong className="block text-sm">Adresse</strong><span className="mt-0.5 block text-sm leading-5 text-white/60">7 rue Joliot Curie<br />59113 Seclin</span></span></div></div>
                </aside>

                <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_16px_55px_rgba(15,23,42,.08)]">
                    <div className="border-b border-gray-100 px-6 py-6 sm:px-8"><p className="text-xs font-black uppercase tracking-[0.2em] text-sbc">Votre message</p><h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-gray-950">Comment pouvons-nous vous aider ?</h2></div>
                    <form onSubmit={submit} className="space-y-6 p-6 sm:p-8">
                        <fieldset><legend className="text-sm font-black text-gray-950">Objet de votre demande</legend><div className="mt-3 grid gap-3 sm:grid-cols-2"><button type="button" aria-pressed={form.kind === "contact"} onClick={() => patch("kind", "contact")} className={`rounded-2xl border p-4 text-left transition ${form.kind === "contact" ? "border-sbc bg-green-50 ring-1 ring-sbc" : "border-gray-200 hover:border-gray-300"}`}><i className={`fas fa-comment-dots ${form.kind === "contact" ? "text-sbc" : "text-gray-400"}`} /><strong className="ml-3 text-sm text-gray-950">Contact simple</strong><span className="mt-2 block text-xs leading-5 text-gray-500">Question sur le club, les équipes ou les inscriptions.</span></button><button type="button" aria-pressed={form.kind === "partnership"} onClick={() => patch("kind", "partnership")} className={`rounded-2xl border p-4 text-left transition ${form.kind === "partnership" ? "border-sbc bg-green-50 ring-1 ring-sbc" : "border-gray-200 hover:border-gray-300"}`}><i className={`fas fa-handshake ${form.kind === "partnership" ? "text-sbc" : "text-gray-400"}`} /><strong className="ml-3 text-sm text-gray-950">Demande de partenariat</strong><span className="mt-2 block text-xs leading-5 text-gray-500">Construire une collaboration avec le SBC.</span></button></div></fieldset>
                        <div className="grid gap-5 sm:grid-cols-2"><Field label="Prénom" required><input required autoComplete="given-name" maxLength={100} value={form.firstName} onChange={(event) => patch("firstName", event.target.value)} className={inputClass} /></Field><Field label="Nom" required><input required autoComplete="family-name" maxLength={100} value={form.lastName} onChange={(event) => patch("lastName", event.target.value)} className={inputClass} /></Field><Field label="E-mail" required><input required type="email" autoComplete="email" maxLength={254} value={form.email} onChange={(event) => patch("email", event.target.value)} className={inputClass} /></Field><Field label="Téléphone"><input type="tel" autoComplete="tel" maxLength={40} value={form.phone} onChange={(event) => patch("phone", event.target.value)} className={inputClass} /></Field></div>
                        {form.kind === "partnership" && <Field label="Entreprise ou organisation"><input autoComplete="organization" maxLength={160} value={form.organization} onChange={(event) => patch("organization", event.target.value)} placeholder="Nom de votre structure" className={inputClass} /></Field>}
                        <Field label="Votre message" required><textarea required minLength={10} maxLength={5000} rows={7} value={form.message} onChange={(event) => patch("message", event.target.value)} placeholder={form.kind === "partnership" ? "Présentez-nous votre entreprise et votre idée de partenariat…" : "Expliquez-nous votre demande…"} className={`${inputClass} resize-y`} /><span className="mt-1 block text-right text-xs font-normal text-gray-400">{form.message.length}/5000</span></Field>
                        <label className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-600"><input required type="checkbox" checked={form.consent} onChange={(event) => patch("consent", event.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 accent-sbc" /><span>J’accepte que mes informations soient utilisées par le Seclin Basket Club pour répondre à ma demande. <Link href="/mentions-legales" className="font-bold text-sbc hover:underline">En savoir plus</Link>.</span></label>
                        <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">Site internet<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => patch("website", event.target.value)} /></label>
                        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"><i className="fas fa-exclamation-circle mr-2" />{error}</p>}
                        <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-3 rounded-xl bg-gray-950 px-5 py-4 font-black text-white shadow-lg transition hover:bg-sbc focus:outline-none focus:ring-4 focus:ring-sbc/25 disabled:cursor-wait disabled:opacity-60">{submitting ? <><i className="fas fa-spinner fa-spin" />Enregistrement…</> : <>Envoyer le message <i className="fas fa-arrow-right text-xs" /></>}</button>
                    </form>
                </div>
            </div>
        </section>
    </main>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return <label className="block text-sm font-black text-gray-800">{label}{required && <span className="ml-1 text-orange-500">*</span>}{children}</label>;
}
