"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface Team {
    name: string;
    category: string;
    image: string;
    schedule: string;
    widgetId: string;
    coaches: { name: string; role: string; img: string }[];
    players: { name: string; num: number; img: string }[];
}

export default function EquipeDetail({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id } = use(params);

    const [team, setTeam] = useState<Team | null>(null);
    const [logoUrl, setLogoUrl] = useState("/img/logo.png");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetch('/api/teams')
                .then(res => res.json())
                .then(data => {
                    const decodedId = decodeURIComponent(id);
                    const foundTeam = data[decodedId] || data[id];
                    setTeam(foundTeam);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }

        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.site_logo_id) {
                    setLogoUrl(`/api/image/${data.site_logo_id}`);
                }
            })
            .catch(console.error);
    }, [id]);

    useEffect(() => {
        if (team?.widgetId) {
            const desktopTarget = document.getElementById('scorenco-widget-desktop');
            const mobileTarget = document.getElementById('scorenco-widget-mobile');

            if (desktopTarget || mobileTarget) {
                // Clear previous widgets
                if (desktopTarget) desktopTarget.innerHTML = '';
                if (mobileTarget) mobileTarget.innerHTML = '';

                const w = document.createElement('div');
                w.className = 'scorenco-widget';
                w.setAttribute('data-widget-type', 'team');
                w.setAttribute('data-widget-id', team.widgetId);
                // Using the inline style from original code
                w.style.cssText = 'background: #14532d; height: 500px; display: flex; align-items: center; justify-content: center; flex-direction: column; text-transform: uppercase; font-family: sans-serif; font-weight: bolder; gap: 9px; color:#1E457B;';

                const styleTag = document.createElement('style');
                styleTag.textContent = ".ldsdr{display:inline-block;width:80px;height:80px}.ldsdr:after{content:\" \";display:block;width:64px;height:64px;margin:8px;border-radius:50%;border:6px solid #1E457B;border-color:#1E457B transparent;animation:ldsdr 1.2s linear infinite}@keyframes ldsdr{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}";
                w.appendChild(styleTag);

                const s = document.createElement('script');
                s.async = true;
                s.defer = true;
                s.src = 'https://widgets.scorenco.com/host/widgets.js';
                w.appendChild(s);

                const placeWidget = () => {
                    const isDesktop = window.matchMedia('(min-width:1024px)').matches;
                    // Logic from original js
                    if (isDesktop && desktopTarget) {
                        if (!desktopTarget.hasChildNodes()) desktopTarget.appendChild(w);
                    } else if (!isDesktop && mobileTarget) {
                        if (!mobileTarget.hasChildNodes()) mobileTarget.appendChild(w);
                    }
                };

                placeWidget();

                window.addEventListener('resize', placeWidget);
                return () => window.removeEventListener('resize', placeWidget);
            }
        }
    }, [team]);

    if (loading) return <div className="text-center p-12 mt-12"><h1 className="text-2xl font-bold">Chargement...</h1></div>;

    if (!team) return (
        <div className='text-center p-12 mt-12'>
            <h1 className='text-2xl font-bold'>Équipe introuvable</h1>
            <Link href='/equipes' className='text-sbc underline'>Retour</Link>
        </div>
    );

    return (
        <>
            <div className="bg-sbc-dark text-white py-12">
                <div className="container mx-auto px-4">
                    <Link href="/equipes" className="text-gray-300 hover:text-white mb-4 inline-block text-sm">
                        <i className="fas fa-arrow-left mr-1"></i> Retour aux équipes
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold">{team.name}</h1>
                    <span className="inline-block bg-sbc-light text-sbc-dark font-bold px-3 py-1 rounded mt-3">{team.category}</span>
                </div>
            </div>

            <main className="container mx-auto px-4 py-12 flex flex-col lg:grid lg:grid-cols-3 gap-12 flex-grow fade-in">
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow border-l-4 border-sbc">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><i className="far fa-clock text-sbc"></i>
                            Horaires d'entraînement</h3>
                        <p className="text-gray-700 font-medium">{team.schedule}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                        <h3 className="text-xl font-bold mb-6 text-sbc-dark flex items-center gap-2">
                            <i className="fas fa-user-tie"></i> Coachs
                        </h3>
                        <div className="space-y-4">
                            {team.coaches.map((c, i) => (
                                <div key={i} className="relative overflow-hidden flex items-center gap-5 p-4 rounded-xl bg-sbc-dark text-white shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
                                    <div className="absolute right-0 top-0 w-24 h-full bg-white/5 skew-x-12 translate-x-12 group-hover:translate-x-8 transition-transform"></div>
                                    <img src={logoUrl} alt="" className="absolute -right-6 -bottom-6 w-24 opacity-10 grayscale rotate-12 group-hover:rotate-0 transition-all duration-500" />

                                    <div className="relative flex-shrink-0">
                                        <div className="absolute inset-0 bg-sbc-light rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                        <img src={c.img} alt={`Coach ${c.name}`} className="relative w-16 h-16 rounded-full object-cover border-2 border-sbc-light/30 shadow-sm" />
                                    </div>

                                    <div className="relative z-10 flex-grow">
                                        <h4 className="font-bold text-lg leading-tight tracking-wide group-hover:text-sbc-light transition-colors">
                                            {c.name.toUpperCase()}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="w-2 h-2 rounded-full bg-sbc-light animate-pulse"></span>
                                            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                                {c.role}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div id="scorenco-widget-desktop" className="hidden lg:block lg:col-span-1 lg:col-start-1 lg:row-start-2 mt-6 h-[500px]"></div>
                </div>

                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold border-b-2 border-gray-200 pb-2 mb-6 text-sbc-dark flex items-center gap-3">
                        <img src={logoUrl} alt="Logo Seclin Basket Club - SBC" className="h-8 w-auto" /> Effectif Joueurs
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                        {team.players && team.players.length > 0 ? team.players.map((p, i) => (
                            <div key={i} className="group relative bg-white p-6 rounded-2xl shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden text-center">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sbc to-sbc-light"></div>
                                <div className="relative inline-block mb-4">
                                    <div className="absolute inset-0 bg-sbc rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                    <img src={p.img} alt={p.name} className="relative w-24 h-24 rounded-full object-cover border-4 border-white shadow-md group-hover:scale-105 transition-transform duration-300" />
                                    <span className="absolute -bottom-2 -right-2 bg-gradient-to-br from-sbc to-sbc-dark text-white text-sm font-bold h-8 w-8 flex items-center justify-center rounded-full border-2 border-white shadow-lg">
                                        #{p.num}
                                    </span>
                                </div>
                                <h4 className="font-bold text-gray-800 text-lg group-hover:text-sbc transition-colors leading-tight">
                                    {p.name}
                                </h4>
                            </div>
                        )) : (
                            <p className="text-gray-500 col-span-full">Effectif non communiqué.</p>
                        )}
                    </div>
                    <div id="scorenco-widget-mobile" className="block lg:hidden mt-6 min-h-[500px]"></div>
                </div>
            </main>
        </>
    );
}
