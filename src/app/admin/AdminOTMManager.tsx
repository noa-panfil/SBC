"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

function TeamSelector({ teams, value, onChange, label, position = 'bottom' }: { teams: any[], value: string, onChange: (val: string) => void, label: string, position?: 'top' | 'bottom' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
            <div
                className="w-full p-2 border rounded-lg flex items-center justify-between cursor-pointer bg-white"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={value ? "font-bold text-gray-900" : "text-gray-400"}>
                    {value || "Sélectionner..."}
                </span>
                <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-xs text-gray-400`}></i>
            </div>

            {isOpen && (
                <div className={`absolute left-0 right-0 z-50 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 overflow-y-auto ${position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                    <div className="p-2 sticky top-0 bg-white border-b border-gray-50">
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="w-full p-2 text-sm bg-gray-50 rounded-md outline-none focus:ring-1 focus:ring-sbc/20"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    {filteredTeams.map(team => (
                        <div
                            key={team.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
                            onClick={() => {
                                onChange(team.name);
                                setIsOpen(false);
                            }}
                        >
                            {team.image ? (
                                <img src={team.image} alt={team.name} className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                    <i className="fas fa-shield-alt text-[10px] text-gray-400"></i>
                                </div>
                            )}
                            <span className="text-sm font-bold text-gray-700">{team.name}</span>
                        </div>
                    ))}
                    {filteredTeams.length === 0 && (
                        <div className="p-4 text-center text-xs text-gray-400 italic">
                            Aucune équipe trouvée
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function getWeekNumber(d: Date) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
}

type Assignment = {
    id: string;
    team: string;
    roles: {
        marqueur: boolean;
        chronometreur: boolean;
        resp_salle: boolean;
        buvette: boolean;
    }
};

function DesignationEditor({ teams, value, onChange }: { teams: any[], value: string, onChange: (val: string) => void }) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    useEffect(() => {
        if (!value) {
            setAssignments([]);
            return;
        }

        const currentSerialized = serialize(assignments);
        if (currentSerialized === value) return;

        if (value.startsWith("Table = 2 Joueurs/Parents ")) {
            setAssignments([{
                id: "init_legacy",
                team: value.replace("Table = 2 Joueurs/Parents ", "").trim(),
                roles: { marqueur: true, chronometreur: true, resp_salle: false, buvette: false }
            }]);
        } else if (value.includes("{")) {
            const parts = value.split(" + ");
            const newAssignments: Assignment[] = [];
            parts.forEach((part, idx) => {
                const m = part.match(/^(.*) \{(.*)\}$/);
                if (m) {
                    const team = m[1].trim();
                    const rolesStr = m[2];
                    newAssignments.push({
                        id: `parsed_${idx}`,
                        team,
                        roles: {
                            marqueur: rolesStr.includes("Marqueur"),
                            chronometreur: rolesStr.includes("Chronométreur"),
                            resp_salle: rolesStr.includes("Respo Salle"),
                            buvette: rolesStr.includes("Buvette")
                        }
                    });
                }
            });
            setAssignments(newAssignments);
        } else {
            if (teams.some(t => t.name === value)) {
                setAssignments([{
                    id: "init_simple",
                    team: value,
                    roles: { marqueur: true, chronometreur: true, resp_salle: false, buvette: false }
                }]);
            }
        }
    }, [value]);

    const serialize = (currentAssignments: Assignment[]) => {
        if (currentAssignments.length === 0) return "";
        return currentAssignments.map(a => {
            const activeRoles = [];
            if (a.roles.marqueur) activeRoles.push("Marqueur");
            if (a.roles.chronometreur) activeRoles.push("Chronométreur");
            if (a.roles.resp_salle) activeRoles.push("Respo Salle");
            if (a.roles.buvette) activeRoles.push("Buvette");
            return `${a.team} {${activeRoles.join(', ')}}`;
        }).join(" + ");
    };

    const updateAssignments = (newAssignments: Assignment[]) => {
        setAssignments(newAssignments);
        onChange(serialize(newAssignments));
    };

    const addAssignment = () => {
        updateAssignments([...assignments, {
            id: Date.now().toString(),
            team: "",
            roles: { marqueur: false, chronometreur: false, resp_salle: false, buvette: false }
        }]);
    };

    const removeAssignment = (id: string) => {
        updateAssignments(assignments.filter(a => a.id !== id));
    };

    const updateAssignmentTeam = (id: string, team: string) => {
        updateAssignments(assignments.map(a => a.id === id ? { ...a, team } : a));
    };

    const toggleRole = (id: string, role: keyof Assignment['roles']) => {
        updateAssignments(assignments.map(a => a.id === id ? {
            ...a,
            roles: { ...a.roles, [role]: !a.roles[role] }
        } : a));
    };

    return (
        <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-500 uppercase">Désignation (Équipes OTM)</label>

            {assignments.map((assignment, index) => (
                <div key={assignment.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 relative">
                    <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="flex-1">
                            <TeamSelector
                                teams={teams}
                                value={assignment.team}
                                onChange={(val) => updateAssignmentTeam(assignment.id, val)}
                                label={`Équipe ${index + 1}`}
                                position={index > 1 ? "top" : "bottom"}
                            />
                        </div>
                        <button onClick={() => removeAssignment(assignment.id)} className="text-red-400 hover:text-red-600 p-1">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 md:gap-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1 rounded border border-gray-200 hover:border-sbc transition">
                            <input
                                type="checkbox"
                                checked={assignment.roles.marqueur}
                                onChange={() => toggleRole(assignment.id, 'marqueur')}
                                className="w-4 h-4 text-sbc rounded focus:ring-sbc"
                            />
                            <span className="text-xs font-bold text-gray-700">Marqueur</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1 rounded border border-gray-200 hover:border-sbc transition">
                            <input
                                type="checkbox"
                                checked={assignment.roles.chronometreur}
                                onChange={() => toggleRole(assignment.id, 'chronometreur')}
                                className="w-4 h-4 text-sbc rounded focus:ring-sbc"
                            />
                            <span className="text-xs font-bold text-gray-700">Chronométreur</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1 rounded border border-gray-200 hover:border-sbc transition">
                            <input
                                type="checkbox"
                                checked={assignment.roles.resp_salle}
                                onChange={() => toggleRole(assignment.id, 'resp_salle')}
                                className="w-4 h-4 text-sbc rounded focus:ring-sbc"
                            />
                            <span className="text-xs font-bold text-gray-700">Respo Salle</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1 rounded border border-gray-200 hover:border-sbc transition">
                            <input
                                type="checkbox"
                                checked={assignment.roles.buvette}
                                onChange={() => toggleRole(assignment.id, 'buvette')}
                                className="w-4 h-4 text-sbc rounded focus:ring-sbc"
                            />
                            <span className="text-xs font-bold text-gray-700">Buvette</span>
                        </label>
                    </div>
                </div>
            ))}

            <button
                onClick={addAssignment}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold text-xs uppercase hover:border-sbc hover:text-sbc transition flex items-center justify-center gap-2"
            >
                <i className="fas fa-plus"></i> Ajouter une équipe
            </button>
        </div>
    );
}

export default function AdminOTMManager({ initialMatches, teams, officials = [] }: { initialMatches: any[], teams: any[], officials?: any[] }) {
    const router = useRouter();
    const [rawMatches, setRawMatches] = useState(initialMatches);

    useEffect(() => {
        setRawMatches(initialMatches);
    }, [initialMatches]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentMatch, setCurrentMatch] = useState<any>({});

    const [leaderboardPage, setLeaderboardPage] = useState(1);
    const LEADERBOARD_ITEMS_PER_PAGE = 10;

    const officialStats = useMemo(() => {
        const stats = new Map<string, {
            name: string,
            scorer: number,
            timer: number,
            referee: number,
            total: number,
            teams: Record<string, number>,
            image_id?: number | null,
            knownTeam?: string,
            is_coach?: boolean
        }>();

        const addStat = (name: string, role: 'scorer' | 'timer' | 'referee', match: any) => {
            if (!name || name.trim() === "") return;
            const cleanName = name.trim();

            // Resolve Player
            let candidates = officials.filter(o => o.fullname === cleanName);
            if (candidates.length === 0) {
                candidates = officials.filter(o => o.originalName === cleanName);
            }
            let selectedOfficial = candidates[0];

            if (candidates.length > 1) {
                // Try to find the one matching the team
                const perfectMatch = candidates.find(candidate => {
                    const candidateTeams = candidate.teams || (candidate.team ? [candidate.team] : []);
                    return candidateTeams.some((t: string) => t === match.category || (match.designation && match.designation.includes(t)));
                });
                if (perfectMatch) selectedOfficial = perfectMatch;
            }

            // Use ID if available, otherwise fallback to name
            const key = selectedOfficial ? `ID_${selectedOfficial.id}` : `NAME_${cleanName}`;

            if (!stats.has(key)) {
                const isCoach = selectedOfficial?.role?.toLowerCase().includes('coach');

                stats.set(key, {
                    name: selectedOfficial ? selectedOfficial.fullname : cleanName,
                    scorer: 0,
                    timer: 0,
                    referee: 0,
                    total: 0,
                    teams: {},
                    image_id: selectedOfficial?.image_id,
                    knownTeam: isCoach ? "Coach / Staff" : selectedOfficial?.team,
                    is_coach: isCoach
                });
            }

            const s = stats.get(key)!;
            s[role]++;
            s.total++;

            // Legacy Parsing
            if (match.designation && match.designation.includes("Table = 2 Joueurs/Parents ")) {
                const teamName = match.designation.replace("Table = 2 Joueurs/Parents ", "").trim();
                s.teams[teamName] = (s.teams[teamName] || 0) + 1;
            }
            // New Parsing: "TeamName {Roles} + TeamName2 {Roles}"
            else if (match.designation && match.designation.includes("{")) {
                const parts = match.designation.split(" + ");
                parts.forEach((p: string) => {
                    const m = p.match(/^(.*) \{(.*)\}$/);
                    if (m) {
                        const teamName = m[1].trim();
                        s.teams[teamName] = (s.teams[teamName] || 0) + 1;
                    }
                });
            }
        };

        rawMatches.forEach(m => {
            addStat(m.scorer, 'scorer', m);
            addStat(m.timer, 'timer', m);
            addStat(m.referee, 'referee', m);
            addStat(m.referee_2, 'referee', m);
        });

        return Array.from(stats.values())
            .sort((a, b) => b.total - a.total);
    }, [rawMatches, officials]);

    const totalLeaderboardPages = Math.ceil(officialStats.length / LEADERBOARD_ITEMS_PER_PAGE);
    const paginatedStats = officialStats.slice((leaderboardPage - 1) * LEADERBOARD_ITEMS_PER_PAGE, leaderboardPage * LEADERBOARD_ITEMS_PER_PAGE);

    const teamNames = teams.map(t => t.name).sort();

    const availableWeeks = useMemo(() => {
        const weeks = new Set<string>();
        const now = new Date();
        const currentWk = getWeekNumber(now);
        weeks.add(currentWk);

        rawMatches.forEach(m => {
            weeks.add(getWeekNumber(new Date(m.match_date)));
        });
        return Array.from(weeks).sort();
    }, [rawMatches]);

    const [selectedWeek, setSelectedWeek] = useState(() => getWeekNumber(new Date()));

    const filteredMatches = useMemo(() => {
        return rawMatches.filter(m => getWeekNumber(new Date(m.match_date)) === selectedWeek)
            .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime() || a.match_time.localeCompare(b.match_time));
    }, [rawMatches, selectedWeek]);


    const calculateMeetingTime = (time: string) => {
        if (!time) return "";
        const [h, m] = time.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m - 30);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const handleMatchTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value;
        setCurrentMatch({
            ...currentMatch,
            match_time: time,
            meeting_time: calculateMeetingTime(time)
        });
    };

    const handleAdd = () => {
        const defaultTime = "14:00";
        let defaultDate = new Date().toISOString().split('T')[0];

        setCurrentMatch({
            is_white_jersey: false,
            match_date: defaultDate,
            match_time: defaultTime,
            meeting_time: calculateMeetingTime(defaultTime),
            category: teamNames[0] || "",
        });
        setIsEditing(true);
    };

    const handleEdit = (match: any) => {
        const date = new Date(match.match_date).toISOString().split('T')[0];
        setCurrentMatch({ ...match, match_date: date });
        setIsEditing(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Supprimer ce match OTM ?")) return;
        try {
            await fetch(`/api/otm/${id}`, { method: "DELETE" });
            setRawMatches(prev => prev.filter(m => m.id !== id));
            router.refresh();
        } catch (e) {
            alert("Erreur");
        }
    };

    const handleSave = async () => {
        try {
            const method = currentMatch.id ? "PUT" : "POST";
            const url = currentMatch.id ? `/api/otm/${currentMatch.id}` : "/api/otm";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentMatch)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed");
            }

            const savedMatch = await res.json();

            setRawMatches(prev => {
                if (currentMatch.id) {
                    // For edits, merge existing match with current form data
                    return prev.map(m => m.id === currentMatch.id ? { ...m, ...currentMatch } : m);
                } else {
                    // For creation, savedMatch contains the new resource with ID (returned by API)
                    return [...prev, savedMatch];
                }
            });

            setIsEditing(false);
            router.refresh();
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Erreur lors de la sauvegarde");
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-black text-gray-900 uppercase">Planning OTM</h3>

                    <div className="relative">
                        <select
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(e.target.value)}
                            className="bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-sbc/20 appearance-none cursor-pointer"
                        >
                            {availableWeeks.map(week => {
                                return (
                                    <option key={week} value={week}>
                                        Semaine {week.split('-W')[1]} ({week.split('-W')[0]})
                                    </option>
                                )
                            })}
                        </select>
                        <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                    </div>
                </div>

                <button onClick={handleAdd} className="bg-sbc text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-sbc-dark transition shadow-lg shadow-sbc/20">
                    + Ajouter Match
                </button>
            </div>

            <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-gray-900 text-white">
                        <tr>
                            <th className="p-4 text-xs font-black uppercase tracking-wider">Cat.</th>
                            <th className="p-4 text-xs font-black uppercase tracking-wider text-center"><i className="fas fa-tshirt"></i></th>
                            <th className="p-4 text-xs font-black uppercase tracking-wider">Date/Heure</th>
                            <th className="p-4 text-xs font-black uppercase tracking-wider">Adversaire</th>
                            <th className="p-4 text-xs font-black uppercase tracking-wider">Code</th>
                            <th className="p-4 text-xs font-black uppercase tracking-wider">Désignation</th>
                            <th className="p-4 text-xs font-black uppercase tracking-wider">Officiels</th>
                            <th className="p-4 text-xs font-black uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {filteredMatches.map(match => (
                            <tr key={match.id} className="hover:bg-gray-50">
                                <td className="p-4 font-bold">{match.category}</td>
                                <td className="p-4 text-center pb-2">
                                    <div className="flex flex-col items-center gap-1">
                                        {match.is_white_jersey ? (
                                            <div className="tooltip" data-tip="Maillots Blancs">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 border-2 border-gray-200 shadow-sm">
                                                    <i className="fas fa-tshirt text-white text-sm drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"></i>
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="tooltip" data-tip="Maillots Verts">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 border border-green-100 shadow-sm">
                                                    <i className="fas fa-tshirt text-green-600 text-sm"></i>
                                                </span>
                                            </div>
                                        )}

                                        {match.is_club_referee && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border bg-purple-50 text-purple-700 border-purple-200 whitespace-nowrap" title="Arbitres Club">
                                                <i className="fas fa-whistle"></i> Club
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="font-bold">{new Date(match.match_date).toLocaleDateString('fr-FR')}</div>
                                    <div className="text-xs text-gray-500">Match: {match.match_time} | RDV: {match.meeting_time}</div>
                                </td>
                                <td className="p-4 font-bold text-gray-700">{match.opponent}</td>
                                <td className="p-4 font-mono text-xs">{match.match_code}</td>
                                <td className="p-4 text-xs max-w-[150px] truncate" title={match.designation}>{match.designation}</td>
                                <td className="p-4 text-xs text-gray-500">
                                    <div className="grid grid-cols-[70px_1fr] gap-y-1 items-center">
                                        {match.scorer && <><span className="font-bold text-gray-400 uppercase text-[10px]">Marqueur:</span> <span className="text-gray-900 font-semibold truncate">{match.scorer}</span></>}
                                        {match.timer && <><span className="font-bold text-gray-400 uppercase text-[10px]">Chrono:</span> <span className="text-gray-900 font-semibold truncate">{match.timer}</span></>}
                                        {match.hall_manager && <><span className="font-bold text-gray-400 uppercase text-[10px]">Resp.:</span> <span className="text-gray-900 font-semibold truncate">{match.hall_manager}</span></>}
                                        {match.bar_manager && <><span className="font-bold text-gray-400 uppercase text-[10px]">Buvette:</span> <span className="text-gray-900 font-semibold truncate">{match.bar_manager}</span></>}
                                        {match.bar_manager && <><span className="font-bold text-gray-400 uppercase text-[10px]">Buvette:</span> <span className="text-gray-900 font-semibold truncate">{match.bar_manager}</span></>}
                                        {match.referee && <><span className="font-bold text-gray-400 uppercase text-[10px]">Arb 1:</span> <span className="text-gray-900 font-semibold truncate">{match.referee}</span></>}
                                        {match.referee_2 && <><span className="font-bold text-gray-400 uppercase text-[10px]">Arb 2:</span> <span className="text-gray-900 font-semibold truncate">{match.referee_2}</span></>}
                                    </div>
                                </td>
                                <td className="p-4 text-right flex gap-2 justify-end">
                                    <button onClick={() => handleEdit(match)} className="text-sbc hover:bg-sbc/10 p-2 rounded transition">
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button onClick={() => handleDelete(match.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-12">
                <h3 className="text-xl font-black text-gray-900 uppercase mb-6 flex items-center gap-3">
                    <i className="fas fa-user-clock text-sbc"></i>
                    Classement des Officiels (Joueurs/Parents)
                </h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center w-16">#</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">Nom</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Marqueur</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Chrono</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Arbitre</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedStats.map((data, index) => {
                                let displayTeam = null;
                                let isCoach = data.is_coach || false;
                                const name = data.name;

                                if (data.knownTeam) {
                                    if (data.knownTeam === "Coach / Staff") {
                                        isCoach = true;
                                    } else {
                                        displayTeam = teams.find(t => t.name === data.knownTeam);
                                    }
                                }

                                if (!displayTeam && !isCoach) {
                                    const primaryTeamName = Object.entries(data.teams).sort((a, b) => b[1] - a[1])[0]?.[0];
                                    displayTeam = teams.find(t => t.name === primaryTeamName);
                                }

                                const globalIndex = (leaderboardPage - 1) * LEADERBOARD_ITEMS_PER_PAGE + index;

                                return (
                                    <tr key={name} className="group hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-center font-black text-gray-300 group-hover:text-sbc">
                                            {globalIndex + 1}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {data.image_id ? (
                                                    <img src={`/api/image/${data.image_id}`} className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-sm" alt={name} />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center flex text-gray-500 font-bold text-xs uppercase border border-gray-200">
                                                        {name.substring(0, 2)}
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">{name}</span>

                                                    {isCoach && (
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <span className="text-[10px] uppercase font-bold text-white bg-gray-800 px-1.5 py-0.5 rounded tracking-wider">Coach</span>
                                                        </div>
                                                    )}

                                                    {displayTeam && (
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            {displayTeam.image ? (
                                                                <img src={displayTeam.image} className="w-3 h-3 rounded-full object-cover" alt="" />
                                                            ) : (
                                                                <i className="fas fa-shield-alt text-[10px] text-gray-400"></i>
                                                            )}
                                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider text-sbc">{displayTeam.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center text-gray-500 text-xs font-bold">
                                            {data.scorer > 0 && <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-100">{data.scorer}</span>}
                                        </td>
                                        <td className="p-4 text-center text-gray-500 text-xs font-bold">
                                            {data.timer > 0 && <span className="px-2 py-1 rounded bg-orange-50 text-orange-600 border border-orange-100">{data.timer}</span>}
                                        </td>
                                        <td className="p-4 text-center text-gray-500 text-xs font-bold">
                                            {data.referee > 0 && <span className="px-2 py-1 rounded bg-purple-50 text-purple-600 border border-purple-100">{data.referee}</span>}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-full font-black text-sm bg-sbc text-white shadow-md shadow-sbc/30">
                                                {data.total}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {totalLeaderboardPages > 1 && (
                        <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => setLeaderboardPage(p => Math.max(1, p - 1))}
                                disabled={leaderboardPage === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-sbc hover:text-white hover:border-sbc transition disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-gray-500"
                            >
                                <i className="fas fa-chevron-left text-xs"></i>
                            </button>

                            <span className="text-xs font-bold text-gray-500">
                                Page {leaderboardPage} sur {totalLeaderboardPages}
                            </span>

                            <button
                                onClick={() => setLeaderboardPage(p => Math.min(totalLeaderboardPages, p + 1))}
                                disabled={leaderboardPage === totalLeaderboardPages}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-sbc hover:text-white hover:border-sbc transition disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-gray-500"
                            >
                                <i className="fas fa-chevron-right text-xs"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto p-8 animate-fade-in-up">
                        <h3 className="text-xl font-black mb-6 uppercase">
                            {currentMatch.id ? 'Modifier Match OTM' : 'Nouveau Match OTM'}
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <TeamSelector
                                    teams={teams}
                                    value={currentMatch.category}
                                    onChange={(val) => setCurrentMatch({ ...currentMatch, category: val })}
                                    label="Catégorie (Équipe à domicile)"
                                />
                            </div>
                            <div className="flex flex-col gap-2 pb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={currentMatch.is_white_jersey || false} onChange={e => setCurrentMatch({ ...currentMatch, is_white_jersey: e.target.checked })} className="w-5 h-5 text-sbc rounded" />
                                    <span className="text-sm font-bold text-gray-700 uppercase">Maillots Blancs ?</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={currentMatch.is_club_referee || false} onChange={e => setCurrentMatch({ ...currentMatch, is_club_referee: e.target.checked })} className="w-5 h-5 text-sbc rounded" />
                                    <span className="text-sm font-bold text-gray-700 uppercase">Arbitres Club ?</span>
                                </label>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                                <input type="date" className="w-full p-2 border rounded-lg" value={currentMatch.match_date || ''} onChange={e => setCurrentMatch({ ...currentMatch, match_date: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">H. Match</label>
                                    <input type="time" className="w-full p-2 border rounded-lg" value={currentMatch.match_time || ''} onChange={handleMatchTimeChange} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">H. RDV (Auto -30min)</label>
                                    <input type="time" className="w-full p-2 border rounded-lg" value={currentMatch.meeting_time || ''} onChange={e => setCurrentMatch({ ...currentMatch, meeting_time: e.target.value })} />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Adversaire</label>
                                <input className="w-full p-2 border rounded-lg font-bold" value={currentMatch.opponent || ''} onChange={e => setCurrentMatch({ ...currentMatch, opponent: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Code Rencontre</label>
                                <input className="w-full p-2 border rounded-lg font-mono" value={currentMatch.match_code || ''} onChange={e => setCurrentMatch({ ...currentMatch, match_code: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <DesignationEditor
                                    teams={teams}
                                    value={currentMatch.designation}
                                    onChange={(val) => setCurrentMatch({ ...currentMatch, designation: val })}
                                />
                            </div>
                        </div>

                        {currentMatch.id && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <h4 className="text-sm font-black uppercase text-gray-400 mb-4">Affectations (Optionnel pour admin)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <input className="p-2 border rounded text-sm" placeholder="Marqueur" value={currentMatch.scorer || ''} onChange={e => setCurrentMatch({ ...currentMatch, scorer: e.target.value })} />
                                    <input className="p-2 border rounded text-sm" placeholder="Chronométreur" value={currentMatch.timer || ''} onChange={e => setCurrentMatch({ ...currentMatch, timer: e.target.value })} />
                                    <input className="p-2 border rounded text-sm" placeholder="Resp. Salle" value={currentMatch.hall_manager || ''} onChange={e => setCurrentMatch({ ...currentMatch, hall_manager: e.target.value })} />
                                    <input className="p-2 border rounded text-sm" placeholder="Buvette" value={currentMatch.bar_manager || ''} onChange={e => setCurrentMatch({ ...currentMatch, bar_manager: e.target.value })} />
                                    <input className="p-2 border rounded text-sm" placeholder="Arbitre Club 1" value={currentMatch.referee || ''} onChange={e => setCurrentMatch({ ...currentMatch, referee: e.target.value })} />
                                    <input className="p-2 border rounded text-sm" placeholder="Arbitre Club 2" value={currentMatch.referee_2 || ''} onChange={e => setCurrentMatch({ ...currentMatch, referee_2: e.target.value })} />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 font-bold text-gray-500 hover:text-gray-700">Annuler</button>
                            <button onClick={handleSave} className="bg-sbc text-white px-6 py-2 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-sbc-dark">Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
