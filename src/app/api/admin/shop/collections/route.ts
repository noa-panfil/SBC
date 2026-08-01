import { NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { isMissingShopTable } from "@/lib/shop/errors";
import { cleanCollectionInput } from "@/lib/shop/validation";

type CollectionRow = RowDataPacket & {
    id: number;
    name: string;
    slug: string;
    description: string;
    banner_image_id: number | null;
    is_active: number;
    display_order: number;
    product_count: number;
};

export async function GET() {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    try {
        const [rows] = await pool.query<CollectionRow[]>(
            `SELECT c.id, c.name, c.slug, c.description, c.banner_image_id, c.is_active, c.display_order,
                    COUNT(p.id) AS product_count
             FROM shop_collections c
             LEFT JOIN shop_products p ON p.collection_id = c.id
             GROUP BY c.id, c.name, c.slug, c.description, c.banner_image_id, c.is_active, c.display_order
             ORDER BY c.display_order, c.id`
        );
        return NextResponse.json({
            collections: rows.map((row) => ({
                id: Number(row.id), name: row.name, slug: row.slug, description: row.description,
                bannerImageId: row.banner_image_id == null ? null : Number(row.banner_image_id),
                bannerImageUrl: row.banner_image_id == null ? null : `/api/shop/images/${row.banner_image_id}`,
                isActive: Boolean(row.is_active), displayOrder: row.display_order,
                productCount: Number(row.product_count),
            })),
            setupRequired: false,
        });
    } catch (error) {
        if (isMissingShopTable(error)) return NextResponse.json({ collections: [], setupRequired: true });
        console.error("Admin shop collections error:", error);
        return NextResponse.json({ error: "Impossible de charger les collections." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const input = cleanCollectionInput(await request.json().catch(() => null));
    if (!input) return NextResponse.json({ error: "Données de collection invalides." }, { status: 400 });
    try {
        if (input.bannerImageId) {
            const [images] = await pool.query<RowDataPacket[]>(
                "SELECT 1 FROM shop_images WHERE id = ? AND purpose = 'collection_banner' LIMIT 1",
                [input.bannerImageId]
            );
            if (!images.length) return NextResponse.json({ error: "Cette image n'est pas une bannière de collection." }, { status: 400 });
        }
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO shop_collections (name, slug, description, banner_image_id, is_active, display_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [input.name, input.slug, input.description, input.bannerImageId, input.isActive ? 1 : 0, input.displayOrder]
        );
        return NextResponse.json({ id: result.insertId }, { status: 201 });
    } catch (error) {
        if (error && typeof error === "object" && "code" in error) {
            const code = (error as { code?: string }).code;
            if (code === "ER_DUP_ENTRY") return NextResponse.json({ error: "Cet identifiant de collection est déjà utilisé." }, { status: 409 });
            if (code === "ER_NO_REFERENCED_ROW_2") return NextResponse.json({ error: "Cette bannière n'existe plus." }, { status: 409 });
        }
        console.error("Admin shop collection create error:", error);
        return NextResponse.json({ error: "Impossible de créer la collection." }, { status: 500 });
    }
}
