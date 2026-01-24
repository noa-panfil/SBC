"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Footer() {
    const [logoUrl, setLogoUrl] = useState("/img/logo.png");

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.site_logo_id) {
                    setLogoUrl(`/api/image/${data.site_logo_id}`);
                }
            })
            .catch(console.error);
    }, []);

    return (
        <footer className="bg-gray-900 text-white pt-12 pb-6 mt-auto">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                    <h4 className="text-xl font-bold mb-4 text-sbc-light flex items-center gap-2">
                        <img src={logoUrl} className="h-8 w-auto" alt="Logo" /> SBC Seclin
                    </h4>
                    <p className="text-gray-400 text-sm">Le club de basket historique de la ville.<br />Formation, Passion, Compétition.</p>
                </div>
                <div>
                    <h4 className="text-xl font-bold mb-4 text-sbc-light">Liens Rapides</h4>
                    <ul className="text-gray-400 text-sm space-y-2">
                        <li><Link href="/" className="hover:text-white">Accueil</Link></li>
                        <li><Link href="/equipes" className="hover:text-white">Nos Équipes</Link></li>
                        <li><Link href="/palmares" className="hover:text-white">Palmarès</Link></li>
                        <li><Link href="/informations" className="hover:text-white">Infos Pratiques</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-xl font-bold mb-4 text-sbc-light">Contact</h4>
                    <p className="text-gray-400 text-sm mb-2"><i className="fas fa-map-marker-alt mr-2"></i> 7 rue Joliot Curie, 59113 Seclin </p>
                    <p className="text-gray-400 text-sm mb-4"><i className="fas fa-envelope mr-2"></i> seclinbc@gmail.com </p>

                    <div className="flex space-x-4">
                        <a href="https://www.facebook.com/share/1BfEPGLcYV/" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition duration-300">
                            <i className="fab fa-facebook-f"></i>
                        </a>
                        <a href="https://www.instagram.com/seclinbasketclub/" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition duration-300">
                            <i className="fab fa-instagram"></i>
                        </a>
                    </div>
                </div>
            </div>
            <div className="text-center border-t border-gray-800 pt-6 text-gray-500 text-sm">
                &copy; 2025 Seclin Basket Club. Tous droits réservés. - <Link href="/mentions-legales" className="hover:text-gray-300">Mentions Légales</Link> - <Link href="/login" className="hover:text-gray-300">Connexion</Link>
            </div>
        </footer>
    );
}
