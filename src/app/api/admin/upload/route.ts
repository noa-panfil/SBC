import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
        if (!allowedTypes.has(file.type)) {
            return NextResponse.json({ error: 'Format d’image non autorisé (JPEG, PNG, WebP ou GIF).' }, { status: 400 });
        }
        if (file.size < 1 || file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'L’image doit peser moins de 10 Mo.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO images (name, mime_type, data) VALUES (?, ?, ?)',
            [file.name, file.type, buffer]
        );

        return NextResponse.json({ id: result.insertId });

    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }
}
