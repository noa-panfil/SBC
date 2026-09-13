import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import AdminPlayersManager from "./AdminPlayersManager";
import Link from "next/link";

async function getPlayers() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT 
                p.id, 
                p.firstname, 
                p.lastname, 
                p.birthdate, 
                p.gender, 
                p.image_id, p.celebration_image_id, p.active,
                GROUP_CONCAT(DISTINCT CONCAT(s.label, ' · ', t.name) ORDER BY s.starts_on DESC SEPARATOR ', ') as teams,
                GROUP_CONCAT(DISTINCT r.label ORDER BY r.label SEPARATOR ', ') AS roles
            FROM persons p
            LEFT JOIN team_memberships tm ON p.id = tm.person_id
            LEFT JOIN teams t ON tm.team_id = t.id
            LEFT JOIN seasons s ON s.id = t.season_id
            LEFT JOIN person_roles pr ON pr.person_id = p.id
            LEFT JOIN roles r ON r.id = pr.role_id
            GROUP BY p.id
            ORDER BY p.lastname, p.firstname
        `);
        return rows.map(row => ({
            id: Number(row.id), firstname: String(row.firstname), lastname: String(row.lastname),
            image_id: row.image_id == null ? null : Number(row.image_id),
            celebration_image_id: row.celebration_image_id == null ? null : Number(row.celebration_image_id), teams: row.teams || null,
            roles: row.roles || null, active: Number(row.active),
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
                    <h1 className="text-3xl font-bold text-sbc-dark mb-1">Gestion des personnes</h1>
                    <p className="text-gray-600">Fonctions et affectations saisonnières des membres du club</p>
                </div>
                <Link href="/admin/players/new" className="rounded-xl bg-sbc px-5 py-3 font-black text-white"><i className="fas fa-plus mr-2" />Ajouter</Link>
            </header>

            <AdminPlayersManager initialPlayers={players} />
        </div>
    );
}
