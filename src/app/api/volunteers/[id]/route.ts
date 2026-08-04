import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function positiveId(value: string): number | null {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = positiveId((await params).id);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!id || !body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const updates: string[] = [];
    const values: Array<number | null | string> = [];
    if (body.image_id !== undefined) {
        const imageId = body.image_id === null ? null : Number(body.image_id);
        if (imageId !== null && (!Number.isSafeInteger(imageId) || imageId < 1)) {
            return NextResponse.json({ error: "Invalid image" }, { status: 400 });
        }
        updates.push("image_id = ?");
        values.push(imageId);
    }
    if (body.sexe !== undefined) {
        if (body.sexe !== "M" && body.sexe !== "F") {
            return NextResponse.json({ error: "Invalid gender" }, { status: 400 });
        }
        updates.push("sexe = ?");
        values.push(body.sexe);
    }
    if (body.display !== undefined) {
        if (body.display !== true && body.display !== false && body.display !== 0 && body.display !== 1) {
            return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
        }
        updates.push("display = ?");
        values.push(body.display === true || body.display === 1 ? 1 : 0);
    }
    if (!updates.length) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

    try {
        values.push(id);
        await pool.query(`UPDATE volunteers SET ${updates.join(", ")} WHERE id = ?`, values);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Volunteer update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = positiveId((await params).id);
    if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    try {
        await pool.query("DELETE FROM volunteers WHERE id = ?", [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Volunteer delete error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
