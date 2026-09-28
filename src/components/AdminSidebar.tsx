"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { adminFeatures, AdminFeature } from "@/lib/admin-features";

type SidebarItem = Pick<AdminFeature, "key" | "navLabel" | "icon" | "href" | "internal"> & { overview?: boolean };

const overviewItem: SidebarItem = { key: "appearance", navLabel: "Vue d’ensemble", icon: "fa-chart-line", href: "/admin", internal: false, overview: true };
const menuItems: SidebarItem[] = [overviewItem, ...adminFeatures];
const mobileKeys = new Set(["players", "contacts", "shop"]);

export default function AdminSidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeView = searchParams.get("view");
    const [isHovered, setIsHovered] = useState(false);

    const isItemActive = (item: SidebarItem) => {
        if (item.overview) return pathname === "/admin" && !activeView;
        if (item.internal) return pathname === "/admin" && activeView === item.key;
        return pathname === item.href || pathname.startsWith(`${item.href}/`);
    };

    return (
        <>
            {/* Desktop Sidebar - Hidden on mobile */}
            <aside
                className={`fixed left-0 top-0 z-50 hidden h-screen flex-col overflow-hidden border-r border-white/[0.06] bg-[#061b14] text-white shadow-2xl transition-all duration-300 md:flex ${isHovered ? "w-72" : "w-20"}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Logo Section */}
                <div className="flex h-20 shrink-0 items-center gap-4 overflow-hidden border-b border-white/[0.06] px-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg shadow-black/20"><Image src="/logo.png" alt="SBC" width={36} height={36} className="h-full w-full object-contain" /></span>
                    <div className={`whitespace-nowrap transition-all duration-300 ${isHovered ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"}`}><p className="text-sm font-black tracking-tight">SBC Admin</p><p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-400">Centre de contrôle</p></div>
                </div>

                {/* Navigation */}
                <nav className="flex-grow space-y-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {menuItems.map((item) => {
                        const isActive = isItemActive(item);
                        return (
                            <Link
                                key={item.overview ? "overview" : item.key}
                                href={item.href}
                                title={!isHovered ? item.navLabel : undefined}
                                className={`group flex h-12 items-center gap-4 rounded-xl px-3 transition-all ${isActive ? "bg-green-500 text-green-950 shadow-lg shadow-green-950/20" : "text-white/45 hover:bg-white/[0.06] hover:text-white"}`}
                            >
                                <i className={`fas ${item.icon} w-8 shrink-0 text-center text-base`}></i>
                                <span className={`whitespace-nowrap text-sm font-bold transition-all duration-300 ${isHovered ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"}`}>
                                    {item.navLabel}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto shrink-0 space-y-1 border-t border-white/[0.06] p-3">
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex h-12 w-full items-center gap-4 rounded-xl px-3 text-left text-white/40 transition-all hover:bg-red-500/10 hover:text-red-300"
                    >
                        <i className="fas fa-sign-out-alt w-8 text-center"></i>
                        <span className={`whitespace-nowrap text-sm font-bold transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}>Déconnexion</span>
                    </button>

                    <Link
                        href="/"
                        className="flex h-12 items-center gap-4 rounded-xl px-3 text-white/40 transition-all hover:bg-white/[0.06] hover:text-white"
                    >
                        <i className="fas fa-external-link-alt w-8 text-center"></i>
                        <span className={`whitespace-nowrap text-sm font-bold transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}>Voir le site</span>
                    </Link>
                </div>
            </aside>

            {/* Mobile Bottom Navigation - Visible only on mobile */}
            <div className="fixed bottom-3 left-3 right-3 z-[100] flex items-center justify-between rounded-[1.6rem] border border-white/15 bg-[#071f17]/95 px-3 py-2.5 shadow-[0_18px_50px_rgba(7,31,23,.35)] backdrop-blur-xl md:hidden">
                {menuItems.filter((item) => item.overview || mobileKeys.has(item.key)).map((item) => {
                    const isActive = isItemActive(item);
                    return (
                        <Link
                            key={item.overview ? "overview" : item.key}
                            href={item.href}
                            aria-label={item.navLabel}
                            className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${isActive ? "bg-green-400 text-green-950 shadow-lg" : "text-white/45 hover:bg-white/10 hover:text-white"}`}
                        >
                            <i className={`fas ${item.icon} text-lg`}></i>
                        </Link>
                    );
                })}
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    aria-label="Se déconnecter"
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                >
                    <i className="fas fa-sign-out-alt text-lg"></i>
                </button>
            </div>
        </>
    );
}
