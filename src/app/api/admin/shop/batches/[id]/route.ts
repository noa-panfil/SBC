import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { parsePositiveId } from "@/lib/shop/validation";
import { RowDataPacket } from "mysql2";
import { EmailKind, sendShopEmail } from "@/lib/shop/emails";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = parsePositiveId((await params).id);
    if (!id) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    const [batches] = await pool.query<RowDataPacket[]>("SELECT * FROM shop_supplier_batches WHERE id = ?", [id]);
    if (!batches[0]) return NextResponse.json({ error: "Lot introuvable." }, { status: 404 });
    const [orders] = await pool.query<RowDataPacket[]>(
        `SELECT id, order_number, customer_first_name, customer_last_name, total_cents, order_status, created_at
         FROM shop_orders WHERE supplier_batch_id = ? ORDER BY created_at`, [id]
    );
    return NextResponse.json({ batch: { ...batches[0], orders } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = parsePositiveId((await params).id);
    const body = await request.json().catch(() => null) as { status?: string } | null;
    if (!id || !body?.status || !["sent", "received", "available", "cancelled"].includes(body.status)) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    const connection = await pool.getConnection();
    let notificationKind: EmailKind | null = null;
    let notificationOrderIds: number[] = [];
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query<RowDataPacket[]>("SELECT status, name FROM shop_supplier_batches WHERE id = ? FOR UPDATE", [id]);
        if (!rows[0]) throw new Error("BATCH_NOT_FOUND");
        const requiredPreviousStatus: Record<string, string> = {
            sent: "draft",
            received: "sent",
            available: "received",
        };
        if (requiredPreviousStatus[body.status] && rows[0].status !== requiredPreviousStatus[body.status]) {
            throw new Error("INVALID_TRANSITION");
        }
        if (body.status === "sent") {
            await connection.query("UPDATE shop_supplier_batches SET status = 'sent', sent_at = COALESCE(sent_at, NOW()) WHERE id = ?", [id]);
            const [orders] = await connection.query<RowDataPacket[]>("SELECT id, order_status FROM shop_orders WHERE supplier_batch_id = ? AND payment_status = 'paid'", [id]);
            notificationKind = "supplier_sent";
            notificationOrderIds = orders.map((order) => Number(order.id));
            for (const order of orders) {
                if (order.order_status !== "sent_to_supplier") {
                    await connection.query("UPDATE shop_orders SET order_status = 'sent_to_supplier' WHERE id = ?", [order.id]);
                    await connection.query(
                        `INSERT INTO shop_order_status_history (order_id, old_status, new_status, changed_by, note)
                         VALUES (?, ?, 'sent_to_supplier', ?, ?)`,
                        [order.id, order.order_status, session.user?.email || "admin", `Lot fournisseur envoyé : ${rows[0].name}`]
                    );
                }
            }
        } else if (body.status === "received") {
            await connection.query("UPDATE shop_supplier_batches SET status = 'received', received_at = COALESCE(received_at, NOW()) WHERE id = ?", [id]);
            const [orders] = await connection.query<RowDataPacket[]>("SELECT id FROM shop_orders WHERE supplier_batch_id = ? AND payment_status = 'paid'", [id]);
            notificationKind = "supplier_received";
            notificationOrderIds = orders.map((order) => Number(order.id));
        } else if (body.status === "available") {
            await connection.query("UPDATE shop_supplier_batches SET status = 'available', available_at = COALESCE(available_at, NOW()) WHERE id = ?", [id]);
            const [orders] = await connection.query<RowDataPacket[]>(
                `SELECT id, order_status FROM shop_orders
                 WHERE supplier_batch_id = ? AND payment_status = 'paid'
                   AND order_status IN ('paid', 'sent_to_supplier', 'available_for_pickup')`,
                [id]
            );
            notificationKind = "pickup";
            notificationOrderIds = orders.map((order) => Number(order.id));
            for (const order of orders) {
                if (order.order_status !== "available_for_pickup") {
                    await connection.query("UPDATE shop_orders SET order_status = 'available_for_pickup' WHERE id = ?", [order.id]);
                    await connection.query(
                        `INSERT INTO shop_order_status_history (order_id, old_status, new_status, changed_by, note)
                         VALUES (?, ?, 'available_for_pickup', ?, ?)`,
                        [order.id, order.order_status, session.user?.email || "admin", `Lot disponible au club : ${rows[0].name}`]
                    );
                }
            }
        } else {
            await connection.query("UPDATE shop_supplier_batches SET status = 'cancelled' WHERE id = ?", [id]);
        }
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        if (error instanceof Error && error.message === "BATCH_NOT_FOUND") {
            return NextResponse.json({ error: "Lot introuvable." }, { status: 404 });
        }
        if (error instanceof Error && error.message === "INVALID_TRANSITION") {
            return NextResponse.json({ error: "Ce changement de statut n'est pas autorisé dans l'état actuel du lot." }, { status: 409 });
        }
        return NextResponse.json({ error: "Impossible de modifier le lot." }, { status: 500 });
    } finally { connection.release(); }

    if (!notificationKind || notificationOrderIds.length === 0) {
        return NextResponse.json({ success: true, emails: { sent: 0, failed: 0 } });
    }
    const results = await Promise.allSettled(notificationOrderIds.map((orderId) => sendShopEmail(orderId, notificationKind)));
    const failed = results.filter((result) => result.status === "rejected").length;
    return NextResponse.json({
        success: true,
        emails: { sent: results.length - failed, failed },
        warning: failed ? `${failed} e-mail(s) n'ont pas pu être envoyés. Vous pouvez les réessayer.` : null,
    });
}
