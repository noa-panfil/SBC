import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import { ResultSetHeader } from "mysql2";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, firstname, lastname, birthdate, gender, image_id, email, teamIds } = body;

        let personId = id;

        // Upsert Person
        if (personId) {
            await pool.query(
                "UPDATE persons SET firstname = ?, lastname = ?, birthdate = ?, gender = ?, image_id = ? WHERE id = ?",
                [firstname, lastname, birthdate || null, gender, image_id, personId]
            );
        } else {
            const [res] = await pool.query<ResultSetHeader>(
                "INSERT INTO persons (firstname, lastname, birthdate, gender, image_id) VALUES (?, ?, ?, ?, ?)",
                [firstname, lastname, birthdate || null, gender, image_id]
            );
            personId = res.insertId;
        }

        // Update Teams
        // Delete existing 'Coach' roles
        await pool.query("DELETE FROM team_members WHERE person_id = ? AND role LIKE '%Coach%'", [personId]);

        // Insert new ones
        if (teamIds && teamIds.length > 0) {
            const values = teamIds.map((tid: number) => [tid, personId, 'Coach']);
            await pool.query("INSERT INTO team_members (team_id, person_id, role) VALUES ?", [values]);
        }

        return NextResponse.json({ success: true, id: personId });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
