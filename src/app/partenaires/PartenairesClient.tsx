"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Partenaires() {
    const [partners, setPartners] = useState<{ name: string; img: string }[]>([]);
    const [logoUrl, setLogoUrl] = useState("/logo.png");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState("");
    const [modalTitle, setModalTitle] = useState("");

    useEffect(() => {
        fetch('/api/partners')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPartners(data);
                }
            })
            .catch(console.error);

        /*
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.site_logo_id) {
                    setLogoUrl(`/api/image/${data.site_logo_id}`);
                }
            })
            .catch(console.error);
        */
    }, []);

    const openModal = (src: string, title: string) => {
        setModalImage(src);
        setModalTitle(title);
        setModalOpen(true);
    };

    return (
        <>
            <header className="bg-white py-12 shadow-sm text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-sbc-dark mb-4 uppercase tracking-wide">Nos Partenaires</h1>
                    <p className="text-gray-600">Ils soutiennent le Seclin Basket Club</p>
                </div>
                <i className="fas fa-handshake absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl text-gray-100 -z-0"></i>
            </header>

            <main className="container mx-auto px-4 py-12 flex-grow fade-in">
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-sbc-dark mb-10 text-center uppercase tracking-widest border-b border-gray-200 pb-4">
                        Ils nous soutiennent
                    </h2>
                    <div className="flex flex-wrap justify-center gap-8">
                        {partners.map((p, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 flex flex-col items-center justify-start border border-gray-100 group h-full flex-none w-full md:basis-1/2 lg:basis-[30%]">
                                <div className="w-full h-48 flex items-center justify-center overflow-hidden rounded-t-2xl bg-gray-100">
                                    <img src={p.img} alt={`Partenaire ${p.name}`} className="w-full h-full object-cover zoomable cursor-zoom-in" onClick={() => openModal(p.img, p.name)} />
                                </div>
                                <div className="p-6 w-full flex flex-col items-center">
                                    <p className="text-xl font-bold text-gray-700 text-center group-hover:text-sbc transition">{p.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-sbc-dark text-white rounded-2xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-4">Devenez partenaire</h2>
                        <p className="mb-8 text-lg text-gray-200">Rejoignez l'aventure SBC et associez votre image à nos valeurs.</p>
                        <Link href="/contact" className="bg-white text-sbc-dark font-bold py-3 px-8 rounded-full hover:bg-sbc-light transition shadow-lg inline-block transform hover:scale-105">
                            Nous contacter
                        </Link>
                    </div>
                    <img src="/logo.png" alt="Logo Seclin Basket Club - SBC" className="absolute -bottom-10 -right-10 w-64 opacity-10" />
                </div>

                {modalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer" onClick={() => setModalOpen(false)}>
                        <div className="relative max-w-4xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setModalOpen(false)} className="absolute -top-12 right-0 text-white text-4xl hover:text-gray-300 transition focus:outline-none">&times;</button>
                            <img src={modalImage} className="w-full max-h-[70vh] object-contain rounded-lg shadow-2xl bg-white p-4" />
                            <div className="text-center mt-6">
                                <h3 className="text-3xl font-bold text-white mb-2 tracking-wide">{modalTitle}</h3>
                                <p className="text-sbc-light text-lg font-medium uppercase">Partenaire du Seclin Basket Club</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
