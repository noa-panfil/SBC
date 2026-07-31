"use client";
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useShopCart } from "@/hooks/useShopCart";
import { formatEuros, SHOP_MAX_QUANTITY } from "@/lib/shop/constants";

export default function CartPageClient() {
    const { lines, updateQuantity, remove, totalCents } = useShopCart();
    const [cancelled, setCancelled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => { setCancelled(new URLSearchParams(window.location.search).get("paiement") === "annule"); }, []);

    const checkout = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setError("");
        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") || "").trim();
        if (email.toLowerCase() !== String(form.get("emailConfirmation") || "").trim().toLowerCase()) {
            setError("Les deux adresses e-mail ne correspondent pas."); return;
        }
        if (!lines.length) { setError("Votre panier est vide."); return; }
        setLoading(true);
        try {
            const response = await fetch("/api/shop/checkout", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
                    customer: { firstName: form.get("firstName"), lastName: form.get("lastName"), email, phone: form.get("phone") },
                    termsAccepted: form.get("termsAccepted") === "on",
                    pickupAcknowledged: form.get("pickupAcknowledged") === "on",
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.url) throw new Error(data.error || "Impossible de démarrer le paiement.");
            window.location.assign(data.url);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Impossible de démarrer le paiement."); setLoading(false);
        }
    };

    return <main className="container mx-auto min-h-screen max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-8"><Link href="/boutique" className="text-sm font-bold text-sbc hover:text-sbc-dark focus:outline-none focus:ring-4 focus:ring-sbc/20"><i className="fas fa-arrow-left mr-2" />Continuer mes achats</Link><h1 className="mt-4 text-4xl font-black text-gray-950">Mon panier</h1><p className="mt-2 text-gray-500">Paiement sécurisé par Stripe · Retrait gratuit au club</p></div>
        {cancelled && <div role="status" className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-900">Le paiement a été annulé. Votre panier a été conservé.</div>}
        {!lines.length ? <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white px-6 py-16 text-center"><i className="fas fa-shopping-basket text-5xl text-sbc/25" /><h2 className="mt-5 text-2xl font-black">Votre panier est vide</h2><Link href="/boutique" className="mt-6 inline-block rounded-xl bg-sbc px-6 py-3 font-black text-white focus:outline-none focus:ring-4 focus:ring-sbc/25">Découvrir la boutique</Link></div> :
        <form onSubmit={checkout} className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
                <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm" aria-labelledby="cart-title"><h2 id="cart-title" className="border-b border-gray-100 px-6 py-5 text-xl font-black">Articles</h2><ul className="divide-y divide-gray-100">{lines.map((line) => <li key={line.variantId} className="flex gap-4 p-5 md:p-6">{line.imageUrl ? <img src={line.imageUrl} alt="" className="h-24 w-20 shrink-0 rounded-xl object-cover md:h-28 md:w-24" /> : <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-xl bg-green-50 text-sbc/30 md:h-28 md:w-24"><i className="fas fa-tshirt text-2xl" /></div>}<div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-gray-950">{line.productName}</h3><p className="mt-1 text-sm text-gray-500">{line.color} · Taille {line.size}</p></div><p className="whitespace-nowrap font-black">{formatEuros(line.priceCents * line.quantity)}</p></div><div className="mt-5 flex items-center justify-between gap-4"><label className="text-sm font-bold text-gray-700">Quantité <select value={line.quantity} onChange={(event) => updateQuantity(line.variantId, Number(event.target.value))} className="ml-2 rounded-lg border border-gray-300 bg-white px-2 py-2 focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15">{Array.from({ length: SHOP_MAX_QUANTITY }, (_, index) => index + 1).map((value) => <option key={value}>{value}</option>)}</select></label><button type="button" onClick={() => remove(line.variantId)} className="rounded-lg px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100" aria-label={`Supprimer ${line.productName} du panier`}><i className="fas fa-trash-alt mr-2" />Supprimer</button></div></div></li>)}</ul></section>
                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm" aria-labelledby="customer-title"><h2 id="customer-title" className="text-xl font-black">Vos coordonnées</h2><p className="mt-1 text-sm text-gray-500">Aucune adresse postale n'est demandée : le retrait se fait au club.</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="block text-sm font-bold text-gray-700">Prénom<input required name="firstName" autoComplete="given-name" maxLength={100} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" /></label><label className="block text-sm font-bold text-gray-700">Nom<input required name="lastName" autoComplete="family-name" maxLength={100} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" /></label><label className="block text-sm font-bold text-gray-700">Adresse e-mail<input required type="email" name="email" autoComplete="email" maxLength={254} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" /></label><label className="block text-sm font-bold text-gray-700">Confirmer l'e-mail<input required type="email" name="emailConfirmation" autoComplete="email" maxLength={254} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" /></label><label className="block text-sm font-bold text-gray-700 sm:col-span-2">Téléphone<input required type="tel" name="phone" autoComplete="tel" maxLength={40} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" /></label></div></section>
            </div>
            <aside className="h-fit rounded-3xl bg-sbc-dark p-6 text-white shadow-xl lg:sticky lg:top-28"><h2 className="text-xl font-black">Récapitulatif</h2><div className="mt-6 space-y-3 border-b border-white/15 pb-5 text-sm"><div className="flex justify-between"><span className="text-green-100">Sous-total</span><strong>{formatEuros(totalCents)}</strong></div><div className="flex justify-between"><span className="text-green-100">Livraison</span><strong>0,00 €</strong></div></div><div className="flex justify-between py-5 text-xl"><span className="font-black">Total</span><strong>{formatEuros(totalCents)}</strong></div><div className="space-y-4 border-t border-white/15 pt-5"><label className="flex cursor-pointer gap-3 text-sm leading-5"><input required type="checkbox" name="termsAccepted" className="mt-1 h-4 w-4 accent-green-400" /><span>J'accepte les <Link href="/boutique/conditions-de-vente" target="_blank" className="font-bold underline">conditions de vente</Link>.</span></label><label className="flex cursor-pointer gap-3 text-sm leading-5"><input required type="checkbox" name="pickupAcknowledged" className="mt-1 h-4 w-4 accent-green-400" /><span>J'ai compris que le retrait s'effectue uniquement au club.</span></label></div>{error && <p role="alert" className="mt-5 rounded-xl bg-red-950/60 p-3 text-sm font-semibold text-red-100">{error}</p>}<button disabled={loading} className="mt-6 w-full rounded-xl bg-white px-5 py-4 font-black text-sbc-dark shadow-lg hover:bg-green-50 focus:outline-none focus:ring-4 focus:ring-white/30 disabled:cursor-wait disabled:opacity-70">{loading ? <><i className="fas fa-circle-notch fa-spin mr-2" />Redirection…</> : <><i className="fas fa-lock mr-2" />Payer avec Stripe</>}</button><p className="mt-4 text-center text-xs leading-5 text-green-100/70">Les prix et disponibilités seront revérifiés sur le serveur avant le paiement.</p></aside>
        </form>}
    </main>;
}
