"use client";

import CoachSidebar from "@/components/CoachSidebar";

export default function CoachLayoutClient({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-gray-50 min-h-screen w-full overflow-x-hidden">
            <CoachSidebar />
            <div className="flex-grow md:pl-20 pb-20 md:pb-0 transition-all duration-300 w-full overflow-x-hidden">
                {children}
            </div>
        </div>
    );
}
