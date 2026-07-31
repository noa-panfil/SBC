import { NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { isMissingShopTable } from "@/lib/shop/errors";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxImageSize = 10 * 1024 * 1024;

export async function GET() {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, name, mime_type, byte_size, created_at
             FROM shop_images ORDER BY id DESC`
        );
        return NextResponse.json(rows.map((row) => ({
            id: Number(row.id),
            name: row.name,
            mime_type: row.mime_type,
            byteSize: Number(row.byte_size),
            createdAt: row.created_at,
        })));
    } catch (error) {
        if (isMissingShopTable(error)) return NextResponse.json([]);
        console.error("Shop images list error:", error);
        return NextResponse.json({ error: "Impossible de charger les images de la boutique." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    try {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Aucune image reçue." }, { status: 400 });
        }
        if (!allowedImageTypes.has(file.type)) {
            return NextResponse.json({ error: "Format non autorisé (JPEG, PNG, WebP ou GIF)." }, { status: 400 });
        }
        if (file.size < 1 || file.size > maxImageSize) {
            return NextResponse.json({ error: "L'image doit peser entre 1 octet et 10 Mo." }, { status: 400 });
        }

        const data = Buffer.from(await file.arrayBuffer());
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO shop_images (name, mime_type, byte_size, data)
             VALUES (?, ?, ?, ?)`,
            [file.name.slice(0, 255), file.type, file.size, data]
        );
        return NextResponse.json({ id: result.insertId }, { status: 201 });
    } catch (error) {
        console.error("Shop image upload error:", error);
        return NextResponse.json({ error: "Impossible d'enregistrer l'image de la boutique." }, { status: 500 });
    }
}
