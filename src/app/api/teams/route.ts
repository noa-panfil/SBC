import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    try {
        // 1. Fetch Teams
        const [teamRows] = await pool.query<RowDataPacket[]>(
            `SELECT t.id, t.name, t.category, t.widget_id, t.image_id
             FROM teams t JOIN seasons s ON s.id = t.season_id
             WHERE t.active = 1 AND s.is_current = 1`
        );

        // 2. Fetch All Members
        const [memberRows] = await pool.query<RowDataPacket[]>(
            `SELECT tm.team_id, tm.membership_role, tm.jersey_number, p.firstname,
                    DATE_FORMAT(p.birthdate, '%d/%m') AS birthday, p.gender, p.image_id
       FROM team_memberships tm
       JOIN persons p ON tm.person_id = p.id
       JOIN teams t ON t.id = tm.team_id
       JOIN seasons s ON s.id = t.season_id
       WHERE p.active = 1 AND t.active = 1 AND s.is_current = 1`
        );
        const [trainingSlotRows] = await pool.query<RowDataPacket[]>(
            `SELECT team_id, schedule_text
             FROM team_training_slots
             ORDER BY team_id, display_order, id`
        );

        // 3. Reconstruct JSON Structure
        const teamsData: Record<string, any> = {};

        for (const team of teamRows) {
            // Resolve Image URL
            const imageUrl = team.image_id ? `/api/image/${team.image_id}?scope=team` : '/img/default-team.png';

            const members = memberRows.filter((m: any) => m.team_id === team.id);

            const coaches = members
                .filter((m: any) => m.membership_role !== 'player')
                .map((m: any) => ({
                    name: m.firstname,
                    role: m.membership_role,
                    img: m.image_id ? `/api/image/${m.image_id}?scope=person` : null,
                    birth: m.birthday || null,
                    sexe: m.gender
                }));

            const players = members
                .filter((m: any) => m.membership_role === 'player')
                .map((m: any) => ({
                    name: m.firstname,
                    num: m.jersey_number,
                    img: m.image_id ? `/api/image/${m.image_id}?scope=person` : null,
                    birth: m.birthday || null,
                    sexe: m.gender
                }));

            teamsData[team.id] = {
                name: team.name,
                category: team.category,
                image: imageUrl,
                trainingSlots: trainingSlotRows
                    .filter((slot: any) => Number(slot.team_id) === Number(team.id))
                    .map((slot: any) => String(slot.schedule_text)),
                widgetId: team.widget_id,
                coaches,
                players
            };
        }

        return NextResponse.json(teamsData);
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }
}
