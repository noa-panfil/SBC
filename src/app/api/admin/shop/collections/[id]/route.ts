import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { cleanCollectionInput, parsePositiveId } from "@/lib/shop/validation";

async function idFrom(params: Promise<{ id: string }>) {
    return parsePositiveId((await params).id);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = await idFrom(params);
    const input = cleanCollectionInput(await request.json().catch(() => null));
    if (!id || !input) return NextResponse.json({ error: "Données de collection invalides." }, { status: 400 });
    try {
        if (input.bannerImageId) {
            const [images] = await pool.query<RowDataPacket[]>(
                "SELECT 1 FROM shop_images WHERE id = ? AND purpose = 'collection_banner' LIMIT 1",
                [input.bannerImageId]
            );
            if (!images.length) return NextResponse.json({ error: "Cette image n'est pas une bannière de collection." }, { status: 400 });
        }
        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE shop_collections
             SET name = ?, slug = ?, description = ?, banner_image_id = ?, is_active = ?, display_order = ?
             WHERE id = ?`,
            [input.name, input.slug, input.description, input.bannerImageId, input.isActive ? 1 : 0, input.displayOrder, id]
        );
        if (!result.affectedRows) return NextResponse.json({ error: "Collection introuvable." }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error && typeof error === "object" && "code" in error) {
            const code = (error as { code?: string }).code;
            if (code === "ER_DUP_ENTRY") return NextResponse.json({ error: "Cet identifiant de collection est déjà utilisé." }, { status: 409 });
            if (code === "ER_NO_REFERENCED_ROW_2") return NextResponse.json({ error: "Cette bannière n'existe plus." }, { status: 409 });
        }
        console.error("Admin shop collection update error:", error);
        return NextResponse.json({ error: "Impossible de modifier la collection." }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = await idFrom(params);
    if (!id) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });

    const [counts] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM shop_products WHERE collection_id = ?", [id]);
    const [result] = await pool.query<ResultSetHeader>("DELETE FROM shop_collections WHERE id = ?", [id]);
    if (!result.affectedRows) return NextResponse.json({ error: "Collection introuvable." }, { status: 404 });
    return NextResponse.json({ success: true, detachedProducts: Number(counts[0]?.count || 0) });
}
