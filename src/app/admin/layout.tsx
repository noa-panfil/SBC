import { Metadata } from "next";

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
    return <>{children}</>;
}
