import { NextResponse } from "next/server";
import { ResultSetHeader } from "mysql2";
import pool from "@/lib/db";
import { sendContactNotification } from "@/lib/contact/emails";
import { consumeContactRateLimit } from "@/lib/contact/rate-limit";
import { parseContactPayload } from "@/lib/contact/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 15_000) return NextResponse.json({ error: "Message trop volumineux." }, { status: 413 });
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    // Champ leurre : une réponse neutre évite d'aider les robots à contourner le filtre.
    if (typeof body?.website === "string" && body.website.trim()) return NextResponse.json({ success: true });
    const payload = parseContactPayload(body);
    if (!payload) return NextResponse.json({ error: "Vérifiez les informations du formulaire et réessayez." }, { status: 400 });

    try {
        const limit = await consumeContactRateLimit(request);
        if (!limit.allowed) return NextResponse.json({ error: "Trop de messages ont été envoyés. Réessayez dans quelques minutes." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO contact_messages
                (kind, first_name, last_name, email, phone, organization, message, consent_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [payload.kind, payload.firstName, payload.lastName, payload.email, payload.phone, payload.organization, payload.message]
        );
        await sendContactNotification(result.insertId).catch((error) => console.error("Contact notification error:", error));
        return NextResponse.json({ success: true, kind: payload.kind }, { status: 201 });
    } catch (error) {
        console.error("Contact submission error:", error);
        return NextResponse.json({ error: "Le message n’a pas pu être enregistré. Réessayez dans quelques instants." }, { status: 500 });
    }
}
