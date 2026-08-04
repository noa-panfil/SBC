"use client";
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useShopCart } from "@/hooks/useShopCart";
import { formatEuros, SHOP_MAX_QUANTITY } from "@/lib/shop/constants";

type CheckoutStep = 1 | 2 | 3;
type CustomerDetails = {
    firstName: string;
    lastName: string;
    email: string;
    emailConfirmation: string;
    phone: string;
};

const CUSTOMER_SESSION_KEY = "sbc-shop-checkout-customer";
const EMPTY_CUSTOMER: CustomerDetails = {
    firstName: "",
    lastName: "",
    email: "",
    emailConfirmation: "",
    phone: "",
};

const STEPS: Array<{ number: CheckoutStep; label: string; shortLabel: string; icon: string }> = [
    { number: 1, label: "Vérification du panier", shortLabel: "Panier", icon: "fa-shopping-bag" },
    { number: 2, label: "Vos coordonnées", shortLabel: "Coordonnées", icon: "fa-user" },
    { number: 3, label: "Récapitulatif et paiement", shortLabel: "Paiement", icon: "fa-lock" },
];

function isSavedCustomer(value: unknown): value is CustomerDetails {
    if (!value || typeof value !== "object") return false;
    const customer = value as Record<string, unknown>;
    return ["firstName", "lastName", "email", "emailConfirmation", "phone"]
        .every((field) => typeof customer[field] === "string");
}

