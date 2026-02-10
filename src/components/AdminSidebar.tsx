"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";

const menuItems = [
    { name: "Vue d'ensemble", icon: "fas fa-chart-line", href: "/admin" },
    { name: "Équipes", icon: "fas fa-users", href: "/admin#teams" },
    { name: "Joueurs", icon: "fas fa-user-friends", href: "/admin/players" },
    { name: "OTM", icon: "fas fa-table", href: "/admin#otm" },
    { name: "Événements", icon: "fas fa-calendar-alt", href: "/admin#events" },
    { name: "Stories", icon: "fas fa-mobile-alt", href: "/admin#stories" },
    { name: "Anniversaires", icon: "fas fa-birthday-cake", href: "/admin#birthdays" },
    { name: "Apparence", icon: "fas fa-paint-brush", href: "/admin#appearance" },
    { name: "Médiathèque", icon: "fas fa-images", href: "/admin/images" },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <>
            {/* Desktop Sidebar - Hidden on mobile */}
            <aside
                className={`fixed left-0 top-0 h-screen bg-sbc-dark text-white transition-all duration-300 z-50 hidden md:flex flex-col ${isHovered ? 'w-64' : 'w-20'}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Logo Section */}
                <div className="p-6 flex items-center gap-4 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-sbc flex-shrink-0 flex items-center justify-center font-bold">S</div>
                    <span className={`font-bold text-xl whitespace-nowrap transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>SBC Admin</span>
                </div>

                {/* Navigation */}
                <nav className="flex-grow mt-6 px-3 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-4 p-4 rounded-xl transition-all group ${isActive ? 'bg-sbc text-white shadow-lg shadow-sbc/20' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
                            >
                                <i className={`${item.icon} w-6 text-center text-lg`}></i>
                                <span className={`whitespace-nowrap transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto border-t border-white/5 space-y-2">
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center gap-4 p-4 rounded-xl text-gray-400 hover:text-red-400 hover:bg-white/5 transition-all text-left"
                    >
                        <i className="fas fa-sign-out-alt w-6 text-center"></i>
                        <span className={`whitespace-nowrap ${isHovered ? 'opacity-100' : 'opacity-0'}`}>Déconnexion</span>
                    </button>

                    <Link
                        href="/"
                        className="flex items-center gap-4 p-4 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <i className="fas fa-external-link-alt w-6 text-center"></i>
                        <span className={`whitespace-nowrap ${isHovered ? 'opacity-100' : 'opacity-0'}`}>Voir le site</span>
                    </Link>
                </div>
            </aside>

            {/* Mobile Bottom Navigation - Visible only on mobile */}
            <div className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl border border-white/20 px-6 py-4 z-[100] flex justify-between items-center shadow-2xl rounded-[2rem]">
                {menuItems.slice(0, 5).map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${isActive ? 'bg-sbc/10 text-sbc scale-110 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <i className={`${item.icon} text-2xl`}></i>
                        </Link>
                    );
                })}
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl text-red-400 hover:text-red-600"
                >
                    <i className="fas fa-sign-out-alt text-xl"></i>
                </button>
            </div>
        </>
    );
}
