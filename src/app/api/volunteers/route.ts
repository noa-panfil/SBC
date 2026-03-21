
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const all = searchParams.get('all') === 'true';
        
        const query = all 
            ? "SELECT id, name, DATE_FORMAT(birth_date, '%d/%m/%Y') as birth_date, image, image_id, role, sexe, display FROM volunteers ORDER BY name ASC"
            : "SELECT id, name, DATE_FORMAT(birth_date, '%d/%m/%Y') as birth_date, image, image_id, role, sexe FROM volunteers WHERE display = 1 ORDER BY name ASC";

        const [rows] = await pool.query<RowDataPacket[]>(query);
        const volunteers = rows.map((v: any) => ({
            id: v.id,
            name: v.name,
            birth_date: v.birth_date, // Already formatted
            image: v.image_id ? `/api/image/${v.image_id}` : v.image,
            image_id: v.image_id,
            role: v.role,
            sexe: v.sexe,
            display: v.display
        }));
        return NextResponse.json(volunteers);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session: any = await getServerSession(authOptions);
        const isAdmin = session?.user?.role === 'admin';

        const body = await request.json();
        const { name, birth_date, image, image_id, role, sexe } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Check if name already exists in volunteers (case insensitive)
        const [existing] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM volunteers WHERE LOWER(name) = LOWER(?)",
            [name.trim()]
        );

        if (existing.length > 0) {
            return NextResponse.json({ success: true, id: existing[0].id, alreadyExists: true });
        }

        const display = isAdmin ? 1 : 0;

        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO volunteers (name, birth_date, image, image_id, role, sexe, display) VALUES (?, STR_TO_DATE(?, '%d/%m/%Y'), ?, ?, ?, ?, ?)",
            [name.trim(), birth_date, image_id ? null : image, image_id || null, role || 'Bénévole', sexe || 'M', display]
        );

        return NextResponse.json({ 
            success: true, 
            id: result.insertId,
            display: display
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
