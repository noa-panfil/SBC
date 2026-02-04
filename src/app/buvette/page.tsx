import { Metadata } from "next";
import BuvetteImage from "./BuvetteImage";

export const metadata: Metadata = {
    title: "Buvette - Seclin Basket Club",
    description: "Le menu de la buvette du SBC. Boissons, snacks et convivialité.",
};

export default function BuvettePage() {
    return (
        <>
            <header className="bg-white py-12 shadow-sm text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-sbc-dark mb-4 uppercase tracking-wide">La Buvette</h1>
                    <p className="text-gray-600">Le lieu de convivialité par excellence</p>
                </div>
                <i className="fas fa-beer absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl text-gray-100 -z-0"></i>
            </header>

            <main className="container mx-auto px-4 py-12 flex-grow space-y-16 fade-in min-h-screen">
                <section className="flex flex-col items-center">
                    <BuvetteImage />

                    <div className="mt-8 text-center text-gray-500">
                        <p className="flex items-center justify-center gap-2">
                            <i className="fas fa-credit-card text-sbc"></i> Paiement par carte bancaire accepté
                        </p>
                    </div>
                </section>
            </main>
        </>
    );
}
