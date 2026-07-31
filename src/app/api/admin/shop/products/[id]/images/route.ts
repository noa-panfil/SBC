import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { parsePositiveId } from "@/lib/shop/validation";
import { ResultSetHeader } from "mysql2";

function order(value: unknown) {
    return typeof value === "number" && Number.isInteger(value) && Math.abs(value) <= 100000 ? value : null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const productId = parsePositiveId((await params).id);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const imageId = parsePositiveId(body?.imageId);
    const displayOrder = order(body?.displayOrder);
    if (!productId || !imageId || displayOrder === null) return NextResponse.json({ error: "Image invalide." }, { status: 400 });
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        if (body?.isPrimary === true) await connection.query("UPDATE shop_product_images SET is_primary = 0 WHERE product_id = ?", [productId]);
        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO shop_product_images (product_id, image_id, display_order, is_primary) VALUES (?, ?, ?, ?)`,
            [productId, imageId, displayOrder, body?.isPrimary === true ? 1 : 0]
        );
        await connection.commit();
        return NextResponse.json({ id: result.insertId }, { status: 201 });
    } catch (error) {
        await connection.rollback();
        if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "ER_DUP_ENTRY") {
            return NextResponse.json({ error: "Cette image est déjà associée au produit." }, { status: 409 });
        }
        return NextResponse.json({ error: "Impossible d'associer l'image." }, { status: 500 });
    } finally { connection.release(); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const productId = parsePositiveId((await params).id);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const associationId = parsePositiveId(body?.associationId);
    const displayOrder = order(body?.displayOrder);
    if (!productId || !associationId || displayOrder === null) return NextResponse.json({ error: "Image invalide." }, { status: 400 });
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        if (body?.isPrimary === true) await connection.query("UPDATE shop_product_images SET is_primary = 0 WHERE product_id = ?", [productId]);
        await connection.query(
            "UPDATE shop_product_images SET display_order = ?, is_primary = ? WHERE id = ? AND product_id = ?",
            [displayOrder, body?.isPrimary === true ? 1 : 0, associationId, productId]
        );
        await connection.commit();
        return NextResponse.json({ success: true });
    } catch {
        await connection.rollback();
        return NextResponse.json({ error: "Impossible de modifier l'image." }, { status: 500 });
    } finally { connection.release(); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const productId = parsePositiveId((await params).id);
    const associationId = parsePositiveId(request.nextUrl.searchParams.get("associationId"));
    if (!productId || !associationId) return NextResponse.json({ error: "Image invalide." }, { status: 400 });
    await pool.query("DELETE FROM shop_product_images WHERE id = ? AND product_id = ?", [associationId, productId]);
    return NextResponse.json({ success: true });
}
