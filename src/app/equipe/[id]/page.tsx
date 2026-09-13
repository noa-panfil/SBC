import { Metadata } from 'next';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import EquipeDetailClient from './EquipeDetailClient';
import { permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import { getTeamPath, slugifyTeamName } from '@/lib/teamUrl';

const getTeamData = cache(async (id: string) => {
    const decodedId = decodeURIComponent(id);

    try {
        // 1. Fetch Team
        const [teamRows] = await pool.query<RowDataPacket[]>(
            `SELECT t.id, t.name, t.category, t.widget_id, t.image_id
             FROM teams t
             JOIN seasons s ON s.id = t.season_id
             WHERE t.active = 1 AND s.is_current = 1`
        );

        const team = /^\d+$/.test(decodedId)
            ? teamRows.find((row) => String(row.id) === decodedId)
            : teamRows.find((row) => slugifyTeamName(String(row.name)) === decodedId);

        if (!team) return null;
        const imageUrl = team.image_id ? `/api/image/${team.image_id}?scope=team` : '/logo.png';

        const [trainingSlotRows] = await pool.query<RowDataPacket[]>(
            `SELECT schedule_text
             FROM team_training_slots
             WHERE team_id = ?
             ORDER BY display_order, id`,
            [team.id]
        );

        // 2. Fetch Members
        const [memberRows] = await pool.query<RowDataPacket[]>(
            `SELECT tm.membership_role, tm.jersey_number, p.firstname, p.image_id, p.celebration_image_id
             FROM team_memberships tm
             JOIN persons p ON tm.person_id = p.id
             WHERE tm.team_id = ?
             ORDER BY CASE WHEN tm.membership_role = 'player' THEN 0 ELSE 1 END,
                      tm.jersey_number IS NULL, tm.jersey_number, p.firstname`,
            [team.id]
        );

        const coaches = memberRows
            .filter((member) => member.membership_role !== 'player')
            .map((member) => ({
                firstname: member.firstname,
                name: member.firstname,
                role: member.membership_role === 'assistant_coach' ? 'Coach adjoint' : 'Coach',
                img: member.image_id ? `/api/image/${member.image_id}?scope=person` : null,
                celebrationImg: member.celebration_image_id ? `/api/image/${member.celebration_image_id}?scope=person` : null
            }));

        const players = memberRows
            .filter((member) => member.membership_role === 'player')
            .map((member) => ({
                firstname: member.firstname,
                name: member.firstname,
                num: member.jersey_number,
                img: member.image_id ? `/api/image/${member.image_id}?scope=person` : null,
                celebrationImg: member.celebration_image_id ? `/api/image/${member.celebration_image_id}?scope=person` : null
            }));

        return {
            id: Number(team.id),
            name: team.name,
            category: team.category,
            image: imageUrl,
            trainingSlots: trainingSlotRows.map((slot) => String(slot.schedule_text)),
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
            return `/api/image/${rows[0].value}?scope=setting`;
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

    if (teamData) {
        const canonicalPath = getTeamPath(teamData.name);
        const requestedPath = `/equipe/${decodeURIComponent(id)}`;
        if (requestedPath !== canonicalPath) permanentRedirect(canonicalPath);
    }

    return <EquipeDetailClient team={teamData} logoUrl={logoUrl} />;
}
