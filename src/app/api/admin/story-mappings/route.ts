import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM division_mappings');
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch mappings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { division_excel, team_name_excel, team_id } = await request.json();

        await pool.query(
            `INSERT INTO division_mappings (division_excel, team_name_excel, team_id) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE team_id = VALUES(team_id)`,
            [division_excel, team_name_excel, team_id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to save mapping' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await pool.query('DELETE FROM division_mappings WHERE id = ?', [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete mapping' }, { status: 500 });
    }
}
