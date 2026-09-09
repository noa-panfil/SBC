import { NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { isMissingShopTable } from "@/lib/shop/errors";
import { convertImageToWebp, ImageConversionError } from "@/lib/convertImageToWebp";

const maxImageSize = 10 * 1024 * 1024;
const imageFormats = {
    product: { width: 1200, height: 1200 },
    collection_banner: { width: 1600, height: 300 },
} as const;

export async function GET() {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, name, mime_type, byte_size, purpose, created_at
             FROM shop_images ORDER BY id DESC`
        );
        return NextResponse.json(rows.map((row) => ({
            id: Number(row.id),
            name: row.name,
            mime_type: row.mime_type,
            purpose: row.purpose,
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
        const purpose = formData.get("purpose") === "collection_banner" ? "collection_banner" : "product";
        const requiredSize = imageFormats[purpose];
        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Aucune image reçue." }, { status: 400 });
        }
        const converted = await convertImageToWebp(file, {
            maxInputBytes: maxImageSize,
            expectedWidth: requiredSize.width,
            expectedHeight: requiredSize.height,
        });
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO shop_images (name, mime_type, byte_size, purpose, data)
             VALUES (?, ?, ?, ?, ?)`,
            [converted.name, converted.mimeType, converted.byteSize, purpose, converted.data]
        );
        return NextResponse.json({ id: result.insertId, mimeType: converted.mimeType, byteSize: converted.byteSize }, { status: 201 });
    } catch (error) {
        if (error instanceof ImageConversionError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error("Shop image upload error:", error);
        return NextResponse.json({ error: "Impossible d'enregistrer l'image de la boutique." }, { status: 500 });
    }
}
