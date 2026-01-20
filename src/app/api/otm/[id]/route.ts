import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session: any = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();


        const fields = [];
        const values = [];

        const allowedFields = [
            'category', 'is_white_jersey', 'match_date', 'match_time', 'meeting_time',
            'opponent', 'match_code', 'designation',
            'scorer', 'timer', 'hall_manager', 'bar_manager', 'referee'
        ];

        for (const key of Object.keys(body)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(body[key]);
            }
        }

        if (fields.length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        values.push(id);

        await pool.query(`
            UPDATE otm_matches SET ${fields.join(', ')} WHERE id = ?
        `, values);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating OTM match:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        await pool.query('DELETE FROM otm_matches WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting OTM match:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
