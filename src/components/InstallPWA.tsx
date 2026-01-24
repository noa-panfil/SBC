"use client";

import { useEffect, useState } from "react";

export default function InstallPWA({ className = "" }: { className?: string }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    if (isStandalone) return null;

    if (!deferredPrompt && !isIOS) return null;

    if (!mounted) return null;

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else if (isIOS) {
            alert("Pour installer l'application sur iOS :\n\n1. Appuyez sur le bouton de partage (carré avec flèche vers le haut)\n2. Faites défiler vers le bas\n3. Sélectionnez 'Sur l'écran d'accueil'");
        }
    };

    return (
        <button
            onClick={handleInstallClick}
            className={`flex items-center gap-2 bg-sbc text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-sbc/20 hover:bg-sbc-dark transition-all transform active:scale-95 ${className}`}
        >
            <i className="fas fa-download"></i>
            <span>Installer l'App</span>
        </button>
    );
}
