import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, team, slots } = body;

    if (!firstName || !lastName || !team || !Array.isArray(slots)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert the coach availability submission
    const [result] = await pool.query(
      `INSERT INTO coach_availabilities (first_name, last_name, team) VALUES (?, ?, ?)`,
      [firstName, lastName, team]
    );

    const coachId = (result as any).insertId;

    if (slots.length > 0) {
      const values = slots.map((s: any) => [coachId, s.dayOfWeek, s.startTime, s.endTime, s.isUnavailable ? 1 : 0]);
      await pool.query(
        `INSERT INTO coach_availability_slots (coach_id, day_of_week, start_time, end_time, is_unavailable) VALUES ?`,
        [values]
      );
    }

    return NextResponse.json({ success: true, coachId });
  } catch (error) {
    console.error("Error saving coach planning:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
