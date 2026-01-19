import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth";
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { firstname, lastname, email, password } = body;

        if (!firstname || !lastname || !email) {
            return NextResponse.json({ error: "Firstname, lastname and email are required" }, { status: 400 });
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE login_coachs SET firstname = ?, lastname = ?, email = ?, password = ? WHERE id = ?',
                [firstname, lastname, email, hashedPassword, id]
            );
        } else {
            await pool.query(
                'UPDATE login_coachs SET firstname = ?, lastname = ?, email = ? WHERE id = ?',
                [firstname, lastname, email, id]
            );
        }

        revalidatePath('/admin');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating coach login:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        await pool.query('DELETE FROM login_coachs WHERE id = ?', [id]);

        revalidatePath('/admin');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting coach login:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
