import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { cleanVariantInput, parsePositiveId } from "@/lib/shop/validation";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = parsePositiveId((await params).id);
    const input = cleanVariantInput(await request.json().catch(() => null));
    if (!id || !input) return NextResponse.json({ error: "Données de variante invalides." }, { status: 400 });
    try {
        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE shop_product_variants SET sku = ?, size = ?, color = ?, price_cents = ?, is_active = ?, display_order = ? WHERE id = ?`,
            [input.sku, input.size, input.color, input.priceCents, input.isActive ? 1 : 0, input.displayOrder, id]
        );
        if (!result.affectedRows) return NextResponse.json({ error: "Variante introuvable." }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "ER_DUP_ENTRY") {
            return NextResponse.json({ error: "Cette combinaison taille/couleur existe déjà." }, { status: 409 });
        }
        return NextResponse.json({ error: "Impossible de modifier la variante." }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = parsePositiveId((await params).id);
    if (!id) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    const [references] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM shop_order_items WHERE variant_id = ?", [id]);
    if (Number(references[0]?.count) > 0) return NextResponse.json({ error: "Cette variante est liée à une commande. Désactivez-la plutôt." }, { status: 409 });
    const [result] = await pool.query<ResultSetHeader>("DELETE FROM shop_product_variants WHERE id = ?", [id]);
    if (!result.affectedRows) return NextResponse.json({ error: "Variante introuvable." }, { status: 404 });
    return NextResponse.json({ success: true });
}
