import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { cleanVariantInput, parsePositiveId } from "@/lib/shop/validation";
import { ResultSetHeader } from "mysql2";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const productId = parsePositiveId((await params).id);
    const rawBody = await request.json().catch(() => null);
    if (!productId || !rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
        return NextResponse.json({ error: "Données de variante invalides." }, { status: 400 });
    }
    const body = rawBody as Record<string, unknown>;
    const rawSizes = Array.isArray(body.sizes) ? body.sizes : [body.size];
    const sizes = rawSizes
        .map((size) => typeof size === "string" ? size.trim() : "")
        .filter(Boolean);
    const uniqueSizes = sizes.filter((size, index) =>
        sizes.findIndex((candidate) => candidate.toLocaleLowerCase("fr-FR") === size.toLocaleLowerCase("fr-FR")) === index
    );
    if (!uniqueSizes.length || uniqueSizes.length > 30) {
        return NextResponse.json({ error: "Sélectionnez entre 1 et 30 tailles." }, { status: 400 });
    }
    if (uniqueSizes.length > 1 && typeof body.sku === "string" && body.sku.trim()) {
        return NextResponse.json({ error: "Ajoutez les références SKU séparément après la création des tailles." }, { status: 400 });
    }
    const inputs = uniqueSizes.map((size, index) => cleanVariantInput({
        ...body,
        size,
        sku: uniqueSizes.length === 1 ? body.sku : "",
        displayOrder: typeof body.displayOrder === "number" ? body.displayOrder + index : index,
    }));
    if (inputs.some((input) => !input)) {
        return NextResponse.json({ error: "Une taille ou une autre donnée de variante est invalide." }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const ids: number[] = [];
        for (const input of inputs) {
            if (!input) continue;
            const [result] = await connection.query<ResultSetHeader>(
                `INSERT INTO shop_product_variants (product_id, sku, size, color, color_hex, price_cents, is_active, display_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [productId, input.sku, input.size, input.color, input.colorHex, input.priceCents, input.isActive ? 1 : 0, input.displayOrder]
            );
            ids.push(result.insertId);
        }
        await connection.commit();
        return NextResponse.json({ id: ids[0], ids, created: ids.length }, { status: 201 });
    } catch (error) {
        await connection.rollback();
        if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "ER_DUP_ENTRY") {
            return NextResponse.json({ error: "Une des combinaisons taille/couleur existe déjà. Aucune taille n'a été ajoutée." }, { status: 409 });
        }
        console.error("Admin shop variant create error:", error);
        return NextResponse.json({ error: "Impossible de créer la variante." }, { status: 500 });
    } finally {
        connection.release();
    }
}
