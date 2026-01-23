"use client";
import React, { useState, useEffect } from "react";

interface PalmaresItem {
    id: number;
    year: number;
    title: string;
    description: string;
    category: string;
    image: string;
    is_highlight: boolean;
}

export default function Palmares() {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState("");
    const [modalTitle, setModalTitle] = useState("");
    const [modalDesc, setModalDesc] = useState("");
    const [palmares, setPalmares] = useState<PalmaresItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/palmares')
            .then(res => res.json())
            .then(data => {
                setPalmares(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const openModal = (src: string, title: string, desc: string) => {
        setModalImage(src);
        setModalTitle(title);
        setModalDesc(desc);
        setModalOpen(true);
    };

    if (loading) return <div className="text-center py-20 text-xl font-bold text-gray-500">Chargement du palmarès...</div>;

    const highlights = palmares.filter(p => p.is_highlight);
    const history = palmares.filter(p => !p.is_highlight);

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

                {highlights.length > 0 && (
                    <section className="fade-in">
                        <h2 className="text-2xl font-bold text-sbc border-b-2 border-gray-200 pb-2 mb-8 flex items-center gap-2">
                            <i className="fas fa-crown"></i> Moments de Gloire
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            {highlights.map((item, index) => {
                                const styles = [
                                    {
                                        card: "bg-gradient-to-b from-yellow-50 to-white border-yellow-200",
                                        icon: "bg-yellow-400",
                                        title: "text-yellow-600"
                                    },
                                    {
                                        card: "bg-gradient-to-b from-slate-100 to-white border-slate-300",
                                        icon: "bg-slate-400",
                                        title: "text-slate-600"
                                    },
                                    {
                                        card: "bg-gradient-to-b from-orange-50 to-white border-orange-200",
                                        icon: "bg-orange-400",
                                        title: "text-orange-600"
                                    }
                                ];

                                const style = styles[index] || styles[0];

                                return (
                                    <div key={item.id} className={`p-6 rounded-2xl shadow-lg border transform hover:-translate-y-2 transition duration-300 flex flex-col h-full ${style.card}`}>
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-md text-white ${style.icon}`}>
                                            <i className="fas fa-trophy"></i>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-800 mb-1">{item.year}</div>
                                        <h3 className={`text-lg font-bold uppercase mb-2 ${style.title}`}>{item.title}</h3>
                                        <p className="text-gray-600 font-bold text-sm">{item.description}</p>
                                        <p className="text-gray-400 text-xs mb-4">{item.category}</p>
                                        <div className="mt-auto pt-4">
                                            <div className="bg-white p-2 shadow-md rounded-lg rotate-2 transform transition hover:rotate-0">
                                                <img src={item.image}
                                                    alt={item.title}
                                                    onClick={() => openModal(item.image, item.title, item.description)}
                                                    className="rounded object-cover h-48 w-full zoomable cursor-zoom-in"
                                                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Photo')} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-sbc border-b-2 border-gray-200 pb-2 mb-12 flex items-center gap-2">
                        <i className="fas fa-history"></i> Historique des Titres
                    </h2>

                    <div className="relative border-l-4 border-sbc ml-6 space-y-16">
                        {history.map((item) => (
                            <div key={item.id} className="relative pl-8 fade-in">
                                <div className={`absolute -left-[10px] top-6 w-5 h-5 bg-white border-4 rounded-full ${item.title.includes('Champion') && !item.title.includes('Vice') ? 'border-yellow-400' : 'border-gray-400'}`}></div>
                                <div className={`bg-white p-6 rounded-xl shadow-md border-l-4 hover:shadow-lg transition ${item.title.includes('Champion') && !item.title.includes('Vice') ? 'border-yellow-400' : 'border-gray-400'}`}>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1">
                                            <span className={`inline-block font-bold px-3 py-1 rounded text-sm mb-2 ${item.title.includes('Champion') && !item.title.includes('Vice') ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-700'}`}>
                                                {item.year}
                                            </span>
                                            <h3 className="text-xl font-bold text-gray-700">{item.title}</h3>
                                            <p className="text-gray-600 font-medium">{item.category}</p>
                                            <p className="text-gray-500 text-sm mt-2">{item.description}</p>
                                        </div>
                                        <div className="md:w-1/2">
                                            <img src={item.image} alt={item.title}
                                                onClick={() => openModal(item.image, item.title, item.description)}
                                                className="rounded-lg shadow-sm w-full h-48 object-cover transform hover:scale-105 transition duration-500 zoomable cursor-zoom-in"
                                                onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Photo')} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
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
