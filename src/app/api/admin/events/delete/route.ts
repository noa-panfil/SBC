import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
    const session = await getServerSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        // Cleanup related tables
        await pool.query('DELETE FROM event_allowed_teams WHERE event_id = ?', [id]);
        await pool.query('DELETE FROM event_roles WHERE event_id = ?', [id]);
        await pool.query('DELETE FROM event_registrations WHERE event_id = ?', [id]);

        // Delete parent event
        await pool.query('DELETE FROM events WHERE id = ?', [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
