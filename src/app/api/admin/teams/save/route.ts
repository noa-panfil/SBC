import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";

const membershipRoles = new Set(["player", "coach", "assistant_coach"]);

type MemberInput = {
    person_id?: unknown;
    membership_role?: unknown;
    jersey_number?: unknown;
};

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const teamId = Number(body?.teamId);
    const name = String(body?.name || "").trim();
    if (!Number.isSafeInteger(teamId) || teamId < 1 || !name) {
        return NextResponse.json({ error: "Équipe ou nom invalide." }, { status: 400 });
    }

    const rawMembers: MemberInput[] = Array.isArray(body.members) ? body.members : [];
    const trainingSlots = [...new Set<string>(Array.isArray(body.trainingSlots)
        ? body.trainingSlots.map((slot: unknown) => String(slot).trim()).filter(Boolean)
        : [])];
    if (trainingSlots.some((slot: string) => slot.length > 255)) {
        return NextResponse.json({ error: "Un créneau d’entraînement est trop long." }, { status: 400 });
    }
    const normalizedMembers = rawMembers.map((member) => ({
        personId: Number(member.person_id),
        role: String(member.membership_role || ""),
        jerseyNumber: member.jersey_number === null || member.jersey_number === "" || member.jersey_number === undefined
            ? null
            : Number(member.jersey_number),
    }));

    if (normalizedMembers.some((member) =>
        !Number.isSafeInteger(member.personId) || member.personId < 1 ||
        !membershipRoles.has(member.role) ||
        (member.jerseyNumber !== null && (!Number.isSafeInteger(member.jerseyNumber) || member.jerseyNumber < 0 || member.jerseyNumber > 999))
    )) {
        return NextResponse.json({ error: "Tous les joueurs et coachs doivent être des personnes existantes." }, { status: 400 });
    }

    const uniqueMembers = [...new Map(normalizedMembers.map((member) => [`${member.personId}:${member.role}`, member])).values()];
    const personIds = [...new Set(uniqueMembers.map((member) => member.personId))];
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [teamRows] = await connection.query<RowDataPacket[]>("SELECT id FROM teams WHERE id = ? FOR UPDATE", [teamId]);
        if (!teamRows.length) {
            await connection.rollback();
            return NextResponse.json({ error: "Équipe introuvable." }, { status: 404 });
        }

        if (personIds.length) {
            const placeholders = personIds.map(() => "?").join(",");
            const [personRows] = await connection.query<RowDataPacket[]>(`SELECT id FROM persons WHERE id IN (${placeholders})`, personIds);
            if (personRows.length !== personIds.length) {
                await connection.rollback();
                return NextResponse.json({ error: "Une personne sélectionnée n’existe plus." }, { status: 400 });
            }
        }

        await connection.query(
            "UPDATE teams SET name = ?, image_id = ?, story_image_id = ?, category = ?, widget_id = ? WHERE id = ?",
            [
                name,
                Number(body.bannerId) || null,
                Number(body.storyImageId) || null,
                String(body.category || "") || null,
                String(body.widgetId || "") || null,
                teamId,
            ]
        );

        await connection.query("DELETE FROM team_training_slots WHERE team_id = ?", [teamId]);
        if (trainingSlots.length) {
            await connection.query(
                "INSERT INTO team_training_slots (team_id, schedule_text, display_order) VALUES ?",
                [trainingSlots.map((slot: string, index: number) => [teamId, slot, index])]
            );
        }

        await connection.query("DELETE FROM team_memberships WHERE team_id = ?", [teamId]);
        if (uniqueMembers.length) {
            await connection.query(
                "INSERT INTO team_memberships (team_id, person_id, membership_role, jersey_number) VALUES ?",
                [uniqueMembers.map((member) => [teamId, member.personId, member.role, member.role === "player" ? member.jerseyNumber : null])]
            );

            for (const member of uniqueMembers) {
                await connection.query(
                    "INSERT IGNORE INTO person_roles (person_id, role_id) SELECT ?, id FROM roles WHERE code = ?",
                    [member.personId, member.role]
                );
            }
        }

        await connection.commit();
        return NextResponse.json({ success: true });
    } catch (error) {
        await connection.rollback();
        console.error("Team save error:", error);
        return NextResponse.json({ error: "Impossible d’enregistrer l’équipe." }, { status: 500 });
    } finally {
        connection.release();
    }
}
