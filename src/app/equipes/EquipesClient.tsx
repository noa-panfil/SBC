"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Team {
    name: string;
    category: string;
    image: string;
    schedule: string;
    widgetId: string;
    coaches: any[];
    players: any[];
}

export default function Equipes() {
    const [teamsData, setTeamsData] = useState<Record<string, Team>>({});
    const [favorites, setFavorites] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load Favorites
        const storedFavs = localStorage.getItem('sbc_favorites');
        if (storedFavs) {
            setFavorites(JSON.parse(storedFavs));
        }

        // Load Teams
        fetch('/api/teams')
            .then(res => res.json())
            .then(data => {
                setTeamsData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const toggleFavorite = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        let newFavs = [...favorites];
        if (newFavs.includes(id)) {
            newFavs = newFavs.filter(fav => fav !== id);
        } else {
            newFavs.push(id);
        }
        setFavorites(newFavs);
        localStorage.setItem('sbc_favorites', JSON.stringify(newFavs));
    };

    const TeamCard = ({ id, team, isFav }: { id: string, team: Team, isFav: boolean }) => (
        <Link href={`/equipe/${id}`} className="group block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition relative fade-in">
            <div className="h-56 overflow-hidden relative">
                <img src={team.image} alt={`${team.name} - Équipe Seclin Basket Club`} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />

                <div className="absolute top-0 left-0 bg-sbc text-white font-bold px-3 py-1 text-sm rounded-br-lg shadow-sm">
                    {team.category}
                </div>

                <button onClick={(e) => toggleFavorite(e, id)}
                    className="absolute top-2 right-2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition shadow-lg backdrop-blur-sm group-hover:scale-110">
                    <i className={`${isFav ? "fas fa-star text-yellow-400" : "far fa-star text-white hover:text-yellow-300"} text-xl transition-colors duration-300 drop-shadow-md`}></i>
                </button>
            </div>
            <div className="p-6">
                <h3 className="text-xl font-bold group-hover:text-sbc transition flex items-center justify-between">
                    {team.name}
                </h3>
                <p className="text-gray-500 mt-2 text-sm flex items-center">
                    Voir l'effectif <i className="fas fa-arrow-right ml-2 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1"></i>
                </p>
            </div>
        </Link>
    );

    if (loading) {
        return (
            <main className="container mx-auto px-4 py-12 flex-grow fade-in text-center">
                <h1 className="text-4xl font-bold text-sbc-dark">Nos Équipes</h1>
                <p className="text-gray-600 mt-2">Saison 2024 - 2025</p>
                <div className="mt-12 text-gray-500">Chargement des équipes...</div>
            </main>
        )
    }

    // Sorting Logic (Same as Admin)
    const getTeamWeight = (name: string) => {
        let score = 0;
        const n = name.toUpperCase();

        // 1. Age Category (Base Score)
        if (n.includes('BABY')) score = 100;
        else if (n.includes('U7') || n.includes('MINI')) score = 200;
        else if (n.includes('U9') || n.includes('POUSSIN')) score = 300;
        else if (n.includes('U11') || n.includes('BENJAMIN')) score = 400;
        else if (n.includes('U13') || n.includes('MINIME')) score = 500;
        else if (n.includes('U15') || n.includes('CADET')) score = 600;
        else if (n.includes('U17')) score = 700;
        else if (n.includes('U18')) score = 800;
        else if (n.includes('U20') || n.includes('JUNIOR')) score = 900;
        else if (n.includes('SENIOR')) score = 1000;
        else if (n.includes('LOISIR')) score = 1100;
        else score = 9999;

        // 2. Gender Priority (Same level: F < M)
        const isFemale = n.includes(' F') || n.includes('-F') || n.endsWith(' F') || n.includes('FILLE');
        const isMale = n.includes(' M') || n.includes('-M') || n.endsWith(' M') || n.includes('GARCON') || n.includes(' MASC');

        if (isFemale) score += 0;
        else if (isMale) score += 5;
        else score += 2;

        // 3. Team Level (1 < 2 < 3)
        if (n.includes(' 2') || n.includes('-2')) score += 1;
        else if (n.includes(' 3') || n.includes('-3')) score += 2;
        else if (n.includes(' 4') || n.includes('-4')) score += 3;

        return score;
    };

    const favoriteTeams = Object.entries(teamsData)
        .filter(([id]) => favorites.includes(id))
        .sort(([, a], [, b]) => getTeamWeight(a.name) - getTeamWeight(b.name));

    const displayedMainTeams = (favorites.length > 0
        ? Object.entries(teamsData).filter(([id]) => !favorites.includes(id))
        : Object.entries(teamsData)
    ).sort(([, a], [, b]) => getTeamWeight(a.name) - getTeamWeight(b.name));

    return (
        <>
            <header className="bg-white py-12 shadow-sm text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-sbc-dark mb-4 uppercase tracking-wide">Nos Équipes</h1>
                    <p className="text-gray-600">Saison 2024 - 2025</p>
                </div>
                <i className="fas fa-basketball-ball absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl text-gray-100 -z-0"></i>
            </header>

            <main className="container mx-auto px-4 py-12 flex-grow fade-in">
                {favorites.length > 0 && (
                    <section id="favorites-section" className="mb-16 border-b border-gray-200 pb-12">
                        <h2 className="text-2xl font-bold text-yellow-600 mb-6 flex items-center gap-2">
                            <i className="fas fa-star"></i> Mes Favoris
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {favoriteTeams.map(([id, team]) => (
                                <TeamCard key={id} id={id} team={team} isFav={true} />
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <h2 className="text-2xl font-bold text-sbc-dark mb-6 flex items-center gap-2">
                        <i className="fas fa-users"></i> {favorites.length > 0 ? "Autres équipes" : "Toutes les équipes"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {displayedMainTeams.map(([id, team]) => (
                            <TeamCard key={id} id={id} team={team} isFav={false} />
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
}
