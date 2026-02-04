import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Match {
    id: number;
    match_date: string;
    match_time: string;
    category: string;
    designation: string;
    match_type: string;
    opponent: string;
}

export default function HomeMatches({ matches }: { matches: Match[] }) {
    if (matches.length === 0) return null;

    const nextMatch = matches[0];
    const upcomingMatches = matches.slice(1, 4);

    return (
        <section className="relative py-20 bg-gray-900 overflow-hidden">
            {/* Abstract Background */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sbc rounded-full blur-[150px] opacity-10 -mr-64 -mt-64 text-sbc"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white rounded-full blur-[120px] opacity-5 -ml-40 -mb-40"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-4">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase transform -skew-x-6">
                            Prochains <span className="text-transparent bg-clip-text bg-gradient-to-r from-sbc to-green-300 pr-2">Matchs</span>
                        </h2>
                        <p className="text-gray-400 mt-2 font-mono uppercase tracking-widest text-sm">
                            Vibrez au rythme du Seclin Basket Club
                        </p>
                    </div>
                    <div className="hidden md:block w-32 h-1 bg-sbc transform skew-x-12"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Featured Match - The "Big Ticket" */}
                    <div className="lg:col-span-7 xl:col-span-8">
                        <div className="relative group perspective-1000">
                            <div className="absolute inset-0 bg-gradient-to-r from-sbc to-sbc-dark rounded-3xl transform rotate-1 group-hover:rotate-2 transition duration-500 opacity-70 blur-md"></div>
                            <div className="relative bg-black border border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden transform transition duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_50px_rgba(34,197,94,0.3)]">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <i className="fas fa-basketball-ball text-9xl text-white transform rotate-45"></i>
                                </div>

                                <div className="flex flex-wrap gap-3 mb-6">
                                    <div className="inline-block bg-sbc text-black px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest">
                                        <i className="fas fa-fire mr-1"></i> Match à la une
                                    </div>
                                    <div className={`inline-block px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest border ${nextMatch.match_type === 'Coupe' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' :
                                            nextMatch.match_type === 'Amical' ? 'bg-blue-500/20 text-blue-500 border-blue-500/50' :
                                                'bg-white/10 text-gray-300 border-white/10'
                                        }`}>
                                        {nextMatch.match_type}
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                                    <div>
                                        <h3 className="text-5xl md:text-7xl font-black text-white italic leading-none mb-2">
                                            {nextMatch.category.replace('M', ' G').replace('F', ' F')}
                                        </h3>
                                        <div className="text-xl md:text-3xl font-bold uppercase tracking-tight flex items-center gap-3">
                                            <span className="text-sbc font-black italic">VS</span>
                                            <span className="text-gray-300">{nextMatch.opponent}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center flex-shrink-0 bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl w-full md:w-auto">
                                        <div className="text-4xl font-black text-white mb-1">
                                            {new Date(nextMatch.match_date).getDate()}
                                        </div>
                                        <div className="text-sm font-bold text-sbc uppercase tracking-widest mb-3">
                                            {format(new Date(nextMatch.match_date), 'MMM', { locale: fr })}
                                        </div>
                                        <div className="w-full h-px bg-white/20 mb-3"></div>
                                        <div className="text-2xl font-mono text-white">
                                            {nextMatch.match_time.slice(0, 5)}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <i className="fas fa-map-marker-alt text-sbc"></i>
                                        <span>Salle Jesse Owens, Seclin</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming List - "The Schedule" */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 h-full">
                        {upcomingMatches.map((match, idx) => (
                            <div key={idx} className="group relative bg-gray-800/50 hover:bg-gray-800 border border-white/5 hover:border-sbc/30 p-5 rounded-2xl transition duration-300 flex-1 flex flex-col justify-center">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center bg-gray-900 p-2.5 rounded-xl border border-white/10 min-w-[60px]">
                                            <span className="text-xl font-bold text-white">{new Date(match.match_date).getDate()}</span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase">{format(new Date(match.match_date), 'MMM', { locale: fr })}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-lg leading-tight group-hover:text-sbc transition">
                                                {match.category}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sbc font-black italic text-xs">VS</span>
                                                <span className="text-gray-400 text-xs font-medium truncate max-w-[150px] sm:max-w-[200px]">
                                                    {match.opponent}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-white font-mono font-bold bg-white/10 px-2 py-1 rounded-md text-sm">
                                            {match.match_time.slice(0, 5)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <a href="/planning" className="mt-2 text-center text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2">
                            Voir tout le calendrier <i className="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
