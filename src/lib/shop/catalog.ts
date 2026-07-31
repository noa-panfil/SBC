import pool from "@/lib/shop/db";
import { RowDataPacket } from "mysql2";
import { ShopImage, ShopProduct, ShopVariant } from "@/types/shop";

type ProductRow = RowDataPacket & {
    id: number; name: string; slug: string; description: string; is_active: number; display_order: number;
};
type ImageRow = RowDataPacket & {
    id: number; product_id: number; image_id: number; color: string | null; is_primary: number; display_order: number;
};
type VariantRow = RowDataPacket & {
    id: number; product_id: number; sku: string | null; size: string; color: string; color_hex: string | null; price_cents: number; is_active: number; display_order: number;
};

export async function getPublicProducts(): Promise<ShopProduct[]> {
    const [productRows] = await pool.query<ProductRow[]>(
        `SELECT DISTINCT p.id, p.name, p.slug, p.description, p.is_active, p.display_order
         FROM shop_products p
         INNER JOIN shop_product_variants v ON v.product_id = p.id AND v.is_active = 1
         WHERE p.is_active = 1
         ORDER BY p.display_order ASC, p.id ASC`
    );
    if (productRows.length === 0) return [];
    const ids = productRows.map((row) => row.id);
    const placeholders = ids.map(() => "?").join(",");
    const [imageRows] = await pool.query<ImageRow[]>(
        `SELECT id, product_id, image_id, color, is_primary, display_order
         FROM shop_product_images WHERE product_id IN (${placeholders})
         ORDER BY is_primary DESC, display_order ASC, id ASC`,
        ids
    );
    const [variantRows] = await pool.query<VariantRow[]>(
        `SELECT id, product_id, sku, size, color, color_hex, price_cents, is_active, display_order
         FROM shop_product_variants WHERE product_id IN (${placeholders}) AND is_active = 1
         ORDER BY display_order ASC, id ASC`,
        ids
    );

    return productRows.map((row) => ({
        id: Number(row.id),
        name: row.name,
        slug: row.slug,
        description: row.description,
        isActive: Boolean(row.is_active),
        displayOrder: row.display_order,
        images: imageRows.filter((image) => image.product_id === row.id).map<ShopImage>((image) => ({
            id: Number(image.id), imageId: Number(image.image_id), url: `/api/shop/images/${image.image_id}`,
            color: image.color, isPrimary: Boolean(image.is_primary), displayOrder: image.display_order,
        })),
        variants: variantRows.filter((variant) => variant.product_id === row.id).map<ShopVariant>((variant) => ({
            id: Number(variant.id), productId: Number(variant.product_id), sku: variant.sku,
            size: variant.size, color: variant.color, colorHex: variant.color_hex, priceCents: variant.price_cents,
            isActive: Boolean(variant.is_active), displayOrder: variant.display_order,
        })),
    }));
}
