"use client";

import { useState } from "react";

export default function BuvetteImage() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    return (
        <>
            <div
                className="w-full max-w-6xl bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 cursor-zoom-in"
                onClick={toggleFullscreen}
            >
                <img
                    src="/menu_buvette.png"
                    alt="Menu Buvette SBC"
                    className="w-full h-auto object-contain"
                />
            </div>

            <p className="mt-2 text-xs text-gray-400 md:hidden text-center">
                <i className="fas fa-expand mr-1"></i> Appuyez sur l'image pour agrandir et pivoter
            </p>

            {/* Fullscreen Overlay */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 z-50 bg-black flex items-center justify-center p-0 md:p-10 cursor-zoom-out"
                    onClick={toggleFullscreen}
                >
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src="/menu_buvette.png"
                            alt="Menu Buvette SBC Fullscreen"
                            className="max-w-none max-h-none md:max-w-full md:max-h-full object-contain md:object-contain transform md:transform-none
                            w-[90vh] h-[90vw] rotate-90 md:w-auto md:h-auto md:rotate-0"
                        />
                        <button
                            className="absolute top-4 right-4 text-white hover:text-sbc bg-black/50 p-3 rounded-full md:hidden"
                        >
                            <i className="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
