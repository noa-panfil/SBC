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
        const body = await request.json();
        const { id, firstname, lastname, birthdate, gender, image_id } = body;

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        await pool.query(
            `UPDATE persons SET 
                firstname = ?, 
                lastname = ?, 
                birthdate = ?, 
                gender = ?, 
                image_id = ?
            WHERE id = ?`,
            [firstname, lastname, birthdate || null, gender, image_id || null, id]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating player:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
