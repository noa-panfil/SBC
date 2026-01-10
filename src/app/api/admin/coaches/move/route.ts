import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { personId, oldTeamId, newTeamId } = body;

        if (!personId || !oldTeamId || !newTeamId) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        // Update the team_id for this specific membership
        // We ensure we only move the record matching the person AND the old team
        const [result] = await pool.query<ResultSetHeader>(
            'UPDATE team_members SET team_id = ? WHERE person_id = ? AND team_id = ?',
            [newTeamId, personId, oldTeamId]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "No changes made found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error moving coach:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
