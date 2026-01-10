import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import AdminPlayersManager from "./AdminPlayersManager";

async function getPlayers() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT 
                p.id, 
                p.firstname, 
                p.lastname, 
                p.birthdate, 
                p.gender, 
                p.image_id,
                GROUP_CONCAT(t.name SEPARATOR ', ') as teams
            FROM persons p
            LEFT JOIN team_members tm ON p.id = tm.person_id
            LEFT JOIN teams t ON tm.team_id = t.id
            GROUP BY p.id
            ORDER BY p.lastname, p.firstname
        `);
        return rows.map(row => ({
            ...row,
            birthdate: row.birthdate ? new Date(row.birthdate).toISOString() : null
        }));
    } catch (e) {
        console.error(e);
        return [];
    }
}

export default async function AdminPlayersPage() {
    const session = await getServerSession();
    if (!session) redirect("/admin/login");

    const players = await getPlayers();

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-sbc-dark mb-1">Gestion des Joueurs</h1>
                    <p className="text-gray-600">Recherchez et modifiez les membres du club</p>
                </div>
            </header>

            <AdminPlayersManager initialPlayers={players} />
        </div>
    );
}
