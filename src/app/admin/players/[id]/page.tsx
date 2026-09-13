import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { RowDataPacket } from "mysql2";
import Link from "next/link";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";
import PlayerEditForm from "../PlayerEditForm";

async function getData(id: string) {
    const [roles] = await pool.query<RowDataPacket[]>("SELECT code, label FROM roles ORDER BY id");
    const [teams] = await pool.query<RowDataPacket[]>(`
        SELECT t.id, t.name, s.label AS season FROM teams t JOIN seasons s ON s.id = t.season_id
        WHERE t.active = 1 ORDER BY s.starts_on DESC, t.display_order, t.name
    `);
    if (id === "new") return {
        person: { id: null, firstname: "", lastname: "", birthdate: "", gender: "", email: "", phone: "", image_id: null, celebration_image_id: null, active: true, roles: [], memberships: [] }, roles, teams,
    };
    const numericId = Number(id);
    if (!Number.isSafeInteger(numericId) || numericId < 1) return null;
    const [people] = await pool.query<RowDataPacket[]>(`
        SELECT id, firstname, lastname, DATE_FORMAT(birthdate, '%Y-%m-%d') AS birthdate,
               gender, email, phone, image_id, celebration_image_id, active FROM persons WHERE id = ?
    `, [numericId]);
    if (!people.length) return null;
    const [personRoles] = await pool.query<RowDataPacket[]>("SELECT r.code FROM person_roles pr JOIN roles r ON r.id = pr.role_id WHERE pr.person_id = ?", [numericId]);
    const [memberships] = await pool.query<RowDataPacket[]>("SELECT team_id, membership_role, jersey_number FROM team_memberships WHERE person_id = ? ORDER BY id", [numericId]);
    return {
        person: { ...people[0], active: !!people[0].active, roles: personRoles.map((role) => role.code), memberships: memberships.map((membership) => ({ ...membership, team_id: Number(membership.team_id) })) }, roles, teams,
    };
}

export default async function PersonEditPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") redirect("/login");
    const { id } = await params;
    const data = await getData(id);
    if (!data) notFound();
    return <div className="min-h-screen bg-gray-50 p-4 md:p-8"><div className="mx-auto max-w-4xl"><Link href="/admin/players" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500"><i className="fas fa-arrow-left" />Toutes les personnes</Link><header className="mb-6 rounded-2xl border bg-white p-6"><h1 className="text-3xl font-black">{id === "new" ? "Nouvelle personne" : "Modifier la personne"}</h1><p className="text-gray-500">Identité, fonctions et équipes au même endroit.</p></header><PlayerEditForm person={data.person as never} roles={data.roles as never[]} teams={data.teams as never[]} /></div></div>;
}
