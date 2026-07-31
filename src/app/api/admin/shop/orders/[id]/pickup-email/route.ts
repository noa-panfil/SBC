import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { parsePositiveId } from "@/lib/shop/validation";
import { sendShopEmail } from "@/lib/shop/emails";
import { RowDataPacket } from "mysql2";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = parsePositiveId((await params).id);
    if (!id) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    const [orders] = await pool.query<RowDataPacket[]>("SELECT order_status, payment_status FROM shop_orders WHERE id = ?", [id]);
    if (!orders[0]) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    if (orders[0].payment_status !== "paid" || orders[0].order_status !== "available_for_pickup") {
        return NextResponse.json({ error: "La commande doit être payée et marquée disponible avant l'envoi." }, { status: 409 });
    }
    try {
        await sendShopEmail(id, "pickup");
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Pickup email error:", error);
        return NextResponse.json({ error: "L'e-mail n'a pas pu être envoyé. Vous pouvez réessayer." }, { status: 502 });
    }
}
