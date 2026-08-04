"use client";

import { CartLine, ShopPersonalization } from "@/types/shop";
import { SHOP_MAX_LINES, SHOP_MAX_QUANTITY } from "./constants";

const KEY = "sbc-shop-cart-v1";
const EVENT = "sbc-shop-cart-change";

function validPersonalization(value: unknown): value is ShopPersonalization {
    if (!value || typeof value !== "object") return false;
    const personalization = value as ShopPersonalization;
    return (personalization.type === "text" || personalization.type === "number") &&
        (personalization.placement === "front" || personalization.placement === "back") &&
        typeof personalization.value === "string" && personalization.value.length > 0 && personalization.value.length <= 30;
}

export function cartLineId(variantId: number, personalizations: ShopPersonalization[]): string {
    if (!personalizations.length) return `variant-${variantId}`;
    const signature = personalizations.map((item) => `${item.type}:${item.placement}:${item.value}`).join("|");
    return `variant-${variantId}-${encodeURIComponent(signature)}`;
}

function normalizeLine(value: unknown): CartLine | null {
    if (!value || typeof value !== "object") return null;
    const line = value as Partial<CartLine> & { personalization?: (ShopPersonalization & { priceCents?: number }) | null };
    const legacyPersonalization = line.personalization == null ? null : validPersonalization(line.personalization) ? line.personalization : undefined;
    const personalizations = Array.isArray(line.personalizations)
        ? line.personalizations.filter(validPersonalization)
        : legacyPersonalization ? [{ type: legacyPersonalization.type, placement: legacyPersonalization.placement, value: legacyPersonalization.value }] : [];
    const personalizationPriceCents = Number.isInteger(line.personalizationPriceCents)
        ? Number(line.personalizationPriceCents)
        : legacyPersonalization?.priceCents && Number.isInteger(legacyPersonalization.priceCents) ? legacyPersonalization.priceCents : 0;
    const uniqueTypes = new Set(personalizations.map((item) => item.type));
    if (legacyPersonalization === undefined || personalizations.length > 2 || uniqueTypes.size !== personalizations.length || personalizationPriceCents < 0 ||
        (Array.isArray(line.personalizations) && personalizations.length !== line.personalizations.length) ||
        !Number.isSafeInteger(line.variantId) || Number(line.variantId) <= 0 || !Number.isSafeInteger(line.productId) || Number(line.productId) <= 0 ||
        typeof line.productName !== "string" || typeof line.size !== "string" || typeof line.color !== "string" ||
        !Number.isInteger(line.priceCents) || Number(line.priceCents) <= 0 || !Number.isInteger(line.quantity) ||
        Number(line.quantity) < 1 || Number(line.quantity) > SHOP_MAX_QUANTITY) return null;
    const validImage = line.imageUrl == null || typeof line.imageUrl === "string";
    if (!validImage) return null;
    return {
        lineId: cartLineId(Number(line.variantId), personalizations),
        variantId: Number(line.variantId),
        productId: Number(line.productId),
        productName: line.productName,
        imageUrl: line.imageUrl ?? null,
        size: line.size,
        color: line.color,
        priceCents: Number(line.priceCents),
        quantity: Number(line.quantity),
        personalizations,
        personalizationPriceCents,
    };
}

export function readCart(): CartLine[] {
    if (typeof window === "undefined") return [];
    try {
        const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
        return Array.isArray(parsed) ? parsed.map(normalizeLine).filter((line): line is CartLine => line !== null).slice(0, SHOP_MAX_LINES) : [];
    } catch { return []; }
}

export function writeCart(lines: CartLine[]) {
    localStorage.setItem(KEY, JSON.stringify(lines.slice(0, SHOP_MAX_LINES)));
    window.dispatchEvent(new Event(EVENT));
}

export function clearCart() { writeCart([]); }

export function subscribeCart(callback: () => void) {
    window.addEventListener(EVENT, callback);
    window.addEventListener("storage", callback);
    return () => { window.removeEventListener(EVENT, callback); window.removeEventListener("storage", callback); };
}

export function addCartLine(line: CartLine): { success: boolean; message: string } {
    const lines = readCart();
    const existing = lines.find((item) => item.lineId === line.lineId);
    if (existing) {
        const quantity = Math.min(SHOP_MAX_QUANTITY, existing.quantity + line.quantity);
        writeCart(lines.map((item) => item.lineId === line.lineId ? { ...item, quantity } : item));
        return { success: true, message: quantity === SHOP_MAX_QUANTITY ? "Quantité maximale atteinte dans le panier." : "Quantité mise à jour dans le panier." };
    }
    if (lines.length >= SHOP_MAX_LINES) return { success: false, message: "Le panier contient déjà le nombre maximal d'articles différents." };
    writeCart([...lines, { ...line, quantity: Math.min(SHOP_MAX_QUANTITY, line.quantity) }]);
    return { success: true, message: "Article ajouté au panier." };
}
