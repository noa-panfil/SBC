import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export async function requireAdminPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") redirect("/login");
    return session;
}

