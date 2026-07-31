import { NextResponse } from "next/server";
import { getPublicProducts } from "@/lib/shop/catalog";
import { isMissingShopTable } from "@/lib/shop/errors";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const products = await getPublicProducts();
        return NextResponse.json({ products, setupRequired: false });
    } catch (error) {
        if (isMissingShopTable(error)) {
            return NextResponse.json({ products: [], setupRequired: true });
        }
        console.error("Shop products error:", error);
        return NextResponse.json({ error: "Impossible de charger la boutique pour le moment." }, { status: 500 });
    }
}

