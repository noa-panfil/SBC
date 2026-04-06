import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { firstname, lastname, email, password, volunteer_id } = body;

        let query = 'UPDATE login_volunteers SET firstname = ?, lastname = ?, email = ?';
        let queryParams: any[] = [firstname, lastname, email];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            queryParams.push(hashedPassword);
        }

        if (volunteer_id !== undefined) {
            query += ', volunteer_id = ?';
            queryParams.push(volunteer_id);
        }

        query += ' WHERE id = ?';
        queryParams.push(id);

        await pool.query(query, queryParams);

        // Also update volunteer name if needed
        const fullName = `${(lastname || "").toUpperCase()} ${firstname}`;
        const [rows]: any = await pool.query('SELECT volunteer_id FROM login_volunteers WHERE id = ?', [id]);
        if (rows.length > 0 && rows[0].volunteer_id) {
            await pool.query('UPDATE volunteers SET name = ? WHERE id = ?', [fullName, rows[0].volunteer_id]);
        }

        revalidatePath('/admin');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating volunteer login:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        // Optionally get volunteer_id to delete if no longer used, but safer to keep volunteer record
        await pool.query('DELETE FROM login_volunteers WHERE id = ?', [id]);

        revalidatePath('/admin');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting volunteer login:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
