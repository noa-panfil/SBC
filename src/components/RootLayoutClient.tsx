"use client";

import Header from "./Header";
import Footer from "./Footer";
import { usePathname } from "next/navigation";

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith("/admin");

    return (
        <>
            {!isAdmin && <Header />}
            {children}
            {!isAdmin && <Footer />}
        </>
    );
}
