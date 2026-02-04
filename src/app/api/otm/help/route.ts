import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT h.*, m.category, m.opponent, m.match_date, m.match_time 
            FROM otm_help_requests h
            JOIN otm_matches m ON h.match_id = m.id
            ORDER BY h.created_at DESC
        `);
        return NextResponse.json(rows);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { matchId, role } = await req.json();

        if (!matchId || !role) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        await pool.query("INSERT INTO otm_help_requests (match_id, role) VALUES (?, ?)", [matchId, role]);

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await pool.query("DELETE FROM otm_help_requests WHERE id = ?", [id]);

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
