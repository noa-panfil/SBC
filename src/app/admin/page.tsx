import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import AdminTeamsClient from "./AdminTeamsClient";

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

        return teams;
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
                <div className="text-sm text-gray-400">
                    v1.0.0
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-blue-500 hover:shadow-md transition">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-2xl">
                        <i className="fas fa-users"></i>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Joueurs</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.players}</p>
                    </div>
                </div>

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
