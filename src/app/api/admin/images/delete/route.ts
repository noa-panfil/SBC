import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        // Attempt to delete. This might fail if there's a foreign key constraint.
        await pool.query("DELETE FROM images WHERE id = ?", [id]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting image:", error);

        // Handle Foreign Key constraint error (ER_ROW_IS_REFERENCED_2)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return NextResponse.json({
                error: "Impossible de supprimer cette image car elle est utilisée ailleurs (événement, équipe, partenaire...)"
            }, { status: 400 });
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
