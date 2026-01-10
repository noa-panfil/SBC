import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import AdminTeamsClient from "./AdminTeamsClient";
import AdminCoachesManager from "./AdminCoachesManager";
import AdminEventsManager from "./AdminEventsManager";

async function getStats() {
    try {
        const [playerRows] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(DISTINCT person_id) as count FROM team_members WHERE role NOT LIKE '%Coach%'"
        );
        const [coachRows] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(DISTINCT person_id) as count FROM team_members WHERE role LIKE '%Coach%'"
        );

        return {
            players: playerRows[0].count,
            coaches: coachRows[0].count
        };
    } catch (e) {
        console.error(e);
        return { players: 0, coaches: 0 };
    }
}

async function getTeams() {
    try {
        const [teamRows] = await pool.query<RowDataPacket[]>(
            'SELECT id, name, category, schedule, widget_id, image_id FROM teams ORDER BY name'
        );
        const [memberRows] = await pool.query<RowDataPacket[]>(
            `SELECT tm.person_id, tm.team_id, tm.role, tm.number, p.firstname, p.lastname, p.birthdate, p.gender, p.image_id
             FROM team_members tm
             JOIN persons p ON tm.person_id = p.id`
        );

        const teams = teamRows.map((team: any) => {
            const members = memberRows.filter((m: any) => m.team_id === team.id);

            const coaches = members
                .filter((m: any) => m.role.toLowerCase().includes('coach'))
                .map((m: any) => ({
                    person_id: m.person_id,
                    name: `${m.firstname} ${m.lastname || ''}`.trim(),
                    role: m.role,
                    img: m.image_id ? `/api/image/${m.image_id}` : null,
                    birth: m.birthdate ? new Date(m.birthdate).toLocaleDateString('fr-FR') : null,
                    sexe: m.gender
                }));

            const players = members
                .filter((m: any) => !m.role.toLowerCase().includes('coach'))
                .map((m: any) => ({
                    person_id: m.person_id,
                    name: `${m.firstname} ${m.lastname || ''}`.trim(),
                    num: m.number,
                    img: m.image_id ? `/api/image/${m.image_id}` : null,
                    birth: m.birthdate ? new Date(m.birthdate).toLocaleDateString('fr-FR') : null,
                    sexe: m.gender
                }));

            return {
                id: team.id.toString(),
                name: team.name,
                category: team.category,
                image: team.image_id ? `/api/image/${team.image_id}` : null,
                image_id: team.image_id, // Added: Essential for persistence on edit!
                schedule: team.schedule,
                widgetId: team.widget_id,
                coaches: coaches,
                players: players
            };
        });

        // Helper to determine sort weight
        const getTeamWeight = (name: string) => {
            let score = 0;
            const n = name.toUpperCase();

            // 1. Age Category (Base Score)
            if (n.includes('BABY')) score = 100;
            else if (n.includes('U7') || n.includes('MINI')) score = 200;
            else if (n.includes('U9') || n.includes('POUSSIN')) score = 300;
            else if (n.includes('U11') || n.includes('BENJAMIN')) score = 400;
            else if (n.includes('U13') || n.includes('MINIME')) score = 500;
            else if (n.includes('U15') || n.includes('CADET')) score = 600;
            else if (n.includes('U17')) score = 700;
            else if (n.includes('U18')) score = 800;
            else if (n.includes('U20') || n.includes('JUNIOR')) score = 900;
            else if (n.includes('SENIOR')) score = 1000;
            else if (n.includes('LOISIR')) score = 1100;
            else score = 9999; // Others at the end

            // 2. Gender Priority (Same level: F < M)
            // If it contains "F" (and not just in "Enfant" or generic words), give small bonus
            // Actually, let's look for specific patterns like "U11 F", "SF", "Seniors F"
            const isFemale = n.includes(' F') || n.includes('-F') || n.endsWith(' F') || n.includes('FILLE');
            const isMale = n.includes(' M') || n.includes('-M') || n.endsWith(' M') || n.includes('GARCON') || n.includes(' MASC');

            if (isFemale) score += 0;
            else if (isMale) score += 5;
            else score += 2; // Mixed/Undefined in between or after female? Usually Baby is mixed (0+2=102). U11F(400) < U11M(405).

            // 3. Team Level (1 < 2 < 3)
            if (n.includes(' 2') || n.includes('-2')) score += 1;
            else if (n.includes(' 3') || n.includes('-3')) score += 2;
            else if (n.includes(' 4') || n.includes('-4')) score += 3;

            return score;
        };

        const sortedTeams = teams.sort((a: any, b: any) => {
            return getTeamWeight(a.name) - getTeamWeight(b.name);
        });

        return sortedTeams;
    } catch (e) {
        console.error(e);
        return [];
    }
}

export default async function AdminDashboard() {
    const session = await getServerSession();

    if (!session) {
        redirect("/admin/login");
    }

    const stats = await getStats();
    const teams = await getTeams();

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-sbc-dark mb-1">Dashboard Admin</h1>
                    <p className="text-gray-600">Bienvenue, <span className="font-semibold text-sbc">{session.user?.email}</span></p>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/admin/images" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition">
                        <i className="fas fa-images"></i> Médiathèque
                    </Link>
                    <div className="text-sm text-gray-400">
                        v1.1.0
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Link href="/admin/players" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-blue-500 hover:shadow-md transition cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-2xl">
                        <i className="fas fa-users"></i>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Joueurs</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.players}</p>
                    </div>
                </Link>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-sbc hover:shadow-md transition">
                    <div className="w-12 h-12 rounded-full bg-sbc-light text-sbc flex items-center justify-center text-2xl">
                        <i className="fas fa-user-tie"></i>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Coachs</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.coaches}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-purple-500 hover:shadow-md transition">
                    <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-2xl">
                        <i className="fas fa-shield-alt"></i>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Équipes</p>
                        <p className="text-2xl font-bold text-gray-800">{teams.length}</p>
                    </div>
                </div>
            </div>



            <AdminTeamsClient teams={teams} />

            <div className="my-8">
                <AdminCoachesManager teams={teams} />
            </div>

            <div className="my-8">
                <AdminEventsManager teams={teams} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Actions Rapides</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500 hover:border-sbc hover:text-sbc cursor-pointer transition">
                        <i className="fas fa-plus mb-2 text-xl"></i>
                        <p>Ajouter une équipe</p>
                    </div>
                    <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500 hover:border-sbc hover:text-sbc cursor-pointer transition">
                        <i className="fas fa-plus mb-2 text-xl"></i>
                        <p>Ajouter un événement</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
