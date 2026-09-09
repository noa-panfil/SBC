import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

async function isAdmin() {
    const session = await getServerSession(authOptions);
    return session?.user?.role === "admin";
}

export async function GET() {
    if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT m.id, m.team_id, m.season_id, m.match_code,
               DATE_FORMAT(m.match_date, '%Y-%m-%d') AS match_date,
               COALESCE(TIME_FORMAT(m.match_time, '%H:%i'), '') AS match_time,
               m.opponent, m.venue, m.home_away, m.competition, m.status,
               m.is_featured, t.name AS team_name, s.label AS season
        FROM matches m
        LEFT JOIN teams t ON t.id = m.team_id
        JOIN seasons s ON s.id = m.season_id
        ORDER BY m.match_date DESC, m.match_time DESC, m.id DESC
    `);
    return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
    if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body?.season_id || !body?.match_date || !body?.opponent?.trim()) {
        return NextResponse.json({ error: "Saison, date et adversaire requis." }, { status: 400 });
    }
    const values = [
        body.team_id || null, body.season_id, body.match_code || null,
        body.match_date, body.match_time || null, body.opponent.trim(), body.venue || null,
        body.home_away || "home", body.competition || "Championnat",
        body.status || "scheduled", body.is_featured ? 1 : 0,
    ];
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO matches
            (team_id, season_id, match_code, match_date, match_time, opponent, venue,
             home_away, competition, status, is_featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, values);
    return NextResponse.json({ id: result.insertId }, { status: 201 });
}

export async function PUT(request: NextRequest) {
    if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body?.id || !body?.season_id || !body?.match_date || !body?.opponent?.trim()) {
        return NextResponse.json({ error: "Données de match invalides." }, { status: 400 });
    }
    await pool.query(`
        UPDATE matches SET team_id = ?, season_id = ?, match_code = ?, match_date = ?,
            match_time = ?, opponent = ?, venue = ?, home_away = ?, competition = ?,
            status = ?, is_featured = ?
        WHERE id = ?
    `, [
        body.team_id || null, body.season_id, body.match_code || null,
        body.match_date, body.match_time || null, body.opponent.trim(), body.venue || null,
        body.home_away || "home", body.competition || "Championnat",
        body.status || "scheduled", body.is_featured ? 1 : 0, body.id,
    ]);
    return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
    if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = Number(request.nextUrl.searchParams.get("id"));
    if (!Number.isSafeInteger(id) || id < 1) {
        return NextResponse.json({ error: "ID invalide." }, { status: 400 });
    }
    await pool.query("DELETE FROM matches WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
}
