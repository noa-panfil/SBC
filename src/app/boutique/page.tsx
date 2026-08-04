import { Metadata } from "next";
import ShopCatalog from "./ShopCatalog";

export const metadata: Metadata = {
    title: "Boutique | Seclin Basket Club",
    description: "Commandez les vêtements et équipements officiels du Seclin Basket Club.",
};

export default function BoutiquePage() {
    return <main className="min-h-screen"><ShopCatalog /></main>;
}
