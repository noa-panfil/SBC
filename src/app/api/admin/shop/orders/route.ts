import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { RowDataPacket } from "mysql2";
import { SHOP_ORDER_STATUSES } from "@/types/shop";

export async function GET(request: NextRequest) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 150) || "";
    const status = request.nextUrl.searchParams.get("status") || "";
    const month = request.nextUrl.searchParams.get("month") || "";
    const batch = request.nextUrl.searchParams.get("batch") || "";
    const payment = request.nextUrl.searchParams.get("payment") || "";
    const where: string[] = [];
    const values: Array<string | number> = [];
    if (search) {
        where.push("(o.order_number LIKE ? OR o.customer_first_name LIKE ? OR o.customer_last_name LIKE ? OR o.customer_email LIKE ?)");
        const pattern = `%${search}%`;
        values.push(pattern, pattern, pattern, pattern);
    }
    if (SHOP_ORDER_STATUSES.includes(status as (typeof SHOP_ORDER_STATUSES)[number])) {
        where.push("o.order_status = ?"); values.push(status);
    }
    if (/^\d{4}-\d{2}$/.test(month)) {
        where.push("DATE_FORMAT(o.created_at, '%Y-%m') = ?"); values.push(month);
    }
    if (/^\d+$/.test(batch)) {
        where.push("o.supplier_batch_id = ?"); values.push(Number(batch));
    } else if (batch === "none") {
        where.push("o.supplier_batch_id IS NULL");
    }
    if (["pending", "paid", "failed", "expired", "refunded", "partially_refunded"].includes(payment)) {
        where.push("o.payment_status = ?"); values.push(payment);
    }
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT o.id, o.order_number, o.customer_first_name, o.customer_last_name, o.customer_email,
                    o.customer_phone, o.total_cents, o.currency, o.payment_status, o.order_status,
                    o.supplier_batch_id, b.name AS batch_name, o.paid_at, o.created_at,
                    o.customer_email_status, o.office_email_status, o.pickup_email_status
             FROM shop_orders o LEFT JOIN shop_supplier_batches b ON b.id = o.supplier_batch_id
             ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
             ORDER BY o.created_at DESC LIMIT 250`, values
        );
        return NextResponse.json({ orders: rows.map((row) => ({
            id: Number(row.id), number: row.order_number, firstName: row.customer_first_name,
            lastName: row.customer_last_name, email: row.customer_email, phone: row.customer_phone,
            totalCents: row.total_cents, currency: row.currency, paymentStatus: row.payment_status,
            orderStatus: row.order_status, batchId: row.supplier_batch_id ? Number(row.supplier_batch_id) : null,
            batchName: row.batch_name, paidAt: row.paid_at, createdAt: row.created_at,
            customerEmailStatus: row.customer_email_status, officeEmailStatus: row.office_email_status,
            pickupEmailStatus: row.pickup_email_status,
        })) });
    } catch (error) {
        console.error("Admin shop orders error:", error);
        return NextResponse.json({ error: "Impossible de charger les commandes." }, { status: 500 });
    }
}
