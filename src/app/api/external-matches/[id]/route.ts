import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseMatch } from "../validation";

function positiveId(value: string): number | null {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = positiveId((await params).id);
    if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    try {
        await pool.query("DELETE FROM external_matches WHERE id = ?", [id]);
        return NextResponse.json({ message: "Deleted successfully" });
    } catch (error) {
        console.error("External match delete error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = positiveId((await params).id);
    const input = parseMatch(await request.json().catch(() => null));
    if (!id || !input) return NextResponse.json({ error: "Invalid match" }, { status: 400 });

    try {
        await pool.query(
            `UPDATE external_matches
             SET category = ?, match_date = ?, match_time = ?, opponent = ?, location = ?, match_type = ?
             WHERE id = ?`,
            [input.category, input.matchDate, input.matchTime, input.opponent, input.location, input.matchType, id]
        );
        return NextResponse.json({
            id,
            category: input.category,
            match_date: input.matchDate,
            match_time: input.matchTime,
            opponent: input.opponent,
            location: input.location,
            loc: "away",
        });
    } catch (error) {
        console.error("External match update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
