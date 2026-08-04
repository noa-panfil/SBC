import type { Metadata } from "next";
import CartPageClient from "./CartPageClient";

export const metadata: Metadata = { title: "Panier | Boutique SBC", description: "Votre panier de la boutique du Seclin Basket Club." };
export default function CartPage() { return <CartPageClient />; }

