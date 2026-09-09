import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const teamId = Number(body?.teamId);
    const imageId = Number(body?.imageId);
    const target = body?.target === "story" ? "story" : body?.target === "banner" ? "banner" : null;

    if (!Number.isSafeInteger(teamId) || teamId < 1 || !Number.isSafeInteger(imageId) || imageId < 1 || !target) {
        return NextResponse.json({ error: "Équipe, image ou destination invalide." }, { status: 400 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT t.id AS team_exists, i.id AS image_exists
         FROM teams t
         LEFT JOIN image_teams i ON i.id = ?
         WHERE t.id = ?`,
        [imageId, teamId]
    );

    if (!rows.length) return NextResponse.json({ error: "Équipe introuvable." }, { status: 404 });
    if (!rows[0].image_exists) return NextResponse.json({ error: "Image introuvable." }, { status: 404 });

    const column = target === "banner" ? "image_id" : "story_image_id";
    await pool.query(`UPDATE teams SET ${column} = ? WHERE id = ?`, [imageId, teamId]);

    return NextResponse.json({ success: true });
}
