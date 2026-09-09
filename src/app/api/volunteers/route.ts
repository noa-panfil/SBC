import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    const includeHidden = request.nextUrl.searchParams.get("all") === "true";
    if (includeHidden) {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT v.id, v.person_id, CONCAT(p.firstname, ' ', p.lastname) AS name,
                   DATE_FORMAT(p.birthdate, '%d/%m/%Y') AS birth_date,
                   p.image_id, v.title AS role, p.gender AS sexe, v.display
            FROM volunteers v JOIN persons p ON p.id = v.person_id
            ORDER BY v.display_order, p.lastname, p.firstname
        `);
        return NextResponse.json(rows.map((row) => ({
            ...row,
            image: row.image_id ? `/api/image/${row.image_id}?scope=person` : null,
        })));
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT p.firstname, DATE_FORMAT(p.birthdate, '%d/%m') AS birth_date,
               p.image_id, v.title AS role, p.gender AS sexe
        FROM volunteers v JOIN persons p ON p.id = v.person_id
        WHERE v.display = 1 AND p.active = 1
        ORDER BY v.display_order, p.firstname
    `);
    return NextResponse.json(rows.map((row) => ({
        name: row.firstname,
        birth_date: row.birth_date,
        image: row.image_id ? `/api/image/${row.image_id}?scope=person` : null,
        role: row.role,
        sexe: row.sexe,
    })));
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => null);
    const name = String(body?.name || "").trim();
    if (!name) return NextResponse.json({ error: "Nom requis." }, { status: 400 });
    const parts = name.split(/\s+/); const firstname = parts.shift() || name; const lastname = parts.join(" ");
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [person] = await connection.query<ResultSetHeader>("INSERT INTO persons (firstname, lastname, birthdate, gender, image_id) VALUES (?, ?, STR_TO_DATE(NULLIF(?, ''), '%d/%m/%Y'), ?, ?)", [firstname, lastname, body.birth_date || null, body.sexe || null, body.image_id || null]);
        const [role] = await connection.query<RowDataPacket[]>("SELECT id FROM roles WHERE code = 'volunteer'");
        await connection.query("INSERT INTO person_roles (person_id, role_id) VALUES (?, ?)", [person.insertId, role[0].id]);
        const [volunteer] = await connection.query<ResultSetHeader>("INSERT INTO volunteers (person_id, title, display) VALUES (?, ?, ?)", [person.insertId, body.role || "Bénévole", body.display === 0 ? 0 : 1]);
        await connection.commit();
        return NextResponse.json({ id: volunteer.insertId }, { status: 201 });
    } catch (error) {
        await connection.rollback(); console.error("Volunteer create error:", error);
        return NextResponse.json({ error: "Création impossible." }, { status: 500 });
    } finally { connection.release(); }
}
