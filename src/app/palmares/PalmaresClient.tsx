"use client";
import React, { useState } from "react";

export default function Palmares() {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState("");
    const [modalTitle, setModalTitle] = useState("");
    const [modalDesc, setModalDesc] = useState("");

    const openModal = (src: string, title: string, desc: string) => {
        setModalImage(src);
        setModalTitle(title);
        setModalDesc(desc);
        setModalOpen(true);
    };

    return (
        <>
            <header className="bg-white py-12 shadow-sm text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-sbc-dark mb-4 uppercase tracking-wide">Palmarès du Club</h1>
                    <p className="text-gray-600">Les titres et grandes épopées du Seclin Basket Club.</p>
                </div>
                <i className="fas fa-trophy absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl text-gray-100 -z-0"></i>
            </header>

            <main className="container mx-auto px-4 py-12 flex-grow space-y-16">

                <section className="fade-in">
                    <h2 className="text-2xl font-bold text-sbc border-b-2 border-gray-200 pb-2 mb-8 flex items-center gap-2">
                        <i className="fas fa-crown"></i> Moments de Gloire
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        {/* 2024 */}
                        <div className="bg-gradient-to-b from-yellow-50 to-white p-6 rounded-2xl shadow-lg border border-yellow-200 transform hover:-translate-y-2 transition duration-300 flex flex-col h-full">
                            <div className="w-16 h-16 bg-yellow-400 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-md">
                                <i className="fas fa-trophy"></i>
                            </div>
                            <div className="text-2xl font-bold text-gray-800 mb-1">2024</div>
                            <h3 className="text-lg font-bold text-yellow-600 uppercase mb-2">Le Doublé Historique</h3>
                            <p className="text-gray-600 font-bold text-sm">Championnes D2 + Coupe Vercaemer</p>
                            <p className="text-gray-400 text-xs mb-4">U15 Féminines A</p>
                            <div className="mt-auto pt-4">
                                <div className="bg-white p-2 shadow-md rounded-lg rotate-2 transform transition hover:rotate-0">
                                    <img src="/img/palmares/u15f-championnes-2024.webp"
                                        alt="U15 Féminines A championnes 2024 - Doublé"
                                        onClick={() => openModal("/img/palmares/u15f-championnes-2024.webp", 'Le Doublé Historique 2024', 'Championnes D2 + Coupe Vercaemer - U15 Féminines A')}
                                        className="rounded object-cover h-48 w-full zoomable cursor-zoom-in"
                                        onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Photo+U15F+2024')} />
                                </div>
                            </div>
                        </div>

                        {/* 2017 */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 transform hover:-translate-y-2 transition duration-300 flex flex-col h-full">
                            <div className="w-16 h-16 bg-sbc text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-md">
                                <i className="fas fa-medal"></i>
                            </div>
                            <div className="text-2xl font-bold text-gray-800 mb-1">2017</div>
                            <h3 className="text-lg font-bold text-sbc uppercase mb-2">Champions D1</h3>
                            <p className="text-gray-600 text-sm">Accession au niveau régional</p>
                            <p className="text-gray-400 text-xs mb-4">Seniors Masc. 1</p>
                            <div className="mt-auto pt-4">
                                <div className="bg-white p-2 shadow-md rounded-lg -rotate-2 transform transition hover:rotate-0">
                                    <img src="/img/palmares/seniors-d1-2017.webp" alt="Seniors M1 champions D1 2017 - Accession"
                                        onClick={() => openModal("/img/palmares/seniors-d1-2017.webp", 'Champions D1 2017', 'Accession Régionale - Seniors Masc. 1')}
                                        className="rounded object-cover h-48 w-full zoomable cursor-zoom-in"
                                        onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Photo+Seniors+2017')} />
                                </div>
                            </div>
                        </div>

                        {/* 2015 */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 transform hover:-translate-y-2 transition duration-300 flex flex-col h-full">
                            <div className="w-16 h-16 bg-gray-700 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-md">
                                <i className="fas fa-star"></i>
                            </div>
                            <div className="text-2xl font-bold text-gray-800 mb-1">2015</div>
                            <h3 className="text-lg font-bold text-gray-700 uppercase mb-2">Excellence Région</h3>
                            <p className="text-gray-600 text-sm">Champions UFOLEP</p>
                            <p className="text-gray-400 text-xs mb-4">Seniors Masc. 4</p>
                            <div className="mt-auto pt-4">
                                <div className="bg-white p-2 shadow-md rounded-lg rotate-1 transform transition hover:rotate-0">
                                    <img src="/img/palmares/seniors-ufolep-2015.webp"
                                        alt="Seniors champions Excellence UFOLEP 2015"
                                        onClick={() => openModal("/img/palmares/seniors-ufolep-2015.webp", 'Champions Excellence 2015', 'Titre UFOLEP - Seniors Masc. 4')}
                                        className="rounded object-cover h-48 w-full zoomable cursor-zoom-in"
                                        onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Photo+UFOLEP+2015')} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-sbc border-b-2 border-gray-200 pb-2 mb-12 flex items-center gap-2">
                        <i className="fas fa-history"></i> Historique des Titres
                    </h2>

                    <div className="relative border-l-4 border-sbc ml-6 space-y-16">

                        {/* 2025 */}
                        <div className="relative pl-8 fade-in">
                            <div className="absolute -left-[10px] top-6 w-5 h-5 bg-white border-4 border-gray-400 rounded-full"></div>
                            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-gray-400 hover:shadow-lg transition">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <span className="inline-block bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded text-sm mb-2">2025</span>
                                        <h3 className="text-xl font-bold text-gray-700">🥈 Vice-Champions TD4</h3>
                                        <p className="text-gray-600 font-medium">U13 Masc.</p>
                                        <p className="text-gray-500 text-sm mt-2">Une superbe saison qui se termine sur la deuxième marche du podium.</p>
                                    </div>
                                    <div className="md:w-1/2">
                                        <img src="/img/palmares/2025-u13m.webp" alt="U13 Masculins vice-champions TD4 2025"
                                            onClick={() => openModal("/img/palmares/2025-u13m.webp", 'Vice-Champions 2025', 'Finale TD4 - U13 Masc.')}
                                            className="rounded-lg shadow-sm w-full h-48 object-cover transform hover:scale-105 transition duration-500 zoomable cursor-zoom-in"
                                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Photo+U13M+2025')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2024 */}
                        <div className="relative pl-8 fade-in">
                            <div className="absolute -left-[10px] top-6 w-5 h-5 bg-white border-4 border-yellow-400 rounded-full"></div>
                            <div className="bg-white p-6 rounded-xl shadow-xl border-l-4 border-yellow-400 hover:shadow-2xl transition ring-1 ring-yellow-100">
                                <span className="inline-block bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded text-sm mb-4">2024 - Année Historique</span>
                                <div className="mb-8 pb-8 border-b border-gray-100">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-sbc mb-1"><i className="fas fa-trophy text-yellow-500 mr-2"></i> Le Doublé U15 Fém. A</h3>
                                            <ul className="space-y-1 mb-3">
                                                <li className="text-gray-700 font-bold">🥇 Championnes D2</li>
                                                <li className="text-gray-700 font-bold">🥇 Championnes Coupe Vercaemer</li>
                                            </ul>
                                        </div>
                                        <div className="md:w-1/2">
                                            <img src="/img/palmares/2024-u15f-double.webp"
                                                alt="U15 Féminines A championnes 2024 - Doublé"
                                                onClick={() => openModal("/img/palmares/2024-u15f-double.webp", 'Doublé Historique 2024', 'Championnes D2 & Coupe Vercaemer - U15F A')}
                                                className="rounded-lg shadow-md w-full h-56 object-cover transform hover:scale-105 transition duration-500 zoomable cursor-zoom-in"
                                                onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Photo+U15F+Doublé+2024')} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
                                        <img src="/img/palmares/2024-u11m.webp" alt="U11 Masculins vice-champions TD4 2024"
                                            onClick={() => openModal("/img/palmares/2024-u11m.webp", 'Vice-Champions 2024', 'Finale TD4 - U11 Masc.')}
                                            className="w-20 h-20 object-cover rounded zoomable cursor-zoom-in"
                                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=U11M')} />
                                        <div>
                                            <h4 className="font-bold text-gray-700">🥈 Vice-Champions TD4</h4>
                                            <p className="text-sm text-gray-500">U11 Masc.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
                                        <img src="/img/palmares/2024-u15f-b.webp" alt="U15 Féminines B vice-championnes TD6 2024"
                                            onClick={() => openModal("/img/palmares/2024-u15f-b.webp", 'Vice-Championnes 2024', 'Finale TD6 - U15 Fém. B')}
                                            className="w-20 h-20 object-cover rounded zoomable cursor-zoom-in"
                                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=U15F+B')} />
                                        <div>
                                            <h4 className="font-bold text-gray-700">🥈 Vice-Championnes TD6</h4>
                                            <p className="text-sm text-gray-500">U15 Fém. B</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative pl-8 fade-in">
                            <div className="absolute -left-[10px] top-6 w-5 h-5 bg-white border-4 border-gray-400 rounded-full"></div>
                            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-gray-400 hover:shadow-lg transition">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <span className="inline-block bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded text-sm mb-2">2023</span>
                                        <h3 className="text-xl font-bold text-gray-700">🥈 Vice-Championnes TD4</h3>
                                        <p className="text-gray-600 font-medium">U15 Fém.</p>
                                    </div>
                                    <div className="md:w-1/2">
                                        <img src="/img/palmares/2023-u15f.webp" alt="U15 Féminines vice-championnes TD4 2023"
                                            onClick={() => openModal("/img/palmares/2023-u15f.webp", 'Vice-Championnes 2023', 'Finale TD4 - U15 Fém.')}
                                            className="rounded-lg shadow-sm w-full h-48 object-cover transform hover:scale-105 transition duration-500 zoomable cursor-zoom-in"
                                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Photo+U15F+2023')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative pl-8 fade-in">
                            <div className="absolute -left-[10px] top-6 w-5 h-5 bg-white border-4 border-yellow-400 rounded-full"></div>
                            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-400 hover:shadow-lg transition">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <span className="inline-block bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded text-sm mb-2">2022</span>
                                        <h3 className="text-xl font-bold text-sbc mb-1"><i className="fas fa-trophy text-yellow-500 mr-2"></i> Championnes TD5</h3>
                                        <p className="text-gray-600 font-bold mb-2">U13 Fém.</p>
                                    </div>
                                    <div className="md:w-1/2">
                                        <img src="/img/palmares/2022-u13f.webp" alt="U13 Féminines championnes TD5 2022"
                                            onClick={() => openModal("/img/palmares/2022-u13f.webp", 'Championnes TD5 2022', 'U13 Féminines')}
                                            className="rounded-lg shadow-sm w-full h-48 object-cover transform hover:scale-105 transition duration-500 zoomable cursor-zoom-in"
                                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Photo+U13F+2022')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative pl-8 fade-in">
                            <div className="absolute -left-[10px] top-6 w-5 h-5 bg-white border-4 border-gray-400 rounded-full"></div>
                            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-gray-400 hover:shadow-lg transition">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <span className="inline-block bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded text-sm mb-2">2019</span>
                                        <h3 className="text-xl font-bold text-gray-700">🥈 Finalistes Coupe Vercaemer</h3>
                                        <p className="text-gray-600 font-medium">U11 Masc.</p>
                                    </div>
                                    <div className="md:w-1/2">
                                        <img src="/img/palmares/2019-u11m.webp" alt="U11 Masculins finalistes Coupe Vercaemer 2019"
                                            onClick={() => openModal("/img/palmares/2019-u11m.webp", 'Finale Coupe Vercaemer 2019', 'U11 Masc.')}
                                            className="rounded-lg shadow-sm w-full h-48 object-cover transform hover:scale-105 transition duration-500 zoomable cursor-zoom-in"
                                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Photo+U11M+2019')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative pl-8 fade-in">
                            <div className="absolute -left-[10px] top-6 w-5 h-5 bg-white border-4 border-gray-400 rounded-full"></div>
                            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-gray-400 hover:shadow-lg transition">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <span className="inline-block bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded text-sm mb-2">2018</span>
                                        <h3 className="text-xl font-bold text-gray-700">🥈 Finalistes TD6</h3>
                                        <p className="text-gray-600 font-medium">U13 Masc.</p>
                                    </div>
                                    <div className="md:w-1/2">
                                        <img src="/img/palmares/2018-u13m.webp" alt="U13 Masculins finalistes TD6 2018"
                                            onClick={() => openModal("/img/palmares/2018-u13m.webp", 'Finale TD6 2018', 'U13 Masc.')}
                                            className="rounded-lg shadow-sm w-full h-48 object-cover transform hover:scale-105 transition duration-500 zoomable cursor-zoom-in"
                                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Photo+U13M+2018')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative pl-8 fade-in">
                            <div className="absolute -left-[10px] top-6 w-5 h-5 bg-white border-4 border-sbc rounded-full"></div>
                            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-sbc hover:shadow-lg transition">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <span className="inline-block bg-sbc text-white font-bold px-3 py-1 rounded text-sm mb-2">2017</span>
                                        <h3 className="text-xl font-bold text-gray-800"><i className="fas fa-trophy text-yellow-500 mr-2"></i> Champions D1</h3>
                                        <p className="text-gray-600 font-bold">Seniors Masc. 1</p>
                                    </div>
                                    <div className="md:w-1/2">
                                        <img src="/img/palmares/2017-seniors.webp" alt="Seniors M1 champions D1 2017 - Accession"
                                            onClick={() => openModal("/img/palmares/2017-seniors.webp", 'Champions D1 2017', 'Montée en Régionale - Seniors A')}
                                            className="rounded-lg shadow-sm w-full h-48 object-cover transform hover:scale-105 transition duration-500 zoomable cursor-zoom-in"
                                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Photo+Seniors+2017')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative pl-8 fade-in">
                            <div className="absolute -left-[10px] top-6 w-5 h-5 bg-white border-4 border-sbc rounded-full"></div>
                            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-sbc hover:shadow-lg transition">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <span className="inline-block bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded text-sm mb-2">2015</span>
                                        <h3 className="text-xl font-bold text-gray-800"><i className="fas fa-trophy text-yellow-500 mr-2"></i> Champions Excellence UFOLEP</h3>
                                        <p className="text-gray-600 font-bold">Seniors Masc. 4</p>
                                    </div>
                                    <div className="md:w-1/2">
                                        <img src="/img/palmares/2015-seniors-ufolep.webp" alt="Seniors champions Excellence UFOLEP 2015"
                                            onClick={() => openModal("/img/palmares/2015-seniors-ufolep.webp", 'Champions UFOLEP 2015', 'Seniors Masc. 4')}
                                            className="rounded-lg shadow-sm w-full h-48 object-cover transform hover:scale-105 transition duration-500 zoomable cursor-zoom-in"
                                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Photo+UFOLEP+2015')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative pl-8 fade-in">
                            <div className="absolute -left-[10px] top-6 w-5 h-5 bg-white border-4 border-sbc rounded-full"></div>
                            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-sbc hover:shadow-lg transition">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <span className="inline-block bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded text-sm mb-2">2014</span>
                                        <h3 className="text-xl font-bold text-gray-800"><i className="fas fa-trophy text-yellow-500 mr-2"></i> Champions D3</h3>
                                        <p className="text-gray-600 font-bold">Seniors Masc. 1</p>
                                    </div>
                                    <div className="md:w-1/2">
                                        <img src="/img/palmares/2014-seniors-d3.webp" alt="Seniors M1 champions D3 2014"
                                            onClick={() => openModal("/img/palmares/2014-seniors-d3.webp", 'Champions D3 2014', 'Seniors Masc. 1')}
                                            className="rounded-lg shadow-sm w-full h-48 object-cover transform hover:scale-105 transition duration-500 zoomable cursor-zoom-in"
                                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Photo+Seniors+2014')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {modalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer" onClick={() => setModalOpen(false)}>
                        <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setModalOpen(false)} className="absolute -top-12 right-0 text-white text-4xl hover:text-gray-300 transition focus:outline-none">&times;</button>
                            <img src={modalImage} className="w-full max-h-[80vh] object-contain rounded-lg shadow-2xl bg-black" />
                            <div className="text-center mt-4">
                                <h3 className="text-2xl font-bold text-white mb-1">{modalTitle}</h3>
                                <p className="text-gray-300 text-lg">{modalDesc}</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
