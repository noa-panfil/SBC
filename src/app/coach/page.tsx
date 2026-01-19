import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Link from "next/link";

async function getCoachTeams(personId: number) {
    if (!personId) return [];
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT t.id, t.name, t.category, t.image_id, tm.role
            FROM teams t
            JOIN team_members tm ON t.id = tm.team_id
            WHERE tm.person_id = ?
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

export default async function CoachDashboard() {
    const session: any = await getServerSession(authOptions);

    if (!session || session.user.role !== 'coach') {
        redirect("/admin/login");
    }

    const personId = session.user.personId;
    const teams: any[] = await getCoachTeams(personId);
    const playersCount = await getMyPlayersCount(teams.map(t => t.id));

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-10 pb-20 overflow-x-hidden">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/90 backdrop-blur-md sticky top-0 md:top-4 z-40 p-6 md:rounded-2xl shadow-sm border-b md:border border-gray-100 md:border-white/20">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Espace Coach</h1>
                    <p className="text-xs md:text-sm text-gray-500 font-medium truncate">
                        Bonjour <span className="text-sbc font-bold">{session.user.name}</span>
                    </p>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 md:gap-6">
                <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 mb-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-sbc to-sbc-dark text-white flex items-center justify-center text-xl md:text-2xl shadow-lg mb-3 md:mb-4">
                        <i className="fas fa-shield-alt"></i>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs md:text-sm font-black uppercase tracking-widest">Mes Équipes</p>
                        <p className="text-2xl md:text-3xl font-black text-gray-900 mt-0.5 md:mt-1">{teams.length}</p>
                    </div>
                </div>

                <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 mb-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl md:text-2xl shadow-lg mb-3 md:mb-4">
                        <i className="fas fa-users"></i>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs md:text-sm font-black uppercase tracking-widest">Mes Joueurs</p>
                        <p className="text-2xl md:text-3xl font-black text-gray-900 mt-0.5 md:mt-1">{playersCount}</p>
                    </div>
                </div>
            </div>

            {/* My Teams List */}
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
                                    {/* Link to Team Details (future) */}
                                    {/* <Link href={`/coach/teams/${team.id}`} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-sbc hover:text-white transition">
                                        <i className="fas fa-arrow-right text-xs"></i>
                                    </Link> */}
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
        </div>
    );
}
