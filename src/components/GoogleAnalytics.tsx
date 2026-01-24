'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function GoogleAnalytics({ GA_MEASUREMENT_ID }: { GA_MEASUREMENT_ID: string }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const url = pathname + searchParams.toString();
    }, [pathname, searchParams]);

    return (
        <>
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                
                // Initialisation par défaut : tout refuser (Consent Mode v2)
                gtag('consent', 'default', {
                    'ad_storage': 'denied',
                    'analytics_storage': 'denied',
                    'ad_user_data': 'denied',
                    'ad_personalization': 'denied'
                });
                
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                });
                `}
            </Script>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
        </>
    );
}
