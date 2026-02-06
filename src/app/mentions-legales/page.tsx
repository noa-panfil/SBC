import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mentions Légales | Seclin Basket Club",
    description: "Mentions légales, politique de confidentialité et conditions d'utilisation du site du Seclin Basket Club.",
};

export default function MentionsLegales() {
    return (
        <>
            <header className="bg-white py-12 shadow-sm text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-sbc-dark mb-4 uppercase tracking-wide">Mentions Légales</h1>
                    <p className="text-gray-600">Informations légales sur le site du SBC.</p>
                </div>
                <i className="fas fa-balance-scale absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl text-gray-100 -z-0"></i>
            </header>

            <main className="container mx-auto px-4 py-12 flex-grow fade-in max-w-4xl">

                <div className="space-y-8 bg-white p-8 rounded-xl shadow-md">

                    <section>
                        <h2 className="text-xl font-bold text-sbc mb-3">1. Éditeur du site</h2>
                        <p>
                            <strong>Seclin Basket Club (SBC)</strong><br />
                            Association régie par la loi de 1901.<br />
                            <strong>Adresse :</strong> 7 rue Joliot Curie, 59113 SECLIN<br />
                            <strong>Email :</strong> seclinbc@gmail.com<br />
                            <strong>Président :</strong> M. Grégory Duponchel
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-sbc mb-3">2. Hébergement</h2>
                        <p>
                            Ce site est hébergé sur un VPS personnel fourni par <strong>Hostinger International Ltd.</strong><br />
                            61 Lordou Vironos Street<br />
                            6023 Larnaca, Cyprus<br />
                            <a href="https://www.hostinger.fr" target="_blank" className="text-sbc hover:underline">www.hostinger.fr</a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-sbc mb-3">3. Conception & Développement</h2>
                        <p>
                            <strong>Webmaster :</strong> Noa Panfil<br />
                            <a href="https://www.linkedin.com/in/noa-panfil/" target="_blank" className="text-sbc hover:underline"><i className="fab fa-linkedin mr-1"></i> Profil LinkedIn</a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-sbc mb-3">4. Propriété intellectuelle</h2>
                        <p>
                            L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et
                            la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les
                            documents téléchargeables et les représentations iconographiques et photographiques.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-sbc mb-3">5. Données personnelles</h2>
                        <p>
                            Les informations recueillies via le formulaire de contact sont destinées exclusivement au Seclin
                            Basket Club pour traiter votre demande. Elles ne sont en aucun cas transmises à des tiers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-sbc mb-3">6. Cookies</h2>
                        <p>
                            Ce site n'utilise pas de cookies de traçage publicitaire. Seuls des cookies techniques essentiels au
                            bon fonctionnement du site peuvent être déposés.
                        </p>
                    </section>

                </div>

            </main>
        </>
    );
}
