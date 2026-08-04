import { requireAdminPage } from "@/lib/shop/admin-page";
import BatchesManager from "./BatchesManager";

export default async function AdminShopBatchesPage() { await requireAdminPage(); return <BatchesManager />; }

