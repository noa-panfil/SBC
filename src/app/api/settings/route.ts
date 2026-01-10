import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT key_name, value FROM settings"
        );

        const settings: Record<string, string> = {};
        rows.forEach(row => {
            settings[row.key_name] = row.value;
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
