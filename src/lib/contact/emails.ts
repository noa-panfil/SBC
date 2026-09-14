import { Resend } from "resend";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";

type ContactRow = RowDataPacket & {
    id: number;
    kind: "contact" | "partnership";
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    organization: string | null;
    message: string;
    created_at: Date;
};

function escapeHtml(value: string) {
    return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

function contactEmailEnv() {
    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const isProduction = process.env.NODE_ENV === "production";
    if (!resendApiKey) throw new Error("RESEND_API_KEY est obligatoire pour les notifications contact.");
    if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL est obligatoire pour les notifications contact.");
    const notificationEmail = isProduction
        ? process.env.CONTACT_NOTIFICATION_EMAIL?.trim() || process.env.SHOP_NOTIFICATION_EMAIL?.trim() || "seclinbc@gmail.com"
        : process.env.CONTACT_DEV_NOTIFICATION_EMAIL?.trim();
    if (!notificationEmail) throw new Error("CONTACT_DEV_NOTIFICATION_EMAIL est obligatoire en développement.");
    return {
        resendApiKey,
        appUrl: appUrl.replace(/\/$/, ""),
        fromEmail: process.env.CONTACT_FROM_EMAIL?.trim() || process.env.SHOP_FROM_EMAIL?.trim() || "Seclin Basket Club <contact@seclinbasketclub.fr>",
        notificationEmail,
    };
}

async function claimNotification(id: number) {
    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE contact_messages SET notification_email_status = 'sending'
         WHERE id = ? AND (notification_email_status IN ('pending', 'failed')
            OR (notification_email_status = 'sending' AND updated_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)))`,
        [id]
    );
    return result.affectedRows === 1;
}

async function completeNotification(id: number, success: boolean) {
    await pool.query(
        `UPDATE contact_messages
         SET notification_email_status = ?, notification_email_sent_at = ${success ? "NOW()" : "notification_email_sent_at"}
         WHERE id = ?`,
        [success ? "sent" : "failed", id]
    );
}

export async function sendContactNotification(id: number) {
    if (!await claimNotification(id)) return;
    try {
        const [rows] = await pool.query<ContactRow[]>(
            `SELECT id, kind, first_name, last_name, email, phone, organization, message, created_at
             FROM contact_messages WHERE id = ?`,
            [id]
        );
        const contact = rows[0];
        if (!contact) throw new Error(`Contact introuvable (${id}).`);
        const env = contactEmailEnv();
        const resend = new Resend(env.resendApiKey);
        const typeLabel = contact.kind === "partnership" ? "Demande de partenariat" : "Contact simple";
        const adminUrl = `${env.appUrl}/admin/contacts/${contact.id}`;
        const identity = `${contact.first_name} ${contact.last_name}`;
        const optionalText = [contact.organization ? `Organisation : ${contact.organization}` : null, contact.phone ? `Téléphone : ${contact.phone}` : null].filter(Boolean).join("\n");
        const text = `${typeLabel}\n\nDate : ${new Date(contact.created_at).toLocaleString("fr-FR")}\nExpéditeur : ${identity}\nE-mail : ${contact.email}${optionalText ? `\n${optionalText}` : ""}\n\nMessage :\n${contact.message}\n\nOuvrir la fiche : ${adminUrl}`;
        const html = `<div style="margin:0;background:#f3f4f6;padding:24px;font-family:Arial,sans-serif;color:#1f2937"><div style="max-width:680px;margin:auto;overflow:hidden;border:1px solid #e5e7eb;border-radius:16px;background:#fff"><div style="background:#082b1d;padding:24px;color:#fff"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#86efac">Seclin Basket Club</div><div style="margin-top:5px;font-size:25px;font-weight:800">${escapeHtml(typeLabel)}</div></div><div style="padding:24px"><p style="margin-top:0;color:#6b7280">Reçu le ${new Date(contact.created_at).toLocaleString("fr-FR")}</p><p><strong>${escapeHtml(identity)}</strong><br><a href="mailto:${escapeHtml(contact.email)}" style="color:#15803d">${escapeHtml(contact.email)}</a>${contact.phone ? `<br>${escapeHtml(contact.phone)}` : ""}${contact.organization ? `<br><strong>Organisation :</strong> ${escapeHtml(contact.organization)}` : ""}</p><div style="margin:22px 0;border-left:4px solid #4ade80;border-radius:0 10px 10px 0;background:#f0fdf4;padding:16px;line-height:1.6;white-space:pre-wrap">${escapeHtml(contact.message)}</div><a href="${adminUrl}" style="display:inline-block;border-radius:10px;background:#15803d;padding:12px 18px;color:#fff;text-decoration:none;font-weight:bold">Ouvrir la fiche contact</a></div></div></div>`;
        const result = await resend.emails.send({
            from: env.fromEmail,
            to: env.notificationEmail,
            replyTo: contact.email,
            subject: `${typeLabel} — ${identity}`,
            html,
            text,
        }, { idempotencyKey: `contact-${id}-office` });
        if (result.error) throw new Error(result.error.message);
        await completeNotification(id, true);
    } catch (error) {
        await completeNotification(id, false);
        throw error;
    }
}
