import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

async function isAdmin() {
    const session = await getServerSession(authOptions);
    return session?.user?.role === "admin";
}

export async function GET() {
    if (!await isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id, name, image_id, display_order, active FROM partners ORDER BY display_order ASC, id ASC"
        );
        return NextResponse.json(rows.map((row) => ({
            id: Number(row.id),
            name: String(row.name),
            imageId: row.image_id == null ? null : Number(row.image_id),
            image: row.image_id ? `/api/image/${row.image_id}?scope=partner` : null,
            displayOrder: Number(row.display_order),
            active: Boolean(row.active),
        })));
    } catch (error) {
        console.error("Partner list error:", error);
        return NextResponse.json({ error: "Chargement des partenaires impossible." }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    if (!await isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const id = body?.id == null ? null : Number(body.id);
    const imageId = body?.imageId == null ? null : Number(body.imageId);
    const requestedOrder = Number(body?.displayOrder);
    const displayOrder = Number.isInteger(requestedOrder) && requestedOrder >= 0 ? requestedOrder : 0;

    if (!name || name.length > 255 || (id !== null && (!Number.isInteger(id) || id < 1)) ||
        (imageId !== null && (!Number.isInteger(imageId) || imageId < 1))) {
        return NextResponse.json({ error: "Données partenaire invalides." }, { status: 400 });
    }

    try {
        if (imageId !== null) {
            const [images] = await pool.query<RowDataPacket[]>("SELECT id FROM image_partners WHERE id = ? LIMIT 1", [imageId]);
            if (!images.length) return NextResponse.json({ error: "Image partenaire introuvable." }, { status: 400 });
        }

        if (id === null) {
            const [result] = await pool.query<ResultSetHeader>(
                "INSERT INTO partners (name, image_id, display_order, active) VALUES (?, ?, ?, ?)",
                [name, imageId, displayOrder, body.active === false ? 0 : 1]
            );
            return NextResponse.json({ id: result.insertId }, { status: 201 });
        }

        const [result] = await pool.query<ResultSetHeader>(
            "UPDATE partners SET name = ?, image_id = ?, display_order = ?, active = ? WHERE id = ?",
            [name, imageId, displayOrder, body.active ? 1 : 0, id]
        );
        if (!result.affectedRows) return NextResponse.json({ error: "Partenaire introuvable." }, { status: 404 });
        return NextResponse.json({ id });
    } catch (error) {
        console.error("Partner save error:", error);
        return NextResponse.json({ error: "Enregistrement du partenaire impossible." }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    if (!await isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const id = Number(request.nextUrl.searchParams.get("id"));
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });

    try {
        const [result] = await pool.query<ResultSetHeader>("DELETE FROM partners WHERE id = ?", [id]);
        if (!result.affectedRows) return NextResponse.json({ error: "Partenaire introuvable." }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Partner delete error:", error);
        return NextResponse.json({ error: "Suppression du partenaire impossible." }, { status: 500 });
    }
}