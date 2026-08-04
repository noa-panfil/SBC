import pool from "@/lib/shop/db";
import { getShopEnv } from "./env";
import { Resend } from "resend";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { formatEuros } from "./constants";
import { parseStoredPersonalizations, personalizationText } from "./personalizations";

type OrderRow = RowDataPacket & {
    id: number;
    order_number: string;
    customer_first_name: string;
    customer_last_name: string;
    customer_email: string;
    customer_phone: string;
    total_cents: number;
    created_at: Date;
};
type ItemRow = RowDataPacket & {
    product_name: string; sku: string | null; size: string; color: string;
    unit_price_cents: number; quantity: number; line_total_cents: number;
    personalization_type: "text" | "number" | null; personalization_placement: "front" | "back" | null;
    personalization_value: string | null; personalization_price_cents: number;
    personalizations_json: unknown;
};
export type EmailKind = "customer" | "office" | "supplier_sent" | "supplier_received" | "pickup";

const emailColumns: Record<EmailKind, { status: string; sentAt: string }> = {
    customer: { status: "customer_email_status", sentAt: "customer_email_sent_at" },
    office: { status: "office_email_status", sentAt: "office_email_sent_at" },
    supplier_sent: { status: "supplier_sent_email_status", sentAt: "supplier_sent_email_sent_at" },
    supplier_received: { status: "supplier_received_email_status", sentAt: "supplier_received_email_sent_at" },
    pickup: { status: "pickup_email_status", sentAt: "pickup_email_sent_at" },
};

function escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char);
}

async function loadOrder(orderId: number) {
    const [orders] = await pool.query<OrderRow[]>(
        `SELECT id, order_number, customer_first_name, customer_last_name, customer_email,
                customer_phone, total_cents, created_at
         FROM shop_orders WHERE id = ?`, [orderId]
    );
    if (!orders[0]) throw new Error(`Commande boutique introuvable (${orderId}).`);
    const [items] = await pool.query<ItemRow[]>(
        `SELECT product_name, sku, size, color, unit_price_cents, quantity, line_total_cents,
                personalization_type, personalization_placement, personalization_value, personalization_price_cents,
                personalizations_json
         FROM shop_order_items WHERE order_id = ? ORDER BY id`, [orderId]
    );
    return { order: orders[0], items };
}

function itemText(items: ItemRow[]): string {
    return items.map((item) => {
        const personalizations = parseStoredPersonalizations(item.personalizations_json, {
            type: item.personalization_type, placement: item.personalization_placement, value: item.personalization_value,
        });
        const details = personalizations.length
            ? ` — ${personalizations.map(personalizationText).join(" — ")} (+${formatEuros(item.personalization_price_cents)})`
            : "";
        return `- ${item.product_name} — ${item.color}, taille ${item.size}${item.sku ? `, réf. ${item.sku}` : ""}${details} — ${item.quantity} × ${formatEuros(item.unit_price_cents)} = ${formatEuros(item.line_total_cents)}`;
    }).join("\n");
}

function itemHtml(items: ItemRow[]): string {
    return items.map((item) => { const personalizations = parseStoredPersonalizations(item.personalizations_json, {
        type: item.personalization_type, placement: item.personalization_placement, value: item.personalization_value,
    }); return `<tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(item.product_name)}</strong><br><span style="color:#6b7280">${escapeHtml(item.color)} · Taille ${escapeHtml(item.size)}${item.sku ? ` · ${escapeHtml(item.sku)}` : ""}</span>${personalizations.length ? `<br><span style="color:#14532d;font-weight:700">${personalizations.map((personalization) => escapeHtml(personalizationText(personalization))).join("<br>")}<br>Supplément : +${formatEuros(item.personalization_price_cents)}</span>` : ""}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right">${formatEuros(item.line_total_cents)}</td>
    </tr>`; }).join("");
}

function frame(content: string): string {
    return `<div style="margin:0;background:#f3f4f6;padding:24px;font-family:Arial,sans-serif;color:#1f2937">
      <div style="max-width:680px;margin:auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="background:#14532d;color:white;padding:24px"><div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#86efac">Seclin Basket Club</div><div style="font-size:26px;font-weight:800;margin-top:4px">Boutique officielle</div></div>
        <div style="padding:24px">${content}</div>
      </div>
    </div>`;
}

