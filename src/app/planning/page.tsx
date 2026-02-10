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
        // Fetch Home Matches
        const [homeMatches] = await pool.query<RowDataPacket[]>(`
            SELECT 
                id, 
                match_date, 
                match_time, 
                category, 
                opponent, 
                is_white_jersey, 
                is_featured,
                match_type,
                NULL as location
            FROM otm_matches 
            WHERE match_date >= CURDATE()
        `);

        // Fetch Away Matches
        const [awayMatches] = await pool.query<RowDataPacket[]>(`
            SELECT 
                id, 
                match_date, 
                match_time, 
                category, 
                opponent, 
                NULL as is_white_jersey, 
                NULL as is_featured,
                'Championnat' as match_type,
                location
            FROM external_matches 
            WHERE match_date >= CURDATE()
        `);

        // Combine and format
        const combined = [
            ...(homeMatches as any[]).map(r => ({ ...r, is_home: true })),
            ...(awayMatches as any[]).map(r => ({ ...r, is_home: false }))
        ];

        // Sort by date then time
        combined.sort((a, b) => {
            const dateA = new Date(a.match_date).getTime();
            const dateB = new Date(b.match_date).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return a.match_time.localeCompare(b.match_time);
        });

        return combined.map(r => ({
            ...r,
            match_date: r.match_date instanceof Date ? r.match_date.toISOString() : new Date(r.match_date).toISOString(),
            is_home: r.is_home,
            is_featured: !!r.is_featured,
            is_white_jersey: !!r.is_white_jersey,
            location: r.location || null
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
