"use client";

import { CartLine } from "@/types/shop";
import { SHOP_MAX_LINES, SHOP_MAX_QUANTITY } from "./constants";

const KEY = "sbc-shop-cart-v1";
const EVENT = "sbc-shop-cart-change";

function validLine(value: unknown): value is CartLine {
    if (!value || typeof value !== "object") return false;
    const line = value as CartLine;
    return Number.isSafeInteger(line.variantId) && line.variantId > 0 && Number.isSafeInteger(line.productId) && line.productId > 0 &&
        typeof line.productName === "string" && typeof line.size === "string" && typeof line.color === "string" &&
        Number.isInteger(line.priceCents) && line.priceCents > 0 && Number.isInteger(line.quantity) &&
        line.quantity >= 1 && line.quantity <= SHOP_MAX_QUANTITY;
}

export function readCart(): CartLine[] {
    if (typeof window === "undefined") return [];
    try {
        const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
        return Array.isArray(parsed) ? parsed.filter(validLine).slice(0, SHOP_MAX_LINES) : [];
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
    const existing = lines.find((item) => item.variantId === line.variantId);
    if (existing) {
        const quantity = Math.min(SHOP_MAX_QUANTITY, existing.quantity + line.quantity);
        writeCart(lines.map((item) => item.variantId === line.variantId ? { ...item, quantity } : item));
        return { success: true, message: quantity === SHOP_MAX_QUANTITY ? "Quantité maximale atteinte dans le panier." : "Quantité mise à jour dans le panier." };
    }
    if (lines.length >= SHOP_MAX_LINES) return { success: false, message: "Le panier contient déjà le nombre maximal d'articles différents." };
    writeCart([...lines, { ...line, quantity: Math.min(SHOP_MAX_QUANTITY, line.quantity) }]);
    return { success: true, message: "Article ajouté au panier." };
}

