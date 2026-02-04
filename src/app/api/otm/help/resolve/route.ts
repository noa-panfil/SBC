import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { requestId, matchId, role, player } = await req.json();

        if (!requestId || !matchId || !role || !player) return NextResponse.json({ error: "Missing fields" }, { status: 400 });


        const allowedRoles = ['scorer', 'timer', 'hall_manager', 'bar_manager', 'referee', 'referee_2'];
        if (!allowedRoles.includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query(`UPDATE otm_matches SET ${role} = ? WHERE id = ?`, [player, matchId]);
            await connection.query("DELETE FROM otm_help_requests WHERE id = ?", [requestId]);

            await connection.commit();
            return NextResponse.json({ success: true });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
