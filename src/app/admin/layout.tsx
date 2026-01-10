import { Metadata } from "next";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata: Metadata = {
    title: {
        default: "SBC - Administration",
        template: "%s | SBC Administration"
    },
    description: "Espace d'administration du Seclin Basket Club.",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
