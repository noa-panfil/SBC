'use client';

import { useState, useEffect } from 'react';

export default function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie_consent");

        if (!consent) {
            setShowBanner(true);
        } else if (consent === "granted") {
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('consent', 'update', {
                    'analytics_storage': 'granted',
                    'ad_storage': 'granted',
                    'ad_user_data': 'granted',
                    'ad_personalization': 'granted'
                });
            }
        }
    }, []);

    const acceptCookie = () => {
        setShowBanner(false);
        localStorage.setItem("cookie_consent", "granted");

        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('consent', 'update', {
                'analytics_storage': 'granted',
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted'
            });
        }
    };

    const declineCookie = () => {
        setShowBanner(false);
        localStorage.setItem("cookie_consent", "denied");
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] fade-in">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-gray-300 text-sm text-center md:text-left">
                    <p>
                        <span className="font-bold text-white">🍪 Cookies & Vie privée</span> <br />
                        Nous utilisons des cookies pour analyser le trafic et améliorer votre expérience sur le site du SBC.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={declineCookie}
                        className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                    >
                        Refuser
                    </button>
                    <button
                        onClick={acceptCookie}
                        className="px-4 py-2 text-sm font-bold text-white bg-sbc hover:bg-green-700 rounded-lg shadow-lg hover:shadow-sbc/20 transition transform hover:-translate-y-0.5"
                    >
                        Accepter
                    </button>
                </div>
            </div>
        </div>
    );
}
