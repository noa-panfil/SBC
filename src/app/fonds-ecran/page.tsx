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
            <div className="relative py-12 bg-gray-900 border-b border-gray-800 overflow-hidden">
                <div className="absolute inset-0 bg-sbc/10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-sbc blur-[150px] opacity-20 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-white blur-[150px] opacity-5 rounded-full -translate-x-1/2 translate-y-1/2"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-sbc/20 border border-sbc/30 text-sbc font-bold text-[10px] uppercase tracking-widest mb-3 backdrop-blur-sm">
                        Zone Supporters
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">
                        Affichez vos <span className="text-sbc">Couleurs</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto font-medium">
                        Emportez le Seclin Basket Club partout avec vous.
                    </p>
                </div>
            </div>

            {/* Content & Simulator */}
            <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-12">
                <WallpaperSimulator />
            </div>
        </main>
    );
}
