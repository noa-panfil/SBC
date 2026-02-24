import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const eventId = formData.get('eventId') as string;
        const lastname = formData.get('lastname') as string;
        const firstname = formData.get('firstname') as string;
        const email = formData.get('email') as string;
        const teamName = formData.get('teamName') as string | null;
        const roleName = formData.get('roleName') as string | null;
        const pollOptionId = formData.get('pollOptionId') as string | null;
        const mode = formData.get('mode') as string | null;
        const file = formData.get('file') as File | null;

        if (!eventId || !lastname || !firstname || !email) {
            return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
        }

        let fileData: Buffer | null = null;
        let fileName: string | null = null;
        let fileMime: string | null = null;

        if (file) {
            if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
                return NextResponse.json({ error: "Format de fichier invalide. Seuls PNG et JPG sont acceptés." }, { status: 400 });
            }
            const arrayBuffer = await file.arrayBuffer();
            fileData = Buffer.from(arrayBuffer);
            fileName = file.name;
            fileMime = file.type;
        }

        if (mode === 'sondage' && pollOptionId) {
            await pool.query(
                `INSERT INTO event_poll_votes (event_id, option_id, firstname, lastname)
                 VALUES (?, ?, ?, ?)`,
                [eventId, pollOptionId, firstname, lastname]
            );
        } else {
            await pool.query(
                `INSERT INTO event_registrations (event_id, lastname, firstname, email, team_name, role_name, file_name, file_mime_type, file_data)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [eventId, lastname, firstname, email, teamName || null, roleName || null, fileName, fileMime, fileData]
            );
        }

        return NextResponse.json({ success: true, message: "Inscription réussie !" });
    } catch (error) {
        console.error("Error registering for event:", error);
        return NextResponse.json({ error: "Erreur lors de l'inscription" }, { status: 500 });
    }
}
