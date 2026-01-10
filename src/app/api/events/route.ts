import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    try {
        const [eventRows] = await pool.query<RowDataPacket[]>(
            'SELECT id, title, event_date, description, location, time_info, mode, image_id FROM events'
        );

        const [allowedTeamRows] = await pool.query<RowDataPacket[]>(
            'SELECT event_id, team_id FROM event_allowed_teams'
        );

        const [roleRows] = await pool.query<RowDataPacket[]>(
            'SELECT event_id, role_name, max_count FROM event_roles'
        );

        const eventsData: Record<string, any> = {};

        for (const event of eventRows) {
            const imageUrl = event.image_id ? `/api/image/${event.image_id}` : null;
            const date = new Date(event.event_date);

            // Allowed teams
            const allowed = allowedTeamRows
                .filter((r: any) => r.event_id === event.id)
                .map((r: any) => r.team_id);

            // Roles
            const roles = roleRows
                .filter((r: any) => r.event_id === event.id)
                .map((r: any) => ({ name: r.role_name, max: r.max_count }));

            eventsData[event.id] = {
                id: event.id, // Add ID to object as well
                title: event.title,
                date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), // approximate "20 Décembre 2025"
                "format-date": date.toLocaleDateString('fr-FR'), // "20/12/2025"
                image: imageUrl,
                description: event.description,
                location: event.location,
                time: event.time_info,
                mode: event.mode,
                allowed_teams: allowed.length > 0 ? allowed : undefined,
                roles: roles.length > 0 ? roles : undefined
            };
        }

        return NextResponse.json(eventsData);
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}
