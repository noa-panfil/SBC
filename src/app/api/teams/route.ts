import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    try {
        // 1. Fetch Teams
        const [teamRows] = await pool.query<RowDataPacket[]>(
            'SELECT id, name, category, schedule, widget_id, image_id FROM teams'
        );

        // 2. Fetch All Members
        const [memberRows] = await pool.query<RowDataPacket[]>(
            `SELECT tm.team_id, tm.role, tm.number, p.firstname, p.lastname, p.birthdate, p.gender, p.image_id
       FROM team_members tm
       JOIN persons p ON tm.person_id = p.id`
        );

        // 3. Reconstruct JSON Structure
        const teamsData: Record<string, any> = {};

        for (const team of teamRows) {
            // Resolve Image URL
            const imageUrl = team.image_id ? `/api/image/${team.image_id}` : '/img/default-team.png';

            const members = memberRows.filter((m: any) => m.team_id === team.id);

            const coaches = members
                .filter((m: any) => m.role.toLowerCase().includes('coach'))
                .map((m: any) => ({
                    person_id: m.person_id, // Added ID for editing
                    name: m.firstname,
                    lastname: m.lastname,
                    role: m.role,
                    img: m.image_id ? `/api/image/${m.image_id}` : null,
                    birth: m.birthdate ? new Date(m.birthdate).toLocaleDateString('fr-FR') : null,
                    sexe: m.gender
                }));

            const players = members
                .filter((m: any) => !m.role.toLowerCase().includes('coach'))
                .map((m: any) => ({
                    person_id: m.person_id, // Added ID for editing
                    name: m.firstname,
                    lastname: m.lastname,
                    num: m.number,
                    img: m.image_id ? `/api/image/${m.image_id}` : null,
                    birth: m.birthdate ? new Date(m.birthdate).toLocaleDateString('fr-FR') : null,
                    sexe: m.gender
                }));

            teamsData[team.id] = {
                name: team.name,
                category: team.category,
                image: imageUrl,
                schedule: team.schedule,
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
