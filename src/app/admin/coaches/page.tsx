import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import AdminCoachesList from "./AdminCoachesList";
import { authOptions } from "@/lib/auth";

async function getCoaches() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT 
                p.id, 
                p.firstname, 
                p.lastname, 
                p.image_id,
                p.image_id,
                GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ', ') as teams
            FROM persons p
            JOIN team_members tm ON p.id = tm.person_id
            JOIN teams t ON tm.team_id = t.id
            WHERE tm.role LIKE '%Coach%' OR tm.role LIKE '%Assistant%' OR tm.role LIKE '%Entraineur%'
            GROUP BY p.id
            ORDER BY p.lastname, p.firstname
        `);
        return rows;
    } catch (e) {
        console.error(e);
        return [];
    }
}

export default async function AdminCoachesPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const coaches = await getCoaches();

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-1">Gestion des Coachs</h1>
                    <p className="text-gray-500 font-medium">Gérez le staff technique du club</p>
                </div>
                <a href="/admin/coaches/new" className="bg-sbc text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-sbc-dark transition flex items-center gap-2">
                    <i className="fas fa-plus"></i> Nouveau Coach
                </a>
            </header>

            <AdminCoachesList initialCoaches={coaches} />
        </div>
    );
}
