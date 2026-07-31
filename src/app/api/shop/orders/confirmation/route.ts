import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/shop/db";
import { RowDataPacket } from "mysql2";

type OrderRow = RowDataPacket & {
    id: number; order_number: string; customer_first_name: string; total_cents: number;
    currency: string; payment_status: string; order_status: string; created_at: Date;
};
type ItemRow = RowDataPacket & {
    product_name: string; size: string; color: string; quantity: number; unit_price_cents: number; line_total_cents: number;
};

export async function GET(request: NextRequest) {
    const sessionId = request.nextUrl.searchParams.get("session_id")?.trim();
    const token = request.nextUrl.searchParams.get("token")?.trim();
    if (!sessionId || !token || token.length !== 64) return NextResponse.json({ error: "Confirmation invalide." }, { status: 400 });
    try {
        const [orders] = await pool.query<OrderRow[]>(
            `SELECT id, order_number, customer_first_name, total_cents, currency, payment_status, order_status, created_at
             FROM shop_orders WHERE stripe_checkout_session_id = ? AND public_token = ?`, [sessionId, token]
        );
        if (!orders[0]) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
        const [items] = await pool.query<ItemRow[]>(
            `SELECT product_name, size, color, quantity, unit_price_cents, line_total_cents
             FROM shop_order_items WHERE order_id = ? ORDER BY id`, [orders[0].id]
        );
        return NextResponse.json({
            order: {
                number: orders[0].order_number,
                firstName: orders[0].customer_first_name,
                totalCents: orders[0].total_cents,
                currency: orders[0].currency,
                paymentStatus: orders[0].payment_status,
                orderStatus: orders[0].order_status,
                createdAt: orders[0].created_at,
                items: items.map((item) => ({ productName: item.product_name, size: item.size, color: item.color,
                    quantity: item.quantity, unitPriceCents: item.unit_price_cents, lineTotalCents: item.line_total_cents })),
            },
        });
    } catch (error) {
        console.error("Shop confirmation error:", error);
        return NextResponse.json({ error: "Impossible de vérifier la commande." }, { status: 500 });
    }
}
