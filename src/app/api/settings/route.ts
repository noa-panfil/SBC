import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const publicSettingKeys = [
    'site_logo_id',
    'hero_image_type',
    'hero_image_id',
] as const;

const editableSettingKeys = new Set<string>([
    ...publicSettingKeys,
    'maintenance_mode',
]);

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT key_name, value FROM settings
             WHERE key_name IN (${publicSettingKeys.map(() => '?').join(', ')})`,
            [...publicSettingKeys]
        );

        const settings: Record<string, string> = {};
        rows.forEach(row => {
            settings[row.key_name] = row.value;
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = await request.json();

        const keys = Object.keys(body);
        if (keys.length === 0) {
            return NextResponse.json({ error: "No settings provided" }, { status: 400 });
        }
        if (keys.some((key) => !editableSettingKeys.has(key))) {
            return NextResponse.json({ error: "Unknown or protected setting" }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (const key of keys) {
                const value = body[key];
                await connection.query(
                    "INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?",
                    [key, String(value), String(value)]
                );
            }

            await connection.commit();
            return NextResponse.json({ success: true });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
