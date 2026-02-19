import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import EventRegistrationClient from "./EventRegistrationClient";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id;

    try {
        const [eventRows] = await pool.query<RowDataPacket[]>(
            'SELECT id, title, event_date, date_display, description, location, time_info, mode, image_id, requires_file, helloasso_iframe FROM events WHERE id = ?',
            [id]
        );

        if (eventRows.length === 0) {
            notFound();
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
        let teams: { id: string, name: string }[] = [];
        if (event.mode === 'joueur') {
            const [allTeams] = await pool.query<RowDataPacket[]>(
                'SELECT id, name FROM teams'
            );
            teams = allTeams.map(t => ({ id: t.id.toString(), name: t.name }));
        }

        const date = new Date(event.event_date);
        const imageUrl = event.image_id ? `/api/image/${event.image_id}` : undefined;

        const eventData = {
            id: event.id,
            title: event.title,
            date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            date_display: event.date_display,
            image: imageUrl,
            description: event.description,
            location: event.location,
            time: event.time_info,
            mode: event.mode as any,
            requires_file: event.requires_file === 1,
            allowed_teams: allowedTeamRows.map(r => r.team_id.toString()),
            roles: roleRows.map(r => ({ name: r.role_name, max: r.max_count })),
            available_teams: teams,
            helloasso_iframe: event.helloasso_iframe || undefined
        };

        return <EventRegistrationClient event={eventData} />;
    } catch (error) {
        console.error("Error loading event page:", error);
        notFound();
    }
}
