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
            "SELECT id, year, title, description, category, image_id, is_highlight, COALESCE(award_level, 'gold') AS award_level FROM palmares ORDER BY year DESC, id DESC"
        );
        return NextResponse.json(rows.map((row) => ({
            id: Number(row.id),
            year: Number(row.year),
            title: String(row.title),
            description: row.description ? String(row.description) : "",
            category: row.category ? String(row.category) : "",
            imageId: row.image_id == null ? null : Number(row.image_id),
            image: row.image_id ? `/api/image/${row.image_id}?scope=palmares` : null,
            isHighlight: Boolean(row.is_highlight),
            awardLevel: ["gold", "silver", "bronze"].includes(row.award_level) ? row.award_level : "gold",
        })));
    } catch (error) {
        console.error("Palmares list error:", error);
        return NextResponse.json({ error: "Chargement du palmarès impossible." }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    if (!await isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const id = body?.id == null ? null : Number(body.id);
    const year = Number(body?.year);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const category = typeof body?.category === "string" ? body.category.trim() : "";
    const imageId = body?.imageId == null ? null : Number(body.imageId);
    const isHighlight = Boolean(body?.isHighlight);
    const awardLevel = ["gold", "silver", "bronze"].includes(body?.awardLevel) ? body.awardLevel : "gold";

    if (!title || title.length > 255 || !Number.isInteger(year) || year < 1900 || year > 2100 ||
        (id !== null && (!Number.isInteger(id) || id < 1)) ||
        (imageId !== null && (!Number.isInteger(imageId) || imageId < 1))) {
        return NextResponse.json({ error: "Données du palmarès invalides. Titre et année valides requis." }, { status: 400 });
    }

    try {
        if (isHighlight) {
            const [countRows] = await pool.query<RowDataPacket[]>(
                "SELECT COUNT(*) AS total FROM palmares WHERE is_highlight = 1 AND (? IS NULL OR id != ?)",
                [id, id]
            );
            if (Number(countRows[0]?.total) >= 3) {
                return NextResponse.json({
                    error: "Limite de 3 pièces maîtresses atteinte (3/3). Décochez d'abord un autre titre avant d'en ajouter un nouveau."
                }, { status: 400 });
            }
        }

        if (imageId !== null) {
            const [images] = await pool.query<RowDataPacket[]>("SELECT id FROM image_palmares WHERE id = ? LIMIT 1", [imageId]);
            if (!images.length) return NextResponse.json({ error: "Image du palmarès introuvable." }, { status: 400 });
        }

        if (id === null) {
            const [result] = await pool.query<ResultSetHeader>(
                "INSERT INTO palmares (year, title, description, category, image_id, is_highlight, award_level) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [year, title, description, category, imageId, isHighlight ? 1 : 0, awardLevel]
            );
            return NextResponse.json({ id: result.insertId }, { status: 201 });
        }

        const [result] = await pool.query<ResultSetHeader>(
            "UPDATE palmares SET year = ?, title = ?, description = ?, category = ?, image_id = ?, is_highlight = ?, award_level = ? WHERE id = ?",
            [year, title, description, category, imageId, isHighlight ? 1 : 0, awardLevel, id]
        );
        if (!result.affectedRows) return NextResponse.json({ error: "Élément du palmarès introuvable." }, { status: 404 });
        return NextResponse.json({ id });
    } catch (error) {
        console.error("Palmares save error:", error);
        return NextResponse.json({ error: "Enregistrement de l'élément du palmarès impossible." }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    if (!await isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const id = Number(request.nextUrl.searchParams.get("id"));
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });

    try {
        const [result] = await pool.query<ResultSetHeader>("DELETE FROM palmares WHERE id = ?", [id]);
        if (!result.affectedRows) return NextResponse.json({ error: "Élément du palmarès introuvable." }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Palmares delete error:", error);
        return NextResponse.json({ error: "Suppression de l'élément du palmarès impossible." }, { status: 500 });
    }
}
