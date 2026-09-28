"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

export default function AdminLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/admin/login";

    if (isLoginPage) return <>{children}</>;

    return (
        <div className="flex min-h-screen w-full overflow-x-hidden bg-[#f5f6f3]">
            <Suspense fallback={<AdminSidebarFallback />}>
                <AdminSidebar />
            </Suspense>
            <div className="flex-grow md:pl-20 pb-20 md:pb-0 transition-all duration-300 w-full overflow-x-hidden">
                {children}
            </div>
        </div>
    );
}

function AdminSidebarFallback() {
    return <><aside className="fixed left-0 top-0 z-50 hidden h-screen w-20 border-r border-white/[0.06] bg-[#061b14] md:block" /><div className="fixed bottom-3 left-3 right-3 z-[100] h-16 rounded-[1.6rem] bg-[#071f17]/95 shadow-2xl md:hidden" /></>;
}
