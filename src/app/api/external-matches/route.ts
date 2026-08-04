import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ResultSetHeader } from "mysql2";
import { parseMatch } from "./validation";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const input = parseMatch(await request.json().catch(() => null));
    if (!input) return NextResponse.json({ error: "Invalid match" }, { status: 400 });

    try {
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO external_matches (category, match_date, match_time, opponent, location, match_type, status)
             VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`,
            [input.category, input.matchDate, input.matchTime, input.opponent, input.location, input.matchType]
        );
        return NextResponse.json({
            id: result.insertId,
            category: input.category,
            match_date: input.matchDate,
            match_time: input.matchTime,
            opponent: input.opponent,
            location: input.location,
            is_external: true,
        });
    } catch (error) {
        console.error("External match create error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
