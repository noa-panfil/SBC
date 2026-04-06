"use client";

import { useState } from "react";
import Link from "next/link";
import VolunteerOTMManager from "./VolunteerOTMManager";
import InstallPWA from "@/components/InstallPWA";
import ChangePasswordModal from "./ChangePasswordModal";

export default function VolunteerDashboardWrapper({ 
    session, 
    otmMatches, 
    currentPersonId, 
    volunteerImageId 
}: { 
    session: any, 
    otmMatches: any[], 
    currentPersonId: number | null, 
    volunteerImageId: number | null 
}) {
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-10 pb-20 overflow-x-hidden">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/90 backdrop-blur-md sticky top-0 md:top-4 z-40 p-6 md:rounded-2xl shadow-sm border-b md:border border-gray-100 md:border-white/20">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <i className="fas fa-hand-holding-heart text-sbc"></i>
                        Espace Bénévole
                    </h1>
                    <p className="text-xs md:text-sm text-gray-500 font-medium truncate">
                        Bonjour <span className="text-sbc font-bold">{session.user.name}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <InstallPWA />
                    <button 
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 font-bold text-sm hover:bg-gray-100 transition shadow-sm border border-gray-100 whitespace-nowrap"
                    >
                        <i className="fas fa-lock"></i>
                        <span>Mot de passe</span>
                    </button>
                    <Link href="#otm-planning" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 font-bold text-sm hover:bg-orange-100 transition shadow-sm border border-orange-100 whitespace-nowrap">
                        <i className="fas fa-calendar-alt"></i>
                        <span>Planning OTM</span>
                    </Link>
                </div>
            </header>

            <section id="otm-planning" className="mt-12 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight whitespace-nowrap text-orange-600">
                        <i className="fas fa-clipboard-list mr-2"></i>
                        Missions Disponibles
                    </h2>
                    <div className="h-px flex-grow bg-gray-100"></div>
                </div>
                <VolunteerOTMManager 
                    matches={otmMatches} 
                    currentUser={session.user.name} 
                    currentPersonId={currentPersonId === null ? undefined : currentPersonId} 
                    volunteerImageId={volunteerImageId} 
                />
            </section>

            <ChangePasswordModal 
                isOpen={isPasswordModalOpen} 
                onClose={() => setIsPasswordModalOpen(false)} 
            />
        </div>
    );
}
