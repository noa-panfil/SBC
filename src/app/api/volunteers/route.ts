
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id, name, DATE_FORMAT(birth_date, '%d/%m/%Y') as birth_date, image, image_id, role FROM volunteers ORDER BY name ASC"
        );
        const volunteers = rows.map((v: any) => ({
            id: v.id,
            name: v.name,
            birth_date: v.birth_date, // Already formatted
            image: v.image_id ? `/api/image/${v.image_id}` : v.image,
            image_id: v.image_id,
            role: v.role
        }));
        return NextResponse.json(volunteers);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, birth_date, image, image_id, role } = body;

        // Convert DD/MM/YYYY to YYYY-MM-DD
        let dbDate = null;
        if (birth_date) {
            const [day, month, year] = birth_date.split('/');
            dbDate = `${year}-${month}-${day}`;
        }

        const [result] = await pool.query(
            'INSERT INTO volunteers (name, birth_date, image, image_id, role) VALUES (?, ?, ?, ?, ?)',
            [name, dbDate, image, image_id || null, role || 'Bénévole']
        );

        return NextResponse.json({ success: true, id: (result as any).insertId });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