async function claimEmail(orderId: number, kind: EmailKind): Promise<boolean> {
    const column = emailColumns[kind].status;
    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE shop_orders SET ${column} = 'sending'
         WHERE id = ? AND (${column} IN ('pending', 'failed') OR (${column} = 'sending' AND updated_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)))`,
        [orderId]
    );
    return result.affectedRows === 1;
}

async function completeEmail(orderId: number, kind: EmailKind, success: boolean) {
    const { status: statusColumn, sentAt: sentColumn } = emailColumns[kind];
    await pool.query(
        `UPDATE shop_orders SET ${statusColumn} = ?, ${sentColumn} = ${success ? "NOW()" : sentColumn} WHERE id = ?`,
        [success ? "sent" : "failed", orderId]
    );
}

export async function sendShopEmail(orderId: number, kind: EmailKind): Promise<void> {
    if (!await claimEmail(orderId, kind)) return;
    try {
        const { order, items } = await loadOrder(orderId);
        const env = getShopEnv();
        const resend = new Resend(env.resendApiKey);
        const customerName = `${order.customer_first_name} ${order.customer_last_name}`;
        let to: string;
        let subject: string;
        let text: string;
        let html: string;

        if (kind === "customer") {
            to = order.customer_email;
            subject = `Paiement confirmé — commande ${order.order_number}`;
            text = `Bonjour ${order.customer_first_name},\n\nVotre paiement est confirmé.\nCommande : ${order.order_number}\n\n${itemText(items)}\n\nTotal payé : ${formatEuros(order.total_cents)}\n\nVotre commande sera regroupée avec les autres commandes du club puis transmise au fournisseur au début du mois suivant. Le retrait se fera uniquement au club.\n\nUne question ? Répondez à cet e-mail ou écrivez à ${env.replyToEmail}.`;
            html = frame(`<h1 style="font-size:24px;margin:0 0 12px">Paiement confirmé</h1><p>Bonjour ${escapeHtml(order.customer_first_name)},</p><p>Merci ! Votre commande <strong>${escapeHtml(order.order_number)}</strong> est bien payée.</p><table style="width:100%;border-collapse:collapse;margin:20px 0"><tbody>${itemHtml(items)}</tbody></table><p style="font-size:20px;font-weight:800;text-align:right">Total : ${formatEuros(order.total_cents)}</p><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px"><strong>Retrait au club uniquement</strong><br>Les commandes sont regroupées et transmises au fournisseur au début du mois suivant.</div><p style="color:#6b7280">Une question ? Répondez à cet e-mail ou écrivez à ${escapeHtml(env.replyToEmail)}.</p>`);
        } else if (kind === "office") {
            to = env.notificationEmail;
            subject = `Nouvelle commande boutique — ${order.order_number}`;
            const adminUrl = `${env.appUrl}/admin/boutique/commandes/${order.id}`;
            text = `Nouvelle commande boutique\n\nCommande : ${order.order_number}\nDate : ${new Date(order.created_at).toLocaleString("fr-FR")}\nClient : ${customerName}\nE-mail : ${order.customer_email}\nTéléphone : ${order.customer_phone}\n\n${itemText(items)}\n\nTotal payé : ${formatEuros(order.total_cents)}\n\nAdministration : ${adminUrl}`;
            html = frame(`<h1 style="font-size:24px;margin:0 0 12px">Nouvelle commande boutique</h1><p><strong>${escapeHtml(order.order_number)}</strong> · ${new Date(order.created_at).toLocaleString("fr-FR")}</p><p><strong>${escapeHtml(customerName)}</strong><br>${escapeHtml(order.customer_email)}<br>${escapeHtml(order.customer_phone)}</p><table style="width:100%;border-collapse:collapse;margin:20px 0"><tbody>${itemHtml(items)}</tbody></table><p style="font-size:20px;font-weight:800;text-align:right">Total payé : ${formatEuros(order.total_cents)}</p><p><a href="${adminUrl}" style="display:inline-block;background:#15803d;color:white;text-decoration:none;padding:12px 18px;border-radius:9px;font-weight:bold">Ouvrir la commande</a></p>`);
        } else if (kind === "supplier_sent") {
            to = order.customer_email;
            subject = `Votre commande ${order.order_number} a été transmise au fournisseur`;
            text = `Bonjour ${order.customer_first_name},\n\nVotre commande ${order.order_number} a été regroupée avec les autres commandes du club et transmise à notre fournisseur.\n\n${itemText(items)}\n\nNous vous informerons à nouveau lorsque les articles auront été reçus par le club. Le retrait n'est pas encore possible à cette étape.\n\nÀ bientôt au Seclin Basket Club !`;
            html = frame(`<h1 style="font-size:24px;margin:0 0 12px">Commande transmise au fournisseur</h1><p>Bonjour ${escapeHtml(order.customer_first_name)},</p><p>Votre commande <strong>${escapeHtml(order.order_number)}</strong> a été regroupée avec les autres commandes du club et transmise à notre fournisseur.</p><table style="width:100%;border-collapse:collapse;margin:20px 0"><tbody>${itemHtml(items)}</tbody></table><div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px"><strong>Prochaine étape</strong><br>Nous vous informerons lorsque les articles auront été reçus par le club. Le retrait n'est pas encore possible.</div>`);
        } else if (kind === "supplier_received") {
            to = order.customer_email;
            subject = `Votre commande ${order.order_number} a été reçue par le club`;
            text = `Bonjour ${order.customer_first_name},\n\nLes articles de votre commande ${order.order_number} ont été reçus par le club.\n\n${itemText(items)}\n\nLe bureau prépare maintenant les commandes. Merci d'attendre l'e-mail « disponible au club » avant de venir effectuer le retrait.\n\nÀ bientôt au Seclin Basket Club !`;
            html = frame(`<h1 style="font-size:24px;margin:0 0 12px">Commande reçue par le club</h1><p>Bonjour ${escapeHtml(order.customer_first_name)},</p><p>Les articles de votre commande <strong>${escapeHtml(order.order_number)}</strong> ont été reçus par le club.</p><table style="width:100%;border-collapse:collapse;margin:20px 0"><tbody>${itemHtml(items)}</tbody></table><div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px"><strong>Merci de patienter encore un peu</strong><br>Le bureau prépare les commandes. Attendez l'e-mail « disponible au club » avant de venir effectuer le retrait.</div>`);
        } else {
            to = order.customer_email;
            subject = `Votre commande ${order.order_number} est disponible au club`;
            text = `Bonjour ${order.customer_first_name},\n\nVotre commande ${order.order_number} est maintenant disponible. Vous pouvez venir la retirer au club.\n\n${itemText(items)}\n\nÀ bientôt au Seclin Basket Club !`;
            html = frame(`<h1 style="font-size:24px;margin:0 0 12px">Votre commande est disponible</h1><p>Bonjour ${escapeHtml(order.customer_first_name)},</p><p>Votre commande <strong>${escapeHtml(order.order_number)}</strong> est maintenant disponible. Vous pouvez venir la retirer au club.</p><table style="width:100%;border-collapse:collapse;margin:20px 0"><tbody>${itemHtml(items)}</tbody></table><p>À bientôt au Seclin Basket Club !</p>`);
        }

        const result = await resend.emails.send({
            from: env.fromEmail, to, replyTo: env.replyToEmail, subject, html, text,
        }, { idempotencyKey: `shop-${orderId}-${kind}` });
        if (result.error) throw new Error(result.error.message);
        await completeEmail(orderId, kind, true);
    } catch (error) {
        await completeEmail(orderId, kind, false);
        throw error;
    }
}

export async function sendPaidOrderEmails(orderId: number): Promise<void> {
    const results = await Promise.allSettled([
        sendShopEmail(orderId, "customer"),
        sendShopEmail(orderId, "office"),
    ]);
    const failure = results.find((result) => result.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
}
