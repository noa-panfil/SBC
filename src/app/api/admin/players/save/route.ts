import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";

const membershipRoles = new Set(["player", "coach", "assistant_coach"]);
type MembershipInput = { team_id?: number | string; membership_role?: string; jersey_number?: number | string | null };
function isMembership(value: unknown): value is MembershipInput { return typeof value === "object" && value !== null; }

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body?.firstname?.trim() || !body?.lastname?.trim()) return NextResponse.json({ error: "Prénom et nom requis." }, { status: 400 });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        let personId = Number(body.id) || 0;
        const values = [body.firstname.trim(), body.lastname.trim(), body.birthdate || null, body.gender || null, body.email || null, body.phone || null, body.image_id || null, body.celebration_image_id || null, body.active ? 1 : 0];
        if (personId) {
            await connection.query("UPDATE persons SET firstname=?, lastname=?, birthdate=?, gender=?, email=?, phone=?, image_id=?, celebration_image_id=?, active=? WHERE id=?", [...values, personId]);
        } else {
            const [insert] = await connection.query<ResultSetHeader>("INSERT INTO persons (firstname, lastname, birthdate, gender, email, phone, image_id, celebration_image_id, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", values);
            personId = insert.insertId;
        }

        const membershipInputs: MembershipInput[] = Array.isArray(body.memberships) ? body.memberships.filter((item: unknown): item is MembershipInput => isMembership(item) && Number(item.team_id) > 0 && membershipRoles.has(String(item.membership_role))) : [];
        const memberships = [...new Map(membershipInputs.map((item) => [`${Number(item.team_id)}:${String(item.membership_role)}`, item])).values()];
        const requestedRoles = new Set<string>(Array.isArray(body.roles) ? body.roles.map(String) : []);
        memberships.forEach((item) => requestedRoles.add(String(item.membership_role)));
        await connection.query("DELETE FROM person_roles WHERE person_id = ?", [personId]);
        const roleCodes = [...requestedRoles];
        if (roleCodes.length) {
            const [validRoles] = await connection.query<RowDataPacket[]>(`SELECT id, code FROM roles WHERE code IN (${roleCodes.map(() => "?").join(",")})`, roleCodes);
            if (validRoles.length) await connection.query("INSERT INTO person_roles (person_id, role_id) VALUES ?", [validRoles.map((role) => [personId, role.id])]);
        }

        await connection.query("DELETE FROM team_memberships WHERE person_id = ?", [personId]);
        if (memberships.length) {
            await connection.query("INSERT INTO team_memberships (team_id, person_id, membership_role, jersey_number) VALUES ?", [memberships.map((item) => [Number(item.team_id), personId, String(item.membership_role), Number(item.jersey_number) || null])]);
        }

        if (requestedRoles.has("volunteer")) await connection.query("INSERT INTO volunteers (person_id) VALUES (?) ON DUPLICATE KEY UPDATE person_id=VALUES(person_id)", [personId]);
        else await connection.query("DELETE FROM volunteers WHERE person_id = ?", [personId]);

        await connection.commit();
        return NextResponse.json({ success: true, id: personId });
    } catch (error) {
        await connection.rollback();
        console.error("Person save error:", error);
        return NextResponse.json({ error: "Impossible d’enregistrer cette personne." }, { status: 500 });
    } finally { connection.release(); }
}

export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = Number(request.nextUrl.searchParams.get("id"));
    if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "ID invalide." }, { status: 400 });
    await pool.query("DELETE FROM persons WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
}
