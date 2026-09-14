import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getAdminSession } from "@/lib/shop/auth";

type ContactListRow = RowDataPacket & {
    id: number;
    kind: "contact" | "partnership";
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    organization: string | null;
    status: "new" | "processed";
    notification_email_status: "pending" | "sending" | "sent" | "failed";
    created_at: Date;
    processed_at: Date | null;
};

export async function GET(request: NextRequest) {
    if (!await getAdminSession()) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim().slice(0, 100) || "";
    const requestedStatus = searchParams.get("status");
    const requestedKind = searchParams.get("kind");
    const status = requestedStatus === "new" || requestedStatus === "processed" ? requestedStatus : null;
    const kind = requestedKind === "contact" || requestedKind === "partnership" ? requestedKind : null;
    const conditions: string[] = [];
    const values: string[] = [];

    if (status) {
        conditions.push("status = ?");
        values.push(status);
    }
    if (kind) {
        conditions.push("kind = ?");
        values.push(kind);
    }
    if (search) {
        conditions.push("(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR organization LIKE ?)");
        const term = `%${search}%`;
        values.push(term, term, term, term);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [[counts], [rows]] = await Promise.all([
        pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) AS total,
                    SUM(status = 'new') AS new_count,
                    SUM(kind = 'partnership') AS partnership_count
             FROM contact_messages`
        ),
        pool.query<ContactListRow[]>(
            `SELECT id, kind, first_name, last_name, email, phone, organization, status,
                    notification_email_status, created_at, processed_at
             FROM contact_messages
             ${where}
             ORDER BY status = 'new' DESC, created_at DESC
             LIMIT 250`,
            values
        ),
    ]);

    return NextResponse.json({
        counts: {
            total: Number(counts[0]?.total || 0),
            new: Number(counts[0]?.new_count || 0),
            partnerships: Number(counts[0]?.partnership_count || 0),
        },
        contacts: rows.map((row) => ({
            id: Number(row.id), kind: row.kind, firstName: row.first_name, lastName: row.last_name,
            email: row.email, phone: row.phone, organization: row.organization, status: row.status,
            notificationEmailStatus: row.notification_email_status, createdAt: row.created_at,
            processedAt: row.processed_at,
        })),
    });
}
