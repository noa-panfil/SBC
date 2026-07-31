export const SHOP_MAX_QUANTITY = 10;
export const SHOP_MAX_LINES = 25;
export const SHOP_CURRENCY = "EUR";

export function formatEuros(cents: number): string {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: SHOP_CURRENCY,
    }).format(cents / 100);
}

