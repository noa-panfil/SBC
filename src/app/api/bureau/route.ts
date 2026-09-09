import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT b.id, b.person_id, CONCAT(p.firstname, ' ', p.lastname) AS fullname, b.title AS role, p.image_id FROM bureau_members b JOIN persons p ON p.id = b.person_id ORDER BY b.display_order, b.id");
    return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => null); const personId = Number(body?.id); const title = String(body?.role || "").trim();
    if (!personId || !title) return NextResponse.json({ error: "Personne et fonction requises." }, { status: 400 });
    const [season] = await pool.query<RowDataPacket[]>("SELECT id FROM seasons WHERE is_current = 1 ORDER BY starts_on DESC LIMIT 1");
    const [result] = await pool.query<ResultSetHeader>("INSERT INTO bureau_members (person_id, season_id, title) VALUES (?, ?, ?)", [personId, season[0]?.id || null, title]);
    const [role] = await pool.query<RowDataPacket[]>("SELECT id FROM roles WHERE code = 'board_member'");
    await pool.query("INSERT IGNORE INTO person_roles (person_id, role_id) VALUES (?, ?)", [personId, role[0].id]);
    return NextResponse.json({ id: result.insertId }, { status: 201 });
}
