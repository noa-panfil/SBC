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
        const body = await request.json();
        const { id, title, date, dateDisplay, description, location, time, mode, imageId, allowedTeams, roles, requiresFile } = body;

        let eventId = id;

        if (id) {
            // UPDATE
            await pool.query(
                `UPDATE events 
                 SET title = ?, event_date = ?, date_display = ?, description = ?, location = ?, time_info = ?, mode = ?, image_id = IFNULL(?, image_id), requires_file = ?
                 WHERE id = ?`,
                [title, date, dateDisplay, description, location, time, mode, imageId || null, requiresFile ? 1 : 0, id]
            );
        } else {
            // INSERT
            const [res] = await pool.query<ResultSetHeader>(
                `INSERT INTO events (title, event_date, date_display, description, location, time_info, mode, image_id, requires_file)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [title, date, dateDisplay, description, location, time, mode, imageId || null, requiresFile ? 1 : 0]
            );
            eventId = res.insertId;
        }

        // Handle Allowed Teams
        await pool.query('DELETE FROM event_allowed_teams WHERE event_id = ?', [eventId]);
        if (mode === 'joueur' && allowedTeams && allowedTeams.length > 0) {
            const values = allowedTeams.map((teamId: string) => [eventId, teamId]);
            await pool.query(
                'INSERT INTO event_allowed_teams (event_id, team_id) VALUES ?',
                [values]
            );
        }

        // Handle Roles
        await pool.query('DELETE FROM event_roles WHERE event_id = ?', [eventId]);
        if (mode === 'benevole' && roles && roles.length > 0) {
            const values = roles.map((r: any) => [eventId, r.name, r.max]);
            await pool.query(
                'INSERT INTO event_roles (event_id, role_name, max_count) VALUES ?',
                [values]
            );
        }

        return NextResponse.json({ success: true, id: eventId });
    } catch (error) {
        console.error("Error saving event:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
