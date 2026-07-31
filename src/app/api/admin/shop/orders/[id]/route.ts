import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { parsePositiveId } from "@/lib/shop/validation";
import { RowDataPacket } from "mysql2";
import { ShopOrderStatus } from "@/types/shop";

const ADMIN_STATUSES: ShopOrderStatus[] = ["paid", "sent_to_supplier", "available_for_pickup", "picked_up", "cancelled"];

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = parsePositiveId((await params).id);
    if (!id) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    const [orders] = await pool.query<RowDataPacket[]>(
        `SELECT o.*, b.name AS batch_name FROM shop_orders o
         LEFT JOIN shop_supplier_batches b ON b.id = o.supplier_batch_id WHERE o.id = ?`, [id]
    );
    if (!orders[0]) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    const [items] = await pool.query<RowDataPacket[]>("SELECT * FROM shop_order_items WHERE order_id = ? ORDER BY id", [id]);
    const [history] = await pool.query<RowDataPacket[]>("SELECT * FROM shop_order_status_history WHERE order_id = ? ORDER BY created_at DESC, id DESC", [id]);
    const order = orders[0];
    return NextResponse.json({
        order: {
            id: Number(order.id), number: order.order_number, firstName: order.customer_first_name,
            lastName: order.customer_last_name, email: order.customer_email, phone: order.customer_phone,
            totalCents: order.total_cents, currency: order.currency, paymentStatus: order.payment_status,
            orderStatus: order.order_status, stripeSessionId: order.stripe_checkout_session_id,
            stripePaymentIntentId: order.stripe_payment_intent_id, batchId: order.supplier_batch_id,
            batchName: order.batch_name, paidAt: order.paid_at, createdAt: order.created_at,
            customerEmailStatus: order.customer_email_status, officeEmailStatus: order.office_email_status,
            pickupEmailStatus: order.pickup_email_status,
            items: items.map((item) => ({ id: Number(item.id), productName: item.product_name, sku: item.sku,
                size: item.size, color: item.color, unitPriceCents: item.unit_price_cents,
                quantity: item.quantity, lineTotalCents: item.line_total_cents })),
            history: history.map((entry) => ({ id: Number(entry.id), oldStatus: entry.old_status,
                newStatus: entry.new_status, changedBy: entry.changed_by, note: entry.note, createdAt: entry.created_at })),
        },
    });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = parsePositiveId((await params).id);
    const body = await request.json().catch(() => null) as { status?: ShopOrderStatus; note?: string } | null;
    if (!id || !body?.status || !ADMIN_STATUSES.includes(body.status)) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : null;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query<RowDataPacket[]>("SELECT order_status, payment_status FROM shop_orders WHERE id = ? FOR UPDATE", [id]);
        if (!rows[0]) { await connection.rollback(); return NextResponse.json({ error: "Commande introuvable." }, { status: 404 }); }
        if (rows[0].payment_status !== "paid" && body.status !== "cancelled") {
            await connection.rollback(); return NextResponse.json({ error: "Une commande non payée ne peut pas avancer logistiquement." }, { status: 409 });
        }
        if (rows[0].order_status !== body.status) {
            await connection.query("UPDATE shop_orders SET order_status = ? WHERE id = ?", [body.status, id]);
            await connection.query(
                `INSERT INTO shop_order_status_history (order_id, old_status, new_status, changed_by, note) VALUES (?, ?, ?, ?, ?)`,
                [id, rows[0].order_status, body.status, session.user?.email || "admin", note]
            );
        }
        await connection.commit();
        return NextResponse.json({ success: true });
    } catch (error) {
        await connection.rollback();
        console.error("Admin shop order update error:", error);
        return NextResponse.json({ error: "Impossible de modifier la commande." }, { status: 500 });
    } finally { connection.release(); }
}
