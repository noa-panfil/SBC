"use client";

import { useEffect } from "react";

export default function PWARegistration() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch((error) => {
                console.error("SW registration failed:", error);
            });
        }
    }, []);
    return null;
}
