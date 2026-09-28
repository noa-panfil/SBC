"use client";

import { useState } from "react";

export default function BuvetteImage() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    return (
        <>
            <button
                type="button"
                aria-label="Ouvrir le menu de la buvette en grand"
                className="group relative block w-full max-w-6xl cursor-zoom-in overflow-hidden rounded-[2rem] border border-gray-200 bg-white text-left shadow-[0_18px_55px_rgba(15,23,42,0.1)] transition hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(8,43,29,0.16)] focus:outline-none focus:ring-4 focus:ring-sbc/20"
                onClick={toggleFullscreen}
            >
                <img
                    src="/menu_buvette.png"
                    alt="Menu Buvette SBC"
                    className="h-auto w-full object-contain transition duration-500 group-hover:scale-[1.01]"
                />
                <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-gray-950/85 px-4 py-2 text-xs font-black text-white opacity-100 shadow-lg backdrop-blur transition sm:opacity-0 sm:group-hover:opacity-100"><i className="fas fa-expand" />Agrandir</span>
            </button>

            <p className="mt-2 text-xs text-gray-400 md:hidden text-center">
                <i className="fas fa-expand mr-1"></i> Appuyez sur l’image pour agrandir et pivoter
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
                            type="button"
                            onClick={(event) => { event.stopPropagation(); setIsFullscreen(false); }}
                            aria-label="Fermer le menu agrandi"
                            className="absolute right-4 top-4 rounded-full bg-black/50 p-3 text-white hover:text-sbc md:hidden"
                        >
                            <i className="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
