"use client";

import Header from "./Header";
import Footer from "./Footer";
import { usePathname } from "next/navigation";

import { PWARegistration } from "@/components/PushSubscriptionManager";

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith("/admin") || pathname?.startsWith("/coach") || pathname === "/login" || pathname?.startsWith("/widget");

    return (
        <>
            <PWARegistration />
            {!isDashboard && <Header />}
            {children}
            {!isDashboard && <Footer />}
        </>
    );
}

