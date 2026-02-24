import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import EventRegistrationClient from "./EventRegistrationClient";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const id = (await params).id;

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT title, description, image_id FROM events WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return {
                title: 'Événement non trouvé',
            };
        }

        const event = rows[0];

        // Construct absolute URL for the image
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seclinbasketclub.fr';
        const imagePath = event.image_id ? `/api/image/${event.image_id}` : '/logo.png';
        const imageUrl = `${baseUrl}${imagePath}`;

        return {
            title: `${event.title} - Seclin Basket Club`,
            description: event.description?.substring(0, 200) || "Événement du Seclin Basket Club",
            openGraph: {
                title: event.title,
                description: event.description?.substring(0, 200) || "Rejoignez-nous pour cet événement !",
                images: [
                    {
                        url: imageUrl,
                        width: 1200,
                        height: 630,
                        alt: event.title,
                    },
                ],
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: event.title,
                description: event.description?.substring(0, 200) || "Rejoignez-nous pour cet événement !",
                images: [imageUrl],
            },
        };
    } catch (error) {
        console.error("Error fetching metadata:", error);
        return {
            title: 'Seclin Basket Club',
        };
    }
}

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

        const [pollOptionRows] = await pool.query<RowDataPacket[]>(
            'SELECT id, option_text FROM event_poll_options WHERE event_id = ?',
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
            helloasso_iframe: event.helloasso_iframe || undefined,
            poll_options: pollOptionRows.map(r => ({ id: r.id, option_text: r.option_text }))
        };

        return <EventRegistrationClient key={eventData.id} event={eventData} />;
    } catch (error) {
        console.error("Error loading event page:", error);
        notFound();
    }
}
