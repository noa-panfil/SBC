import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { date, excludeId } = body;

        if (!date) {
            return NextResponse.json({ error: "Date required" }, { status: 400 });
        }

        // Check if there is already a featured match in the same week
        // YEARWEEK(date, 1) returns year+week_number with Monday as start of week
        const query = excludeId
            ? "SELECT id FROM otm_matches WHERE is_featured = 1 AND YEARWEEK(match_date, 1) = YEARWEEK(?, 1) AND id != ?"
            : "SELECT id FROM otm_matches WHERE is_featured = 1 AND YEARWEEK(match_date, 1) = YEARWEEK(?, 1)";

        const params = excludeId ? [date, excludeId] : [date];

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json({ hasFeatured: rows.length > 0 });
    } catch (error: any) {
        console.error("Error checking featured match:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
