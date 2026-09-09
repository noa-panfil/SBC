import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";

async function admin() { return (await getServerSession(authOptions))?.user?.role === "admin"; }

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await admin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = Number((await params).id); const body = await request.json().catch(() => null);
    const [rows] = await pool.query<RowDataPacket[]>("SELECT person_id FROM volunteers WHERE id = ?", [id]);
    if (!rows.length) return NextResponse.json({ error: "Bénévole introuvable." }, { status: 404 });
    const personId = rows[0].person_id;
    if (body.name !== undefined) { const parts = String(body.name).trim().split(/\s+/); const firstname = parts.shift() || ""; await pool.query("UPDATE persons SET firstname = ?, lastname = ? WHERE id = ?", [firstname, parts.join(" "), personId]); }
    if (body.birth_date !== undefined) await pool.query("UPDATE persons SET birthdate = STR_TO_DATE(NULLIF(?, ''), '%d/%m/%Y') WHERE id = ?", [body.birth_date, personId]);
    if (body.sexe !== undefined) await pool.query("UPDATE persons SET gender = ? WHERE id = ?", [body.sexe || null, personId]);
    if (body.image_id !== undefined) await pool.query("UPDATE persons SET image_id = ? WHERE id = ?", [body.image_id || null, personId]);
    if (body.role !== undefined) await pool.query("UPDATE volunteers SET title = ? WHERE id = ?", [body.role, id]);
    if (body.display !== undefined) await pool.query("UPDATE volunteers SET display = ? WHERE id = ?", [body.display ? 1 : 0, id]);
    return NextResponse.json({ success: true });
}

export const PATCH = PUT;

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await admin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = Number((await params).id);
    const [rows] = await pool.query<RowDataPacket[]>("SELECT person_id FROM volunteers WHERE id = ?", [id]);
    if (rows.length) {
        await pool.query("DELETE pr FROM person_roles pr JOIN roles r ON r.id = pr.role_id WHERE pr.person_id = ? AND r.code = 'volunteer'", [rows[0].person_id]);
        await pool.query("DELETE FROM volunteers WHERE id = ?", [id]);
    }
    return NextResponse.json({ success: true });
}
