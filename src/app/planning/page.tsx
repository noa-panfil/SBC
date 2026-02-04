import Link from "next/link";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import PlanningList from "./PlanningList";

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
        <div className="min-h-screen bg-gray-900 text-white selection:bg-sbc selection:text-white">
            <header className="fixed top-0 w-full z-50 bg-gray-900/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:border-sbc transition-colors">
                            <i className="fas fa-arrow-left text-sm group-hover:text-sbc transition-colors"></i>
                        </div>
                        <span className="font-bold uppercase tracking-widest text-xs hidden sm:block text-gray-400 group-hover:text-white transition-colors">Retour accueil</span>
                    </Link>
                    <h1 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase">
                        SBC <span className="text-sbc">PLANNING</span>
                    </h1>
                </div>
            </header>

            <main className="pt-32 pb-20 container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12 text-center relative">
                        <h2 className="text-5xl md:text-8xl font-black text-white/5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap blur-sm select-none">
                            CALENDRIER
                        </h2>
                        <h2 className="text-3xl md:text-5xl font-black relative z-10 italic uppercase">
                            Prochains <span className="text-sbc">rendez-vous</span>
                        </h2>
                        <p className="mt-4 text-gray-400 font-mono text-sm uppercase tracking-widest relative z-10">
                            Supportez vos équipes préférées
                        </p>
                    </div>

                    <PlanningList matches={matches} />
                </div>
            </main>

            <footer className="py-8 border-t border-white/5 text-center text-gray-600 text-xs uppercase tracking-widest">
                &copy; {new Date().getFullYear()} Seclin Basket Club
            </footer>
        </div>
    );
}
