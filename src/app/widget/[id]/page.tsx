"use client";

import { use, useEffect, useRef } from "react";

export default function WidgetPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && id) {
            const script = document.createElement("script");
            script.src = "https://widgets.scorenco.com/host/widgets.js";
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);

            return () => {
                if (document.body.contains(script)) {
                    document.body.removeChild(script);
                }
            };
        }
    }, [id]);

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '500px', margin: 0, padding: 0, overflow: 'auto' }}>
            <div
                ref={containerRef}
                className="scorenco-widget"
                data-widget-type="team"
                data-widget-id={id}
                suppressHydrationWarning={true}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    textTransform: 'uppercase',
                    fontFamily: 'sans-serif',
                    fontWeight: 'bolder',
                    gap: '9px',
                    color: '#1E457B',
                    minHeight: '500px',
                    width: '100%'
                }}
            ></div>
            <style jsx global>{`
                html, body { margin: 0; padding: 0; background: transparent; width: 100%; height: 100%; overflow-x: hidden; overflow-y: auto; }
                .ldsdr{display:inline-block;width:80px;height:80px}.ldsdr:after{content:" ";display:block;width:64px;height:64px;margin:8px;border-radius:50%;border:6px solid #1E457B;border-color:#1E457B transparent;animation:ldsdr 1.2s linear infinite}@keyframes ldsdr{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
            `}</style>
        </div>
    );
}
