"use client";

import { useEffect, useState } from "react";

export default function Contact() {
    const [redirectUrl, setRedirectUrl] = useState("");

    useEffect(() => {
        setRedirectUrl(window.location.origin + "/merci");
    }, []);

    return (
        <>
            <header className="bg-white py-12 shadow-sm text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-sbc-dark mb-4 uppercase tracking-wide">Contactez-nous</h1>
                    <p className="text-gray-600">Une question sur les inscriptions ou le sponsoring ?</p>
                </div>
                <i className="fas fa-envelope absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl text-gray-100 -z-0"></i>
            </header>

            <main className="container mx-auto px-4 py-12 flex-grow fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-sbc-dark text-white p-10 relative overflow-hidden">
                        <div className="relative z-10 space-y-8">
                            <h2 className="text-2xl font-bold">Nos Coordonnées</h2>
                            <div className="flex items-start gap-4">
                                <i className="fas fa-map-marker-alt text-2xl text-sbc-light"></i>
                                <p>7 rue Joliot Curie<br />59113 Seclin</p>
                            </div>
                            <div className="flex items-start gap-4">
                                <i className="fas fa-envelope text-2xl text-sbc-light"></i>
                                <p>seclinbc@gmail.com</p>
                            </div>
                            <div className="flex items-start gap-4">
                                <i className="fas fa-phone text-2xl text-sbc-light"></i>
                                <p>06 50 72 37 63</p>
                            </div>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/img/logo.png" alt="Logo Seclin Basket Club - SBC"
                            className="absolute -bottom-10 -right-10 w-64 opacity-10" />
                    </div>

                    <div className="p-10">
                        <form action="https://api.web3forms.com/submit" method="POST">
                            <input type="hidden" name="access_key" value="872c9a5f-aca6-4124-9364-62c3afc12c1e" />
                            <input type="hidden" name="redirect" value={redirectUrl} />

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <input type="text" name="Nom" placeholder="Nom" required
                                    className="bg-gray-50 border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-sbc" />
                                <input type="text" name="Prénom" placeholder="Prénom" required
                                    className="bg-gray-50 border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-sbc" />
                            </div>

                            <input type="email" name="email" placeholder="Email" required
                                className="bg-gray-50 border p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-sbc" />

                            <div className="flex items-center gap-3 mb-4">
                                <input id="partnership" name="partenariat" type="checkbox" value="OUI"
                                    className="h-4 w-4 text-sbc focus:ring-sbc border-gray-300 rounded" />
                                <label htmlFor="partnership" className="text-sm text-gray-700">Demande de partenariat</label>
                            </div>

                            <textarea name="message" rows={4} placeholder="Message" required
                                className="bg-gray-50 border p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-sbc"></textarea>

                            <button type="submit"
                                className="w-full bg-sbc text-white font-bold py-3 rounded-lg hover:bg-sbc-dark transition transform hover:-translate-y-1 shadow-md">
                                Envoyer
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </>
    );
}
