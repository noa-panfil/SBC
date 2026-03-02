import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await pool.query('DELETE FROM external_matches WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await req.json();
        const { id } = await params;
        const { match_date, match_time, category, opponent, location } = body;

        await pool.query(
            `UPDATE external_matches SET category=?, match_date=?, match_time=?, opponent=?, location=? WHERE id=?`,
            [category, match_date, match_time, opponent, location, id]
        );

        return NextResponse.json({
            id: Number(id),
            category, match_date, match_time, opponent, location, loc: 'away'
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
