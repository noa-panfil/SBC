import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
