import { NextResponse } from "next/server";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { getAdminProducts } from "@/lib/shop/admin-products";
import { cleanProductInput } from "@/lib/shop/validation";
import { ResultSetHeader } from "mysql2";
import { isMissingShopTable } from "@/lib/shop/errors";

export async function GET() {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    try {
        return NextResponse.json({ products: await getAdminProducts(), setupRequired: false });
    } catch (error) {
        if (isMissingShopTable(error)) return NextResponse.json({ products: [], setupRequired: true });
        console.error("Admin shop products error:", error);
        return NextResponse.json({ error: "Impossible de charger les produits." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const input = cleanProductInput(await request.json().catch(() => null));
    if (!input) return NextResponse.json({ error: "Données produit invalides." }, { status: 400 });
    try {
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO shop_products (name, slug, description, is_active, display_order, collection_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [input.name, input.slug, input.description, input.isActive ? 1 : 0, input.displayOrder, input.collectionId]
        );
        return NextResponse.json({ id: result.insertId }, { status: 201 });
    } catch (error) {
        if (error && typeof error === "object" && "code" in error) {
            const code = (error as { code?: string }).code;
            if (code === "ER_DUP_ENTRY") return NextResponse.json({ error: "Cet identifiant est déjà utilisé." }, { status: 409 });
            if (code === "ER_NO_REFERENCED_ROW_2") return NextResponse.json({ error: "La collection sélectionnée n'existe plus." }, { status: 409 });
        }
        console.error("Admin shop product create error:", error);
        return NextResponse.json({ error: "Impossible de créer le produit." }, { status: 500 });
    }
}
