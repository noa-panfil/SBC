"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { formatEuros } from "@/lib/shop/constants";

type Batch = {
    id: number;
    name: string;
    periodMonth: string;
    status: string;
    orderCount: number;
    totalCents: number;
    createdAt: string;
    sentAt: string | null;
    receivedAt: string | null;
    availableAt: string | null;
};

type Order = {
    id: number;
    number: string;
    firstName: string;
    lastName: string;
    totalCents: number;
    createdAt: string;
};

const statusLabels: Record<string, string> = {
    draft: "Brouillon",
    sent: "Envoyé",
    received: "Reçu",
    available: "Disponible au club",
    cancelled: "Annulé",
};

export default function BatchesManager() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [name, setName] = useState("");
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const [batchResponse, orderResponse] = await Promise.all([
                fetch("/api/admin/shop/batches", { cache: "no-store" }),
                fetch("/api/admin/shop/orders?payment=paid&batch=none", { cache: "no-store" }),
            ]);
            const batchData = await batchResponse.json();
            const orderData = await orderResponse.json();
            if (!batchResponse.ok) throw new Error(batchData.error);
            if (!orderResponse.ok) throw new Error(orderData.error);
            setBatches(batchData.batches);
            setOrders(orderData.orders);
            setSelected((current) =>
                current.filter((id) => orderData.orders.some((order: Order) => order.id === id)),
            );
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Erreur");
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!name) {
            const date = new Date(`${period}-02T12:00:00`);
            setName(
                `Commande fournisseur - ${date
                    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
                    .replace(/^./, (letter) => letter.toUpperCase())}`,
            );
        }
    }, [period, name]);

    const create = async (event: FormEvent) => {
        event.preventDefault();
        if (!selected.length) {
            setError("Sélectionnez au moins une commande payée.");
            return;
        }
        if (!confirm(`Créer le lot « ${name} » avec ${selected.length} commande(s) ?`)) return;

        try {
            const response = await fetch("/api/admin/shop/batches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, periodMonth: period, orderIds: selected }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setSelected([]);
            setName("");
            await load();
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Erreur");
        }
    };

    const update = async (batch: Batch, status: string) => {
        if (!confirm(`Confirmer : passer le lot « ${batch.name} » au statut ${statusLabels[status]} ?`)) return;

        try {
            const response = await fetch(`/api/admin/shop/batches/${batch.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            if (data.warning) {
                alert(`Lot mis à jour. ${data.warning}`);
            } else if (data.emails?.sent) {
                alert(`Lot mis à jour et ${data.emails.sent} e-mail(s) envoyé(s).`);
            }
            await load();
        } catch (reason) {
            alert(reason instanceof Error ? reason.message : "Erreur");
        }
    };

    const retryEmails = async (batch: Batch, stage: "sent" | "received" | "available") => {
        const labels = {
            sent: "transmission au fournisseur",
            received: "réception au club",
            available: "disponibilité au club",
        };
        const label = labels[stage];
        if (!confirm(`Réessayer les e-mails de ${label} pour le lot « ${batch.name} » ?`)) return;

        try {
            const response = await fetch(`/api/admin/shop/batches/${batch.id}/emails`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stage }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.warning || "Impossible de relancer les e-mails.");
            const failed = data.emails?.failed || 0;
            alert(
                failed
                    ? `${data.emails.processed} commande(s) vérifiée(s), mais ${failed} e-mail(s) restent en erreur.`
                    : `${data.emails.processed} commande(s) vérifiée(s). Les notifications manquantes ont été envoyées.`,
            );
        } catch (reason) {
            alert(reason instanceof Error ? reason.message : "Erreur");
        }
    };

    const selectionTotal = orders
        .filter((order) => selected.includes(order.id))
        .reduce((sum, order) => sum + order.totalCents, 0);

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl p-4 pb-28 md:p-8">
            <header>
                <Link href="/admin/boutique" className="text-sm font-bold text-sbc">
                    <i className="fas fa-arrow-left mr-2" />
                    Boutique
                </Link>
                <h1 className="mt-2 text-3xl font-black">Lots fournisseur</h1>
                <p className="mt-1 text-gray-500">Regroupez les commandes payées et exportez le besoin mensuel.</p>
            </header>

            {error && (
                <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">
                    {error}
                </p>
            )}

            <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_360px]">
                <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b p-5">
                        <div>
                            <h2 className="text-xl font-black">Commandes à regrouper</h2>
                            <p className="text-sm text-gray-500">Payées et sans lot fournisseur</p>
                        </div>
                        <button
                            onClick={() =>
                                setSelected(selected.length === orders.length ? [] : orders.map((order) => order.id))
                            }
                            className="text-sm font-bold text-sbc"
                        >
                            {selected.length === orders.length && orders.length
                                ? "Tout désélectionner"
                                : "Tout sélectionner"}
                        </button>
                    </div>
                    <div className="divide-y">
                        {orders.map((order) => (
                            <label key={order.id} className="flex cursor-pointer items-center gap-4 p-4 hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(order.id)}
                                    onChange={(event) =>
                                        setSelected(
                                            event.target.checked
                                                ? [...selected, order.id]
                                                : selected.filter((id) => id !== order.id),
                                        )
                                    }
                                    className="h-5 w-5 accent-green-700"
                                />
                                <span className="min-w-0 flex-1">
                                    <strong className="block text-sbc">{order.number}</strong>
                                    <span className="text-sm text-gray-500">
                                        {order.firstName} {order.lastName} · {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                                    </span>
                                </span>
                                <strong>{formatEuros(order.totalCents)}</strong>
                            </label>
                        ))}
                        {!orders.length && (
                            <p className="p-10 text-center text-gray-400">Aucune commande payée en attente de lot.</p>
                        )}
                    </div>
                </section>

                <form
                    onSubmit={create}
                    className="h-fit rounded-2xl bg-sbc-dark p-6 text-white shadow-xl lg:sticky lg:top-8"
                >
                    <h2 className="text-xl font-black">Créer un lot</h2>
                    <label className="mt-5 block text-sm font-bold">
                        Période
                        <input
                            required
                            type="month"
                            value={period}
                            onChange={(event) => {
                                setPeriod(event.target.value);
                                setName("");
                            }}
                            className="mt-2 w-full rounded-xl border-0 bg-white px-3 py-3 text-gray-900"
                        />
                    </label>
                    <label className="mt-4 block text-sm font-bold">
                        Nom du lot
                        <input
                            required
                            maxLength={180}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="mt-2 w-full rounded-xl border-0 bg-white px-3 py-3 text-gray-900"
                        />
                    </label>
                    <div className="mt-5 border-y border-white/15 py-4 text-sm">
                        <div className="flex justify-between"><span>Commandes</span><strong>{selected.length}</strong></div>
                        <div className="mt-2 flex justify-between"><span>Total client</span><strong>{formatEuros(selectionTotal)}</strong></div>
                    </div>
                    <button
                        className="mt-5 w-full rounded-xl bg-white px-4 py-3 font-black text-sbc-dark disabled:opacity-50"
                        disabled={!selected.length}
                    >
                        Créer le lot
                    </button>
                </form>
            </div>

            <section className="mt-8">
                <h2 className="text-2xl font-black">Historique des lots</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {batches.map((batch) => (
                        <article key={batch.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-black text-gray-950">{batch.name}</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {batch.orderCount} commande(s) · {formatEuros(batch.totalCents)}
                                    </p>
                                </div>
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black">
                                    {statusLabels[batch.status] || batch.status}
                                </span>
                            </div>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <a
                                    href={`/api/admin/shop/batches/${batch.id}/export`}
                                    className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-bold text-white"
                                >
                                    <i className="fas fa-file-excel mr-2" />
                                    Exporter
                                </a>
                                {batch.status === "draft" && (
                                    <button
                                        onClick={() => update(batch, "sent")}
                                        className="rounded-lg bg-orange-50 px-3 py-2 text-sm font-bold text-orange-800"
                                    >
                                        Marquer envoyé
                                    </button>
                                )}
                                {batch.status === "sent" && (
                                    <>
                                        <button
                                            onClick={() => update(batch, "received")}
                                            className="rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-800"
                                        >
                                            Marquer reçu
                                        </button>
                                        <button
                                            onClick={() => retryEmails(batch, "sent")}
                                            className="rounded-lg border px-3 py-2 text-sm font-bold text-gray-700"
                                        >
                                            Relancer e-mails « envoyé »
                                        </button>
                                    </>
                                )}
                                {batch.status === "received" && (
                                    <>
                                        <button
                                            onClick={() => update(batch, "available")}
                                            className="rounded-lg bg-sbc px-3 py-2 text-sm font-bold text-white"
                                        >
                                            Marquer disponible au club
                                        </button>
                                        <button
                                            onClick={() => retryEmails(batch, "sent")}
                                            className="rounded-lg border px-3 py-2 text-sm font-bold text-gray-700"
                                        >
                                            Relancer e-mails « envoyé »
                                        </button>
                                        <button
                                            onClick={() => retryEmails(batch, "received")}
                                            className="rounded-lg border px-3 py-2 text-sm font-bold text-gray-700"
                                        >
                                            Relancer e-mails « reçu »
                                        </button>
                                    </>
                                )}
                                {batch.status === "available" && (
                                    <>
                                        <button
                                            onClick={() => retryEmails(batch, "sent")}
                                            className="rounded-lg border px-3 py-2 text-sm font-bold text-gray-700"
                                        >
                                            Relancer e-mails « envoyé »
                                        </button>
                                        <button
                                            onClick={() => retryEmails(batch, "received")}
                                            className="rounded-lg border px-3 py-2 text-sm font-bold text-gray-700"
                                        >
                                            Relancer e-mails « reçu »
                                        </button>
                                        <button
                                            onClick={() => retryEmails(batch, "available")}
                                            className="rounded-lg border border-sbc px-3 py-2 text-sm font-bold text-sbc"
                                        >
                                            Relancer e-mails « disponible »
                                        </button>
                                    </>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}
