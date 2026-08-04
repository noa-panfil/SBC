import { ShopPersonalization } from "@/types/shop";

function isPersonalization(value: unknown): value is ShopPersonalization {
    if (!value || typeof value !== "object") return false;
    const item = value as Partial<ShopPersonalization>;
    return (item.type === "text" || item.type === "number") &&
        (item.placement === "front" || item.placement === "back") &&
        typeof item.value === "string" && item.value.length > 0 && item.value.length <= 30;
}

export function parseStoredPersonalizations(
    json: unknown,
    legacy?: { type: unknown; placement: unknown; value: unknown }
): ShopPersonalization[] {
    let parsed: unknown = json;
    if (typeof json === "string" && json.trim()) {
        try { parsed = JSON.parse(json); } catch { parsed = null; }
    }
    if (Array.isArray(parsed)) {
        const items = parsed.filter(isPersonalization).slice(0, 2);
        if (items.length && new Set(items.map((item) => item.type)).size === items.length) return items;
    }
    const fallback = legacy && { type: legacy.type, placement: legacy.placement, value: legacy.value };
    return isPersonalization(fallback) ? [fallback] : [];
}

export function personalizationText(personalization: ShopPersonalization): string {
    return `${personalization.type === "text" ? "Texte" : "Numéro"} « ${personalization.value} » (${personalization.placement === "front" ? "devant" : "dos"})`;
}
