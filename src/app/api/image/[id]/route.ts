import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Await the whole params object first, then destructure, as per Next.js 15+ changes if applicable, 
    // but standard destructuring works in current stable versions usually. 
    // However, to be safe with recent experimental warnings:
    const { id } = await params;

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT mime_type, data FROM images WHERE id = ?',
            [id]
        );

        if (!rows || rows.length === 0) {
            return new NextResponse('Image not found', { status: 404 });
        }

        const { mime_type, data } = rows[0];

        return new NextResponse(data, {
            headers: {
                'Content-Type': mime_type,
                'Content-Length': Buffer.byteLength(data).toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
