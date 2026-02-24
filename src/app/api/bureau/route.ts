import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                b.id, b.role, b.display_order,
                COALESCE(p.image_id, v.image_id, NULL) as image_id,
                COALESCE(NULLIF(TRIM(CONCAT(p.lastname, ' ', p.firstname)), ''), v.name) as fullname
             FROM bureau_members b
             LEFT JOIN persons p ON b.person_id = p.id
             LEFT JOIN volunteers v ON b.volunteer_id = v.id
             ORDER BY b.display_order ASC, b.role ASC, p.lastname ASC, v.name ASC`
        );
        return NextResponse.json(rows);
    } catch (e) {
        console.error("Error fetching bureau members:", e);
        return NextResponse.json({ error: "Interal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, role } = body;

        if (!id || !role) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        let person_id = null;
        let volunteer_id = null;

        // Volunteers have negative IDs
        if (id < 0) {
            volunteer_id = Math.abs(id);
        } else {
            person_id = id;
        }

        const [result]: any = await pool.query(
            "INSERT INTO bureau_members (person_id, volunteer_id, role) VALUES (?, ?, ?)",
            [person_id, volunteer_id, role]
        );
        return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
    } catch (e) {
        console.error("Error adding bureau member:", e);
        return NextResponse.json({ error: "Interal Server Error" }, { status: 500 });
    }
}
