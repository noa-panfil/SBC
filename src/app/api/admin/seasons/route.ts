import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body?.label?.trim() || !body?.starts_on || !body?.ends_on) return NextResponse.json({ error: "Libellé et dates requis." }, { status: 400 });
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        if (body.is_current) await connection.query("UPDATE seasons SET is_current = 0");
        const [result] = await connection.query<ResultSetHeader>("INSERT INTO seasons (label, starts_on, ends_on, is_current) VALUES (?, ?, ?, ?)", [body.label.trim(), body.starts_on, body.ends_on, body.is_current ? 1 : 0]);
        if (body.copy_from) {
            const [sourceTeams] = await connection.query<RowDataPacket[]>("SELECT name, category, widget_id, display_order FROM teams WHERE season_id = ?", [body.copy_from]);
            if (sourceTeams.length) {
                await connection.query("INSERT INTO teams (season_id, name, category, widget_id, display_order) VALUES ?", [sourceTeams.map((team) => [result.insertId, team.name, team.category, team.widget_id, team.display_order])]);
                await connection.query(
                    `INSERT INTO team_training_slots (team_id, schedule_text, display_order)
                     SELECT new_team.id, slot.schedule_text, slot.display_order
                     FROM team_training_slots slot
                     JOIN teams source_team ON source_team.id = slot.team_id
                     JOIN teams new_team ON new_team.season_id = ? AND new_team.name = source_team.name
                     WHERE source_team.season_id = ?`,
                    [result.insertId, body.copy_from]
                );
            }
        }
        await connection.commit();
        return NextResponse.json({ id: result.insertId }, { status: 201 });
    } catch (error) {
        await connection.rollback(); console.error("Season create error:", error);
        return NextResponse.json({ error: "Création de la saison impossible." }, { status: 500 });
    } finally { connection.release(); }
}
