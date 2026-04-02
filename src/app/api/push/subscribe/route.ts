import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const session: any = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { subscription } = await req.json();
        
        if (!subscription) {
            return NextResponse.json({ error: "No subscription provided" }, { status: 400 });
        }

        const userId = session.user.id;
        const role = session.user.role;
        const subString = JSON.stringify(subscription);

        // Delete existing subscriptions for this user to avoid duplicates if needed, 
        // or just add it. Multiple devices per user are allowed.
        await pool.query(
            "INSERT INTO push_subscriptions (user_id, role, subscription) VALUES (?, ?, ?)",
            [userId, role, subString]
        );

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Push subscribe error:", e);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
