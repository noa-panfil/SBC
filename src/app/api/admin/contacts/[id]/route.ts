import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getAdminSession } from "@/lib/shop/auth";
import { parseContactId } from "@/lib/contact/validation";

type ContactDetailRow = RowDataPacket & {
    id: number;
    kind: "contact" | "partnership";
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    organization: string | null;
    message: string;
    status: "new" | "processed";
    admin_note: string | null;
    processed_at: Date | null;
    processed_by: string | null;
    notification_email_status: "pending" | "sending" | "sent" | "failed";
    notification_email_sent_at: Date | null;
    consent_at: Date;
    created_at: Date;
};

function mapContact(row: ContactDetailRow) {
    return {
        id: Number(row.id), kind: row.kind, firstName: row.first_name, lastName: row.last_name,
        email: row.email, phone: row.phone, organization: row.organization, message: row.message,
        status: row.status, adminNote: row.admin_note, processedAt: row.processed_at,
        processedBy: row.processed_by, notificationEmailStatus: row.notification_email_status,
        notificationEmailSentAt: row.notification_email_sent_at, consentAt: row.consent_at,
        createdAt: row.created_at,
    };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = parseContactId((await params).id);
    if (!id) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    const [rows] = await pool.query<ContactDetailRow[]>(
        `SELECT id, kind, first_name, last_name, email, phone, organization, message,
                status, admin_note, processed_at, processed_by, notification_email_status,
                notification_email_sent_at, consent_at, created_at
         FROM contact_messages WHERE id = ? LIMIT 1`,
        [id]
    );
    if (!rows[0]) return NextResponse.json({ error: "Contact introuvable." }, { status: 404 });
    return NextResponse.json({ contact: mapContact(rows[0]) });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = parseContactId((await params).id);
    const body = await request.json().catch(() => null) as { processed?: boolean; note?: unknown } | null;
    if (!id || typeof body?.processed !== "boolean") {
        return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }
    if (body.note !== undefined && typeof body.note !== "string") {
        return NextResponse.json({ error: "La note interne est invalide." }, { status: 400 });
    }
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) || null : null;
    const [result] = await pool.query<ResultSetHeader>(
        body.processed
            ? `UPDATE contact_messages SET status = 'processed', admin_note = ?,
               processed_at = NOW(), processed_by = ? WHERE id = ?`
            : `UPDATE contact_messages SET status = 'new', admin_note = ?,
               processed_at = NULL, processed_by = NULL WHERE id = ?`,
        body.processed ? [note, session.user?.email || "admin", id] : [note, id]
    );
    if (!result.affectedRows) return NextResponse.json({ error: "Contact introuvable." }, { status: 404 });
    return NextResponse.json({ success: true });
}
