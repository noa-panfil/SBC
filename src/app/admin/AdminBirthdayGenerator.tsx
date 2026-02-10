"use client";

import { useState, useEffect, useRef } from "react";
import { toBlob } from "html-to-image";

interface Person {
    person_id: number;
    name: string;
    roles: string[]; // List of roles/teams
    birth: string | null; // "dd/mm/yyyy"
    img?: string | null;
}

interface Partner {
    id: number;
    name: string;
    img: string | null;
}

const MONTHS = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function AdminBirthdayGenerator({ teams }: { teams: any[] }) {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
    const [displayMode, setDisplayMode] = useState<'list' | 'photos'>('list');
    const [partners, setPartners] = useState<Partner[]>([]);
    const postRef = useRef<HTMLDivElement>(null);
    const [birthdays, setBirthdays] = useState<{ day: number, dateStr: string, members: { name: string, role: string, img: string | null }[] }[]>([]);

    useEffect(() => {
        // Fetch partners for the footer
        fetch('/api/partners')
            .then(res => res.json())
            .then(data => setPartners(data))
            .catch(console.error);
    }, []);

    useEffect(() => {
        // Aggregate all people from teams
        const allPeople = new Map<number, Person>();

        teams.forEach(team => {
            // Process Coaches
            team.coaches.forEach((c: any) => {
                const person: Person = allPeople.get(c.person_id) || {
                    person_id: c.person_id,
                    name: c.name,
                    roles: [],
                    birth: c.birth,
                    img: c.img
                };

                // Add role if not duplicate
                const roleStr = `Coach ${team.name}`;
                if (!person.roles.includes(roleStr)) {
                    person.roles.push(roleStr);
                }
                allPeople.set(c.person_id, person);
            });

            // Process Players
            team.players.forEach((p: any) => {
                const person: Person = allPeople.get(p.person_id) || {
                    person_id: p.person_id,
                    name: p.name,
                    roles: [],
                    birth: p.birth,
                    img: p.img
                };

                // Add role if not duplicate. For players, we just list the Team Name.
                // Or "Joueur U11" ? User asked: "coach tel équipe et joue dans tel équipe"
                // So "Joueur {team.name}" is clearest.
                const roleStr = `Joueur ${team.name}`;
                if (!person.roles.includes(roleStr)) {
                    person.roles.push(roleStr);
                }
                allPeople.set(p.person_id, person);
            });
        });

        // Filter by month
        const filtered = Array.from(allPeople.values()).filter(p => {
            if (!p.birth) return false;
            const parts = p.birth.split('/');
            if (parts.length !== 3) return false;
            const month = parseInt(parts[1], 10) - 1; // 0-11
            return month === selectedMonth;
        });

        // Group by day
        const grouped = new Map<number, { name: string, role: string, img: string | null }[]>();
        filtered.forEach(p => {
            const day = parseInt(p.birth!.split('/')[0], 10);

            // Format Roles
            let roleDisplay = "";
            if (p.roles.length > 0) {
                roleDisplay = `(${p.roles.join(', ')})`;
            }

            const memberObj = {
                name: p.name,
                role: roleDisplay,
                img: p.img || null
            };

            if (!grouped.has(day)) {
                grouped.set(day, []);
            }
            grouped.get(day)?.push(memberObj);
        });

        // Convert to array and sort by day
        const result = Array.from(grouped.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([day, members]) => ({
                day,
                dateStr: day < 10 ? `0${day}` : `${day}`,
                members
            }));

        setBirthdays(result);

    }, [teams, selectedMonth]);


    const handleDownload = async () => {
        if (!postRef.current) return;
        try {
            const blob = await toBlob(postRef.current, {
                quality: 1.0,
                pixelRatio: 1,
                width: 1080,
                height: 1350,
                style: {
                    transform: 'none',
                    transformOrigin: 'top left',
                    width: '1080px',
                    height: '1350px',
                    margin: '0'
                }
            });
            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `anniversaires-${MONTHS[selectedMonth].toLowerCase()}.png`;
                link.href = url;
                link.click();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleShare = async () => {
        if (!postRef.current) return;
        try {
            const blob = await toBlob(postRef.current, {
                quality: 1.0,
                pixelRatio: 1,
                width: 1080,
                height: 1350,
                style: {
                    transform: 'none',
                    transformOrigin: 'top left',
                    width: '1080px',
                    height: '1350px',
                    margin: '0'
                }
            });
            if (blob && navigator.share) {
                const file = new File([blob], `anniversaires-${MONTHS[selectedMonth].toLowerCase()}.png`, { type: "image/png" });
                await navigator.share({
                    files: [file],
                    title: 'Anniversaires SBC',
                    text: `Les anniversaires du mois de ${MONTHS[selectedMonth]} !`
                });
            } else {
                alert("Partage non supporté");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="border-gray-300 rounded-lg shadow-sm focus:border-sbc focus:ring-sbc font-bold text-gray-700"
                    >
                        {MONTHS.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>
                    <span className="text-gray-500 font-medium">{birthdays.reduce((acc, curr) => acc + curr.members.length, 0)} anniversaires</span>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setDisplayMode('list')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${displayMode === 'list' ? 'bg-white text-sbc shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <i className="fas fa-list mr-2"></i> Liste
                    </button>
                    <button
                        onClick={() => setDisplayMode('photos')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${displayMode === 'photos' ? 'bg-white text-sbc shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <i className="fas fa-portrait mr-2"></i> Photos
                    </button>
                </div>

                <div className="flex gap-4">
                    <button onClick={handleShare} className="bg-gray-100 hover:bg-gray-200 text-sbc font-bold py-2 px-4 rounded-lg transition">
                        <i className="fas fa-share-alt mr-2"></i> Partager
                    </button>
                    <button onClick={handleDownload} className="bg-sbc hover:bg-sbc-dark text-white font-bold py-2 px-4 rounded-lg transition shadow-lg">
                        <i className="fas fa-download mr-2"></i> Télécharger
                    </button>
                </div>
            </div>

            <div className="flex justify-center bg-gray-50 p-8 rounded-xl overflow-auto">
                <div className="relative shadow-2xl overflow-hidden bg-white group select-none">
                    {/* Canvas Container - 1080x1350 (4:5 Ratio) Scaled down for preview */}
                    <div
                        ref={postRef}
                        className="w-[1080px] h-[1350px] bg-gradient-to-br from-white to-gray-100 relative text-sbc-dark flex flex-col"
                        style={{
                            transform: 'scale(0.35)',
                            transformOrigin: 'top left',
                            marginBottom: '-877px', // 1350 * (1 - 0.35) roughly
                            marginRight: '-702px' // 1080 * (1 - 0.35) roughly
                        }}
                    >
                        {/* Background Elements */}
                        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sbc rounded-full blur-[150px] opacity-10 translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-sbc-dark rounded-full blur-[150px] opacity-10 -translate-x-1/2 translate-y-1/2"></div>
                        <div className="absolute inset-0 bg-[url('/img/pattern.png')] opacity-[0.03]"></div>

                        {/* Decoration Top */}
                        <div className="w-full h-4 bg-gradient-to-r from-sbc to-sbc-dark"></div>

                        {/* Header */}
                        <div className="pt-16 pb-8 px-16 text-center z-10">
                            <img src="/logo.png" alt="SBC" className="w-32 h-32 mx-auto mb-6 drop-shadow-xl" />
                            <h2 className="text-4xl font-black uppercase tracking-widest text-gray-400 mb-2">Joyeux Anniversaire</h2>
                            <h1 className="text-8xl font-black uppercase text-sbc tracking-tighter drop-shadow-sm">{MONTHS[selectedMonth]}</h1>
                        </div>



                        {/* Content List - Conditional Render */}
                        <div className="flex-grow px-12 py-4 overflow-hidden relative z-10">
                            {displayMode === 'list' ? (
                                // LIST MODE - Premium Dynamic Design
                                <div>
                                    {(() => {
                                        const count = birthdays.reduce((acc, curr) => acc + curr.members.length, 0);

                                        // Improved Tiers for better responsiveness
                                        const isSuperDense = count > 20; // 4 Cols
                                        const isXDense = count >= 15 && count <= 20; // 3 Cols (Smaller)
                                        const isDense = count >= 10 && count < 15; // 3 Cols (Larger)
                                        const isMedium = count > 5 && count < 10; // 2 Cols
                                        const isSpacious = count <= 5; // 1 Col

                                        // Container scaling
                                        const containerClass = isSpacious
                                            ? "flex flex-col gap-6 justify-center h-full px-20"
                                            : isSuperDense
                                                ? "grid grid-cols-4 gap-x-4 gap-y-4 px-4 content-start h-full"
                                                : (isXDense || isDense)
                                                    ? `grid grid-cols-3 gap-x-6 ${isXDense ? 'gap-y-4' : 'gap-y-8'} px-6 content-start h-full`
                                                    : "grid grid-cols-2 gap-x-12 gap-y-12 px-12 content-center h-full";

                                        // Item scaling - Grid items default behavior
                                        const itemClass = "w-full";
                                        const itemMargin = ""; // Grid handles gaps, no margins needed

                                        // Element sizing - 5 tiers of scaling
                                        const dateSize = isSpacious
                                            ? "w-28 h-28 text-6xl rounded-3xl"
                                            : isSuperDense ? "w-8 h-8 text-xs rounded-lg"
                                                : isXDense ? "w-11 h-11 text-lg rounded-xl"
                                                    : isDense ? "w-14 h-14 text-2xl rounded-xl"
                                                        : "w-20 h-20 text-4xl rounded-2xl";

                                        const gapGroup = isSpacious ? "gap-6" : isSuperDense ? "gap-1.5" : isXDense ? "gap-3" : "gap-4";
                                        const containerGap = isSpacious ? "gap-4 pt-4" : isSuperDense ? "gap-0.5 pt-0" : isXDense ? "gap-1 pt-0.5" : "gap-2 pt-1.5";

                                        const cardPadding = isSpacious
                                            ? "p-6 pr-10 rounded-3xl"
                                            : isSuperDense ? "p-1 pr-2 rounded-md"
                                                : isXDense ? "p-2 pr-3.5 rounded-xl"
                                                    : isDense ? "p-3.5 pr-5 rounded-2xl"
                                                        : "p-5 pr-8 rounded-3xl";

                                        const avatarSize = isSpacious
                                            ? "w-28 h-28 border-[6px]"
                                            : isSuperDense ? "w-7 h-7 border"
                                                : isXDense ? "w-10 h-10 border-2"
                                                    : isDense ? "w-14 h-14 border-2"
                                                        : "w-18 h-18 border-4";

                                        const nameSize = isSpacious
                                            ? "text-5xl"
                                            : isSuperDense ? "text-[10px]"
                                                : isXDense ? "text-base"
                                                    : isDense ? "text-xl"
                                                        : "text-3xl";

                                        const roleSize = isSpacious
                                            ? "text-2xl mt-2"
                                            : isSuperDense ? "text-[7px] mt-0"
                                                : isXDense ? "text-[9px] mt-0.5"
                                                    : isDense ? "text-xs mt-1"
                                                        : "text-base mt-2";

                                        return (
                                            <div className={containerClass}>
                                                {birthdays.map((b, i) => (
                                                    <div key={i} className={`flex items-start ${gapGroup} w-full`}>
                                                        {/* Date Badge */}
                                                        <div className={`${dateSize} bg-gradient-to-br from-sbc to-sbc-dark text-white flex flex-col items-center justify-center shrink-0 z-10 border border-white/20 shadow-lg`}>
                                                            <span className="font-black leading-none tracking-tighter">{b.dateStr}</span>
                                                        </div>

                                                        {/* Members Group */}
                                                        <div className={`flex flex-col w-full ${containerGap}`}>
                                                            {b.members.map((member, idx) => (
                                                                <div key={idx} className={`flex items-center gap-3 bg-white/60 backdrop-blur-sm ${cardPadding} border border-gray-100 shadow-sm relative overflow-hidden group hover:bg-white/80 transition-colors`}>
                                                                    {/* Avatar */}
                                                                    <div className={`${avatarSize} rounded-full overflow-hidden shrink-0 border-white shadow-sm bg-gray-100 flex items-center justify-center`}>
                                                                        {member.img ? (
                                                                            <img src={member.img} className="w-full h-full object-cover" alt="" />
                                                                        ) : (
                                                                            <i className={`fas fa-user text-gray-300 ${isSpacious ? 'text-5xl' : isSuperDense ? 'text-[9px]' : 'text-sm'}`}></i>
                                                                        )}
                                                                    </div>

                                                                    {/* Text Info */}
                                                                    <div className="flex flex-col min-w-0 justify-center flex-grow">
                                                                        <span className={`font-bold text-gray-800 truncate block leading-tight ${nameSize}`}>{member.name}</span>
                                                                        <span className={`text-sbc font-bold uppercase tracking-wider truncate block opacity-80 group-hover:opacity-100 transition-opacity ${roleSize}`}>
                                                                            {(() => {
                                                                                const roles = member.role.replace(/[()]/g, '').split(',').map(r => r.trim());
                                                                                if (roles.length > 2) {
                                                                                    return roles.slice(0, 2).join(', ') + '...';
                                                                                }
                                                                                return roles.join(', ');
                                                                            })()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                {birthdays.length === 0 && (
                                                    <div className={`text-center text-4xl text-gray-400 mt-20 italic col-span-full`}>
                                                        Aucun anniversaire ce mois-ci
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : (
                                // PHOTO GRID MODE
                                <div>
                                    {(() => {
                                        // Flatten members
                                        const allMembers = birthdays.flatMap(dayGroup =>
                                            dayGroup.members.map(member => ({ ...member, dateStr: dayGroup.dateStr }))
                                        );

                                        const total = allMembers.length;
                                        // Dynamic columns: 6 if > 10 items, else 5
                                        const cols = total > 10 ? 6 : 5;
                                        const remainder = total % cols;
                                        const mainCount = remainder === 0 ? total : total - remainder;

                                        const mainItems = allMembers.slice(0, mainCount);
                                        const lastItems = allMembers.slice(mainCount);

                                        // Dynamic width for flex items
                                        // gap-3 (0.75rem). For N cols, width = (100% - (N-1)*gap) / N
                                        // For 5 cols: (100% - 3rem) / 5
                                        // For 6 cols: (100% - 3.75rem) / 6
                                        const flexBasis = total > 10 ? 'calc((100% - 3.75rem) / 6)' : 'calc((100% - 3rem) / 5)';

                                        return (
                                            <div className="flex flex-col gap-3 content-start h-full">
                                                {/* Main Grid for full rows */}
                                                {mainItems.length > 0 && (
                                                    <div className={`grid gap-3 ${total > 10 ? 'grid-cols-6' : 'grid-cols-5'}`}>
                                                        {mainItems.map((member, idx) => (
                                                            <div key={`main-${idx}`} className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col overflow-hidden relative group">
                                                                <div className="relative aspect-[2/3] bg-gray-100 w-full">
                                                                    <img
                                                                        src={member.img || "/logo.png"}
                                                                        alt={member.name}
                                                                        className={`w-full h-full object-cover ${!member.img ? 'p-6 opacity-20' : ''}`}
                                                                    />
                                                                    <div className="absolute top-2 right-2 bg-sbc text-white font-black text-[12px] px-2 py-0.5 rounded shadow-sm z-10">
                                                                        {member.dateStr}
                                                                    </div>
                                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-8 pb-3 px-2 flex flex-col justify-end text-center z-10">
                                                                        <h3 className="font-bold text-white leading-tight text-[11px] truncate w-full drop-shadow-md">{member.name}</h3>
                                                                        <p className="text-[9px] text-gray-200 leading-none truncate w-full mt-0.5 drop-shadow-md">{member.role.replace(/[()]/g, '')}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Flex Row for centered remainder */}
                                                {lastItems.length > 0 && (
                                                    <div className="flex flex-wrap justify-center gap-3">
                                                        {lastItems.map((member, idx) => (
                                                            <div
                                                                key={`last-${idx}`}
                                                                className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col overflow-hidden relative group shrink-0"
                                                                style={{ width: flexBasis }}
                                                            >
                                                                <div className="relative aspect-[2/3] bg-gray-100 w-full">
                                                                    <img
                                                                        src={member.img || "/logo.png"}
                                                                        alt={member.name}
                                                                        className={`w-full h-full object-cover ${!member.img ? 'p-6 opacity-20' : ''}`}
                                                                    />
                                                                    <div className="absolute top-2 right-2 bg-sbc text-white font-black text-[12px] px-2 py-0.5 rounded shadow-sm z-10">
                                                                        {member.dateStr}
                                                                    </div>
                                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-8 pb-3 px-2 flex flex-col justify-end text-center z-10">
                                                                        <h3 className="font-bold text-white leading-tight text-[11px] truncate w-full drop-shadow-md">{member.name}</h3>
                                                                        <p className="text-[9px] text-gray-200 leading-none truncate w-full mt-0.5 drop-shadow-md">{member.role.replace(/[()]/g, '')}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {allMembers.length === 0 && (
                                                    <div className="text-center text-4xl text-gray-400 mt-20 italic w-full">
                                                        Aucun anniversaire ce mois-ci
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Sponsors Footer */}
                        <div className="bg-white pt-8 pb-12 px-16 z-20 mt-auto border-t border-gray-100">
                            <div className="flex items-center justify-center gap-12 flex-wrap opacity-90">
                                {partners.slice(0, 6).map(p => (
                                    p.img ? (
                                        <img key={p.id} src={p.img} alt={p.name} className="h-16 object-contain max-w-[150px]" />
                                    ) : null
                                ))}
                            </div>
                        </div>

                        <div className="w-full h-4 bg-gradient-to-r from-sbc-dark to-sbc mt-auto"></div>

                    </div>
                </div>
            </div>
        </div >
    );
}
