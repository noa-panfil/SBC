import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertImageToWebp, ImageConversionError } from "@/lib/convertImageToWebp";

export const runtime = 'nodejs';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const scope = String(formData.get('scope') || 'person');
        const tables: Record<string, string> = {
            person: 'image_persons',
            team: 'image_teams',
            event: 'image_events',
            setting: 'image_settings',
            partner: 'image_partners',
            palmares: 'image_palmares',
        };
        const table = tables[scope];

        if (!file || !table) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const converted = await convertImageToWebp(file);

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO ${table} (name, mime_type, data) VALUES (?, ?, ?)`,
            [converted.name, converted.mimeType, converted.data]
        );

        return NextResponse.json({ id: result.insertId, scope, url: `/api/image/${result.insertId}?scope=${scope}`, mimeType: converted.mimeType, byteSize: converted.byteSize });

    } catch (error) {
        if (error instanceof ImageConversionError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Erreur serveur pendant l’import de l’image.' }, { status: 500 });
    }
}