export default function CartPageClient() {
    const { lines, updateQuantity, remove, totalCents } = useShopCart();
    const [step, setStep] = useState<CheckoutStep>(1);
    const [customer, setCustomer] = useState<CustomerDetails>(EMPTY_CUSTOMER);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [pickupAcknowledged, setPickupAcknowledged] = useState(false);
    const [cancelled, setCancelled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const paymentCancelled = new URLSearchParams(window.location.search).get("paiement") === "annule";
        setCancelled(paymentCancelled);

        if (!paymentCancelled) return;
        try {
            const saved: unknown = JSON.parse(sessionStorage.getItem(CUSTOMER_SESSION_KEY) || "null");
            if (isSavedCustomer(saved)) {
                setCustomer(saved);
                setStep(3);
            }
        } catch {
            sessionStorage.removeItem(CUSTOMER_SESSION_KEY);
        }
    }, []);

    const changeStep = (nextStep: CheckoutStep) => {
        setError("");
        setStep(nextStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const validateCustomer = () => {
        const details = {
            firstName: customer.firstName.trim(),
            lastName: customer.lastName.trim(),
            email: customer.email.trim(),
            emailConfirmation: customer.emailConfirmation.trim(),
            phone: customer.phone.trim(),
        };

        if (!details.firstName || !details.lastName || !details.email || !details.emailConfirmation || !details.phone) {
            return "Tous les champs de coordonnées sont obligatoires.";
        }
        if (!/^\S+@\S+\.\S+$/.test(details.email)) return "L'adresse e-mail n'est pas valide.";
        if (details.email.toLowerCase() !== details.emailConfirmation.toLowerCase()) {
            return "Les deux adresses e-mail ne correspondent pas.";
        }

        setCustomer(details);
        return "";
    };

    const startCheckout = async () => {
        if (!lines.length) {
            setError("Votre panier est vide.");
            changeStep(1);
            return;
        }
        if (!termsAccepted || !pickupAcknowledged) {
            setError("Vous devez accepter les conditions de vente et confirmer le retrait au club.");
            return;
        }

        setLoading(true);
        setError("");
        sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(customer));

        try {
            const response = await fetch("/api/shop/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: lines.map((line) => ({
                        variantId: line.variantId,
                        quantity: line.quantity,
                        personalizations: line.personalizations.map((personalization) => ({
                            type: personalization.type,
                            placement: personalization.placement,
                            value: personalization.value,
                        })),
                    })),
                    customer: {
                        firstName: customer.firstName,
                        lastName: customer.lastName,
                        email: customer.email,
                        phone: customer.phone,
                    },
                    termsAccepted,
                    pickupAcknowledged,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.url) throw new Error(data.error || "Impossible de démarrer le paiement.");
            window.location.assign(data.url);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Impossible de démarrer le paiement.");
            setLoading(false);
        }
    };

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (step === 1) {
            if (!lines.length) {
                setError("Votre panier est vide.");
                return;
            }
            changeStep(2);
            return;
        }

        if (step === 2) {
            const validationError = validateCustomer();
            if (validationError) {
                setError(validationError);
                return;
            }
            changeStep(3);
            return;
        }

        await startCheckout();
    };

    return (
        <main className="min-h-screen bg-gray-50/70 pb-16">
            <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
                <header className="mb-8">
                    <Link href="/boutique" className="text-sm font-bold text-sbc hover:text-sbc-dark focus:outline-none focus:ring-4 focus:ring-sbc/20">
                        <i className="fas fa-arrow-left mr-2" />Continuer mes achats
                    </Link>
                    <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">Finaliser ma commande</h1>
                            <p className="mt-2 text-gray-500">Paiement sécurisé par Stripe · Retrait gratuit au club</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                            <i className="fas fa-shield-alt text-sbc" />Paiement 100 % sécurisé
                        </div>
                    </div>
                </header>

                {cancelled && (
                    <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950">
                        <i className="fas fa-info-circle mt-0.5 text-orange-500" />
                        <div><strong>Paiement annulé.</strong> Votre panier et vos coordonnées ont été conservés. Vous pouvez vérifier votre commande avant de réessayer.</div>
                    </div>
                )}

                {lines.length > 0 && (
                    <nav aria-label="Étapes de validation de la commande" className="mb-8 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                        <ol className="grid grid-cols-3">
                            {STEPS.map((item, index) => {
                                const completed = item.number < step;
                                const active = item.number === step;
                                return (
                                    <li key={item.number} className="relative flex justify-center">
                                        {index > 0 && (
                                            <span aria-hidden="true" className="absolute right-1/2 top-5 h-0.5 w-full overflow-hidden bg-gray-200 sm:top-6">
                                                <span
                                                    className={`block h-full origin-left bg-sbc transition-transform duration-700 ease-in-out motion-reduce:transition-none ${item.number <= step ? "scale-x-100" : "scale-x-0"}`}
                                                />
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            disabled={item.number > step}
                                            onClick={() => item.number < step && changeStep(item.number)}
                                            aria-current={active ? "step" : undefined}
                                            className="relative z-10 flex w-full flex-col items-center gap-2 text-center disabled:cursor-default"
                                        >
                                            <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-black transition-all duration-500 ease-out motion-reduce:transition-none sm:h-12 sm:w-12 ${completed || active ? "border-sbc bg-sbc text-white" : "border-gray-200 bg-white text-gray-400"}`}>
                                                <i className={`fas ${completed ? "fa-check" : item.icon}`} />
                                            </span>
                                            <span className={`text-xs font-black sm:text-sm ${active ? "text-sbc-dark" : completed ? "text-gray-700" : "text-gray-400"}`}>
                                                <span className="sm:hidden">{item.shortLabel}</span>
                                                <span className="hidden sm:inline">{item.label}</span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>
                )}

                {!lines.length ? (
                    <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white px-6 py-16 text-center">
                        <i className="fas fa-shopping-basket text-5xl text-sbc/25" />
                        <h2 className="mt-5 text-2xl font-black">Votre panier est vide</h2>
                        <Link href="/boutique" className="mt-6 inline-block rounded-xl bg-sbc px-6 py-3 font-black text-white focus:outline-none focus:ring-4 focus:ring-sbc/25">Découvrir la boutique</Link>
                    </div>
                ) : (
                    <form onSubmit={submit} className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <div>
                            {step === 1 && (
                                <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm" aria-labelledby="cart-title">
                                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 sm:px-6">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-sbc">Étape 1 sur 3</p>
                                            <h2 id="cart-title" className="mt-1 text-xl font-black">Vérifiez vos articles</h2>
                                        </div>
                                        <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-sbc-dark">Modifiable</span>
                                    </div>
                                    <ul className="divide-y divide-gray-100">
                                        {lines.map((line) => (
                                            <li key={line.lineId} className="flex gap-4 p-5 sm:p-6">
                                                {line.imageUrl ? (
                                                    <img src={line.imageUrl} alt="" className="h-28 w-24 shrink-0 rounded-2xl bg-gray-50 object-cover sm:h-32 sm:w-28" />
                                                ) : (
                                                    <div className="flex h-28 w-24 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-sbc/30 sm:h-32 sm:w-28"><i className="fas fa-tshirt text-2xl" /></div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <h3 className="font-black text-gray-950">{line.productName}</h3>
                                                            <p className="mt-1 text-sm text-gray-500">{line.color} · Taille {line.size}</p>
                                                            {line.personalizations.length > 0 && <div className="mt-1 space-y-0.5 text-sm font-semibold text-sbc-dark">{line.personalizations.map((personalization) => <p key={personalization.type}>{personalization.type === "text" ? "Texte" : "Numéro"} « {personalization.value} » · {personalization.placement === "front" ? "Devant" : "Dos"}</p>)}<p className="text-xs text-gray-500">Supplément : +{formatEuros(line.personalizationPriceCents)}</p></div>}
                                                            <p className="mt-1 text-xs text-gray-400">{formatEuros(line.priceCents)} l'unité</p>
                                                        </div>
                                                        <p className="whitespace-nowrap font-black">{formatEuros(line.priceCents * line.quantity)}</p>
                                                    </div>
                                                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                                                        <label className="text-sm font-bold text-gray-700">
                                                            Quantité
                                                            <select value={line.quantity} onChange={(event) => updateQuantity(line.lineId, Number(event.target.value))} className="ml-2 rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15">
                                                                {Array.from({ length: SHOP_MAX_QUANTITY }, (_, index) => index + 1).map((value) => <option key={value}>{value}</option>)}
                                                            </select>
                                                        </label>
                                                        <button type="button" onClick={() => remove(line.lineId)} className="rounded-lg px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100" aria-label={`Supprimer ${line.productName} du panier`}>
                                                            <i className="fas fa-trash-alt mr-2" />Supprimer
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 text-sm text-gray-600 sm:px-6">
                                        <i className="fas fa-info-circle mr-2 text-sbc" />Vérifiez la taille, la couleur et la quantité de chaque article.
                                    </div>
                                </section>
                            )}

                            {step === 2 && (
                                <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="customer-title">
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-sbc">Étape 2 sur 3</p>
                                    <h2 id="customer-title" className="mt-1 text-2xl font-black">Vos coordonnées</h2>
                                    <p className="mt-2 text-sm leading-6 text-gray-500">Elles serviront à confirmer votre paiement et à vous prévenir lorsque votre commande sera disponible au club.</p>
                                    <div className="mt-7 grid gap-5 sm:grid-cols-2">
                                        <label className="block text-sm font-bold text-gray-700">
                                            Prénom
                                            <input required value={customer.firstName} onChange={(event) => setCustomer({ ...customer, firstName: event.target.value })} name="firstName" autoComplete="given-name" maxLength={100} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" />
                                        </label>
                                        <label className="block text-sm font-bold text-gray-700">
                                            Nom
                                            <input required value={customer.lastName} onChange={(event) => setCustomer({ ...customer, lastName: event.target.value })} name="lastName" autoComplete="family-name" maxLength={100} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" />
                                        </label>
                                        <label className="block text-sm font-bold text-gray-700">
                                            Adresse e-mail
                                            <input required type="email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} name="email" autoComplete="email" maxLength={254} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" />
                                        </label>
                                        <label className="block text-sm font-bold text-gray-700">
                                            Confirmer l'e-mail
                                            <input required type="email" value={customer.emailConfirmation} onChange={(event) => setCustomer({ ...customer, emailConfirmation: event.target.value })} name="emailConfirmation" autoComplete="email" maxLength={254} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" />
                                        </label>
                                        <label className="block text-sm font-bold text-gray-700 sm:col-span-2">
                                            Téléphone
                                            <input required type="tel" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} name="phone" autoComplete="tel" maxLength={40} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" />
                                        </label>
                                    </div>
                                    <div className="mt-7 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm leading-6 text-green-950">
                                        <i className="fas fa-store mr-2 text-sbc" /><strong>Pas d'adresse de livraison :</strong> toutes les commandes sont à retirer au club.
                                    </div>
                                </section>
                            )}

                            {step === 3 && (
                                <div className="space-y-6">
                                    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm" aria-labelledby="review-title">
                                        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-6">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.18em] text-sbc">Étape 3 sur 3</p>
                                                <h2 id="review-title" className="mt-1 text-2xl font-black">Récapitulatif de la commande</h2>
                                            </div>
                                            <button type="button" onClick={() => changeStep(1)} className="shrink-0 rounded-lg px-3 py-2 text-sm font-black text-sbc hover:bg-green-50">Modifier</button>
                                        </div>
                                        <ul className="divide-y divide-gray-100">
                                            {lines.map((line) => (
                                                <li key={line.lineId} className="flex items-center gap-4 p-5 sm:px-6">
                                                    {line.imageUrl ? <img src={line.imageUrl} alt="" className="h-20 w-16 shrink-0 rounded-xl bg-gray-50 object-cover" /> : <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-xl bg-green-50 text-sbc/30"><i className="fas fa-tshirt" /></div>}
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="truncate font-black">{line.productName}</h3>
                                                        <p className="mt-1 text-sm text-gray-500">{line.color} · Taille {line.size} · Qté {line.quantity}</p>
                                                        {line.personalizations.length > 0 && <div className="mt-1 text-xs font-semibold text-sbc-dark">{line.personalizations.map((personalization) => <p key={personalization.type}>{personalization.type === "text" ? "Texte" : "Numéro"} « {personalization.value} » · {personalization.placement === "front" ? "Devant" : "Dos"}</p>)}</div>}
                                                    </div>
                                                    <strong className="whitespace-nowrap">{formatEuros(line.priceCents * line.quantity)}</strong>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>

                                    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="review-customer-title">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h2 id="review-customer-title" className="text-lg font-black">Coordonnées</h2>
                                                <p className="mt-3 font-bold text-gray-950">{customer.firstName} {customer.lastName}</p>
                                                <p className="mt-1 text-sm text-gray-600">{customer.email}</p>
                                                <p className="mt-1 text-sm text-gray-600">{customer.phone}</p>
                                            </div>
                                            <button type="button" onClick={() => changeStep(2)} className="shrink-0 rounded-lg px-3 py-2 text-sm font-black text-sbc hover:bg-green-50">Modifier</button>
                                        </div>
                                    </section>
                                </div>
                            )}
                        </div>

                        <aside className="h-fit overflow-hidden rounded-3xl bg-sbc-dark text-white shadow-xl lg:sticky lg:top-28">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black">Votre commande</h2>
                                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{lines.reduce((sum, line) => sum + line.quantity, 0)} article(s)</span>
                                </div>
                                <div className="mt-6 space-y-3 border-b border-white/15 pb-5 text-sm">
                                    <div className="flex justify-between"><span className="text-green-100">Sous-total</span><strong>{formatEuros(totalCents)}</strong></div>
                                    <div className="flex justify-between"><span className="text-green-100">Livraison</span><strong>Gratuite</strong></div>
                                </div>
                                <div className="flex justify-between py-5 text-xl"><span className="font-black">Total</span><strong>{formatEuros(totalCents)}</strong></div>

                                {step === 3 && (
                                    <div className="space-y-4 border-t border-white/15 pt-5">
                                        <label className="flex cursor-pointer gap-3 text-sm leading-5">
                                            <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-green-400" />
                                            <span>J'accepte les <Link href="/boutique/conditions-de-vente" target="_blank" className="font-bold underline">conditions de vente</Link>.</span>
                                        </label>
                                        <label className="flex cursor-pointer gap-3 text-sm leading-5">
                                            <input type="checkbox" checked={pickupAcknowledged} onChange={(event) => setPickupAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-green-400" />
                                            <span>J'ai compris que le retrait s'effectue uniquement au club.</span>
                                        </label>
                                    </div>
                                )}

                                {error && <p role="alert" className="mt-5 rounded-xl bg-red-950/60 p-3 text-sm font-semibold text-red-100">{error}</p>}

                                <div className="mt-6 space-y-3">
                                    {step > 1 && (
                                        <button type="button" disabled={loading} onClick={() => changeStep((step - 1) as CheckoutStep)} className="w-full rounded-xl border border-white/25 px-5 py-3.5 font-black text-white hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/20 disabled:opacity-50">
                                            <i className="fas fa-arrow-left mr-2" />Retour
                                        </button>
                                    )}
                                    <button type="submit" disabled={loading} className="w-full rounded-xl bg-white px-5 py-4 font-black text-sbc-dark shadow-lg hover:bg-green-50 focus:outline-none focus:ring-4 focus:ring-white/30 disabled:cursor-wait disabled:opacity-70">
                                        {loading ? (
                                            <><i className="fas fa-circle-notch fa-spin mr-2" />Redirection…</>
                                        ) : step === 1 ? (
                                            <>Continuer vers mes coordonnées<i className="fas fa-arrow-right ml-2" /></>
                                        ) : step === 2 ? (
                                            <>Vérifier ma commande<i className="fas fa-arrow-right ml-2" /></>
                                        ) : (
                                            <><i className="fas fa-lock mr-2" />Payer avec Stripe</>
                                        )}
                                    </button>
                                </div>

                                <p className="mt-4 text-center text-xs leading-5 text-green-100/70">
                                    {step === 3 ? "Les prix et disponibilités seront revérifiés avant le paiement." : "Vous pourrez revenir à cette étape avant de payer."}
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-5 border-t border-white/10 bg-black/10 px-5 py-4 text-xs font-bold text-green-100/80">
                                <span><i className="fas fa-lock mr-2" />Stripe</span>
                                <span><i className="fas fa-store mr-2" />Retrait club</span>
                            </div>
                        </aside>
                    </form>
                )}
            </div>
        </main>
    );
}
