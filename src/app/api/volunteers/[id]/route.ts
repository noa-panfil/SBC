
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// PATCH to update fields (e.g., image) of a volunteer
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { image_id, sexe } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const updates: string[] = [];
        const values: any[] = [];

        if (image_id !== undefined) {
            updates.push('image_id = ?');
            values.push(image_id);
        }
        if (sexe !== undefined) {
            updates.push('sexe = ?');
            values.push(sexe);
        }

        if (updates.length > 0) {
            values.push(id);
            await pool.query(
                `UPDATE volunteers SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await pool.query('DELETE FROM volunteers WHERE id = ?', [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
