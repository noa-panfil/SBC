import Image from "next/image";
import HomeClient from "@/components/HomeClient";
import Link from "next/link";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import HomeMatches from "@/components/HomeMatches";

async function getUpcomingMatches() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT * FROM otm_matches 
            WHERE match_date >= CURDATE() 
            ORDER BY is_featured DESC, match_date ASC, match_time ASC 
            LIMIT 6
        `);
    return rows.map(r => ({
      ...r,
      match_date: r.match_date.toISOString(),
    }));
  } catch (e) {
    console.error("Error fetching upcoming matches", e);
    return [];
  }
}

export default async function Home() {
  let logoUrl = "/img/logo.png";
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT value FROM settings WHERE key_name = 'site_logo_id'"
    );
    if (rows.length > 0) {
      logoUrl = `/api/image/${rows[0].value}`;
    }
  } catch (e) {
    console.error("Error fetching home logo:", e);
  }

  const matches = await getUpcomingMatches();

  return (
    <>
      <header className="relative h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1920&auto=format&fit=crop"
            alt="Terrain de basket - Seclin Basket Club"
            fill
            priority
            sizes="100vw"
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl fade-in">
          <Image
            src={logoUrl}
            alt="Logo Seclin Basket Club - SBC"
            width={128}
            height={128}
            className="h-32 w-auto mx-auto mb-6 drop-shadow-lg"
          />
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6">SECLIN <span className="text-sbc-light">BASKET</span> CLUB</h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">Rejoignez la passion verte et blanche.</p>
          <Link href="/equipes"
            className="bg-sbc hover:bg-sbc-light text-white px-8 py-4 rounded-full font-bold text-lg transition transform hover:scale-105 shadow-xl inline-block">
            Voir les équipes
          </Link>
        </div>
      </header>

      <HomeMatches matches={matches as any} />
      <HomeClient />
    </>
  );
}
