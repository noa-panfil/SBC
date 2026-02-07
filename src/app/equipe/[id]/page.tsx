import { Metadata } from 'next';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import EquipeDetailClient from './EquipeDetailClient';
import { notFound } from 'next/navigation';
import { cache } from 'react';

const getTeamData = cache(async (id: string) => {
    const decodedId = decodeURIComponent(id);

    try {
        // 1. Fetch Team
        const [teamRows] = await pool.query<RowDataPacket[]>(
            'SELECT id, name, category, schedule, widget_id, image_id FROM teams WHERE id = ?',
            [decodedId]
        );

        if (teamRows.length === 0) {
            return null;
        }

        const team = teamRows[0];
        const imageUrl = team.image_id ? `/api/image/${team.image_id}` : '/img/default-team.png';

        // 2. Fetch Members
        const [memberRows] = await pool.query<RowDataPacket[]>(
            `SELECT tm.role, tm.number, p.firstname, p.lastname, p.image_id
             FROM team_members tm
             JOIN persons p ON tm.person_id = p.id
             WHERE tm.team_id = ?`,
            [decodedId]
        );

        const coaches = memberRows
            .filter((m: any) => m.role.toLowerCase().includes('coach'))
            .map((m: any) => ({
                firstname: m.firstname,
                lastname: m.lastname,
                name: `${m.firstname} ${m.lastname}`, // For compatibility
                role: m.role,
                img: m.image_id ? `/api/image/${m.image_id}` : null
            }));

        const players = memberRows
            .filter((m: any) => !m.role.toLowerCase().includes('coach'))
            .map((m: any) => ({
                firstname: m.firstname,
                lastname: m.lastname,
                name: `${m.firstname} ${m.lastname}`, // For compatibility
                num: m.number,
                img: m.image_id ? `/api/image/${m.image_id}` : null
            }));

        return {
            name: team.name,
            category: team.category,
            image: imageUrl,
            schedule: team.schedule,
            widgetId: team.widget_id,
            coaches,
            players
        };
    } catch (e) {
        console.error("Error fetching team", e);
        return null;
    }
});

async function getLogoUrl() {
    /*
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT value FROM settings WHERE key_name = 'site_logo_id'"
        );
        if (rows.length > 0 && rows[0].value) {
            return `/api/image/${rows[0].value}`;
        }
    } catch (e) { }
    */
    return "/logo.png";
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const team = await getTeamData(id);

    if (!team) {
        return {
            title: 'Équipe introuvable | Seclin Basket Club'
        };
    }

    return {
        title: `${team.name} | Seclin Basket Club`,
        description: `Découvrez l'équipe ${team.name} du Seclin Basket Club : effectif, résultats et planning.`
    };
}

export default async function EquipePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const teamData = await getTeamData(id);
    const logoUrl = await getLogoUrl();

    // If !teamData, client component handles it or we could return notFound() here.
    return <EquipeDetailClient team={teamData} logoUrl={logoUrl} />;
}
