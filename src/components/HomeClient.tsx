"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

// Types
interface Event {
    id: string;
    title: string;
    date: string;
    "format-date": string;
    time: string;
    location: string;
    description: string;
    image: string;
    jsDate?: Date;
}

interface Person {
    name: string;
    img: string;
    day: number;
    birth: string;
    sexe: string;
    roles: string[];
    teamsData: { name: string; id: string }[];
}

export default function HomeClient() {
    return (
        <main className="fade-in">
            <EventSection />
            <BirthdaySection />
            <PartnerCarousel />
        </main>
    )
}

function EventSection() {
    const [events, setEvents] = useState<{ upcoming: Event[], past: Event[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<'upcoming' | 'past'>('upcoming');
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 3;

    useEffect(() => {
        fetch('/api/events')
            .then(res => res.json())
            .then(data => {
                const now = new Date();
                now.setHours(0, 0, 0, 0);

                const upcoming: Event[] = [];
                const past: Event[] = [];

                function parseDate(str: string) {
                    const [day, month, year] = str.split('/');
                    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                }

                Object.entries(data).forEach(([id, event]: [string, any]) => {
                    if (!event["format-date"]) return;

                    const eventDate = parseDate(event["format-date"]);
                    if (!eventDate) return;

                    const eventWithId: Event = { ...event, id, jsDate: eventDate };

                    if (eventDate.getTime() >= now.getTime()) {
                        upcoming.push(eventWithId);
                    } else {
                        past.push(eventWithId);
                    }
                });

                upcoming.sort((a, b) => (a.jsDate!.getTime() - b.jsDate!.getTime()));
                past.sort((a, b) => (b.jsDate!.getTime() - a.jsDate!.getTime()));

                setEvents({ upcoming, past });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading || !events || (events.upcoming.length === 0 && events.past.length === 0)) return null;

    const list = currentView === 'upcoming' ? events.upcoming : events.past;
    const totalPages = Math.ceil(list.length / itemsPerPage);
    const visibleItems = list.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    const handleSwitch = () => {
        setCurrentView(prev => prev === 'upcoming' ? 'past' : 'upcoming');
        setCurrentPage(0);
    };

    return (
        <section id="events-section" className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-center gap-2 md:gap-6 mb-10 select-none">
                    <button onClick={() => { setCurrentView('upcoming'); setCurrentPage(0); }} aria-label="Voir les événements à venir"
                        className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full bg-gray-100 hover:bg-sbc hover:text-white text-gray-600 transition flex items-center justify-center shadow-sm focus:outline-none ${currentView === 'upcoming' ? 'opacity-0 pointer-events-none' : ''}`}>
                        <i className="fas fa-chevron-left text-lg md:text-xl"></i>
                    </button>

                    <div className="text-center w-72 md:w-96 flex flex-col justify-center h-20">
                        <h2 className="text-xl md:text-3xl font-bold text-sbc-dark flex items-center justify-center gap-2 md:gap-3 transition-all duration-300 whitespace-nowrap">
                            {currentView === 'upcoming' ? <><i className="fas fa-calendar-alt text-sbc"></i> Événements à venir</> : <><i className="fas fa-history text-sbc"></i> C'est déjà passé</>}
                        </h2>
                        <p className="text-gray-500 mt-1 text-xs md:text-base line-clamp-1">
                            {currentView === 'upcoming' ? "Ne manquez pas les prochains rendez-vous !" : "Souvenirs des événements précédents."}
                        </p>
                    </div>

                    <button onClick={() => { setCurrentView('past'); setCurrentPage(0); }} aria-label="Voir les événements passés"
                        className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full bg-gray-100 hover:bg-sbc hover:text-white text-gray-600 transition flex items-center justify-center shadow-sm focus:outline-none ${currentView === 'past' ? 'opacity-0 pointer-events-none' : ''}`}>
                        <i className="fas fa-chevron-right text-lg md:text-xl"></i>
                    </button>
                </div>

                <div className="relative flex items-center gap-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className={`z-10 w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-600 shadow-md hover:bg-sbc hover:text-white hover:border-sbc transition flex-shrink-0 flex items-center justify-center ${totalPages <= 1 ? 'hidden' : ''} ${currentPage === 0 ? 'opacity-30 cursor-default' : ''}`}>
                        <i className="fas fa-chevron-left"></i>
                    </button>

                    <div className="flex-grow overflow-hidden min-h-[400px]">
                        {list.length === 0 ? (
                            <div className="text-center text-gray-400 py-10 italic">Aucun événement à afficher pour le moment.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up">
                                {visibleItems.map(event => (
                                    <EventCard key={event.id} event={event} isPast={currentView === 'past'} />
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1}
                        className={`z-10 w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-600 shadow-md hover:bg-sbc hover:text-white hover:border-sbc transition flex-shrink-0 flex items-center justify-center ${totalPages <= 1 ? 'hidden' : ''} ${currentPage >= totalPages - 1 ? 'opacity-30 cursor-default' : ''}`}>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <span key={i} className={`block w-2 h-2 rounded-full transition-all duration-300 ${i === currentPage ? 'bg-sbc w-4' : 'bg-gray-300'}`}></span>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function EventCard({ event, isPast }: { event: Event, isPast: boolean }) {
    const CardContent = (
        <>
            <div className="relative w-full h-64 bg-gray-100">
                <Image
                    src={event.image || "/img/event-placeholder.jpg"}
                    alt={event.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition duration-500 hover:scale-105"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-sbc-dark font-bold px-3 py-1 rounded-lg shadow text-sm border border-gray-100 z-10">
                    <i className="far fa-calendar mr-1"></i> {event.date}
                </div>
                {!isPast && (
                    <div className="absolute inset-0 bg-transparent group-hover:bg-black/20 transition duration-300 flex items-center justify-center z-10">
                        <span className="bg-sbc text-white px-6 py-2 rounded-full font-bold shadow-lg opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300">
                            S'inscrire
                        </span>
                    </div>
                )}
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1">{event.title}</h3>
                <div className="text-sm text-gray-500 mb-3 space-y-1">
                    <p><i className="fas fa-clock text-sbc mr-2"></i> {event.time}</p>
                    <p><i className="fas fa-map-marker-alt text-sbc mr-2"></i> {event.location}</p>
                </div>
                <p className="text-gray-600 text-sm flex-grow line-clamp-3">
                    {event.description}
                </p>
            </div>
        </>
    );

    if (isPast) {
        return (
            <div className="block bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col h-full opacity-70 grayscale cursor-default">
                {CardContent}
            </div>
        )
    }

    return (
        <Link href={`/event/${event.id}`} className="block bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition duration-300 flex flex-col h-full group cursor-pointer">
            {CardContent}
        </Link>
    );
}

function BirthdaySection() {
    const [birthdays, setBirthdays] = useState<Person[]>([]);
    const [monthName, setMonthName] = useState("");
    const [todayDay, setTodayDay] = useState(0);

    useEffect(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        setTodayDay(today.getDate());
        const monthNames = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
        setMonthName(monthNames[currentMonth]);

        fetch('/api/teams')
            .then(res => res.json())
            .then(data => {
                const uniquePeople: Record<string, Person> = {};

                function processPerson(person: any, teamName: string, teamId: string, roleLabel: string) {
                    if (!person.birth) return;
                    const parts = person.birth.split("/");
                    if (parts.length === 3) {
                        const birthDay = parseInt(parts[0], 10);
                        const birthMonth = parseInt(parts[1], 10) - 1;

                        if (birthMonth === currentMonth) {
                            const uniqueKey = person.name + "-" + person.birth;
                            if (!uniquePeople[uniqueKey]) {
                                uniquePeople[uniqueKey] = {
                                    name: person.name,
                                    img: person.img,
                                    day: birthDay,
                                    birth: person.birth,
                                    sexe: person.sexe || "M",
                                    roles: [roleLabel],
                                    teamsData: [{ name: teamName, id: teamId }],
                                };
                            } else {
                                const existing = uniquePeople[uniqueKey];
                                if (!existing.roles.includes(roleLabel)) existing.roles.push(roleLabel);
                                const teamExists = existing.teamsData.some((t) => t.id === teamId);
                                if (!teamExists) existing.teamsData.push({ name: teamName, id: teamId });
                                if (person.sexe) existing.sexe = person.sexe;
                            }
                        }
                    }
                }

                for (const [teamId, teamData] of Object.entries(data)) {
                    // @ts-ignore
                    if (teamData.players) teamData.players.forEach((p) => processPerson(p, teamData.name, teamId, "Joueur"));
                    // @ts-ignore
                    if (teamData.coaches) teamData.coaches.forEach((c) => processPerson(c, teamData.name, teamId, c.role || "Coach"));
                }

                const list = Object.values(uniquePeople);
                list.sort((a, b) => a.day - b.day);
                setBirthdays(list);
            })
            .catch(console.error);
    }, []);

    if (birthdays.length === 0) return null;

    const todaysBirthdays = birthdays.filter(p => p.day === todayDay);
    const otherBirthdays = birthdays.filter(p => p.day !== todayDay);

    return (
        <section id="birthday-section" className="py-12 bg-green-50 border-b border-green-100">
            <div className="container mx-auto px-4">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-sbc-dark flex items-center justify-center gap-3">
                        <i className="fas fa-birthday-cake text-yellow-500 animate-bounce"></i>
                        Anniversaires du mois
                    </h2>
                    <p className="text-gray-600 mt-2">Ils fêtent leur anniversaire en <span className="font-bold capitalize text-sbc">{monthName}</span></p>
                </div>

                {/* TODAY'S BIRTHDAYS - FEATURED */}
                {todaysBirthdays.length > 0 && (
                    <div className="mb-12">
                        <div className="text-center mb-6">
                            <span className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black uppercase tracking-widest shadow-lg animate-pulse">
                                <i className="fas fa-star mr-2"></i> C'est aujourd'hui !
                            </span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-6">
                            {todaysBirthdays.map((p, i) => {
                                const parts = p.birth.split("/");
                                let birthYear = parseInt(parts[2], 10);
                                const currentYear = new Date().getFullYear();
                                if (birthYear < 100) {
                                    const currentYearShort = currentYear - 2000;
                                    birthYear += birthYear > currentYearShort ? 1900 : 2000;
                                }
                                const age = currentYear - birthYear;

                                return (
                                    <div key={i} className="flex flex-col items-center max-w-xs w-full bg-white rounded-3xl p-6 shadow-[0_0_30px_rgba(234,179,8,0.2)] border-2 border-yellow-400 relative overflow-hidden transform hover:scale-105 transition duration-500">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-300 via-orange-500 to-red-500"></div>
                                        <div className="absolute -right-4 -top-4 text-8xl opacity-5 text-yellow-500 rotate-12">
                                            <i className="fas fa-gift"></i>
                                        </div>

                                        <div className="relative mb-4">
                                            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
                                            <Image
                                                src={p.img}
                                                alt={p.name}
                                                width={96}
                                                height={96}
                                                className="relative w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                                            />
                                            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white w-10 h-10 flex items-center justify-center rounded-full font-black text-lg shadow-lg border-2 border-white transform rotate-6">
                                                {age}
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black text-gray-800 text-center mb-2 leading-tight">{p.name}</h3>

                                        <div className="flex flex-wrap justify-center gap-1 mb-4">
                                            {p.teamsData.map((t, idx) => (
                                                <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                    {t.name}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="text-center">
                                            <p className="text-lg font-bold text-sbc mb-1">Joyeux Anniversaire !</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* OTHER BIRTHDAYS */}
                <div className="flex flex-wrap justify-center gap-6 w-full">
                    {otherBirthdays.map((p, i) => {
                        const parts = p.birth.split("/");
                        let birthYear = parseInt(parts[2], 10);
                        const currentYear = new Date().getFullYear();
                        if (birthYear < 100) {
                            const currentYearShort = currentYear - 2000;
                            birthYear += birthYear > currentYearShort ? 1900 : 2000;
                        }
                        const age = currentYear - birthYear;
                        const pronoun = p.sexe === "F" ? "Elle" : "Il";

                        return (
                            <div key={i} className={`bg-white rounded-xl shadow-md p-4 flex items-center gap-4 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] xl:w-[calc(25%-18px)] border-l-4 ${p.day < todayDay ? 'border-gray-200 grayscale opacity-60' : 'border-sbc hover:shadow-lg transition transform hover:-translate-y-1'}`}>
                                <div className="relative flex-shrink-0">
                                    <Image
                                        src={p.img}
                                        alt={p.name}
                                        width={64}
                                        height={64}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                                    />
                                    <div className={`absolute -bottom-1 -right-1 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow ${p.day < todayDay ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-sbc'}`}>{p.day}</div>
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-bold text-gray-800 text-lg leading-tight truncate mb-1">{p.name}</h3>
                                    <div className="text-xs uppercase tracking-wide mb-2 text-gray-500">
                                        <span className="text-sbc font-bold">{p.roles.join(" & ")}</span><br />
                                        <span className="truncate block mt-0.5">
                                            {p.teamsData.map((t, idx) => (
                                                <span key={idx}>
                                                    {idx > 0 && " / "}
                                                    <Link href={`/equipe/${t.id}`} className="text-gray-600 hover:text-sbc hover:underline transition font-medium">{t.name}</Link>
                                                </span>
                                            ))}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-xs"><i className="fas fa-calendar-day mr-1"></i> Le {p.day} {monthName} ({age} ans)</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    );
}

function PartnerCarousel() {
    const [partners, setPartners] = useState<{ name: string; img: string }[]>([]);
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
    }, []);

    const openModal = (src: string, title: string) => {
        setModalImage(src);
        setModalTitle(title);
        setModalOpen(true);
    };

    // Repetition for continuous scroll
    const allPartners = [...partners, ...partners];

    return (
        <section className="py-16 bg-white border-t border-gray-100 overflow-hidden">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-2xl font-bold text-gray-400 mb-4 uppercase tracking-widest">Ils nous soutiennent</h2>

                <div className="carousel-container">
                    <div className="carousel-track">
                        {allPartners.map((p, i) => (
                            <div key={i} className="carousel-item bg-white rounded-xl shadow-md border border-gray-100 p-4">
                                <div className="relative w-full h-32">
                                    <Image
                                        src={p.img}
                                        alt={`Partenaire ${p.name}`}
                                        fill
                                        className="object-contain zoomable transition duration-300 hover:scale-105 cursor-zoom-in"
                                        onClick={() => openModal(p.img, p.name)}
                                        sizes="(max-width: 768px) 100vw, 300px"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8">
                    <Link href="/partenaires"
                        className="inline-block border-2 border-sbc text-sbc font-bold py-2 px-8 rounded-full hover:bg-sbc hover:text-white transition duration-300 shadow-sm hover:shadow-md">
                        Voir la page partenaires complète
                    </Link>
                </div>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer" onClick={() => setModalOpen(false)}>
                    <div className="relative max-w-4xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setModalOpen(false)} className="absolute -top-12 right-0 text-white text-4xl hover:text-gray-300 transition focus:outline-none">&times;</button>
                        <div className="relative w-full max-h-[70vh] h-[70vh]">
                            <Image
                                src={modalImage}
                                alt={modalTitle}
                                fill
                                className="object-contain rounded-lg shadow-2xl bg-white p-4"
                            />
                        </div>
                        <div className="text-center mt-6">
                            <h3 className="text-3xl font-bold text-white mb-2 tracking-wide">{modalTitle}</h3>
                            <p className="text-sbc-light text-lg font-medium uppercase">Partenaire du Seclin Basket Club</p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
