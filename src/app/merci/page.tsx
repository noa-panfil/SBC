import Link from "next/link";

export default function Merci() {
    return (
        <main className="container mx-auto px-4 flex-grow flex flex-col items-center justify-center py-20 fade-in">

            <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl text-center max-w-lg w-full border border-gray-100">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-check text-4xl text-sbc"></i>
                </div>

                <h1 className="text-3xl font-bold text-sbc-dark mb-4">Message envoyé !</h1>

                <p className="text-gray-600 mb-8">
                    Merci de nous avoir contactés. L'équipe du SBC a bien reçu votre message et vous répondra dans les plus
                    brefs délais.
                </p>

                <div className="space-y-3">
                    <Link href="/"
                        className="block w-full bg-sbc hover:bg-sbc-dark text-white font-bold py-3 rounded-lg transition transform hover:-translate-y-1 shadow-md">
                        Retour à l'accueil
                    </Link>
                </div>
            </div>

        </main>
    )
}
