import { NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { isMissingShopTable } from "@/lib/shop/errors";

const maxImageSize = 10 * 1024 * 1024;
const requiredImageSize = 1200;

function jpegDimensions(data: Buffer): { width: number; height: number } | null {
    if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return null;
    const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
    let offset = 2;
    while (offset + 8 < data.length) {
        if (data[offset] !== 0xff) {
            offset += 1;
            continue;
        }
        const marker = data[offset + 1];
        offset += 2;
        if (marker === 0xd8 || marker === 0x01) continue;
        if (marker === 0xd9 || marker === 0xda || offset + 2 > data.length) break;
        const segmentLength = data.readUInt16BE(offset);
        if (segmentLength < 2 || offset + segmentLength > data.length) return null;
        if (startOfFrameMarkers.has(marker)) {
            return { height: data.readUInt16BE(offset + 3), width: data.readUInt16BE(offset + 5) };
        }
        offset += segmentLength;
    }
    return null;
}

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
        if (file.type !== "image/jpeg") {
            return NextResponse.json({ error: "L'image doit être validée avec l'outil de recadrage." }, { status: 400 });
        }
        if (file.size < 1 || file.size > maxImageSize) {
            return NextResponse.json({ error: "L'image doit peser entre 1 octet et 10 Mo." }, { status: 400 });
        }

        const data = Buffer.from(await file.arrayBuffer());
        const dimensions = jpegDimensions(data);
        if (!dimensions || dimensions.width !== requiredImageSize || dimensions.height !== requiredImageSize) {
            return NextResponse.json({ error: `L'image finale doit mesurer exactement ${requiredImageSize} × ${requiredImageSize} px.` }, { status: 400 });
        }
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
