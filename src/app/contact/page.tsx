import type { Metadata } from "next";
import ContactClient from "./ContactClient";
import type { ContactKind } from "@/lib/contact/validation";

export const metadata: Metadata = {
    title: "Contact | Seclin Basket Club",
    description: "Contactez le Seclin Basket Club pour une question, une inscription ou une demande de partenariat.",
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
    const { type } = await searchParams;
    const initialKind: ContactKind = type === "partnership" ? "partnership" : "contact";
    return <ContactClient initialKind={initialKind} />;
}
