import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { parsePositiveId } from "@/lib/shop/validation";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export async function GET() {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT b.id, b.name, b.period_month, b.status, b.created_at, b.sent_at, b.received_at, b.available_at,
                COUNT(o.id) AS order_count, COALESCE(SUM(o.total_cents), 0) AS total_cents
         FROM shop_supplier_batches b LEFT JOIN shop_orders o ON o.supplier_batch_id = b.id
         GROUP BY b.id ORDER BY b.period_month DESC, b.id DESC`
    );
    return NextResponse.json({ batches: rows.map((row) => ({ id: Number(row.id), name: row.name,
        periodMonth: row.period_month, status: row.status, createdAt: row.created_at, sentAt: row.sent_at,
        receivedAt: row.received_at, availableAt: row.available_at,
        orderCount: Number(row.order_count), totalCents: Number(row.total_cents) })) });
}

export async function POST(request: NextRequest) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const body = await request.json().catch(() => null) as { name?: string; periodMonth?: string; orderIds?: unknown[] } | null;
    const name = body?.name?.trim();
    const orderIds = body?.orderIds?.map(parsePositiveId).filter((id): id is number => id !== null) || [];
    if (!name || name.length > 180 || !body?.periodMonth || !/^\d{4}-\d{2}$/.test(body.periodMonth) || !orderIds.length || orderIds.length !== body.orderIds?.length) {
        return NextResponse.json({ error: "Informations du lot invalides." }, { status: 400 });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const placeholders = orderIds.map(() => "?").join(",");
        const [eligible] = await connection.query<RowDataPacket[]>(
            `SELECT id FROM shop_orders WHERE id IN (${placeholders}) AND payment_status = 'paid' AND supplier_batch_id IS NULL FOR UPDATE`, orderIds
        );
        if (eligible.length !== orderIds.length) {
            await connection.rollback(); return NextResponse.json({ error: "Certaines commandes ne sont plus éligibles à ce lot." }, { status: 409 });
        }
        const [result] = await connection.query<ResultSetHeader>(
            "INSERT INTO shop_supplier_batches (name, period_month, status) VALUES (?, ?, 'draft')",
            [name, `${body.periodMonth}-01`]
        );
        await connection.query(`UPDATE shop_orders SET supplier_batch_id = ? WHERE id IN (${placeholders})`, [result.insertId, ...orderIds]);
        for (const orderId of orderIds) {
            await connection.query(
                `INSERT INTO shop_order_status_history (order_id, old_status, new_status, changed_by, note)
                 SELECT id, order_status, order_status, ?, ? FROM shop_orders WHERE id = ?`,
                [session.user?.email || "admin", `Ajout au lot ${name}`, orderId]
            );
        }
        await connection.commit();
        return NextResponse.json({ id: result.insertId }, { status: 201 });
    } catch (error) {
        await connection.rollback();
        if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "ER_DUP_ENTRY") {
            return NextResponse.json({ error: "Ce nom de lot existe déjà." }, { status: 409 });
        }
        console.error("Batch create error:", error);
        return NextResponse.json({ error: "Impossible de créer le lot." }, { status: 500 });
    } finally { connection.release(); }
}
