import { requireAdminPage } from "@/lib/shop/admin-page";
import OrdersManager from "./OrdersManager";

export default async function AdminShopOrdersPage() { await requireAdminPage(); return <OrdersManager />; }

