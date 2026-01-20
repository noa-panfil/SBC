import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [rows] = await pool.query('SELECT id, firstname, lastname, email, created_at FROM login_coachs ORDER BY lastname ASC');
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error("Error fetching coach logins:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { firstname, lastname, email, password } = body;

        if (!firstname || !email || !password) {
            return NextResponse.json({ error: "Firstname, email and password are required" }, { status: 400 });
        }

        const safeLastname = lastname || "";
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO login_coachs (firstname, lastname, email, password) VALUES (?, ?, ?, ?)',
            [firstname, safeLastname, email, hashedPassword]
        );

        revalidatePath('/admin');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error creating coach login:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
