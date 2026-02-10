import WallpaperSimulator from "@/components/WallpaperSimulator";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Fonds d'écran | Seclin Basket Club",
    description: "Personnalisez votre téléphone aux couleurs du SBC. Téléchargez nos fonds d'écran officiels.",
};

export default function WallpapersPage() {
    return (
        <main className="min-h-screen bg-white">
            {/* Header / Hero */}
            <header className="bg-white py-12 shadow-sm text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-sbc-dark mb-4 uppercase tracking-wide">Affichez vos couleurs</h1>
                    <p className="text-gray-600">Téléchargez nos fonds d'écran officiels.</p>
                </div>
                <i className="fas fa-mobile-alt absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl text-gray-100 -z-0"></i>
            </header>

            {/* Content & Simulator */}
            <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-12">
                <WallpaperSimulator />
            </div>
        </main>
    );
}
