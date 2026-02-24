import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id, 10);
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        await pool.query("DELETE FROM bureau_members WHERE id = ?", [id]);
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Error deleting bureau member:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
