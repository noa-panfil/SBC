import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const scope = request.nextUrl.searchParams.get('scope');
    const tables: Record<string, string> = {
        person: 'image_persons',
        team: 'image_teams',
        partner: 'image_partners',
        event: 'image_events',
        palmares: 'image_palmares',
        setting: 'image_settings',
    };
    const table = scope ? tables[scope] : null;

    if (!table) {
        return new NextResponse('Image scope required', { status: 400 });
    }

    try {
        let isPublic = true;
        if (scope === 'person') {
            const [visibilityRows] = await pool.query<RowDataPacket[]>(
                `SELECT (
                    EXISTS(
                        SELECT 1 FROM persons p
                        JOIN volunteers v ON v.person_id = p.id
                        WHERE (p.image_id = ? OR p.celebration_image_id = ?) AND p.active = 1 AND v.display = 1
                    ) OR EXISTS(
                        SELECT 1 FROM persons p
                        JOIN bureau_members b ON b.person_id = p.id
                        WHERE (p.image_id = ? OR p.celebration_image_id = ?) AND p.active = 1
                    ) OR EXISTS(
                        SELECT 1 FROM persons p
                        JOIN team_memberships tm ON tm.person_id = p.id
                        JOIN teams t ON t.id = tm.team_id
                        JOIN seasons s ON s.id = t.season_id
                        WHERE (p.image_id = ? OR p.celebration_image_id = ?) AND p.active = 1 AND t.active = 1 AND s.is_current = 1
                    )
                ) AS is_public`,
                [id, id, id, id, id, id]
            );
            isPublic = Boolean(visibilityRows[0]?.is_public);

            if (!isPublic) {
                const session = await getServerSession(authOptions);
                if (session?.user?.role !== 'admin') {
                    return new NextResponse('Image not found', { status: 404 });
                }
            }
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT mime_type, data FROM ${table} WHERE id = ?`,
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
                'Cache-Control': isPublic ? 'public, max-age=31536000, immutable' : 'private, no-store',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
