import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SBC - Accueil",
  description: "Le site officiel du Seclin Basket Club (SBC). Retrouvez les actus, les résultats, les équipes et la vie du club.",
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
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </head>
      <body
        className={`${inter.variable} antialiased bg-gray-50 text-gray-800 flex flex-col min-h-screen`}
      >
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}
