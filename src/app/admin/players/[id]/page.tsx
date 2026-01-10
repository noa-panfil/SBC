import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import PlayerEditForm from "@/app/admin/players/PlayerEditForm";
import Link from "next/link";

interface Player {
    id: number;
    firstname: string;
    lastname: string;
    birthdate: string;
    gender: string;
    image_id: number | null;
}

async function getPlayer(id: string): Promise<Player | null> {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM persons WHERE id = ?",
            [id]
        );
        if (rows.length === 0) return null;
        return {
            ...rows[0],
            birthdate: rows[0].birthdate ? new Date(rows[0].birthdate).toISOString().split('T')[0] : ""
        } as Player;
    } catch (e) {
        console.error(e);
        return null;
    }
}

export default async function PlayerEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession();
    if (!session) redirect("/admin/login");

    const player = await getPlayer(id);
    if (!player) notFound();

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-3xl mx-auto">
                <Link href="/admin/players" className="inline-flex items-center gap-2 text-gray-500 hover:text-sbc mb-6 transition">
                    <i className="fas fa-arrow-left"></i> Retour à la liste
                </Link>

                <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-3xl font-bold text-sbc-dark mb-1">Modifier le Profil</h1>
                        <p className="text-gray-600">ID Joueur : #{player.id}</p>
                    </div>
                </header>

                <PlayerEditForm player={player} />
            </div>
        </div>
    );
}
