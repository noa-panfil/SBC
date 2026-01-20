import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { firstname, lastname, email, password } = body;

        if (!firstname || !email) {
            return NextResponse.json({ error: "Firstname and email are required" }, { status: 400 });
        }

        const safeLastname = lastname || "";

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE login_coachs SET firstname = ?, lastname = ?, email = ?, password = ? WHERE id = ?',
                [firstname, safeLastname, email, hashedPassword, id]
            );
        } else {
            await pool.query(
                'UPDATE login_coachs SET firstname = ?, lastname = ?, email = ? WHERE id = ?',
                [firstname, safeLastname, email, id]
            );
        }

        revalidatePath('/admin');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating coach login:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
        }
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
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
