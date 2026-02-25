"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function DownloadPage() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sbc"></div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 py-12 animate-in fade-in duration-500">
            <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center relative border border-gray-100">
                {/* Background decorative element */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-sbc/10 to-transparent"></div>

                <div className="w-24 h-24 mx-auto bg-white rounded-2xl shadow-xl p-2 mb-6 flex items-center justify-center border border-gray-50 relative z-10 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                    <img
                        src="/logo.png"
                        alt="SBC Logo"
                        className="w-full h-full object-contain drop-shadow-sm"
                        onError={(e) => { e.currentTarget.src = "/img/logo.png" }}
                    />
                </div>

                <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">L'App<br /><span className="text-sbc">SBC</span></h1>
                <p className="text-gray-500 mb-8 max-w-[250px] mx-auto text-sm">Restez connecté au club avec notre application mobile.</p>

                {isStandalone ? (
                    <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl shadow-sm">
                            <i className="fas fa-check"></i>
                        </div>
                        <h3 className="text-green-800 font-bold mb-2">Déjà installée</h3>
                        <p className="text-green-600 text-sm">Vous profitez déjà de la meilleure expérience possible.</p>
                        <Link href="/" className="mt-6 inline-block bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20">
                            Ouvrir l'application
                        </Link>
                    </div>
                ) : isIOS ? (
                    <div className="text-left space-y-6">
                        <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 relative overflow-hidden group">
                            <i className="fab fa-apple absolute -right-4 -top-4 text-8xl text-blue-500/5 group-hover:text-blue-500/10 transition-colors"></i>

                            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 relative z-10">
                                <i className="fab fa-apple text-xl text-sbc"></i>
                                Installation sur iPhone
                            </h3>

                            <ol className="space-y-5 relative z-10">
                                <div className="absolute left-4 top-4 bottom-4 w-px bg-blue-200" />
                                <li className="relative pl-12 group/item">
                                    <div className="absolute left-0 top-0 w-8 h-8 bg-white border border-blue-200 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm shadow-sm group-hover/item:border-blue-500 group-hover/item:text-blue-500 transition-colors">1</div>
                                    <p className="text-sm text-gray-700 pt-1">Appuyez sur le bouton <strong>Partager</strong> <span className="text-xs text-gray-400">(souvent en bas de l'écran)</span></p>
                                    <div className="bg-white border text-blue-500 rounded-lg p-2 mt-2 w-max shadow-sm transform group-hover/item:-translate-y-0.5 transition-transform">
                                        <i className="fas fa-share-square text-xl"></i>
                                    </div>
                                </li>
                                <li className="relative pl-12 group/item">
                                    <div className="absolute left-0 top-0 w-8 h-8 bg-white border border-blue-200 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm shadow-sm group-hover/item:border-blue-500 group-hover/item:text-blue-500 transition-colors">2</div>
                                    <p className="text-sm text-gray-700 pt-1">Faites défiler et sélectionnez <strong>Sur l'écran d'accueil</strong></p>
                                    <div className="bg-white border rounded-lg px-3 py-2 mt-2 w-max shadow-sm flex items-center gap-2 transform group-hover/item:-translate-y-0.5 transition-transform">
                                        <i className="far fa-plus-square text-gray-600 text-lg"></i>
                                        <span className="text-xs font-semibold text-gray-800">Sur l'écran d'accueil</span>
                                    </div>
                                </li>
                                <li className="relative pl-12 group/item">
                                    <div className="absolute left-0 top-0 w-8 h-8 bg-white border border-blue-200 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm shadow-sm group-hover/item:border-blue-500 group-hover/item:text-blue-500 transition-colors">3</div>
                                    <p className="text-sm text-gray-700 pt-1">Confirmez en appuyant sur <strong>Ajouter</strong> en haut à droite.</p>
                                </li>
                            </ol>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
                                <i className="fab fa-android text-2xl text-green-500"></i>
                                Installer l'Application
                            </h3>
                            <p className="text-sm text-gray-600 mb-6 px-4">Un raccourci sera ajouté à votre écran d'accueil pour un accès rapide.</p>

                            <button
                                onClick={handleInstallClick}
                                disabled={!deferredPrompt}
                                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${deferredPrompt ? 'bg-sbc text-white shadow-xl shadow-sbc/30 hover:bg-sbc-dark hover:scale-[1.02] active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                                <i className="fas fa-download text-lg"></i>
                                <span>{deferredPrompt ? "Télécharger l'App" : "Installation non disponible"}</span>
                            </button>

                            {!deferredPrompt && (
                                <p className="text-xs text-gray-500 mt-4 leading-relaxed bg-white p-3 rounded-lg border border-gray-100">
                                    <i className="fas fa-info-circle text-blue-400 mr-1"></i>
                                    Si le bouton est inactif, essayez d'ouvrir le menu de votre navigateur (trois points en haut à droite) et cherchez "Installer l'application", ou l'app est peut-être déjà installée.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-sbc transition-colors flex items-center justify-center gap-2 hover:gap-3 opacity-80 hover:opacity-100">
                        <i className="fas fa-arrow-left"></i>
                        Retourner au site web
                    </Link>
                </div>
            </div>
        </div>
    );
}
