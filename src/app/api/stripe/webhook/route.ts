import { NextResponse } from "next/server";
import Stripe from "stripe";
import pool from "@/lib/shop/db";
import { getShopEnv } from "@/lib/shop/env";
import { getStripe } from "@/lib/shop/stripe";
import { sendPaidOrderEmails } from "@/lib/shop/emails";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { errorMessage } from "@/lib/shop/errors";

type OrderRow = RowDataPacket & {
    id: number;
    total_cents: number;
    currency: string;
    payment_status: string;
    order_status: string;
};

type EventRow = RowDataPacket & {
    processing_status: "processing" | "processed" | "failed";
    stale: number;
};

type EventClaim = "claimed" | "processed" | "in_progress";

function paymentIntentId(value: string | Stripe.PaymentIntent | null): string | null {
    return typeof value === "string" ? value : value?.id || null;
}

async function claimStripeEvent(event: Stripe.Event): Promise<EventClaim> {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [insert] = await connection.query<ResultSetHeader>(
            `INSERT IGNORE INTO shop_stripe_events (stripe_event_id, event_type, processing_status)
             VALUES (?, ?, 'processing')`,
            [event.id, event.type]
        );
        if (insert.affectedRows === 1) {
            await connection.commit();
            return "claimed";
        }

        const [events] = await connection.query<EventRow[]>(
            `SELECT processing_status, updated_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE) AS stale
             FROM shop_stripe_events WHERE stripe_event_id = ? FOR UPDATE`,
            [event.id]
        );
        const existing = events[0];
        if (!existing) throw new Error("Stripe event claim disappeared");
        if (existing.processing_status === "processed") {
            await connection.commit();
            return "processed";
        }
        if (existing.processing_status === "processing" && !existing.stale) {
            await connection.commit();
            return "in_progress";
        }

        await connection.query(
            `UPDATE shop_stripe_events
             SET event_type = ?, processing_status = 'processing', processed_at = NULL, last_error = NULL
             WHERE stripe_event_id = ?`,
            [event.type, event.id]
        );
        await connection.commit();
        return "claimed";
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function markSessionPaid(
    session: Stripe.Checkout.Session
): Promise<{ orderId: number; canSendEmails: boolean }> {
    const orderId = Number(session.metadata?.order_id);
    if (!Number.isSafeInteger(orderId) || orderId < 1) {
        throw new Error("Stripe session missing a valid order_id");
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [orders] = await connection.query<OrderRow[]>(
            `SELECT id, total_cents, currency, payment_status, order_status
             FROM shop_orders WHERE id = ? AND stripe_checkout_session_id = ? FOR UPDATE`,
            [orderId, session.id]
        );
        const order = orders[0];
        if (!order) throw new Error("Stripe order not found");
        if (session.amount_total !== order.total_cents || session.currency?.toUpperCase() !== order.currency.toUpperCase()) {
            throw new Error(`Stripe amount mismatch for order ${orderId}`);
        }

        // Un ancien événement de paiement ne doit jamais annuler un remboursement déjà enregistré.
        if (order.payment_status === "refunded" || order.payment_status === "partially_refunded") {
            await connection.commit();
            return { orderId, canSendEmails: false };
        }

        if (order.payment_status !== "paid") {
            await connection.query(
                `UPDATE shop_orders
                 SET payment_status = 'paid', order_status = 'paid', paid_at = COALESCE(paid_at, NOW()),
                     stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, ?)
                 WHERE id = ?`,
                [paymentIntentId(session.payment_intent), orderId]
            );
            await connection.query(
                `INSERT INTO shop_order_status_history (order_id, old_status, new_status, changed_by, note)
                 VALUES (?, ?, 'paid', 'stripe_webhook', 'Paiement confirmé par Stripe')`,
                [orderId, order.order_status]
            );
        }
        await connection.commit();
        return { orderId, canSendEmails: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function markSessionFailed(
    session: Stripe.Checkout.Session,
    status: "payment_failed" | "expired"
): Promise<number | null> {
    const orderId = Number(session.metadata?.order_id);
    if (!Number.isSafeInteger(orderId) || orderId < 1) return null;

    const paymentStatus = status === "expired" ? "expired" : "failed";
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [orders] = await connection.query<OrderRow[]>(
            `SELECT id, order_status, payment_status FROM shop_orders
             WHERE id = ? AND stripe_checkout_session_id = ? FOR UPDATE`,
            [orderId, session.id]
        );
        const order = orders[0];
        // Les états financiers terminaux ne peuvent pas régresser à cause d'un ancien événement.
        if (!order || order.payment_status !== "pending") {
            await connection.commit();
            return order ? orderId : null;
        }

        await connection.query(
            "UPDATE shop_orders SET payment_status = ?, order_status = ? WHERE id = ?",
            [paymentStatus, status, orderId]
        );
        if (order.order_status !== status) {
            await connection.query(
                `INSERT INTO shop_order_status_history (order_id, old_status, new_status, changed_by, note)
                 VALUES (?, ?, ?, 'stripe_webhook', ?)`,
                [orderId, order.order_status, status,
                    status === "expired" ? "Session Stripe expirée" : "Paiement Stripe échoué"]
            );
        }
        await connection.commit();
        return orderId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function markRefund(charge: Stripe.Charge): Promise<number | null> {
    const intentId = typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;
    if (!intentId) return null;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [orders] = await connection.query<OrderRow[]>(
            `SELECT id, order_status, payment_status, total_cents, currency
             FROM shop_orders WHERE stripe_payment_intent_id = ? FOR UPDATE`,
            [intentId]
        );
        const order = orders[0];
        if (!order) {
            await connection.commit();
            return null;
        }
        if (charge.amount !== order.total_cents || charge.currency.toUpperCase() !== order.currency.toUpperCase()) {
            throw new Error(`Stripe refund amount mismatch for order ${order.id}`);
        }
        if (order.payment_status === "refunded") {
            await connection.commit();
            return Number(order.id);
        }

        const full = charge.refunded || charge.amount_refunded >= charge.amount;
        const paymentStatus = full ? "refunded" : "partially_refunded";
        const orderStatus = full ? "refunded" : order.order_status;
        await connection.query(
            "UPDATE shop_orders SET payment_status = ?, order_status = ? WHERE id = ?",
            [paymentStatus, orderStatus, order.id]
        );
        if (full && order.order_status !== "refunded") {
            await connection.query(
                `INSERT INTO shop_order_status_history (order_id, old_status, new_status, changed_by, note)
                 VALUES (?, ?, 'refunded', 'stripe_webhook', 'Remboursement confirmé par Stripe')`,
                [order.id, order.order_status]
            );
        }
        await connection.commit();
        return Number(order.id);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function POST(request: Request) {
    let env: ReturnType<typeof getShopEnv>;
    try {
        env = getShopEnv();
    } catch (error) {
        console.error("Stripe webhook configuration error:", error);
        return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

    let event: Stripe.Event;
    try {
        const rawBody = await request.text();
        event = getStripe(env.stripeSecretKey).webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
    } catch (error) {
        console.warn("Stripe webhook signature rejected:", errorMessage(error));
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    let orderId: number | null = null;
    try {
        const claim = await claimStripeEvent(event);
        if (claim === "processed") {
            return NextResponse.json({ received: true, duplicate: true });
        }
        if (claim === "in_progress") {
            return NextResponse.json({ error: "Webhook already processing" }, { status: 409 });
        }

        if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
            const session = event.data.object as Stripe.Checkout.Session;
            if (session.payment_status === "paid" || event.type === "checkout.session.async_payment_succeeded") {
                const paid = await markSessionPaid(session);
                orderId = paid.orderId;
                if (paid.canSendEmails) await sendPaidOrderEmails(orderId);
            }
        } else if (event.type === "checkout.session.async_payment_failed") {
            orderId = await markSessionFailed(event.data.object as Stripe.Checkout.Session, "payment_failed");
        } else if (event.type === "checkout.session.expired") {
            orderId = await markSessionFailed(event.data.object as Stripe.Checkout.Session, "expired");
        } else if (event.type === "charge.refunded") {
            orderId = await markRefund(event.data.object as Stripe.Charge);
        }

        await pool.query(
            `UPDATE shop_stripe_events
             SET processing_status = 'processed', order_id = ?, processed_at = NOW(), last_error = NULL
             WHERE stripe_event_id = ?`,
            [orderId, event.id]
        );
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error(`Stripe webhook ${event.type} failed:`, errorMessage(error));
        await pool.query(
            `UPDATE shop_stripe_events
             SET processing_status = 'failed', order_id = ?, last_error = ?
             WHERE stripe_event_id = ?`,
            [orderId, errorMessage(error).slice(0, 500), event.id]
        ).catch(() => undefined);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}
