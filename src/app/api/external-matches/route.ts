import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { match_date, match_time, category, opponent, location, match_type } = body;

        const [result]: any = await pool.query(
            `INSERT INTO external_matches (category, match_date, match_time, opponent, location, match_type, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`,
            [category, match_date, match_time, opponent, location, match_type || 'Championnat']
        );

        return NextResponse.json({
            id: result.insertId,
            category, match_date, match_time, opponent, location,
            is_external: true
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
