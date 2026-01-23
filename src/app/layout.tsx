import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Seclin Basket Club (SBC) - Club de Basket & Sport à Seclin (Métropole Lilloise)",
  description: "Bienvenue au Seclin Basket Club (SBC). Votre club de sport référence à Seclin, au cœur de la Métropole Lilloise et du Nord. Rejoignez-nous pour pratiquer le basket en compétition ou loisir.",
  keywords: ["Seclin Basket Club", "SBC", "Sport Seclin", "Seclin Sport", "Basket Seclin", "Sport Nord", "Sport Lille", "Club de sport Seclin", "Association sportive Seclin", "Basket métropole lilloise"],
  other: {
    "google-site-verification": "verification_token",
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

import RootLayoutClient from "../components/RootLayoutClient";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
              document.head.appendChild(link);
            `
          }}
        />
        <noscript>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        </noscript>
      </head>
      <body
        className={`${inter.variable} antialiased bg-gray-50 text-gray-800 flex flex-col min-h-screen`}
      >
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsClub",
              "name": "Seclin Basket Club",
              "alternateName": "SBC",
              "url": "https://seclinbasketclub.fr",
              "logo": "https://seclinbasketclub.fr/img/logo.png",
              "image": "https://seclinbasketclub.fr/img/logo.png",
              "description": "Club de basket et de sport à Seclin, proche de Lille dans le Nord. Pratique du basket en compétition et loisir pour tous les âges.",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Parc des Époux Rosenberg",
                "addressLocality": "Seclin",
                "postalCode": "59113",
                "addressRegion": "Hauts-de-France",
                "addressCountry": "FR"
              },
              "areaServed": ["Seclin", "Lille", "Métropole Européenne de Lille", "Nord"],
              "priceRange": "€"
            })
          }}
        />
      </body>
    </html>
  );
}
