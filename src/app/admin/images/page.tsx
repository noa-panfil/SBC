import { Metadata } from "next";
import AdminImagesManager from "./AdminImagesManager";

export const metadata: Metadata = {
    title: "Médiathèque - Administration",
};

export default function AdminImagesPage() {
    return (
        <main className="container mx-auto px-4 py-8">
            <AdminImagesManager />
        </main>
    );
}
