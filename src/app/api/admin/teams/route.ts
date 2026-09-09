import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ResultSetHeader } from "mysql2";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body?.season_id || !body?.name?.trim()) return NextResponse.json({ error: "Saison et nom requis." }, { status: 400 });
    const [result] = await pool.query<ResultSetHeader>("INSERT INTO teams (season_id, name, category) VALUES (?, ?, ?)", [body.season_id, body.name.trim(), body.category || null]);
    return NextResponse.json({ id: result.insertId }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = Number(request.nextUrl.searchParams.get("id"));
    if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "ID invalide." }, { status: 400 });
    await pool.query("DELETE FROM teams WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
}
