import { Metadata } from "next";
import BoutiqueEmbed from "./BoutiqueEmbed";

export const metadata: Metadata = {
    title: "Boutique | Seclin Basket Club",
    description: "Commandez les équipements officiels du Seclin Basket Club : maillots, survêtements, accessoires...",
};

export default function BoutiquePage() {
    return (
        <main className="container mx-auto px-4 py-8 min-h-screen">
            <div className="text-center mb-8">
                <span className="text-sbc font-bold tracking-widest uppercase text-sm">Supporters</span>
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 uppercase italic">
                    La <span className="text-sbc">Boutique</span>
                </h1>
                <p className="text-gray-500 mt-2">Commandez vos équipements officiels directement via HelloAsso</p>
                <div className="mt-6 flex justify-center">
                    <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-lg border border-blue-100 inline-flex items-center gap-3 max-w-2xl text-left">
                        <i className="fas fa-info-circle text-xl text-blue-600"></i>
                        <p className="text-sm font-medium leading-relaxed">
                            <strong>Information importante :</strong> Les commandes sont groupées et transmises à notre fournisseur <u>au début du mois suivant</u> votre commande. Merci de prendre en compte ce délai de traitement.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <BoutiqueEmbed />
            </div>
        </main>
    );
}
