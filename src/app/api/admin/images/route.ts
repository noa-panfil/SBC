import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth";

export async function GET() {
    const session = await getServerSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // We only fetch IDs and MIME types to avoid loading all binary data at once
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id, mime_type FROM images ORDER BY id DESC"
        );

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching images list:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
