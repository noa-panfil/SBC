import { Metadata } from "next";
import { requireAdminPage } from "@/lib/shop/admin-page";
import ContactDetail from "./ContactDetail";

export const metadata: Metadata = { title: "Fiche contact" };

export default async function AdminContactPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdminPage();
    const { id } = await params;
    return <ContactDetail id={id} />;
}
