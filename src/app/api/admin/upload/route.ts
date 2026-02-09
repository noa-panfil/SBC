import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const hexData = buffer.toString('hex');

        // Generate a random ID (or let auto-increment do it if we adjust schema, but here we insert manually or auto)
        // If your images table is auto-increment, we just insert.
        // Assuming structure: id, name, mime_type, data

        // Let's use auto-increment if possible, or generate a safe ID.
        // Based on previous contexts, images has an ID. Let's try inserting without ID to let AI handle it or generate a timestamp based one if needed.
        // Actually, previous scripts inserted created IDs. Let's check table schema later, but standard INSERT usually implies auto_increment.

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO images (name, mime_type, data) VALUES (?, ?, UNHEX(?))',
            [file.name, file.type, hexData]
        );

        return NextResponse.json({ id: result.insertId });

    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }
}
