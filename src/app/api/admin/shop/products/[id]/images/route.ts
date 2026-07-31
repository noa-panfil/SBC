import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { parsePositiveId } from "@/lib/shop/validation";
import { ResultSetHeader, RowDataPacket } from "mysql2";

function order(value: unknown) {
    return typeof value === "number" && Number.isInteger(value) && Math.abs(value) <= 100000 ? value : null;
}

function imageColor(value: unknown): string | null | undefined {
    if (value == null || value === "") return null;
    if (typeof value !== "string") return undefined;
    const color = value.trim();
    return color && color.length <= 100 ? color : undefined;
}

async function colorExists(connection: Awaited<ReturnType<typeof pool.getConnection>>, productId: number, color: string | null) {
    if (color === null) return true;
    const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT 1 FROM shop_product_variants WHERE product_id = ? AND color = ? LIMIT 1",
        [productId, color]
    );
    return rows.length > 0;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const productId = parsePositiveId((await params).id);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const imageId = parsePositiveId(body?.imageId);
    const displayOrder = order(body?.displayOrder);
    const color = imageColor(body?.color);
    if (!productId || !imageId || displayOrder === null || color === undefined) return NextResponse.json({ error: "Image invalide." }, { status: 400 });
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        if (!await colorExists(connection, productId, color)) {
            await connection.rollback();
            return NextResponse.json({ error: "Cette couleur n'existe pas sur le produit." }, { status: 400 });
        }
        const [sameColorImages] = await connection.query<RowDataPacket[]>(
            "SELECT COUNT(*) AS count FROM shop_product_images WHERE product_id = ? AND color <=> ?",
            [productId, color]
        );
        const isPrimary = body?.isPrimary === true || Number(sameColorImages[0]?.count) === 0;
        if (isPrimary) await connection.query("UPDATE shop_product_images SET is_primary = 0 WHERE product_id = ? AND color <=> ?", [productId, color]);
        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO shop_product_images (product_id, image_id, color, display_order, is_primary) VALUES (?, ?, ?, ?, ?)`,
            [productId, imageId, color, displayOrder, isPrimary ? 1 : 0]
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
    const color = imageColor(body?.color);
    if (!productId || !associationId || displayOrder === null || color === undefined) return NextResponse.json({ error: "Image invalide." }, { status: 400 });
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        if (!await colorExists(connection, productId, color)) {
            await connection.rollback();
            return NextResponse.json({ error: "Cette couleur n'existe pas sur le produit." }, { status: 400 });
        }
        const [sameColorImages] = await connection.query<RowDataPacket[]>(
            "SELECT COUNT(*) AS count FROM shop_product_images WHERE product_id = ? AND color <=> ? AND id <> ?",
            [productId, color, associationId]
        );
        const isPrimary = body?.isPrimary === true || Number(sameColorImages[0]?.count) === 0;
        if (isPrimary) await connection.query("UPDATE shop_product_images SET is_primary = 0 WHERE product_id = ? AND color <=> ?", [productId, color]);
        const [result] = await connection.query<ResultSetHeader>(
            "UPDATE shop_product_images SET color = ?, display_order = ?, is_primary = ? WHERE id = ? AND product_id = ?",
            [color, displayOrder, isPrimary ? 1 : 0, associationId, productId]
        );
        if (!result.affectedRows) {
            await connection.rollback();
            return NextResponse.json({ error: "Image introuvable." }, { status: 404 });
        }
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
