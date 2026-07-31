"use client";

import { useCallback, useEffect, useState } from "react";
import { CartLine } from "@/types/shop";
import { readCart, subscribeCart, writeCart } from "@/lib/shop/cart";
import { SHOP_MAX_QUANTITY } from "@/lib/shop/constants";

export function useShopCart() {
    const [lines, setLines] = useState<CartLine[]>([]);
    const refresh = useCallback(() => setLines(readCart()), []);
    useEffect(() => {
        const timer = window.setTimeout(refresh, 0);
        const unsubscribe = subscribeCart(refresh);
        return () => { window.clearTimeout(timer); unsubscribe(); };
    }, [refresh]);
    const updateQuantity = (variantId: number, quantity: number) => {
        if (!Number.isInteger(quantity)) return;
        if (quantity <= 0) writeCart(lines.filter((line) => line.variantId !== variantId));
        else writeCart(lines.map((line) => line.variantId === variantId ? { ...line, quantity: Math.min(SHOP_MAX_QUANTITY, quantity) } : line));
    };
    const remove = (variantId: number) => writeCart(lines.filter((line) => line.variantId !== variantId));
    return { lines, updateQuantity, remove, count: lines.reduce((sum, line) => sum + line.quantity, 0),
        totalCents: lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0) };
}
