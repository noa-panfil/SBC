import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'SBC - Page non trouvée',
    robots: {
        index: false,
        follow: true,
    },
};

export default function NotFound() {
    return (
        <main className="container mx-auto px-4 flex-grow flex flex-col items-center justify-center py-20 fade-in min-h-[60vh]">
            <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl text-center max-w-lg w-full border border-gray-100">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <i className="fas fa-basketball-ball text-4xl text-sbc animate-bounce"></i>
                    <div className="absolute text-5xl font-bold text-gray-800 opacity-20">4<span className="invisible">0</span>4
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-sbc-dark mb-4">Air Ball !</h1>

                <p className="text-gray-600 mb-8">
                    Oups, on dirait que cette page a manqué le panier.<br />
                    Elle n&apos;existe pas ou a été déplacée.
                </p>

                <div className="space-y-3">
                    <Link href="/"
                        className="block w-full bg-sbc hover:bg-sbc-dark text-white font-bold py-3 rounded-lg transition transform hover:-translate-y-1 shadow-md">
                        <i className="fas fa-arrow-left mr-2"></i> Retour au terrain
                    </Link>
                </div>
            </div>
        </main>
    );
}
