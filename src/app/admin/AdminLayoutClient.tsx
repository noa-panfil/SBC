"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { usePathname } from "next/navigation";

export default function AdminLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/admin/login";

    if (isLoginPage) return <>{children}</>;

    return (
        <div className="flex bg-gray-50 min-h-screen w-full overflow-x-hidden">
            <AdminSidebar />
            <div className="flex-grow md:pl-20 pb-20 md:pb-0 transition-all duration-300 w-full overflow-x-hidden">
                {children}
            </div>
        </div>
    );
}
