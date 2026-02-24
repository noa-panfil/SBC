import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
    const session = await getServerSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const { eventId } = await request.json();

        if (!eventId) {
            return NextResponse.json({ error: "Missing Event ID" }, { status: 400 });
        }

        const [eventRows] = await pool.query<RowDataPacket[]>(
            `SELECT mode FROM events WHERE id = ?`,
            [eventId]
        );

        if (eventRows.length === 0) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const mode = eventRows[0].mode;

        if (mode === 'sondage') {
            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT v.id, v.lastname, v.firstname, v.created_at, o.option_text as poll_option_text 
                 FROM event_poll_votes v
                 JOIN event_poll_options o ON v.option_id = o.id
                 WHERE v.event_id = ? 
                 ORDER BY v.created_at DESC`,
                [eventId]
            );
            return NextResponse.json(rows);
        } else {
            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT id, lastname, firstname, email, team_name, role_name, file_name, file_mime_type, created_at 
                 FROM event_registrations 
                 WHERE event_id = ? 
                 ORDER BY created_at DESC`,
                [eventId]
            );
            return NextResponse.json(rows);
        }
    } catch (error) {
        console.error("Error fetching registrations:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
