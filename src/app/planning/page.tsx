import Link from "next/link";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import PlanningList from "./PlanningList";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Planning | Seclin Basket Club',
    description: 'Consultez les dates et horaires des prochains matchs de toutes les équipes du Seclin Basket Club.',
};

export const dynamic = 'force-dynamic';

async function getMatches() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT * FROM otm_matches 
            WHERE match_date >= CURDATE() 
            ORDER BY match_date ASC, match_time ASC 
        `);
        return rows.map(r => ({
            ...r,
            match_date: r.match_date.toISOString(),
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
                <PlanningList matches={matches as any} />
            </main>
        </>
    );
}
