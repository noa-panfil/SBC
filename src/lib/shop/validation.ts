import { SHOP_MAX_LINES, SHOP_MAX_QUANTITY } from "./constants";

type CheckoutLine = { variantId: number; quantity: number };
export type CheckoutPayload = {
    items: CheckoutLine[];
    customer: { firstName: string; lastName: string; email: string; phone: string };
    termsAccepted: true;
    pickupAcknowledged: true;
};

function text(value: unknown, max: number): string | null {
    if (typeof value !== "string") return null;
    const cleaned = value.trim();
    return cleaned.length > 0 && cleaned.length <= max ? cleaned : null;
}

export function parsePositiveId(value: unknown): number | null {
    const id = typeof value === "string" ? Number(value) : value;
    return typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function parseCheckoutPayload(value: unknown): CheckoutPayload | null {
    if (!value || typeof value !== "object") return null;
    const body = value as Record<string, unknown>;
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > SHOP_MAX_LINES) return null;

    const combined = new Map<number, number>();
    for (const item of body.items) {
        if (!item || typeof item !== "object") return null;
        const candidate = item as Record<string, unknown>;
        const variantId = parsePositiveId(candidate.variantId);
        const quantity = candidate.quantity;
        if (!variantId || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > SHOP_MAX_QUANTITY) return null;
        const total = (combined.get(variantId) || 0) + quantity;
        if (total > SHOP_MAX_QUANTITY) return null;
        combined.set(variantId, total);
    }

    const customer = body.customer;
    if (!customer || typeof customer !== "object") return null;
    const details = customer as Record<string, unknown>;
    const firstName = text(details.firstName, 100);
    const lastName = text(details.lastName, 100);
    const email = text(details.email, 254)?.toLowerCase() || null;
    const phone = text(details.phone, 40);
    if (!firstName || !lastName || !email || !phone || !/^\S+@\S+\.\S+$/.test(email)) return null;
    if (body.termsAccepted !== true || body.pickupAcknowledged !== true) return null;

    return {
        items: Array.from(combined, ([variantId, quantity]) => ({ variantId, quantity })),
        customer: { firstName, lastName, email, phone },
        termsAccepted: true,
        pickupAcknowledged: true,
    };
}

export function cleanProductInput(value: unknown) {
    if (!value || typeof value !== "object") return null;
    const body = value as Record<string, unknown>;
    const name = text(body.name, 160);
    const slug = text(body.slug, 180)?.toLowerCase();
    const description = typeof body.description === "string" && body.description.length <= 10000 ? body.description.trim() : null;
    const displayOrder = typeof body.displayOrder === "number" && Number.isInteger(body.displayOrder) && Math.abs(body.displayOrder) <= 100000 ? body.displayOrder : null;
    if (!name || !slug || description === null || displayOrder === null || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
    return { name, slug, description, isActive: body.isActive === true, displayOrder };
}

export function cleanVariantInput(value: unknown) {
    if (!value || typeof value !== "object") return null;
    const body = value as Record<string, unknown>;
    const size = text(body.size, 80);
    const color = text(body.color, 100);
    const sku = body.sku == null || body.sku === "" ? null : text(body.sku, 100);
    const priceCents = body.priceCents;
    const displayOrder = body.displayOrder;
    if (!size || !color || (body.sku && !sku) || typeof priceCents !== "number" || !Number.isInteger(priceCents) || priceCents < 1 || priceCents > 10_000_000) return null;
    if (typeof displayOrder !== "number" || !Number.isInteger(displayOrder) || Math.abs(displayOrder) > 100000) return null;
    return { size, color, sku, priceCents, isActive: body.isActive === true, displayOrder };
}

