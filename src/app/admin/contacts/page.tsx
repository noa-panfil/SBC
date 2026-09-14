import { Metadata } from "next";
import { requireAdminPage } from "@/lib/shop/admin-page";
import ContactsManager from "./ContactsManager";

export const metadata: Metadata = { title: "Contacts" };

export default async function AdminContactsPage() {
    await requireAdminPage();
    return <ContactsManager />;
}
