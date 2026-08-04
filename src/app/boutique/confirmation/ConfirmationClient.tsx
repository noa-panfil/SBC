"use client";
/* eslint-disable react/no-unescaped-entities */

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearCart } from "@/lib/shop/cart";
import { formatEuros } from "@/lib/shop/constants";

type Confirmation = { number: string; firstName: string; totalCents: number; paymentStatus: string; orderStatus: string; items: Array<{ productName: string; size: string; color: string; quantity: number; lineTotalCents: number; personalizations: Array<{ type: "text" | "number"; placement: "front" | "back"; value: string }>; personalizationPriceCents: number }> };

export default function ConfirmationClient() {
    const [order, setOrder] = useState<Confirmation | null>(null);
    const [error, setError] = useState("");
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session_id"); const token = params.get("token");
        if (!sessionId || !token) { setError("Le lien de confirmation est incomplet."); return; }
        let stopped = false; let attempts = 0;
        const check = async () => {
            try {
                const response = await fetch(`/api/shop/orders/confirmation?session_id=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(token)}`, { cache: "no-store" });
                const data = await response.json(); if (!response.ok) throw new Error(data.error || "Confirmation indisponible.");
                if (stopped) return;
                const normalizedOrder: Confirmation = {
                    ...data.order,
                    items: data.order.items.map((item: Confirmation["items"][number]) => ({
                        ...item,
                        color: item.personalizations.length
                            ? `${item.color} · ${item.personalizations.map((personalization) => `${personalization.type === "text" ? "Texte" : "Numéro"} « ${personalization.value} » (${personalization.placement === "front" ? "devant" : "dos"})`).join(" · ")}`
                            : item.color,
                    })),
                };
                setOrder(normalizedOrder); attempts += 1;
                if (data.order.paymentStatus === "paid") { clearCart(); stopped = true; return; }
                if (attempts < 15) window.setTimeout(check, 2000);
            } catch (reason) { if (!stopped) setError(reason instanceof Error ? reason.message : "Confirmation indisponible."); }
        };
        check(); return () => { stopped = true; };
    }, []);
    if (error) return <main className="container mx-auto min-h-screen max-w-2xl px-4 py-20"><div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center"><i className="fas fa-exclamation-triangle text-4xl text-red-500" /><h1 className="mt-4 text-2xl font-black text-red-950">Confirmation indisponible</h1><p className="mt-2 text-red-800">{error}</p><Link href="/boutique" className="mt-6 inline-block font-bold text-red-900 underline">Retour à la boutique</Link></div></main>;
    if (!order) return <main className="container mx-auto min-h-screen max-w-2xl px-4 py-20 text-center" role="status"><i className="fas fa-circle-notch fa-spin text-4xl text-sbc" /><p className="mt-4 font-bold text-gray-700">Vérification de votre paiement…</p></main>;
    const paid = order.paymentStatus === "paid";
    return <main className="container mx-auto min-h-screen max-w-2xl px-4 py-14"><div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl"><div className={`p-8 text-center text-white ${paid ? "bg-sbc-dark" : "bg-orange-600"}`}><i className={`fas ${paid ? "fa-check-circle" : "fa-clock"} text-5xl`} /><h1 className="mt-4 text-3xl font-black">{paid ? "Paiement confirmé" : "Paiement en cours de confirmation"}</h1><p className="mt-2 opacity-85">Commande {order.number}</p></div><div className="p-6 md:p-8"><p className="text-lg">Bonjour <strong>{order.firstName}</strong>,</p><p className="mt-2 text-gray-600">{paid ? "Votre commande est enregistrée et un e-mail récapitulatif va vous être envoyé." : "Stripe traite encore votre paiement. Cette page ne valide rien elle-même : la confirmation sécurisée arrive par le webhook Stripe."}</p><ul className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100">{order.items.map((item, index) => <li key={index} className="flex justify-between gap-4 p-4 text-sm"><span><strong>{item.productName}</strong><br /><span className="text-gray-500">{item.color} · Taille {item.size} · Qté {item.quantity}</span></span><strong className="whitespace-nowrap">{formatEuros(item.lineTotalCents)}</strong></li>)}</ul><div className="mt-5 flex justify-between text-xl font-black"><span>Total</span><span>{formatEuros(order.totalCents)}</span></div><div className="mt-6 rounded-2xl bg-green-50 p-5 text-sm leading-6 text-green-950"><strong>Prochaine étape :</strong> votre commande sera regroupée avant d'être transmise au fournisseur. Le retrait se fera uniquement au club.</div><Link href="/boutique" className="mt-6 block text-center font-black text-sbc hover:text-sbc-dark">Retour à la boutique</Link></div></div></main>;
}
