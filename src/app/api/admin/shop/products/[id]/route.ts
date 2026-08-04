import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { cleanProductInput, parsePositiveId } from "@/lib/shop/validation";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getAdminProducts } from "@/lib/shop/admin-products";

async function idFrom(params: Promise<{ id: string }>) {
    return parsePositiveId((await params).id);
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = await idFrom(params);
    if (!id) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    const products = await getAdminProducts();
    const product = products.find((candidate) => candidate.id === id);
    return product ? NextResponse.json({ product }) : NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = await idFrom(params);
    const input = cleanProductInput(await request.json().catch(() => null));
    if (!id || !input) return NextResponse.json({ error: "Données produit invalides." }, { status: 400 });
    try {
        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE shop_products SET name = ?, slug = ?, description = ?, is_active = ?, display_order = ?, collection_id = ?,
                personalization_enabled = ?, personalization_price_cents = ?, personalization_text_enabled = ?,
                personalization_number_enabled = ?, personalization_front_enabled = ?, personalization_back_enabled = ?,
                personalization_text_front_enabled = ?, personalization_text_back_enabled = ?,
                personalization_number_front_enabled = ?, personalization_number_back_enabled = ?
             WHERE id = ?`,
            [input.name, input.slug, input.description, input.isActive ? 1 : 0, input.displayOrder, input.collectionId,
                input.personalizationEnabled ? 1 : 0, input.personalizationPriceCents,
                input.personalizationTextEnabled ? 1 : 0, input.personalizationNumberEnabled ? 1 : 0,
                input.personalizationFrontEnabled ? 1 : 0, input.personalizationBackEnabled ? 1 : 0,
                input.personalizationTextFrontEnabled ? 1 : 0, input.personalizationTextBackEnabled ? 1 : 0,
                input.personalizationNumberFrontEnabled ? 1 : 0, input.personalizationNumberBackEnabled ? 1 : 0, id]
        );
        if (!result.affectedRows) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error && typeof error === "object" && "code" in error) {
            const code = (error as { code?: string }).code;
            if (code === "ER_DUP_ENTRY") return NextResponse.json({ error: "Cet identifiant est déjà utilisé." }, { status: 409 });
            if (code === "ER_NO_REFERENCED_ROW_2") return NextResponse.json({ error: "La collection sélectionnée n'existe plus." }, { status: 409 });
        }
        console.error("Admin shop product update error:", error);
        return NextResponse.json({ error: "Impossible de modifier le produit." }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = await idFrom(params);
    if (!id) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    const [references] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM shop_order_items WHERE product_id = ?", [id]);
    if (Number(references[0]?.count) > 0) {
        await pool.query("UPDATE shop_products SET is_active = 0 WHERE id = ?", [id]);
        return NextResponse.json({ success: true, archived: true });
    }
    const [result] = await pool.query<ResultSetHeader>("DELETE FROM shop_products WHERE id = ?", [id]);
    if (!result.affectedRows) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    return NextResponse.json({ success: true, archived: false });
}
