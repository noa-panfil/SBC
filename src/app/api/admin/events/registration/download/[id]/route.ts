import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT file_name, file_mime_type, file_data FROM event_registrations WHERE id = ?',
            [id]
        );

        if (!rows || rows.length === 0) {
            return new NextResponse('File not found', { status: 404 });
        }

        const { file_name, file_mime_type, file_data } = rows[0];

        if (!file_data) {
            return new NextResponse('No file uploaded for this registration', { status: 404 });
        }

        return new NextResponse(file_data, {
            headers: {
                'Content-Type': file_mime_type || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${file_name || 'download'}"`,
            },
        });
    } catch (error) {
        console.error('Download Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
