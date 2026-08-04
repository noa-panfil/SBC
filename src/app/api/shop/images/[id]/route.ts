import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/shop/db";
import { parsePositiveId } from "@/lib/shop/validation";

type ImageRow = RowDataPacket & {
    mime_type: string;
    byte_size: number;
    data: Buffer;
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const id = parsePositiveId((await params).id);
    if (!id) return new NextResponse("Image introuvable", { status: 404 });

    try {
        const [rows] = await pool.query<ImageRow[]>(
            "SELECT mime_type, byte_size, data FROM shop_images WHERE id = ?",
            [id]
        );
        const image = rows[0];
        if (!image) return new NextResponse("Image introuvable", { status: 404 });

        return new NextResponse(new Uint8Array(image.data), {
            headers: {
                "Content-Type": image.mime_type,
                "Content-Length": String(image.byte_size),
                "Cache-Control": "public, max-age=31536000, immutable",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error) {
        console.error("Shop image read error:", error);
        return new NextResponse("Erreur interne", { status: 500 });
    }
}
