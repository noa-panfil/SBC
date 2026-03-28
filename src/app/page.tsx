import Image from "next/image";
import HomeClient from "@/components/HomeClient";
import Link from "next/link";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import HomeMatches from "@/components/HomeMatches";

export const dynamic = 'force-dynamic';

async function getUpcomingMatches() {
  try {

    const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT o.*, t.id as team_id, t.image_id as team_image_id, t.story_image_id as team_story_image_id
            FROM otm_matches o
            LEFT JOIN teams t ON o.category = t.name
            WHERE o.match_date >= CURDATE() 
            ORDER BY o.is_featured DESC, o.match_date ASC, o.match_time ASC 
            LIMIT 15
        `);

    const validMatches = rows.map(r => ({
      ...r,
      match_date: r.match_date.toISOString(),
      _rawDate: new Date(r.match_date)
    }));

    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    let featuredMatch = validMatches.find(m => (m as any).is_featured && m._rawDate <= oneWeekFromNow) || null;
    let upcomingList = validMatches.filter(m => !(m as any).is_featured).slice(0, 3);


    const result = [featuredMatch, ...upcomingList].map(m => {
      if (!m) return null;
      const { _rawDate, ...rest } = m;
      const matchData = rest as any;
      return {
        ...matchData,
        team_image_url: matchData.team_image_id ? `/api/image/${matchData.team_image_id}` : null,
        team_story_image_url: matchData.team_story_image_id ? `/api/image/${matchData.team_story_image_id}` : null,
      };
    });

    return result;

  } catch (e) {
    console.error("Error fetching upcoming matches", e);
    return [];
  }
}

export default async function Home() {
  let logoUrl = "/logo.png";
  let heroUrl = "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1920&auto=format&fit=crop";

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT key_name, value FROM settings WHERE key_name IN ('site_logo_id', 'hero_image_type', 'hero_image_id')"
    );

    const settings: Record<string, string> = {};
    rows.forEach((row: any) => {
      settings[row.key_name] = row.value;
    });

    /* 
    // Force use of local logo.png
    if (settings.site_logo_id) {
      logoUrl = `/api/image/${settings.site_logo_id}`;
    } 
    */

    if (settings.hero_image_type === 'custom' && settings.hero_image_id) {
      heroUrl = `/api/image/${settings.hero_image_id}`;
    }

  } catch (e) {
    console.error("Error fetching home settings:", e);
  }

  const matches = await getUpcomingMatches();

  return (
    <>
      <header className="relative h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={heroUrl}
            alt="Terrain de basket - Seclin Basket Club"
            fill
            priority
            sizes="100vw"
            quality={100}
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
