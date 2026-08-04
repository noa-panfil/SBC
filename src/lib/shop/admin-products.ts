import pool from "@/lib/shop/db";
import { RowDataPacket } from "mysql2";
import { ShopProduct } from "@/types/shop";

type ProductRow = RowDataPacket & {
    id: number; name: string; slug: string; description: string; is_active: number; display_order: number;
    personalization_enabled: number; personalization_price_cents: number;
    personalization_text_enabled: number; personalization_number_enabled: number;
    personalization_front_enabled: number; personalization_back_enabled: number;
    personalization_text_front_enabled: number; personalization_text_back_enabled: number;
    personalization_number_front_enabled: number; personalization_number_back_enabled: number;
    collection_id: number | null; collection_name: string | null; collection_slug: string | null;
    collection_description: string | null; collection_banner_image_id: number | null;
    collection_is_active: number | null; collection_display_order: number | null;
};
type ImageRow = RowDataPacket & { id: number; product_id: number; image_id: number; color: string | null; is_primary: number; display_order: number };
type VariantRow = RowDataPacket & { id: number; product_id: number; sku: string | null; size: string; color: string; color_hex: string | null; price_cents: number; is_active: number; display_order: number };

export async function getAdminProducts(): Promise<ShopProduct[]> {
    const [products] = await pool.query<ProductRow[]>(
        `SELECT p.id, p.name, p.slug, p.description, p.is_active, p.display_order, p.collection_id,
                p.personalization_enabled, p.personalization_price_cents, p.personalization_text_enabled,
                p.personalization_number_enabled, p.personalization_front_enabled, p.personalization_back_enabled,
                p.personalization_text_front_enabled, p.personalization_text_back_enabled,
                p.personalization_number_front_enabled, p.personalization_number_back_enabled,
                c.name AS collection_name, c.slug AS collection_slug, c.description AS collection_description,
                c.banner_image_id AS collection_banner_image_id,
                c.is_active AS collection_is_active, c.display_order AS collection_display_order
         FROM shop_products p
         LEFT JOIN shop_collections c ON c.id = p.collection_id
         ORDER BY CASE WHEN c.id IS NULL THEN 1 ELSE 0 END, c.display_order, c.id, p.display_order, p.id`
    );
    if (!products.length) return [];
    const ids = products.map((product) => product.id);
    const placeholders = ids.map(() => "?").join(",");
    const [images] = await pool.query<ImageRow[]>(
        `SELECT id, product_id, image_id, color, is_primary, display_order FROM shop_product_images
         WHERE product_id IN (${placeholders}) ORDER BY is_primary DESC, display_order, id`, ids
    );
    const [variants] = await pool.query<VariantRow[]>(
        `SELECT id, product_id, sku, size, color, color_hex, price_cents, is_active, display_order FROM shop_product_variants
         WHERE product_id IN (${placeholders}) ORDER BY display_order, id`, ids
    );
    return products.map((product) => ({
        id: Number(product.id), name: product.name, slug: product.slug, description: product.description,
        isActive: Boolean(product.is_active), displayOrder: product.display_order,
        personalizationEnabled: Boolean(product.personalization_enabled),
        personalizationPriceCents: Number(product.personalization_price_cents),
        personalizationTextEnabled: Boolean(product.personalization_text_enabled),
        personalizationNumberEnabled: Boolean(product.personalization_number_enabled),
        personalizationFrontEnabled: Boolean(product.personalization_front_enabled),
        personalizationBackEnabled: Boolean(product.personalization_back_enabled),
        personalizationTextFrontEnabled: Boolean(product.personalization_text_front_enabled),
        personalizationTextBackEnabled: Boolean(product.personalization_text_back_enabled),
        personalizationNumberFrontEnabled: Boolean(product.personalization_number_front_enabled),
        personalizationNumberBackEnabled: Boolean(product.personalization_number_back_enabled),
        collectionId: product.collection_id == null ? null : Number(product.collection_id),
        collection: product.collection_id == null ? null : {
            id: Number(product.collection_id), name: product.collection_name!, slug: product.collection_slug!,
            description: product.collection_description || "",
            bannerImageId: product.collection_banner_image_id == null ? null : Number(product.collection_banner_image_id),
            bannerImageUrl: product.collection_banner_image_id == null ? null : `/api/shop/images/${product.collection_banner_image_id}`,
            isActive: Boolean(product.collection_is_active),
            displayOrder: Number(product.collection_display_order || 0),
        },
        images: images.filter((image) => image.product_id === product.id).map((image) => ({
            id: Number(image.id), imageId: Number(image.image_id), url: `/api/shop/images/${image.image_id}`,
            color: image.color, isPrimary: Boolean(image.is_primary), displayOrder: image.display_order,
        })),
        variants: variants.filter((variant) => variant.product_id === product.id).map((variant) => ({
            id: Number(variant.id), productId: Number(variant.product_id), sku: variant.sku,
            size: variant.size, color: variant.color, colorHex: variant.color_hex, priceCents: variant.price_cents,
            isActive: Boolean(variant.is_active), displayOrder: variant.display_order,
        })),
    }));
}
