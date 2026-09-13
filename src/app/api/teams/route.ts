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
                    DATE_FORMAT(p.birthdate, '%d/%m') AS birthday, p.gender, p.image_id,
                    p.celebration_image_id
       FROM team_memberships tm
       JOIN persons p ON tm.person_id = p.id
       JOIN teams t ON t.id = tm.team_id
       JOIN seasons s ON s.id = t.season_id
       WHERE p.active = 1 AND t.active = 1 AND s.is_current = 1
       ORDER BY tm.team_id,
                CASE WHEN tm.membership_role = 'player' THEN 0 ELSE 1 END,
                tm.jersey_number IS NULL, tm.jersey_number, p.firstname`
        );
        const [trainingSlotRows] = await pool.query<RowDataPacket[]>(
            `SELECT team_id, schedule_text
             FROM team_training_slots
             ORDER BY team_id, display_order, id`
        );

        // 3. Reconstruct JSON Structure
        const teamsData: Record<string, object> = {};

        for (const team of teamRows) {
            // Resolve Image URL
            const imageUrl = team.image_id ? `/api/image/${team.image_id}?scope=team` : '/logo.png';

            const members = memberRows.filter((member) => Number(member.team_id) === Number(team.id));

            const coaches = members
                .filter((member) => member.membership_role !== 'player')
                .map((member) => ({
                    name: member.firstname,
                    role: member.membership_role,
                    img: member.image_id ? `/api/image/${member.image_id}?scope=person` : null,
                    celebrationImg: member.celebration_image_id ? `/api/image/${member.celebration_image_id}?scope=person` : null,
                    birth: member.birthday || null,
                    sexe: member.gender
                }));

            const players = members
                .filter((member) => member.membership_role === 'player')
                .map((member) => ({
                    name: member.firstname,
                    num: member.jersey_number,
                    img: member.image_id ? `/api/image/${member.image_id}?scope=person` : null,
                    celebrationImg: member.celebration_image_id ? `/api/image/${member.celebration_image_id}?scope=person` : null,
                    birth: member.birthday || null,
                    sexe: member.gender
                }));

            teamsData[team.id] = {
                name: team.name,
                category: team.category,
                image: imageUrl,
                trainingSlots: trainingSlotRows
                    .filter((slot) => Number(slot.team_id) === Number(team.id))
                    .map((slot) => String(slot.schedule_text)),
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
