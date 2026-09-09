import Image from "next/image";
import HomeClient from "@/components/HomeClient";
import Link from "next/link";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import HomeMatches from "@/components/HomeMatches";

type HomeMatchRow = RowDataPacket & {
  id: number; match_date: Date; match_time: string; opponent: string; is_featured: number;
  home_away: string; venue: string | null; match_type: string; category: string; team_image_id: number | null;
  team_story_image_id: number | null;
};

export const dynamic = 'force-dynamic';

async function getUpcomingMatches() {
  try {

    const [rows] = await pool.query<HomeMatchRow[]>(`
            SELECT m.id, m.match_date,
                   COALESCE(TIME_FORMAT(m.match_time, '%H:%i'), '') AS match_time,
                   m.opponent, m.is_featured, m.home_away, m.venue,
                   m.competition AS match_type,
                   COALESCE(t.name, t.category, 'Equipe SBC') AS category,
                   t.id AS team_id, t.image_id AS team_image_id,
                   t.story_image_id AS team_story_image_id
            FROM matches m
            LEFT JOIN teams t ON m.team_id = t.id
            WHERE m.match_date >= CURDATE() AND m.status = 'scheduled'
            ORDER BY m.is_featured DESC, m.match_date ASC, m.match_time ASC
            LIMIT 15
        `);

    const validMatches = rows.map(r => ({
      id: Number(r.id), match_time: String(r.match_time || ""), opponent: String(r.opponent), designation: "",
      is_featured: Boolean(r.is_featured), home_away: String(r.home_away), venue: r.venue,
      match_type: String(r.match_type), category: String(r.category),
      team_image_id: r.team_image_id, team_story_image_id: r.team_story_image_id,
      match_date: r.match_date.toISOString(),
      _rawDate: new Date(r.match_date)
    }));

    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    const featuredMatch = validMatches.find(m => Boolean(m.is_featured) && m._rawDate <= oneWeekFromNow) || null;
    const upcomingList = validMatches.filter(m => !m.is_featured).slice(0, 3);


    const result = (featuredMatch ? [featuredMatch, ...upcomingList] : upcomingList).map(m => {
      const matchData = m;
      return {
        ...matchData,
        team_image_url: matchData.team_image_id ? `/api/image/${matchData.team_image_id}?scope=team` : undefined,
        team_story_image_url: matchData.team_story_image_id ? `/api/image/${matchData.team_story_image_id}?scope=team` : undefined,
      };
    });

    return result;

  } catch (e) {
    console.error("Error fetching upcoming matches", e);
    return [];
  }
}

export default async function Home() {
  const logoUrl = "/logo.png";
  let heroUrl = "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1920&auto=format&fit=crop";

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT key_name, value FROM settings WHERE key_name IN ('site_logo_id', 'hero_image_type', 'hero_image_id')"
    );

    const settings: Record<string, string> = {};
    rows.forEach((row) => {
      settings[row.key_name] = row.value;
    });

    /* 
    // Force use of local logo.png
    if (settings.site_logo_id) {
      logoUrl = `/api/image/${settings.site_logo_id}?scope=setting`;
    } 
    */

    if (settings.hero_image_type === 'custom' && settings.hero_image_id) {
      heroUrl = `/api/image/${settings.hero_image_id}?scope=setting`;
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

      <HomeMatches matches={matches} />
      <HomeClient />
    </>
  );
}
