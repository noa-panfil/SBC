import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    console.log("OTM GET Session:", session); // DEBUG
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch matches logic
        // We might want to filter by date (future matches only?)
        // For now, let's get all matches ordered by date
        const [rows] = await pool.query(`
            SELECT * FROM otm_matches 
            ORDER BY match_date ASC, match_time ASC
        `);
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error("Error fetching OTM matches:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session: any = await getServerSession(authOptions);
    console.log("OTM POST Session:", session); // DEBUG
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            category, is_white_jersey, match_date, match_time,
            opponent, match_code, designation
        } = body;

        if (!category || !match_date || !match_time || !opponent) {
            return NextResponse.json({ error: "Catégorie, Date, Heure et Adversaire requis" }, { status: 400 });
        }

        // Calculate meeting time (30 mins before)
        // Assuming match_time is "HH:MM"
        let meeting_time = body.meeting_time;
        if (!meeting_time && match_time) {
            const [h, m] = match_time.split(':').map(Number);
            const date = new Date();
            date.setHours(h, m - 30);
            meeting_time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }

        await pool.query(`
            INSERT INTO otm_matches (
                category, is_white_jersey, match_date, match_time, meeting_time, 
                opponent, match_code, designation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            category, is_white_jersey || false, match_date, match_time, meeting_time,
            opponent, match_code, designation
        ]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error creating OTM match:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
