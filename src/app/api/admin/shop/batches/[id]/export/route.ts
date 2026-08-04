import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/shop/db";
import { getAdminSession } from "@/lib/shop/auth";
import { parsePositiveId } from "@/lib/shop/validation";
import { RowDataPacket } from "mysql2";
import * as XLSX from "xlsx";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await getAdminSession()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const id = parsePositiveId((await params).id);
    if (!id) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    const [batches] = await pool.query<RowDataPacket[]>("SELECT name, period_month FROM shop_supplier_batches WHERE id = ?", [id]);
    if (!batches[0]) return NextResponse.json({ error: "Lot introuvable." }, { status: 404 });
    const [summary] = await pool.query<RowDataPacket[]>(
        `SELECT i.product_name AS Produit, COALESCE(i.sku, '') AS SKU, i.color AS Couleur, i.size AS Taille,
                CASE COALESCE(JSON_UNQUOTE(JSON_EXTRACT(i.personalizations_json, '$[0].type')), i.personalization_type) WHEN 'text' THEN 'Texte' WHEN 'number' THEN 'Numéro' ELSE '' END AS Type_personnalisation_1,
                CASE COALESCE(JSON_UNQUOTE(JSON_EXTRACT(i.personalizations_json, '$[0].placement')), i.personalization_placement) WHEN 'front' THEN 'Devant' WHEN 'back' THEN 'Dos' ELSE '' END AS Emplacement_1,
                COALESCE(JSON_UNQUOTE(JSON_EXTRACT(i.personalizations_json, '$[0].value')), i.personalization_value, '') AS Valeur_personnalisation_1,
                CASE JSON_UNQUOTE(JSON_EXTRACT(i.personalizations_json, '$[1].type')) WHEN 'text' THEN 'Texte' WHEN 'number' THEN 'Numéro' ELSE '' END AS Type_personnalisation_2,
                CASE JSON_UNQUOTE(JSON_EXTRACT(i.personalizations_json, '$[1].placement')) WHEN 'front' THEN 'Devant' WHEN 'back' THEN 'Dos' ELSE '' END AS Emplacement_2,
                COALESCE(JSON_UNQUOTE(JSON_EXTRACT(i.personalizations_json, '$[1].value')), '') AS Valeur_personnalisation_2,
                i.personalization_price_cents / 100 AS Prix_personnalisation_EUR,
                i.unit_price_cents / 100 AS Prix_unitaire_EUR, SUM(i.quantity) AS Quantite_totale
         FROM shop_order_items i INNER JOIN shop_orders o ON o.id = i.order_id
         WHERE o.supplier_batch_id = ? GROUP BY i.product_name, i.sku, i.color, i.size,
                Type_personnalisation_1, Emplacement_1, Valeur_personnalisation_1,
                Type_personnalisation_2, Emplacement_2, Valeur_personnalisation_2,
                i.personalization_price_cents, i.unit_price_cents
         ORDER BY i.product_name, i.color, i.size`, [id]
    );
    const [details] = await pool.query<RowDataPacket[]>(
        `SELECT o.order_number AS Numero_commande, o.created_at AS Date, CONCAT(o.customer_first_name, ' ', o.customer_last_name) AS Client,
                o.customer_email AS Email, o.customer_phone AS Telephone, i.product_name AS Produit,
                COALESCE(i.sku, '') AS SKU, i.color AS Couleur, i.size AS Taille, i.quantity AS Quantite,
                CASE COALESCE(JSON_UNQUOTE(JSON_EXTRACT(i.personalizations_json, '$[0].type')), i.personalization_type) WHEN 'text' THEN 'Texte' WHEN 'number' THEN 'Numéro' ELSE '' END AS Type_personnalisation_1,
                CASE COALESCE(JSON_UNQUOTE(JSON_EXTRACT(i.personalizations_json, '$[0].placement')), i.personalization_placement) WHEN 'front' THEN 'Devant' WHEN 'back' THEN 'Dos' ELSE '' END AS Emplacement_1,
                COALESCE(JSON_UNQUOTE(JSON_EXTRACT(i.personalizations_json, '$[0].value')), i.personalization_value, '') AS Valeur_personnalisation_1,
                CASE JSON_UNQUOTE(JSON_EXTRACT(i.personalizations_json, '$[1].type')) WHEN 'text' THEN 'Texte' WHEN 'number' THEN 'Numéro' ELSE '' END AS Type_personnalisation_2,
                CASE JSON_UNQUOTE(JSON_EXTRACT(i.personalizations_json, '$[1].placement')) WHEN 'front' THEN 'Devant' WHEN 'back' THEN 'Dos' ELSE '' END AS Emplacement_2,
                COALESCE(JSON_UNQUOTE(JSON_EXTRACT(i.personalizations_json, '$[1].value')), '') AS Valeur_personnalisation_2,
                i.personalization_price_cents / 100 AS Prix_personnalisation_EUR,
                i.unit_price_cents / 100 AS Prix_unitaire_EUR, i.line_total_cents / 100 AS Total_ligne_EUR
         FROM shop_orders o INNER JOIN shop_order_items i ON i.order_id = o.id
         WHERE o.supplier_batch_id = ? ORDER BY o.created_at, o.order_number, i.id`, [id]
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary), "Synthèse fournisseur");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(details), "Détail commandes");
    const content = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const safeName = String(batches[0].name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
    return new NextResponse(content, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${safeName || `lot-${id}`}.xlsx"`,
            "Cache-Control": "no-store",
        },
    });
}
