import { requireAdminPage } from "@/lib/shop/admin-page";
import ProductsManager from "./ProductsManager";

export default async function AdminShopProductsPage() { await requireAdminPage(); return <ProductsManager />; }

