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
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [variants] = await connection.query<RowDataPacket[]>(
            "SELECT product_id, color FROM shop_product_variants WHERE id = ? FOR UPDATE",
            [id]
        );
        if (!variants[0]) {
            await connection.rollback();
            return NextResponse.json({ error: "Variante introuvable." }, { status: 404 });
        }
        const oldColor = String(variants[0].color);
        const productId = Number(variants[0].product_id);
        await connection.query<ResultSetHeader>(
            `UPDATE shop_product_variants SET sku = ?, size = ?, color = ?, color_hex = ?, price_cents = ?, is_active = ?, display_order = ? WHERE id = ?`,
            [input.sku, input.size, input.color, input.colorHex, input.priceCents, input.isActive ? 1 : 0, input.displayOrder, id]
        );
        await connection.query(
            "UPDATE shop_product_variants SET color_hex = ? WHERE product_id = ? AND color = ?",
            [input.colorHex, productId, input.color]
        );
        if (oldColor !== input.color) {
            const [remaining] = await connection.query<RowDataPacket[]>(
                "SELECT COUNT(*) AS count FROM shop_product_variants WHERE product_id = ? AND color = ?",
                [productId, oldColor]
            );
            if (Number(remaining[0]?.count) === 0) {
                await connection.query(
                    "UPDATE shop_product_images SET color = ? WHERE product_id = ? AND color = ?",
                    [input.color, productId, oldColor]
                );
            }
        }
        await connection.commit();
        return NextResponse.json({ success: true });
    } catch (error) {
        await connection.rollback();
        if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "ER_DUP_ENTRY") {
            return NextResponse.json({ error: "Cette combinaison taille/couleur existe déjà." }, { status: 409 });
        }
        return NextResponse.json({ error: "Impossible de modifier la variante." }, { status: 500 });
    } finally {
        connection.release();
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = parsePositiveId((await params).id);
    if (!id) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [variants] = await connection.query<RowDataPacket[]>("SELECT product_id, color FROM shop_product_variants WHERE id = ? FOR UPDATE", [id]);
        if (!variants[0]) {
            await connection.rollback();
            return NextResponse.json({ error: "Variante introuvable." }, { status: 404 });
        }
        const [references] = await connection.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM shop_order_items WHERE variant_id = ?", [id]);
        if (Number(references[0]?.count) > 0) {
            await connection.rollback();
            return NextResponse.json({ error: "Cette variante est liée à une commande. Désactivez-la plutôt." }, { status: 409 });
        }
        await connection.query<ResultSetHeader>("DELETE FROM shop_product_variants WHERE id = ?", [id]);
        const [remaining] = await connection.query<RowDataPacket[]>(
            "SELECT COUNT(*) AS count FROM shop_product_variants WHERE product_id = ? AND color = ?",
            [variants[0].product_id, variants[0].color]
        );
        if (Number(remaining[0]?.count) === 0) {
            await connection.query(
                "UPDATE shop_product_images SET color = NULL WHERE product_id = ? AND color = ?",
                [variants[0].product_id, variants[0].color]
            );
        }
        await connection.commit();
        return NextResponse.json({ success: true });
    } catch {
        await connection.rollback();
        return NextResponse.json({ error: "Impossible de supprimer la variante." }, { status: 500 });
    } finally {
        connection.release();
    }
}
