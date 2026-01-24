import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Link from "next/link";
import CoachOTMManager from "./CoachOTMManager";
import CoachSettings from "./CoachSettings";
import InstallPWA from "@/components/InstallPWA";

async function getCoachTeams(personId: number) {
    if (!personId) return [];
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT t.id, t.name, t.category, t.image_id, tm.role
            FROM teams t
            JOIN team_members tm ON t.id = tm.team_id
            WHERE tm.person_id = ? AND tm.role LIKE '%Coach%'
            ORDER BY t.name
        `, [personId]);
        return rows;
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function getMyPlayersCount(teamIds: number[]) {
    if (teamIds.length === 0) return 0;
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT COUNT(DISTINCT person_id) as count 
            FROM team_members 
            WHERE team_id IN (?) AND role NOT LIKE '%Coach%'
        `, [teamIds]);
        return rows[0].count;
    } catch (e) {
        console.error(e);
        return 0;
    }
}

async function getMyPlayers(teamIds: number[]) {
    if (teamIds.length === 0) return [];
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT p.id, p.firstname, p.lastname, p.image_id, t.name as team_name
            FROM persons p
            JOIN team_members tm ON p.id = tm.person_id
            JOIN teams t ON tm.team_id = t.id
            WHERE tm.team_id IN (?) AND tm.role NOT LIKE '%Coach%'
            ORDER BY p.lastname, p.firstname
        `, [teamIds]);
        return rows.map((r: any) => ({
            id: r.id,
            fullname: `${r.lastname.toUpperCase()} ${r.firstname}`,
            team: r.team_name,
            image_id: r.image_id
        }));
    } catch (e) {
        console.error("Error fetching players", e);
        return [];
    }
}

async function getOtmMatches(days?: number) {
    try {
        let query = `SELECT * FROM otm_matches`;
        const params: any[] = [];

        if (days) {
            query += ` WHERE match_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 2 DAY) AND DATE_ADD(CURDATE(), INTERVAL ? DAY)`;
            params.push(days);
        }

        query += ` ORDER BY match_date ASC, match_time ASC`;

        const [rows] = await pool.query<RowDataPacket[]>(query, params);
        return rows.map((row: any) => ({
            ...row,
            match_date: row.match_date.toISOString(),
            created_at: row.created_at.toISOString(),
        }));
    } catch (e) {
        console.error("Error fetching OTM matches", e);
        return [];
    }
}

async function getAllPlayers() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT p.id, p.firstname, p.lastname, p.image_id, t.name as team_name
            FROM persons p
            JOIN team_members tm ON p.id = tm.person_id
            JOIN teams t ON tm.team_id = t.id
            WHERE tm.role NOT LIKE '%Coach%'
            ORDER BY p.lastname, p.firstname
        `);
        return rows.map((r: any) => ({
            id: r.id,
            fullname: `${r.lastname.toUpperCase()} ${r.firstname}`,
            team: r.team_name,
            image_id: r.image_id
        }));
    } catch (e) {
        console.error("Error fetching all players", e);
        return [];
    }
}

