import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [rows] = await pool.query('SELECT id, firstname, lastname, email, created_at, volunteer_id FROM login_volunteers ORDER BY lastname ASC');
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error("Error fetching volunteer logins:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { firstname, lastname, email, password, volunteer_id } = body;

        if (!firstname || !email || !password) {
            return NextResponse.json({ error: "Firstname, email and password are required" }, { status: 400 });
        }

        const safeLastname = lastname || "";
        const hashedPassword = await bcrypt.hash(password, 10);
        const fullName = `${safeLastname.toUpperCase()} ${firstname}`;

        let finalVolunteerId = volunteer_id;
        if (!finalVolunteerId) {
            const [existingVols]: any = await pool.query('SELECT id FROM volunteers WHERE name = ?', [fullName]);
            if (existingVols.length > 0) {
                finalVolunteerId = existingVols[0].id;
            } else {
                const [insertRes]: any = await pool.query('INSERT INTO volunteers (name, display, role) VALUES (?, 1, "Bénévole")', [fullName]);
                finalVolunteerId = insertRes.insertId;
            }
        }

        await pool.query(
            'INSERT INTO login_volunteers (firstname, lastname, email, password, volunteer_id) VALUES (?, ?, ?, ?, ?)',
            [firstname, safeLastname, email, hashedPassword, finalVolunteerId]
        );

        revalidatePath('/admin');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error creating volunteer login:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
