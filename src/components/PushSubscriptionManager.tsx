"use client";

import { useEffect, useState } from "react";

export function PushSubscriptionManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>("default");

    useEffect(() => {
        if ("serviceWorker" in navigator && "PushManager" in window) {
            setIsSupported(true);
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        const sw = await navigator.serviceWorker.ready;
        const sub = await sw.pushManager.getSubscription();
        setIsSubscribed(!!sub);
        setPermission(Notification.permission);
    };

    const subscribe = async () => {
        try {
            const sw = await navigator.serviceWorker.ready;
            const sub = await sw.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            });

            const res = await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription: sub })
            });

            if (res.ok) {
                setIsSubscribed(true);
                setPermission(Notification.permission);
            }
        } catch (e) {
            console.error("Subscription failed:", e);
        }
    };

    if (!isSupported) return null;

    if (permission === 'denied') return (
         <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
            <i className="fas fa-bell-slash"></i>
            Notifications bloquées par votre navigateur.
        </div>
    );

    if (isSubscribed) return (
         <div className="bg-green-50 text-green-600 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
            <i className="fas fa-bell"></i>
            Notifications activées pour cet appareil.
        </div>
    );

    return (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex flex-col gap-3 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center animate-pulse">
                    <i className="fas fa-bell"></i>
                </div>
                <div>
                    <h4 className="font-black text-gray-900 text-sm">Activer les notifications OTM ?</h4>
                    <p className="text-xs text-gray-500 font-medium">Recevez une alerte dès que votre équipe est désignée pour un match.</p>
                </div>
            </div>
            <button
                onClick={subscribe}
                className="bg-orange-500 hover:bg-orange-600 text-white font-black py-2 rounded-lg text-xs uppercase tracking-wider transition-all transform active:scale-95"
            >
                Autoriser les notifications
            </button>
        </div>
    );
}

// In app/_components/PWARegistration.tsx or similar
export function PWARegistration() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").then((reg) => {
                console.log("Service Worker registered:", reg);
            }).catch((err) => {
                console.error("SW registration failed:", err);
            });
        }
    }, []);
    return null;
}
