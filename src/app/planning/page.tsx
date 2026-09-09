import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import PlanningList from "./PlanningList";
import { Metadata } from 'next';

type CalendarMatchRow = RowDataPacket & {
    id: number; match_date: Date; match_time: string; category: string; opponent: string;
    is_featured: number; match_type: string; location: string | null; home_away: string;
};

export const metadata: Metadata = {
    title: 'Planning | Seclin Basket Club',
    description: 'Consultez les dates et horaires des prochains matchs de toutes les équipes du Seclin Basket Club.',
};

export const dynamic = 'force-dynamic';

async function getMatches() {
    try {
        const [rows] = await pool.query<CalendarMatchRow[]>(`
            SELECT m.id, m.match_date,
                   COALESCE(TIME_FORMAT(m.match_time, '%H:%i'), '') AS match_time,
                   COALESCE(t.name, t.category, 'Equipe SBC') AS category,
                   m.opponent, m.is_featured,
                   m.competition AS match_type, m.venue AS location,
                   m.home_away
            FROM matches m
            LEFT JOIN teams t ON t.id = m.team_id
            WHERE m.match_date >= CURDATE()
              AND m.status = 'scheduled'
              AND m.opponent NOT LIKE '%Exempt%'
            ORDER BY m.match_date, m.match_time, m.id
        `);

        return rows.map(r => ({
            id: Number(r.id), match_time: String(r.match_time || ""), category: String(r.category),
            designation: "", match_type: String(r.match_type), opponent: String(r.opponent),
            match_date: r.match_date instanceof Date ? r.match_date.toISOString() : new Date(r.match_date).toISOString(),
            is_home: r.home_away === 'home',
            is_featured: !!r.is_featured,
            is_white_jersey: false,
            location: r.location || undefined
        }));

    } catch (e) {
        console.error("Error fetching matches", e);
        return [];
    }
}

export default async function PlanningPage() {
    const matches = await getMatches();

    return (
        <>
            <header className="bg-white py-12 shadow-sm text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-sbc-dark mb-4 uppercase tracking-wide">Planning du Club</h1>
                    <p className="text-gray-600">Le calendrier officiel des matchs du Seclin Basket Club.</p>
                </div>
                <i className="fas fa-calendar-alt absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl text-gray-100 -z-0"></i>
            </header>

            <main className="container mx-auto px-4 py-12 min-h-[60vh]">
                <PlanningList matches={matches} />
            </main>
        </>
    );
}
