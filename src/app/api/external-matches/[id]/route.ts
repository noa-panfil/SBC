import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await pool.query('DELETE FROM external_matches WHERE id = ?', [params.id]);
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { match_date, match_time, category, opponent, location } = body;

        await pool.query(
            `UPDATE external_matches SET category=?, match_date=?, match_time=?, opponent=?, location=? WHERE id=?`,
            [category, match_date, match_time, opponent, location, params.id]
        );

        return NextResponse.json({
            id: Number(params.id),
            category, match_date, match_time, opponent, location, loc: 'away'
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
