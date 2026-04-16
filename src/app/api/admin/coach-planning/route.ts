import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const [coaches]: any = await pool.query(
      `SELECT * FROM coach_availabilities ORDER BY created_at DESC`
    );

    const [slots]: any = await pool.query(
      `SELECT * FROM coach_availability_slots ORDER BY day_of_week, start_time`
    );

    const data = coaches.map((c: any) => ({
      ...c,
      slots: slots.filter((s: any) => s.coach_id === c.id)
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching coach planning data:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
