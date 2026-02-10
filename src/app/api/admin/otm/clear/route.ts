import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from '@/lib/db';

export async function DELETE(req: NextRequest) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await pool.query('DELETE FROM otm_matches');
        await pool.query('DELETE FROM external_matches'); // Clear away games too

        // Reset auto_increment optionally?
        // await pool.query('ALTER TABLE otm_matches AUTO_INCREMENT = 1');
        // await pool.query('ALTER TABLE external_matches AUTO_INCREMENT = 1');

        return NextResponse.json({ success: true, message: "Toutes les tables de matchs (Domicile & Extérieur) ont été vidées." });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