export default async function CoachDashboard() {
    const session: any = await getServerSession(authOptions);

    if (!session || session.user.role !== 'coach') {
        redirect("/login");
    }

    const personId = session.user.personId;
    const teams: any[] = await getCoachTeams(personId);
    const playersCount = await getMyPlayersCount(teams.map(t => t.id));
    const otmMatches = await getOtmMatches(7);

    const allOtmMatches = await getOtmMatches();
    const rawAllPlayers = await getAllPlayers();

    // Disambiguate players with same name
    const nameCounts: Record<string, number> = {};
    rawAllPlayers.forEach((p: any) => {
        nameCounts[p.fullname] = (nameCounts[p.fullname] || 0) + 1;
    });

    const allPlayers = rawAllPlayers.map((p: any) => ({
        ...p,
        originalName: p.fullname,
        fullname: nameCounts[p.fullname] > 1 ? `${p.fullname} (${p.team})` : p.fullname
    }));

    // Update 'players' (my players) with the disambiguated names
    const players = (await getMyPlayers(teams.map(t => t.id))).map((p: any) => {
        const found = allPlayers.find((ap: any) => ap.id === p.id);
        return found ? found : p;
    });


    let coachImageId = null;
    try {
        const [coachRows] = await pool.query<RowDataPacket[]>("SELECT image_id FROM persons WHERE id = ?", [personId]);
        if (coachRows.length > 0) {
            coachImageId = coachRows[0].image_id;
        }
    } catch (e) {
        console.error("Error fetching coach details", e);
    }

    const playerStatsMap = new Map<number, number>();
    players.forEach((p: any) => playerStatsMap.set(p.id, 0));

    allOtmMatches.forEach((m: any) => {
        [m.scorer, m.timer, m.hall_manager, m.bar_manager, m.referee].forEach(name => {
            if (name) {
                // 1. Try exact match (handles "Axel (U11)" vs "Axel (U13)")
                let candidates = allPlayers.filter((ap: any) => ap.fullname === name);

                // 2. Fallback: Try matching original name (handles legacy "Axel")
                if (candidates.length === 0) {
                    candidates = allPlayers.filter((ap: any) => ap.originalName === name);
                }

                if (candidates.length > 0) {
                    let selectedPlayer = candidates[0];

                    // If multiple candidates, try to resolve by team
                    if (candidates.length > 1) {
                        const perfectMatch = candidates.find((p: any) => p.team === m.category || (m.designation && m.designation.includes(p.team)));
                        if (perfectMatch) selectedPlayer = perfectMatch;
                    }

                    // Only credit if the RESOLVED player is one of the logged-in coach's players
                    if (playerStatsMap.has(selectedPlayer.id)) {
                        playerStatsMap.set(selectedPlayer.id, (playerStatsMap.get(selectedPlayer.id) || 0) + 1);
                    }
                }
            }
        });
    });

    const playersWithStats = players.map((p: any) => ({
        ...p,
        otmCount: playerStatsMap.get(p.id) || 0
    })).sort((a: any, b: any) => b.otmCount - a.otmCount);

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-10 pb-20 overflow-x-hidden">

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/90 backdrop-blur-md sticky top-0 md:top-4 z-40 p-6 md:rounded-2xl shadow-sm border-b md:border border-gray-100 md:border-white/20">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Espace Coach</h1>
                    <p className="text-xs md:text-sm text-gray-500 font-medium truncate">
                        Bonjour <span className="text-sbc font-bold">{session.user.name}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <InstallPWA />
                    <CoachSettings />
                    <Link href="#otm-planning" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 font-bold text-sm hover:bg-orange-100 transition shadow-sm border border-orange-100 whitespace-nowrap">
                        <i className="fas fa-calendar-alt"></i>
                        <span>Planning OTM</span>
                    </Link>
                    <Link href="#otm-leaderboard" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 text-purple-600 font-bold text-sm hover:bg-purple-100 transition shadow-sm border border-purple-100 whitespace-nowrap">
                        <i className="fas fa-trophy"></i>
                        <span>Classement OTM</span>
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-3 md:gap-6">
                <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sbc/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-sbc text-white flex items-center justify-center text-lg md:text-xl shadow-md mb-3">
                            <i className="fas fa-shield-alt"></i>
                        </div>
                        <p className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-widest">Mes Équipes</p>
                        <p className="text-xl md:text-2xl font-black text-gray-900 mt-1">{teams.length}</p>
                    </div>
                </div>

                <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg md:text-xl shadow-md mb-3">
                            <i className="fas fa-users"></i>
                        </div>
                        <p className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-widest">Mes Joueurs</p>
                        <p className="text-xl md:text-2xl font-black text-gray-900 mt-1">{playersCount}</p>
                    </div>
                </div>
            </div>

            <section>
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight whitespace-nowrap">Mes Équipes</h2>
                    <div className="h-px flex-grow bg-gray-200"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.length > 0 ? (
                        teams.map((team) => (
                            <div key={team.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-100 p-2 overflow-hidden flex items-center justify-center">
                                        {team.image_id ? (
                                            <img src={`/api/image/${team.image_id}`} alt={team.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <i className="fas fa-shield-alt text-3xl text-gray-300"></i>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 text-lg uppercase leading-tight group-hover:text-sbc transition">{team.name}</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{team.category}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Role: {team.role}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full p-12 text-center text-gray-400 italic bg-white rounded-3xl border border-gray-100 border-dashed">
                            Vous n'êtes assigné à aucune équipe pour le moment.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-12">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight whitespace-nowrap">Mes Joueurs</h2>
                    <div className="h-px flex-grow bg-gray-200"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {players.length > 0 ? (
                        players.map((player: any, index: number) => (
                            <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition group">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                                    {player.image_id ? (
                                        <img src={`/api/image/${player.image_id}`} alt={player.fullname} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-black text-gray-400 text-sm">{player.fullname.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate group-hover:text-sbc transition">{player.fullname}</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider truncate">{player.team}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full p-8 text-center text-gray-400 italic bg-white rounded-2xl border border-gray-100 border-dashed">
                            Aucun joueur trouvé dans vos équipes.
                        </div>
                    )}
                </div>
            </section>

            <section id="otm-planning" className="mt-12 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight whitespace-nowrap">Planning OTM</h2>
                    <div className="h-px flex-grow bg-gray-200"></div>
                </div>
                <CoachOTMManager matches={otmMatches} myTeamNames={teams.map(t => t.name)} players={players} allPlayers={allPlayers} currentUser={session.user.name} coachImageId={coachImageId} />
            </section>

            <section id="otm-leaderboard" className="mt-12 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight whitespace-nowrap">Classement OTM</h2>
                    <div className="h-px flex-grow bg-gray-200"></div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center w-16">#</th>
                                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">Joueur</th>
                                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">Équipe</th>
                                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Tables</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {playersWithStats.map((player: any, index: number) => (
                                    <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-4 text-center font-black text-gray-300 group-hover:text-sbc">
                                            {index + 1}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {player.image_id ? (
                                                    <img src={`/api/image/${player.image_id}`} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-sbc/10 text-sbc flex items-center justify-center font-black border-2 border-white shadow-sm">
                                                        {player.fullname.charAt(0)}
                                                    </div>
                                                )}
                                                <span className="font-bold text-gray-900">{player.fullname}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase">
                                                {player.team}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${player.otmCount > 0 ? 'bg-sbc text-white shadow-md shadow-sbc/30' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                {player.otmCount}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
