"use client";

import { useEffect } from "react";

export default function BoutiqueEmbed() {
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data && e.data.height) {
                const haWidgetElement = document.getElementById('haWidget');
                if (haWidgetElement) {
                    haWidgetElement.style.height = e.data.height + 'px';
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <iframe
            id="haWidget"
            src="https://www.helloasso.com/associations/seclin-basket-club/boutiques/boutique-seclin-bc-2022-2023/widget"
            style={{ width: "100%", height: "750px", border: "none", overflow: "hidden" }}
            scrolling="no"
            allowTransparency={true}
        ></iframe>
    );
}
