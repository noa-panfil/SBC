import { requireAdminPage } from "@/lib/shop/admin-page";
import OrderDetail from "./OrderDetail";

export default async function AdminShopOrderPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdminPage(); const { id } = await params; return <OrderDetail id={id} />;
}

