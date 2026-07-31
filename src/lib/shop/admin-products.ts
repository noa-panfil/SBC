import pool from "@/lib/shop/db";
import { RowDataPacket } from "mysql2";
import { ShopProduct } from "@/types/shop";

type ProductRow = RowDataPacket & { id: number; name: string; slug: string; description: string; is_active: number; display_order: number };
type ImageRow = RowDataPacket & { id: number; product_id: number; image_id: number; is_primary: number; display_order: number };
type VariantRow = RowDataPacket & { id: number; product_id: number; sku: string | null; size: string; color: string; price_cents: number; is_active: number; display_order: number };

export async function getAdminProducts(): Promise<ShopProduct[]> {
    const [products] = await pool.query<ProductRow[]>(
        "SELECT id, name, slug, description, is_active, display_order FROM shop_products ORDER BY display_order, id"
    );
    if (!products.length) return [];
    const ids = products.map((product) => product.id);
    const placeholders = ids.map(() => "?").join(",");
    const [images] = await pool.query<ImageRow[]>(
        `SELECT id, product_id, image_id, is_primary, display_order FROM shop_product_images
         WHERE product_id IN (${placeholders}) ORDER BY is_primary DESC, display_order, id`, ids
    );
    const [variants] = await pool.query<VariantRow[]>(
        `SELECT id, product_id, sku, size, color, price_cents, is_active, display_order FROM shop_product_variants
         WHERE product_id IN (${placeholders}) ORDER BY display_order, id`, ids
    );
    return products.map((product) => ({
        id: Number(product.id), name: product.name, slug: product.slug, description: product.description,
        isActive: Boolean(product.is_active), displayOrder: product.display_order,
        images: images.filter((image) => image.product_id === product.id).map((image) => ({
            id: Number(image.id), imageId: Number(image.image_id), url: `/api/shop/images/${image.image_id}`,
            isPrimary: Boolean(image.is_primary), displayOrder: image.display_order,
        })),
        variants: variants.filter((variant) => variant.product_id === product.id).map((variant) => ({
            id: Number(variant.id), productId: Number(variant.product_id), sku: variant.sku,
            size: variant.size, color: variant.color, priceCents: variant.price_cents,
            isActive: Boolean(variant.is_active), displayOrder: variant.display_order,
        })),
    }));
}
