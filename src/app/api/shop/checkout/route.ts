import { NextResponse } from "next/server";
import pool from "@/lib/shop/db";
import { parseCheckoutPayload } from "@/lib/shop/validation";
import { SHOP_CURRENCY } from "@/lib/shop/constants";
import { getCheckoutEnv } from "@/lib/shop/env";
import { getStripe } from "@/lib/shop/stripe";
import { randomBytes } from "crypto";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import Stripe from "stripe";

type VariantRow = RowDataPacket & {
    id: number; product_id: number; product_name: string; sku: string | null;
    size: string; color: string; price_cents: number;
    personalization_enabled: number; personalization_price_cents: number;
    personalization_text_enabled: number; personalization_number_enabled: number;
    personalization_front_enabled: number; personalization_back_enabled: number;
    personalization_text_front_enabled: number; personalization_text_back_enabled: number;
    personalization_number_front_enabled: number; personalization_number_back_enabled: number;
};

export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    const payload = parseCheckoutPayload(body);
    if (!payload) return NextResponse.json({ error: "Les informations du panier sont invalides." }, { status: 400 });

    let env: ReturnType<typeof getCheckoutEnv>;
    try {
        env = getCheckoutEnv();
    } catch (error) {
        console.error("Shop checkout configuration error:", error);
        return NextResponse.json({ error: "Le paiement est temporairement indisponible." }, { status: 503 });
    }

    const stripe = getStripe(env.stripeSecretKey);
    let connection: PoolConnection | null = null;
    let stripeSession: Stripe.Checkout.Session | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const ids = Array.from(new Set(payload.items.map((item) => item.variantId)));
        const placeholders = ids.map(() => "?").join(",");
        const [rows] = await connection.query<VariantRow[]>(
            `SELECT v.id, v.product_id, p.name AS product_name, v.sku, v.size, v.color, v.price_cents,
                    p.personalization_enabled, p.personalization_price_cents, p.personalization_text_enabled,
                    p.personalization_number_enabled, p.personalization_front_enabled, p.personalization_back_enabled,
                    p.personalization_text_front_enabled, p.personalization_text_back_enabled,
                    p.personalization_number_front_enabled, p.personalization_number_back_enabled
             FROM shop_product_variants v
             INNER JOIN shop_products p ON p.id = v.product_id
             WHERE v.id IN (${placeholders}) AND v.is_active = 1 AND p.is_active = 1
             FOR UPDATE`, ids
        );
        if (rows.length !== ids.length) {
            await connection.rollback();
            return NextResponse.json({ error: "Un article n'est plus disponible. Actualisez votre panier." }, { status: 409 });
        }

        const rowById = new Map(rows.map((row) => [Number(row.id), row]));
        const configuredLines = payload.items.map((item) => {
            const row = rowById.get(item.variantId)!;
            if (item.personalizations.length && !row.personalization_enabled) return null;
            for (const personalization of item.personalizations) {
                if (personalization.type === "text" && !row.personalization_text_enabled) return null;
                if (personalization.type === "number" && !row.personalization_number_enabled) return null;
                if (personalization.type === "text" && personalization.placement === "front" && !row.personalization_text_front_enabled) return null;
                if (personalization.type === "text" && personalization.placement === "back" && !row.personalization_text_back_enabled) return null;
                if (personalization.type === "number" && personalization.placement === "front" && !row.personalization_number_front_enabled) return null;
                if (personalization.type === "number" && personalization.placement === "back" && !row.personalization_number_back_enabled) return null;
            }
            const personalizationPriceCents = item.personalizations.length ? Number(row.personalization_price_cents) : 0;
            return {
                row,
                quantity: item.quantity,
                personalizations: item.personalizations,
                personalizationPriceCents,
                unitPriceCents: Number(row.price_cents) + personalizationPriceCents,
            };
        });
        if (configuredLines.some((line) => line === null)) {
            await connection.rollback();
            return NextResponse.json({ error: "La personnalisation n'est plus disponible pour l'un des articles." }, { status: 409 });
        }
        const lines = configuredLines.filter((line): line is NonNullable<typeof line> => line !== null);
        const totalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
        if (!Number.isSafeInteger(totalCents) || totalCents < 1) throw new Error("Invalid checkout total");

        const token = randomBytes(32).toString("hex");
        const temporaryNumber = `TMP-${randomBytes(12).toString("hex")}`;
        const [orderResult] = await connection.query<ResultSetHeader>(
            `INSERT INTO shop_orders (
                order_number, public_token, customer_first_name, customer_last_name, customer_email,
                customer_phone, total_cents, currency, payment_status, order_status,
                terms_accepted_at, pickup_acknowledged_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending_payment', NOW(), NOW())`,
            [temporaryNumber, token, payload.customer.firstName, payload.customer.lastName, payload.customer.email,
                payload.customer.phone, totalCents, SHOP_CURRENCY]
        );
        const orderId = orderResult.insertId;
        const orderNumber = `SBC-${new Date().getFullYear()}-${String(orderId).padStart(6, "0")}`;
        await connection.query("UPDATE shop_orders SET order_number = ? WHERE id = ?", [orderNumber, orderId]);

        for (const line of lines) {
            const { row, quantity, personalizations, personalizationPriceCents, unitPriceCents } = line;
            const firstPersonalization = personalizations[0] || null;
            await connection.query(
                `INSERT INTO shop_order_items (
                    order_id, product_id, variant_id, product_name, sku, size, color,
                    unit_price_cents, quantity, line_total_cents, personalization_type,
                    personalization_placement, personalization_value, personalization_price_cents,
                    personalizations_json
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [orderId, row.product_id, row.id, row.product_name, row.sku, row.size, row.color,
                    unitPriceCents, quantity, unitPriceCents * quantity, firstPersonalization?.type || null,
                    firstPersonalization?.placement || null, firstPersonalization?.value || null, personalizationPriceCents,
                    personalizations.length ? JSON.stringify(personalizations) : null]
            );
        }

        stripeSession = await stripe.checkout.sessions.create({
            mode: "payment",
            customer_email: payload.customer.email,
            client_reference_id: orderNumber,
            metadata: { order_id: String(orderId), order_number: orderNumber },
            payment_intent_data: { metadata: { order_id: String(orderId), order_number: orderNumber } },
            line_items: lines.map(({ row, quantity, personalizations, unitPriceCents }) => ({
                quantity,
                price_data: {
                    currency: SHOP_CURRENCY.toLowerCase(),
                    unit_amount: unitPriceCents,
                    product_data: {
                        name: row.product_name,
                        description: `${row.color} · Taille ${row.size}${personalizations.map((personalization) => ` · ${personalization.type === "text" ? "Texte" : "Numéro"} « ${personalization.value} » (${personalization.placement === "front" ? "devant" : "dos"})`).join("")}`,
                        metadata: { product_id: String(row.product_id), variant_id: String(row.id) },
                    },
                },
            })),
            success_url: `${env.appUrl}/boutique/confirmation?session_id={CHECKOUT_SESSION_ID}&token=${token}`,
            cancel_url: `${env.appUrl}/boutique/panier?paiement=annule`,
            locale: "fr",
        });
        if (!stripeSession.url) throw new Error("Stripe checkout URL missing");

        await connection.query(
            "UPDATE shop_orders SET stripe_checkout_session_id = ? WHERE id = ?",
            [stripeSession.id, orderId]
        );
        await connection.query(
            `INSERT INTO shop_order_status_history (order_id, old_status, new_status, changed_by, note)
             VALUES (?, NULL, 'pending_payment', 'checkout', 'Session Stripe créée')`, [orderId]
        );
        await connection.commit();
        return NextResponse.json({ url: stripeSession.url });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => undefined);
        if (stripeSession) await stripe.checkout.sessions.expire(stripeSession.id).catch(() => undefined);
        console.error("Shop checkout error:", error);
        return NextResponse.json({ error: "Le paiement n'a pas pu être initialisé. Réessayez." }, { status: 500 });
    } finally {
        connection?.release();
    }
}
