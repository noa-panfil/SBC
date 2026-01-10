import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT id, year, title, description, category, image_id, is_highlight FROM palmares ORDER BY year DESC'
        );

        const data = rows.map((row: any) => ({
            id: row.id,
            year: row.year,
            title: row.title,
            description: row.description,
            category: row.category,
            image: row.image_id ? `/api/image/${row.image_id}` : null,
            is_highlight: Boolean(row.is_highlight)
        }));

        return NextResponse.json(data);
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch palmares' }, { status: 500 });
    }
}
