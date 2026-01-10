import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id, name, image_id FROM partners ORDER BY display_order ASC, id ASC"
        );

        const partners = rows.map(p => ({
            id: p.id,
            name: p.name,
            img: p.image_id ? `/api/image/${p.image_id}` : null
        }));

        return NextResponse.json(partners);
    } catch (error) {
        console.error("Error fetching partners:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
