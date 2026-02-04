import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import CoachEditForm from "../CoachEditForm";
import { authOptions } from "@/lib/auth";

async function getCoach(id: string) {
    if (id === 'new') return null;
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT p.*
        FROM persons p
        WHERE p.id = ?
    `, [id]);
    return rows[0] || null;
}

async function getCoachTeams(id: string) {
    if (id === 'new') return [];
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT team_id FROM team_members WHERE person_id = ? AND (role LIKE '%Coach%' OR role LIKE '%Assistant%' OR role LIKE '%Entraineur%')
    `, [id]);
    return rows.map(r => r.team_id);
}

async function getAllTeams() {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT id, name FROM teams ORDER BY name");
    return rows;
}

export default async function CoachEditPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const resolvedParams = await params;
    const coach = await getCoach(resolvedParams.id);
    const assignedTeamIds = await getCoachTeams(resolvedParams.id);
    const allTeams = await getAllTeams();

    if (!coach && resolvedParams.id !== 'new') {
        return <div>Coach introuvable</div>;
    }

    const coachData = coach || {
        firstname: '',
        lastname: '',
        birthdate: '',
        gender: 'M',
        image_id: null,
        email: ''
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <header className="mb-8 max-w-4xl mx-auto">
                <a href="/admin/coaches" className="text-gray-500 hover:text-sbc mb-4 inline-flex items-center gap-2 font-bold text-sm transition">
                    <i className="fas fa-arrow-left"></i> Retour aux coachs
                </a>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                    {resolvedParams.id === 'new' ? 'Ajouter un nouveau coach' : `Modifier ${coachData.firstname} ${coachData.lastname}`}
                </h1>
            </header>

            <CoachEditForm
                coach={coachData as any}
                id={resolvedParams.id === 'new' ? null : Number(resolvedParams.id)}
                assignedTeamIds={assignedTeamIds}
                allTeams={allTeams as any[]}
            />
        </div>
    );
}
