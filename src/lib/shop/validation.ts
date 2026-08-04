import { SHOP_MAX_LINES, SHOP_MAX_QUANTITY } from "./constants";

export type CheckoutPersonalization = { type: "text" | "number"; placement: "front" | "back"; value: string };
type CheckoutLine = { variantId: number; quantity: number; personalizations: CheckoutPersonalization[] };
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

    const combined = new Map<string, CheckoutLine>();
    for (const item of body.items) {
        if (!item || typeof item !== "object") return null;
        const candidate = item as Record<string, unknown>;
        const variantId = parsePositiveId(candidate.variantId);
        const quantity = candidate.quantity;
        if (!variantId || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > SHOP_MAX_QUANTITY) return null;
        const rawPersonalizations = Array.isArray(candidate.personalizations)
            ? candidate.personalizations
            : candidate.personalization == null ? [] : [candidate.personalization];
        if (rawPersonalizations.length > 2) return null;
        const personalizations: CheckoutPersonalization[] = [];
        for (const candidatePersonalization of rawPersonalizations) {
            if (!candidatePersonalization || typeof candidatePersonalization !== "object") return null;
            const raw = candidatePersonalization as Record<string, unknown>;
            const type = raw.type;
            const placement = raw.placement;
            const value = typeof raw.value === "string" ? raw.value.trim() : "";
            if ((type !== "text" && type !== "number") || (placement !== "front" && placement !== "back")) return null;
            if (type === "number" ? !/^\d{1,3}$/.test(value) : value.length < 1 || value.length > 30 || !/^[\p{L}\p{N} .'-]+$/u.test(value)) return null;
            personalizations.push({ type, placement, value });
        }
        if (new Set(personalizations.map((item) => item.type)).size !== personalizations.length) return null;
        personalizations.sort((a, b) => a.type === b.type ? 0 : a.type === "text" ? -1 : 1);
        const key = `${variantId}|${personalizations.map((item) => `${item.type}:${item.placement}:${item.value}`).join("|")}`;
        const total = (combined.get(key)?.quantity || 0) + quantity;
        if (total > SHOP_MAX_QUANTITY) return null;
        combined.set(key, { variantId, quantity: total, personalizations });
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
        items: Array.from(combined.values()),
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
    const collectionId = body.collectionId == null || body.collectionId === "" ? null : parsePositiveId(body.collectionId);
    const personalizationEnabled = body.personalizationEnabled === true;
    const personalizationPriceCents = body.personalizationPriceCents;
    const personalizationTextEnabled = body.personalizationTextEnabled === true;
    const personalizationNumberEnabled = body.personalizationNumberEnabled === true;
    const personalizationFrontEnabled = body.personalizationFrontEnabled === true;
    const personalizationBackEnabled = body.personalizationBackEnabled === true;
    const personalizationTextFrontEnabled = body.personalizationTextFrontEnabled === true;
    const personalizationTextBackEnabled = body.personalizationTextBackEnabled === true;
    const personalizationNumberFrontEnabled = body.personalizationNumberFrontEnabled === true;
    const personalizationNumberBackEnabled = body.personalizationNumberBackEnabled === true;
    if (!name || !slug || description === null || displayOrder === null || (body.collectionId != null && body.collectionId !== "" && !collectionId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
    if (typeof personalizationPriceCents !== "number" || !Number.isInteger(personalizationPriceCents) || personalizationPriceCents < 0 || personalizationPriceCents > 10_000_000 || (personalizationEnabled && personalizationPriceCents < 1)) return null;
    if (personalizationEnabled && (!personalizationTextEnabled && !personalizationNumberEnabled)) return null;
    if (personalizationEnabled && personalizationTextEnabled && !personalizationTextFrontEnabled && !personalizationTextBackEnabled) return null;
    if (personalizationEnabled && personalizationNumberEnabled && !personalizationNumberFrontEnabled && !personalizationNumberBackEnabled) return null;
    return { name, slug, description, isActive: body.isActive === true, displayOrder, collectionId,
        personalizationEnabled, personalizationPriceCents, personalizationTextEnabled,
        personalizationNumberEnabled, personalizationFrontEnabled, personalizationBackEnabled,
        personalizationTextFrontEnabled, personalizationTextBackEnabled,
        personalizationNumberFrontEnabled, personalizationNumberBackEnabled };
}

export function cleanCollectionInput(value: unknown) {
    if (!value || typeof value !== "object") return null;
    const body = value as Record<string, unknown>;
    const name = text(body.name, 160);
    const slug = text(body.slug, 180)?.toLowerCase();
    const description = typeof body.description === "string" && body.description.length <= 2000 ? body.description.trim() : null;
    const bannerImageId = body.bannerImageId == null || body.bannerImageId === "" ? null : parsePositiveId(body.bannerImageId);
    const displayOrder = typeof body.displayOrder === "number" && Number.isInteger(body.displayOrder) && Math.abs(body.displayOrder) <= 100000 ? body.displayOrder : null;
    if (!name || !slug || description === null || displayOrder === null || (body.bannerImageId != null && body.bannerImageId !== "" && !bannerImageId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
    return { name, slug, description, bannerImageId, isActive: body.isActive === true, displayOrder };
}

export function cleanVariantInput(value: unknown) {
    if (!value || typeof value !== "object") return null;
    const body = value as Record<string, unknown>;
    const size = text(body.size, 80);
    const color = text(body.color, 100);
    const colorHex = typeof body.colorHex === "string" && /^#[0-9a-f]{6}$/i.test(body.colorHex)
        ? body.colorHex.toLowerCase()
        : null;
    const sku = body.sku == null || body.sku === "" ? null : text(body.sku, 100);
    const priceCents = body.priceCents;
    const displayOrder = body.displayOrder;
    if (!size || !color || (body.sku && !sku) || typeof priceCents !== "number" || !Number.isInteger(priceCents) || priceCents < 1 || priceCents > 10_000_000) return null;
    if (typeof displayOrder !== "number" || !Number.isInteger(displayOrder) || Math.abs(displayOrder) > 100000) return null;
    return { size, color, colorHex, sku, priceCents, isActive: body.isActive === true, displayOrder };
}
