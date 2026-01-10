import { Metadata } from "next";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const metadata: Metadata = {
    title: "Informations Pratiques - Seclin Basket Club",
    description: "Tarifs des licences, organigramme, salle Jesse Owens... Retrouvez toutes les infos pratiques du SBC.",
};

export default async function Informations() {
    // Fetch gym image from settings
    let gymImageUrl = "/img/salle/arena.webp";
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT value FROM settings WHERE key_name = 'gym_image_id'"
        );
        if (rows.length > 0) {
            gymImageUrl = `/api/image/${rows[0].value}`;
        }
    } catch (e) {
        console.error("Error fetching gym image:", e);
    }

    return (
        <>
            <header className="bg-white py-12 shadow-sm text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-sbc-dark mb-4 uppercase tracking-wide">Informations Pratiques</h1>
                    <p className="text-gray-600">Tout ce qu'il faut savoir sur le SBC</p>
                </div>
                <i className="fas fa-info absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl text-gray-100 -z-0"></i>
            </header>

            <main className="container mx-auto px-4 py-12 flex-grow space-y-16 fade-in">

                <section>
                    <h2 className="text-2xl font-bold text-sbc border-b-2 border-gray-200 pb-2 mb-8">
                        <i className="fas fa-tag mr-2"></i> Grille Tarifaire 2024-2025
                    </h2>

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-sbc-dark text-white uppercase text-sm leading-normal">
                                        <th className="py-4 px-6 text-left">Catégorie</th>
                                        <th className="py-4 px-6 text-left">Années de naissance</th>
                                        <th className="py-4 px-6 text-center bg-sbc font-bold">Palier 1<br /><span className="text-xs font-normal lowercase opacity-80">(Standard)</span></th>
                                        <th className="py-4 px-6 text-center">Palier 2<br /><span className="text-xs font-normal lowercase opacity-80">(+4 ans au club)</span></th>
                                        <th className="py-4 px-6 text-center">Mutation<br /><span className="text-xs font-normal lowercase opacity-80">(Nouveau club)</span></th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-700 text-sm font-medium">
                                    <tr className="border-b border-gray-200 hover:bg-green-50 transition">
                                        <td className="py-4 px-6 font-bold text-sbc-dark">SENIORS</td>
                                        <td className="py-4 px-6">Avant 2005</td>
                                        <td className="py-4 px-6 text-center bg-green-50 text-base font-bold text-gray-800">110 €</td>
                                        <td className="py-4 px-6 text-center">90 €</td>
                                        <td className="py-4 px-6 text-center text-gray-500">170 €</td>
                                    </tr>
                                    <tr className="border-b border-gray-200 hover:bg-green-50 transition">
                                        <td className="py-4 px-6 font-bold text-sbc-dark">U21</td>
                                        <td className="py-4 px-6">2005 / 2006 / 2007</td>
                                        <td className="py-4 px-6 text-center bg-green-50 text-base font-bold text-gray-800">110 €</td>
                                        <td className="py-4 px-6 text-center">90 €</td>
                                        <td className="py-4 px-6 text-center text-gray-500">170 €</td>
                                    </tr>
                                    <tr className="border-b border-gray-200 hover:bg-green-50 transition">
                                        <td className="py-4 px-6 font-bold text-sbc-dark">U18</td>
                                        <td className="py-4 px-6">2008 / 2009 / 2010</td>
                                        <td className="py-4 px-6 text-center bg-green-50 text-base font-bold text-gray-800">105 €</td>
                                        <td className="py-4 px-6 text-center">85 €</td>
                                        <td className="py-4 px-6 text-center text-gray-500">165 €</td>
                                    </tr>
                                    <tr className="border-b border-gray-200 hover:bg-green-50 transition">
                                        <td className="py-4 px-6 font-bold text-sbc-dark">U15</td>
                                        <td className="py-4 px-6">2011 / 2012</td>
                                        <td className="py-4 px-6 text-center bg-green-50 text-base font-bold text-gray-800">95 €</td>
                                        <td className="py-4 px-6 text-center">75 €</td>
                                        <td className="py-4 px-6 text-center text-gray-500">155 €</td>
                                    </tr>
                                    <tr className="border-b border-gray-200 hover:bg-green-50 transition">
                                        <td className="py-4 px-6 font-bold text-sbc-dark">U13</td>
                                        <td className="py-4 px-6">2013 / 2014</td>
                                        <td className="py-4 px-6 text-center bg-green-50 text-base font-bold text-gray-800">90 €</td>
                                        <td className="py-4 px-6 text-center">70 €</td>
                                        <td className="py-4 px-6 text-center text-gray-500">90 €</td>
                                    </tr>
                                    <tr className="border-b border-gray-200 hover:bg-green-50 transition">
                                        <td className="py-4 px-6 font-bold text-sbc-dark">U11</td>
                                        <td className="py-4 px-6">2015 / 2016</td>
                                        <td className="py-4 px-6 text-center bg-green-50 text-base font-bold text-gray-800">75 €</td>
                                        <td className="py-4 px-6 text-center">65 €</td>
                                        <td className="py-4 px-6 text-center text-gray-500">75 €</td>
                                    </tr>
                                    <tr className="border-b border-gray-200 hover:bg-green-50 transition">
                                        <td className="py-4 px-6 font-bold text-sbc-dark">U9</td>
                                        <td className="py-4 px-6">2017 / 2018</td>
                                        <td className="py-4 px-6 text-center bg-green-50 text-base font-bold text-gray-800">65 €</td>
                                        <td className="py-4 px-6 text-center">65 €</td>
                                        <td className="py-4 px-6 text-center text-gray-500">65 €</td>
                                    </tr>
                                    <tr className="hover:bg-green-50 transition">
                                        <td className="py-4 px-6 font-bold text-sbc-dark">U7</td>
                                        <td className="py-4 px-6">2019 / 2020</td>
                                        <td className="py-4 px-6 text-center bg-green-50 text-base font-bold text-gray-800">55 €</td>
                                        <td className="py-4 px-6 text-center">55 €</td>
                                        <td className="py-4 px-6 text-center text-gray-500">55 €</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-500 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p><strong><i className="fas fa-info-circle text-sbc"></i> Note :</strong> Le tarif "Mutation" s'applique
                            aux joueurs venant d'un autre club (Palier 1 + 60€ de frais fédéraux). Pour les catégories U13 et
                            inférieures, le tarif mutation est identique au Palier 1.</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-sbc border-b-2 border-gray-200 pb-2 mb-8">
                        <i className="fas fa-users mr-2"></i> Le Bureau du Club
                    </h2>

                    <div className="flex flex-col items-center w-full">

                        <div className="relative z-10 bg-white border-2 border-gray-900 p-4 w-72 shadow-lg flex items-center gap-4 hover:scale-105 transition duration-300">
                            <div className="w-16 h-16 rounded-full bg-sbc text-white flex items-center justify-center text-2xl flex-shrink-0">
                                <i className="fas fa-user-tie"></i>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Grégory<br />Duponchel</h3>
                                <p className="text-gray-500 font-medium text-sm">Président</p>
                            </div>
                        </div>

                        <div className="h-8 w-0.5 bg-gray-900"></div>

                        <div className="relative z-10 bg-white border-2 border-gray-900 p-4 w-72 shadow-lg flex items-center gap-4 hover:scale-105 transition duration-300">
                            <div className="w-16 h-16 rounded-full bg-sbc text-white flex items-center justify-center text-2xl flex-shrink-0">
                                <i className="fas fa-user"></i>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Jean-Philippe<br />Pennequin</h3>
                                <p className="text-gray-500 font-medium text-sm">Vice-président</p>
                            </div>
                        </div>

                        <div className="h-8 w-0.5 bg-gray-900 md:hidden"></div>
                        <div className="hidden md:block h-8 w-0.5 bg-gray-900"></div>

                        <div className="hidden md:block w-[21rem] h-8 border-t-2 border-l-2 border-r-2 border-gray-900 rounded-t-sm"></div>

                        <div className="flex flex-col md:flex-row gap-8 md:gap-12">

                            <div className="bg-white border-2 border-gray-900 p-4 w-72 shadow-lg flex items-center gap-4 hover:scale-105 transition duration-300">
                                <div className="w-16 h-16 rounded-full bg-sbc text-white flex items-center justify-center text-2xl flex-shrink-0">
                                    <i className="fas fa-pen-fancy"></i>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-lg leading-tight">Marie<br />Duponchel</h3>
                                    <p className="text-gray-500 font-medium text-sm">Secrétaire</p>
                                </div>
                            </div>

                            <div className="h-8 w-0.5 bg-gray-900 mx-auto md:hidden"></div>

                            <div className="bg-white border-2 border-gray-900 p-4 w-72 shadow-lg flex items-center gap-4 hover:scale-105 transition duration-300">
                                <div className="w-16 h-16 rounded-full bg-sbc text-white flex items-center justify-center text-2xl flex-shrink-0">
                                    <i className="fas fa-coins"></i>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">Laëtitia<br />Dumont</h3>
                                    <p className="text-gray-500 font-medium text-sm">Trésorière</p>
                                </div>
                            </div>

                        </div>

                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-sbc border-b-2 border-gray-200 pb-2 mb-8">
                        <i className="fas fa-map-marker-alt mr-2"></i> Notre Salle
                    </h2>
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl overflow-hidden shadow-md flex flex-col md:flex-row">
                            <img src={gymImageUrl} className="w-full md:w-2/5 object-cover h-64 md:h-auto" alt="Salle Jesse Owens - Seclin Basket Club" />
                            <div className="p-8 flex flex-col justify-center">
                                <h3 className="font-bold text-2xl mb-4">Salle Jesse Owens</h3>
                                <div className="space-y-4 mb-6 text-gray-600">
                                    <p className="flex items-center gap-2"><i className="fas fa-location-arrow text-sbc"></i> Rue Pablo Picasso, 59113 Seclin</p>
                                    <p className="flex items-center gap-2"><i className="fas fa-info-circle text-sbc"></i> Revêtement de sol sportif en caoutchouc, Tribunes 200 places.</p>
                                </div>
                                <a href="https://maps.app.goo.gl/dWV2ttK7M8iynQTK6" target="_blank" className="bg-sbc hover:bg-sbc-dark text-white font-bold py-2 px-6 rounded-lg transition inline-block text-center w-full md:w-auto">
                                    <i className="fas fa-map mr-2"></i> Voir sur la carte
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
