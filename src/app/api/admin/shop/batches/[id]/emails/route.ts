import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { EmailKind, sendShopEmail } from "@/lib/shop/emails";
import { parsePositiveId } from "@/lib/shop/validation";
import { RowDataPacket } from "mysql2";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const batchId = parsePositiveId((await params).id);
    const body = await request.json().catch(() => null) as { stage?: string } | null;
    if (!batchId || !body?.stage || !["sent", "received", "available"].includes(body.stage)) {
        return NextResponse.json({ error: "Notification invalide." }, { status: 400 });
    }
    const [batches] = await pool.query<RowDataPacket[]>("SELECT status FROM shop_supplier_batches WHERE id = ?", [batchId]);
    if (!batches[0]) return NextResponse.json({ error: "Lot introuvable." }, { status: 404 });
    if (body.stage === "sent" && !["sent", "received", "available"].includes(batches[0].status)) {
        return NextResponse.json({ error: "Le lot n'a pas encore été envoyé." }, { status: 409 });
    }
    if (body.stage === "received" && !["received", "available"].includes(batches[0].status)) {
        return NextResponse.json({ error: "Le lot n'a pas encore été reçu." }, { status: 409 });
    }
    if (body.stage === "available" && batches[0].status !== "available") {
        return NextResponse.json({ error: "Le lot n'est pas encore disponible au club." }, { status: 409 });
    }
    const availabilityFilter = body.stage === "available" ? " AND order_status = 'available_for_pickup'" : "";
    const [orders] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM shop_orders
         WHERE supplier_batch_id = ? AND payment_status = 'paid'${availabilityFilter}`,
        [batchId]
    );
    const kind: EmailKind = body.stage === "sent"
        ? "supplier_sent"
        : body.stage === "received" ? "supplier_received" : "pickup";
    const results = await Promise.allSettled(orders.map((order) => sendShopEmail(Number(order.id), kind)));
    const failed = results.filter((result) => result.status === "rejected").length;
    return NextResponse.json({
        success: failed === 0,
        emails: { processed: results.length, failed },
        warning: failed ? `${failed} e-mail(s) n'ont pas pu être envoyés.` : null,
    }, { status: failed ? 502 : 200 });
}
