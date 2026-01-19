import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CoachLayoutClient from "./CoachLayoutClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "SBC - Espace Coach",
        template: "%s | SBC Coach"
    },
    description: "Espace réservé aux coachs du Seclin Basket Club.",
};

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
    const session: any = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    // Optional: Restrict to coach role. 
    // If Admin wants to access, they can, but the UI might assume they have a personId linked to a team.
    // Ideally Admin should not access this directly unless we mock a logged in coach.
    // For now, strict check:
    if (session.user.role !== 'coach') {
        redirect("/admin");
    }

    return <CoachLayoutClient>{children}</CoachLayoutClient>;
}
