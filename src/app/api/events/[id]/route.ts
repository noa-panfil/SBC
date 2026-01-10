import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;

        const [eventRows] = await pool.query<RowDataPacket[]>(
            'SELECT id, title, event_date, date_display, description, location, time_info, mode, image_id FROM events WHERE id = ?',
            [id]
        );

        if (eventRows.length === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const event = eventRows[0];

        const [allowedTeamRows] = await pool.query<RowDataPacket[]>(
            'SELECT team_id FROM event_allowed_teams WHERE event_id = ?',
            [id]
        );

        const [roleRows] = await pool.query<RowDataPacket[]>(
            'SELECT role_name, max_count FROM event_roles WHERE event_id = ?',
            [id]
        );

        // Fetch teams if mode is joueur
        let teams: any[] = [];
        if (event.mode === 'joueur') {
            const [allTeams] = await pool.query<RowDataPacket[]>(
                'SELECT id, name FROM teams'
            );
            teams = allTeams;
        }

        const imageUrl = event.image_id ? `/api/image/${event.image_id}` : null;
        const date = new Date(event.event_date);

        const eventData = {
            id: event.id,
            title: event.title,
            date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            "format-date": date.toLocaleDateString('fr-FR'),
            date_display: event.date_display,
            image: imageUrl,
            description: event.description,
            location: event.location,
            time: event.time_info,
            mode: event.mode,
            allowed_teams: allowedTeamRows.map(r => r.team_id),
            roles: roleRows.map(r => ({ name: r.role_name, max: r.max_count })),
            available_teams: teams
        };

        return NextResponse.json(eventData);
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
    }
}
