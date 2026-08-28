export type ShopVariant = {
    id: number;
    productId: number;
    sku: string | null;
    size: string;
    color: string;
    colorHex: string | null;
    priceCents: number;
    isActive: boolean;
    displayOrder: number;
};

export type ShopImage = {
    id: number;
    imageId: number;
    url: string;
    color: string | null;
    isPrimary: boolean;
    displayOrder: number;
};

export type ShopCollection = {
    id: number;
    name: string;
    slug: string;
    description: string;
    bannerImageId: number | null;
    bannerImageUrl: string | null;
    isActive: boolean;
    displayOrder: number;
};

export type ShopProduct = {
    id: number;
    name: string;
    slug: string;
    description: string;
    isActive: boolean;
    displayOrder: number;
    collectionId: number | null;
    collection: ShopCollection | null;
    personalizationEnabled: boolean;
    personalizationPriceCents: number;
    personalizationTextPriceCents: number;
    personalizationNumberPriceCents: number;
    personalizationTextEnabled: boolean;
    personalizationNumberEnabled: boolean;
    personalizationFrontEnabled: boolean;
    personalizationBackEnabled: boolean;
    personalizationTextFrontEnabled: boolean;
    personalizationTextBackEnabled: boolean;
    personalizationNumberFrontEnabled: boolean;
    personalizationNumberBackEnabled: boolean;
    images: ShopImage[];
    variants: ShopVariant[];
};

export type ShopPersonalization = {
    type: "text" | "number";
    placement: "front" | "back";
    value: string;
};

export type CartLine = {
    lineId: string;
    variantId: number;
    productId: number;
    productName: string;
    imageUrl: string | null;
    size: string;
    color: string;
    priceCents: number;
    quantity: number;
    personalizations: ShopPersonalization[];
    personalizationPriceCents: number;
};

export type ShopPaymentStatus = "pending" | "paid" | "failed" | "expired" | "refunded" | "partially_refunded";

export type ShopOrderStatus =
    | "pending_payment"
    | "paid"
    | "sent_to_supplier"
    | "available_for_pickup"
    | "picked_up"
    | "cancelled"
    | "refunded"
    | "payment_failed"
    | "expired";

export type ShopBatchStatus = "draft" | "sent" | "received" | "available" | "cancelled";

export type ShopOrderItem = {
    id: number;
    productName: string;
    sku: string | null;
    size: string;
    color: string;
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
    personalizations: ShopPersonalization[];
    personalizationPriceCents: number;
};

export const SHOP_ORDER_STATUSES: ShopOrderStatus[] = [
    "pending_payment",
    "paid",
    "sent_to_supplier",
    "available_for_pickup",
    "picked_up",
    "cancelled",
    "refunded",
    "payment_failed",
    "expired",
];
