import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
    const session = await getServerSession();

    if (!session) {
        redirect("/admin/login");
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold text-sbc-dark mb-4">Dashboard Admin</h1>
            <p className="text-gray-600">Bienvenue, {session.user?.email}</p>
            <div className="bg-white p-6 rounded shadow mt-8">
                <p>Le dashboard sera développé prochainement.</p>
            </div>
        </div>
    );
}
