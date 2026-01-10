import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
    try {
        const { eventId } = await request.json();

        if (!eventId) {
            return NextResponse.json({ error: "Missing Event ID" }, { status: 400 });
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, lastname, firstname, email, team_name, role_name, created_at 
             FROM event_registrations 
             WHERE event_id = ? 
             ORDER BY created_at DESC`,
            [eventId]
        );

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching registrations:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
