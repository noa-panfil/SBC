import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { eventId, lastname, firstname, email, teamName, roleName } = body;

        if (!eventId || !lastname || !firstname || !email) {
            return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
        }

        await pool.query(
            `INSERT INTO event_registrations (event_id, lastname, firstname, email, team_name, role_name)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [eventId, lastname, firstname, email, teamName || null, roleName || null]
        );

        return NextResponse.json({ success: true, message: "Inscription réussie !" });
    } catch (error) {
        console.error("Error registering for event:", error);
        return NextResponse.json({ error: "Erreur lors de l'inscription" }, { status: 500 });
    }
}
