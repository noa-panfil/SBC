"use client";

import Header from "./Header";
import Footer from "./Footer";
import { usePathname } from "next/navigation";

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith("/admin") || pathname?.startsWith("/coach") || pathname === "/login";

    return (
        <>
            {!isDashboard && <Header />}
            {children}
            {!isDashboard && <Footer />}
        </>
    );
}
