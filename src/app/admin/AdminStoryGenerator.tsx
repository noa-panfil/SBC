"use client";

import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { toPng } from "html-to-image";

interface Team {
    id: string;
    name: string;
    category: string;
    image: string | null;
}

interface Mapping {
    id: number;
    division_excel: string;
    team_name_excel: string;
    team_id: string;
}

interface Match {
    division: string;
    date: string;
    time: string;
    home: string;
    visitor: string;
    location: string;
    teamId?: string; // Mapped team ID
    teamName?: string;
    homeDisplay?: string;
    visitorDisplay?: string;
    scoreHome?: string;
    scoreVisitor?: string;
    teamImage?: string;
    seclinSide?: 'home' | 'visitor';
}

type Mode = 'match-affiche' | 'planning-semaine' | 'match-resultat' | 'resultats-semaine';

export default function AdminStoryGenerator({ teams }: { teams: Team[] }) {
    const [activeTab, setActiveTab] = useState<'generator' | 'mappings'>('generator');
    const [mappings, setMappings] = useState<Mapping[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    // Generator Mode
    const [mode, setMode] = useState<Mode>('match-affiche');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [showTeamPhoto, setShowTeamPhoto] = useState(true);

    // Mapping Form
    const [newDivisionCode, setNewDivisionCode] = useState("");
    const [newTeamNameString, setNewTeamNameString] = useState("");
    const [selectedTeam, setSelectedTeam] = useState("");

    // Refs for capturing images
    const storyRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        fetchMappings();
    }, []);

    const fetchMappings = async () => {
        const res = await fetch('/api/admin/story-mappings');
        if (res.ok) {
            setMappings(await res.json());
        }
    };

    const handleSaveMapping = async () => {
        if (!newDivisionCode || !newTeamNameString || !selectedTeam) return;

        const res = await fetch('/api/admin/story-mappings', {
            method: 'POST',
            body: JSON.stringify({
                division_excel: newDivisionCode.trim(),
                team_name_excel: newTeamNameString.trim(),
                team_id: selectedTeam
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setNewDivisionCode("");
            setNewTeamNameString("");
            setSelectedTeam("");
            fetchMappings();
        }
    };

    const handleDeleteMapping = async (id: number) => {
        if (confirm("Supprimer cette assignation ?")) {
            await fetch(`/api/admin/story-mappings?id=${id}`, { method: 'DELETE' });
            fetchMappings();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

            // Simple parser assuming headers are on row 1 (index 0)
            // Need to find columns: Division, Date, Heure, Domicile, Visiteur, Lieu
            if (data.length < 2) return;

            const headers = data[0].map((h: any) => h?.toString().toLowerCase().trim());

            const colIdx = {
                division: headers.findIndex((h: string) => h.includes('division') || h.includes('poule')),
                date: headers.findIndex((h: string) => h.includes('date')),
                time: headers.findIndex((h: string) => h.includes('heure')),
                home: headers.findIndex((h: string) => h.includes('equipe 1') || h.includes('équipe 1') || h.includes('domicile')),
                visitor: headers.findIndex((h: string) => h.includes('equipe 2') || h.includes('équipe 2') || h.includes('visiteur')),
                location: headers.findIndex((h: string) => h.includes('lieu') || h.includes('salle')),
                scoreHome: 8, // Column I
                scoreVisitor: 10 // Column K
            };

            const parsedMatches: Match[] = [];

            // Skip header
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;

                const division = row[colIdx.division];
                if (!division) continue;

                // raw date parsing might be needed depending on excel format
                // Often excel returns number for date.
                let dateStr = row[colIdx.date];
                if (typeof dateStr === 'number') {
                    // Excel date to JS date
                    const dateInfo = XLSX.SSF.parse_date_code(dateStr);
                    dateStr = `${dateInfo.d}/${dateInfo.m}/${dateInfo.y}`;
                }

                let timeStr = row[colIdx.time];
                if (typeof timeStr === 'number') {
                    // Excel fraction of day
                    const totalMinutes = Math.round(timeStr * 24 * 60);
                    const hours = Math.floor(totalMinutes / 60);
                    const mins = totalMinutes % 60;
                    timeStr = `${hours.toString().padStart(2, '0')}H${mins.toString().padStart(2, '0')}`;
                }

                parsedMatches.push({
                    division: division.toString().trim(),
                    date: dateStr?.toString() || "",
                    time: timeStr?.toString() || "",
                    home: row[colIdx.home]?.toString() || "",
                    visitor: row[colIdx.visitor]?.toString() || "",
                    location: row[colIdx.location]?.toString() || "",
                    scoreHome: colIdx.scoreHome !== -1 && row[colIdx.scoreHome] !== undefined ? row[colIdx.scoreHome]?.toString() : undefined,
                    scoreVisitor: colIdx.scoreVisitor !== -1 && row[colIdx.scoreVisitor] !== undefined ? row[colIdx.scoreVisitor]?.toString() : undefined,
                });
            }

            const cleanName = (name: string) => {
                return name
                    .split('(')[0]
                    .replace(/\s+-\s+.*/, '')   // Remove " - ..."
                    .replace(/-(\d+.*)/, '')    // Remove "-2..."
                    .trim();
            };

            // Map to teams
            const mapped = parsedMatches.map(m => {
                let homeDisplay = cleanName(m.home);
                let visitorDisplay = cleanName(m.visitor);
                let foundTeam = undefined;
                let seclinSide: 'home' | 'visitor' | undefined = undefined;

                const homeKey = `${m.division.trim().toLowerCase()}__SEP__${m.home.trim().toLowerCase()}`;
                const visitorKey = `${m.division.trim().toLowerCase()}__SEP__${m.visitor.trim().toLowerCase()}`;

                // Find mapping for HOME team
                const mapHome = mappings.find(map =>
                    map.division_excel.trim().toLowerCase() === m.division.trim().toLowerCase() &&
                    map.team_name_excel.trim().toLowerCase() === m.home.trim().toLowerCase()
                );

                if (mapHome) {
                    const t = teams.find(team => team.id === mapHome.team_id);
                    if (t) {
                        homeDisplay = t.name;
                        foundTeam = t;
                        seclinSide = 'home';
                    }
                }

                // Find mapping for VISITOR team
                const mapVisitor = mappings.find(map =>
                    map.division_excel.trim().toLowerCase() === m.division.trim().toLowerCase() &&
                    map.team_name_excel.trim().toLowerCase() === m.visitor.trim().toLowerCase()
                );

                if (mapVisitor) {
                    const t = teams.find(team => team.id === mapVisitor.team_id);
                    if (t) {
                        visitorDisplay = t.name;
                        if (!foundTeam) foundTeam = t;
                        seclinSide = 'visitor';
                    }
                }

                return {
                    ...m,
                    teamId: foundTeam?.id,
                    teamName: foundTeam?.name,
                    homeDisplay,
                    visitorDisplay,
                    teamImage: foundTeam?.image || "/logo.png",
                    seclinSide
                };
            });

            setMatches(mapped);
        };
        reader.readAsBinaryString(uploadedFile);
    };

    const downloadStory = async (index: number) => {
        const el = storyRefs.current[index];
        if (!el) return;

        try {
            const dataUrl = await toPng(el, {
                quality: 1.0,
                pixelRatio: 1, // 1 is enough if we are at full 1080x1920 size. 2 makes it 4k massive.
                width: 1080,
                height: 1920,
                cacheBust: true,
                style: {
                    transform: 'none',
                    transformOrigin: 'top left',
                    marginBottom: '0',
                    marginRight: '0',
                    width: '1080px',
                    height: '1920px'
                }
            });
            const link = document.createElement('a');
            const filename = (mode === 'planning-semaine' || mode === 'resultats-semaine')
                ? `${mode}-partie-${index + 1}.png`
                : `story-${matches[index].home}-vs-${matches[index].visitor}.png`;
            link.download = filename;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error(err);
        }
    };

    // Separate Effect to re-map matches when mappings change
    useEffect(() => {
        if (matches.length > 0) {
            const cleanName = (name: string) => {
                return name
                    .split('(')[0]
                    .replace(/\s+-\s+.*/, '')   // Remove " - ..."
                    .replace(/-(\d+.*)/, '')    // Remove "-2..."
                    .trim();
            };

            const mapped = matches.map(m => {
                let homeDisplay = cleanName(m.home);
                let visitorDisplay = cleanName(m.visitor);
                let foundTeam = undefined;
                let seclinSide: 'home' | 'visitor' | undefined = undefined;

                const homeKey = `${m.division.trim().toLowerCase()}__SEP__${m.home.trim().toLowerCase()}`;
                const visitorKey = `${m.division.trim().toLowerCase()}__SEP__${m.visitor.trim().toLowerCase()}`;

                const mapHome = mappings.find(map =>
                    map.division_excel.trim().toLowerCase() === m.division.trim().toLowerCase() &&
                    map.team_name_excel.trim().toLowerCase() === m.home.trim().toLowerCase()
                );
                if (mapHome) {
                    const t = teams.find(team => team.id === mapHome.team_id);
                    if (t) {
                        homeDisplay = t.name;
                        foundTeam = t;
                        seclinSide = 'home';
                    }
                }

                // Find mapping for VISITOR team
                const mapVisitor = mappings.find(map =>
                    map.division_excel.trim().toLowerCase() === m.division.trim().toLowerCase() &&
                    map.team_name_excel.trim().toLowerCase() === m.visitor.trim().toLowerCase()
                );
                if (mapVisitor) {
                    const t = teams.find(team => team.id === mapVisitor.team_id);
                    if (t) {
                        visitorDisplay = t.name;
                        if (!foundTeam) foundTeam = t;
                        seclinSide = 'visitor';
                    }
                }

                return {
                    ...m,
                    teamId: foundTeam?.id,
                    teamName: foundTeam?.name,
                    homeDisplay,
                    visitorDisplay,
                    teamImage: foundTeam?.image || "/logo.png",
                    seclinSide
                };
            });

            // If mapped matches differ (shallow check on length or deep check?)
            // To avoid infinite loop, we should probably only set if meaningful changes.
            // But since this runs on [mappings, teams], it should be fine.
            // Let's just setMatches.
            // Naive check to prevent loop if matches array reference changes but content same?
            // "matches" is in dependency array? No, "matches.length > 0" is condition but matches is not in dependency array of useEffect?
            // The useEffect dep array is [mappings, teams].Matches is not there.
            // So we can safely setMatches.
            setMatches(prev => {
                const isDiff = JSON.stringify(prev) !== JSON.stringify(mapped);
                return isDiff ? mapped : prev;
            });
        }
    }, [mappings, teams]);


    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('generator')}
                        className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'generator' ? 'bg-sbc text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        Générateur
                    </button>
                    <button
                        onClick={() => setActiveTab('mappings')}
                        className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'mappings' ? 'bg-sbc text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        Assignations
                    </button>
                </div>
            </div>

            {activeTab === 'mappings' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-gray-50 p-4 rounded-xl">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Division (Excel)</label>
                            <input
                                type="text"
                                value={newDivisionCode}
                                onChange={(e) => setNewDivisionCode(e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-sbc focus:ring-sbc"
                                placeholder="ex: DMU11-7..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nom Équipe (Excel)</label>
                            <input
                                type="text"
                                value={newTeamNameString}
                                onChange={(e) => setNewTeamNameString(e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-sbc focus:ring-sbc"
                                placeholder="ex: SECLIN BC (2)..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Équipe SBC Associée</label>
                            <select
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-sbc focus:ring-sbc"
                            >
                                <option value="">-- Choisir une équipe --</option>
                                {teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleSaveMapping}
                            className="bg-sbc text-white font-bold py-2 px-4 rounded-lg hover:bg-sbc-dark transition shadow-lg md:col-span-3 w-full sm:w-auto"
                        >
                            <i className="fas fa-plus mr-2"></i> Ajouter / Modifier
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-500 text-sm uppercase">
                                    <th className="py-3 font-bold">Division</th>
                                    <th className="py-3 font-bold">Nom Équipe</th>
                                    <th className="py-3 font-bold">Équipe SBC</th>
                                    <th className="py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mappings.map(m => {
                                    const t = teams.find(team => team.id === m.team_id);
                                    return (
                                        <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                            <td className="py-3 font-medium text-gray-600 font-mono text-xs">{m.division_excel}</td>
                                            <td className="py-3 font-medium text-gray-900">{m.team_name_excel}</td>
                                            <td className="py-3">
                                                {t ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-sbc-dark">{t.name}</span>
                                                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">{t.category}</span>
                                                    </div>
                                                ) : <span className="text-red-500">Équipe supprimée</span>}
                                            </td>
                                            <td className="py-3 text-right">
                                                <button
                                                    onClick={() => handleDeleteMapping(m.id)}
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {mappings.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-400">Aucune assignation pour le moment.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'generator' && (
                <div className="space-y-8">
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-sbc transition-colors bg-gray-50">
                        <i className="fas fa-file-excel text-4xl text-green-600 mb-4"></i>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Importer le fichier Excel</h3>
                        <p className="text-sm text-gray-500 mb-4">Format attendu: Colonne A = Division, autres colonnes: Date, Heure, Domicile, Visiteur, Lieu</p>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-full file:border-0
                              file:text-sm file:font-semibold
                              file:bg-sbc-light file:text-sbc-dark
                              hover:file:bg-sbc hover:file:text-white transition
                            "
                        />
                    </div>

                    <div className="flex gap-4 mb-4 overflow-x-auto pb-2">
                        <button
                            onClick={() => setMode('match-affiche')}
                            className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition ${mode === 'match-affiche' ? 'bg-sbc text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        >
                            Affiche Match (Indiv.)
                        </button>
                        <button
                            onClick={() => setMode('match-resultat')}
                            className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition ${mode === 'match-resultat' ? 'bg-sbc text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        >
                            Résultat Match (Indiv.)
                        </button>
                        <button
                            onClick={() => setMode('planning-semaine')}
                            className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition ${mode === 'planning-semaine' ? 'bg-sbc text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        >
                            Planning Semaine (Global)
                        </button>
                        <button
                            onClick={() => setMode('resultats-semaine')}
                            className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition ${mode === 'resultats-semaine' ? 'bg-sbc text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        >
                            Résultats Semaine (Global)
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                        <input
                            type="checkbox"
                            id="showTeamPhoto"
                            checked={showTeamPhoto}
                            onChange={(e) => setShowTeamPhoto(e.target.checked)}
                            className="w-5 h-5 text-sbc rounded focus:ring-sbc border-gray-300"
                        />
                        <label htmlFor="showTeamPhoto" className="text-gray-700 font-bold cursor-pointer select-none">
                            Afficher la photo d'équipe (si disponible)
                        </label>
                    </div>

                    {matches.length > 0 && (
                        <>
                            {/* GLOBAL VIEWS (Planning / Results) */}
                            {(mode === 'planning-semaine' || mode === 'resultats-semaine') && (
                                (() => {
                                    const matchesPerSlide = mode === 'planning-semaine' ? 10 : 8;
                                    return Array.from({ length: Math.ceil(matches.length / matchesPerSlide) }).map((_, slideIndex) => {
                                        const sliceStart = slideIndex * matchesPerSlide;
                                        const sliceEnd = sliceStart + matchesPerSlide;
                                        const currentMatches = matches.slice(sliceStart, sliceEnd);

                                        return (
                                            <div key={slideIndex} className="flex flex-col gap-4 items-center">
                                                <div className="flex justify-between items-center w-full max-w-[400px]">
                                                    <h3 className="font-bold text-lg">Page {slideIndex + 1}</h3>
                                                    <button onClick={() => downloadStory(slideIndex)} className="text-sbc hover:underline font-bold">
                                                        <i className="fas fa-download mr-2"></i> Télécharger
                                                    </button>
                                                </div>

                                                <div className="relative overflow-hidden shadow-2xl rounded-xl bg-white">
                                                    <div
                                                        ref={el => { storyRefs.current[slideIndex] = el }}
                                                        className="w-[1080px] h-[1920px] bg-gradient-to-tr from-sbc-dark to-gray-900 text-white relative flex flex-col items-center overflow-hidden"
                                                        style={{
                                                            transform: 'scale(0.25)',
                                                            transformOrigin: 'top left',
                                                            width: '1080px',
                                                            height: '1920px',
                                                            marginBottom: '-1440px',
                                                            marginRight: '-810px'
                                                        }}
                                                    >
                                                        {/* Background Decoration */}
                                                        <div className="absolute top-0 w-full h-1/2 bg-sbc skew-y-12 transform -translate-y-1/2 opacity-20"></div>
                                                        <div className="absolute bottom-0 w-full h-1/3 bg-black/50 backdrop-blur-3xl"></div>
                                                        <div className="absolute inset-0 bg-[url('/img/pattern.png')] opacity-5"></div>

                                                        {/* Header */}
                                                        <div className="pt-24 text-center z-10 w-full px-12 pb-8">
                                                            <img src="/logo.png" alt="SBC" className="w-32 h-32 mx-auto mb-6 drop-shadow-2xl" />
                                                            <h1 className="text-6xl font-black uppercase tracking-widest text-sbc-light mb-4">
                                                                {mode === 'planning-semaine' ? 'AGENDA DU WEEK-END' : 'RÉSULTATS DU WEEK-END'}
                                                            </h1>
                                                            {Math.ceil(matches.length / matchesPerSlide) > 1 && (
                                                                <h2 className="text-4xl font-bold text-white/50 mb-4">PARTIE {slideIndex + 1}</h2>
                                                            )}
                                                            <div className="h-2 w-32 bg-white mx-auto rounded-full"></div>
                                                        </div>

                                                        {/* List Content */}
                                                        <div className="flex-grow w-full px-12 overflow-hidden flex flex-col items-center z-10">
                                                            {/* Column Headers */}
                                                            <div className="flex w-full max-w-5xl px-8 mb-6 text-sbc-light opacity-80">
                                                                <div className="w-5/12 text-right pr-12 flex items-center justify-end gap-4">
                                                                    <span className="text-3xl font-bold uppercase tracking-widest">Domicile</span>
                                                                    <i className="fas fa-home text-5xl"></i>
                                                                </div>
                                                                <div className="w-2/12"></div>
                                                                <div className="w-5/12 text-left pl-12 flex items-center justify-start gap-4">
                                                                    <i className="fas fa-plane text-5xl"></i>
                                                                    <span className="text-3xl font-bold uppercase tracking-widest">Extérieur</span>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4 w-full max-w-6xl">
                                                                {currentMatches.map((m, i) => {
                                                                    const sHome = parseInt(m.scoreHome || '0');
                                                                    const sVisitor = parseInt(m.scoreVisitor || '0');

                                                                    let resultStatus = 'neutral';
                                                                    if (mode === 'resultats-semaine' && m.seclinSide) {
                                                                        if (m.seclinSide === 'home') {
                                                                            if (sHome > sVisitor) resultStatus = 'win';
                                                                            else if (sHome < sVisitor) resultStatus = 'loss';
                                                                        } else {
                                                                            if (sVisitor > sHome) resultStatus = 'win';
                                                                            else if (sVisitor < sHome) resultStatus = 'loss';
                                                                        }
                                                                    }

                                                                    const bgClass = resultStatus === 'win' ? 'bg-green-500/20 border-green-500'
                                                                        : resultStatus === 'loss' ? 'bg-red-500/20 border-red-500'
                                                                            : 'bg-white/5 border-white/10';

                                                                    return (
                                                                        <div key={i} className={`${bgClass} backdrop-blur-sm border rounded-xl p-4 flex items-center relative overflow-hidden group transition-colors duration-300`}>

                                                                            {/* HOME TEAM (Left) */}
                                                                            <div className="w-5/12 flex flex-col items-end pr-8 border-r border-white/10">
                                                                                <div className="text-4xl font-black uppercase text-right leading-none truncate w-full">
                                                                                    {m.homeDisplay || m.home}
                                                                                </div>
                                                                                {mode === 'resultats-semaine' && (
                                                                                    <div className={`text-6xl font-black mt-2 ${parseInt(m.scoreHome || '0') > parseInt(m.scoreVisitor || '0') ? 'text-green-400' : 'text-white/50'}`}>
                                                                                        {m.scoreHome}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* CENTER INFO */}
                                                                            <div className="w-2/12 flex flex-col items-center justify-center text-center px-2">
                                                                                <div className="flex flex-col opacity-75">
                                                                                    <span className="text-lg font-bold">{m.date.split('/')[0]}/{m.date.split('/')[1]}</span>
                                                                                    <span className="text-2xl font-black text-sbc-light">{m.time}</span>
                                                                                </div>
                                                                                <div className="text-xs opacity-50 truncate w-full mt-1">
                                                                                    {m.location}
                                                                                </div>
                                                                            </div>

                                                                            {/* VISITOR TEAM (Right) */}
                                                                            <div className="w-5/12 flex flex-col items-start pl-8 border-l border-white/10">
                                                                                <div className="text-4xl font-black uppercase text-left leading-none truncate w-full">
                                                                                    {m.visitorDisplay || m.visitor}
                                                                                </div>
                                                                                {mode === 'resultats-semaine' && (
                                                                                    <div className={`text-6xl font-black mt-2 ${parseInt(m.scoreVisitor || '0') > parseInt(m.scoreHome || '0') ? 'text-green-400' : 'text-white/50'}`}>
                                                                                        {m.scoreVisitor}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Footer */}
                                                        <div className="pb-16 pt-8 text-center z-10 w-full">
                                                            <p className="text-2xl font-bold tracking-widest uppercase opacity-75">#WEARESBC</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()
                            )}

                            {/* INDIVIDUAL VIEWS */}
                            {
                                (mode === 'match-affiche' || mode === 'match-resultat') && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                        {matches.map((match, i) => {
                                            const sHome = parseInt(match.scoreHome || '0');
                                            const sVisitor = parseInt(match.scoreVisitor || '0');

                                            let resultStatus = 'neutral';
                                            if (mode === 'match-resultat' && match.seclinSide) {
                                                if (match.seclinSide === 'home') {
                                                    if (sHome > sVisitor) resultStatus = 'win';
                                                    else if (sHome < sVisitor) resultStatus = 'loss';
                                                } else {
                                                    if (sVisitor > sHome) resultStatus = 'win';
                                                    else if (sVisitor < sHome) resultStatus = 'loss';
                                                }
                                            }

                                            const bgGradient = resultStatus === 'win' ? 'from-green-800 to-black'
                                                : resultStatus === 'loss' ? 'from-red-800 to-black'
                                                    : 'from-sbc-dark to-gray-900';

                                            return (
                                                <div key={i} className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg text-xs">
                                                        <span className="font-bold text-gray-600 truncate max-w-[100px]">{match.division}</span>
                                                        {!match.teamId && (
                                                            <button
                                                                onClick={() => {
                                                                    const likelySeclin = [match.home, match.visitor].find(n => n.toLowerCase().includes('seclin')) || match.home;
                                                                    setNewDivisionCode(match.division);
                                                                    setNewTeamNameString(likelySeclin);
                                                                    setActiveTab('mappings');
                                                                }}
                                                                className="text-sbc hover:underline"
                                                            >
                                                                Assigner ?
                                                            </button>
                                                        )}
                                                        <button onClick={() => downloadStory(i)} title="Télécharger" className="text-gray-500 hover:text-black">
                                                            <i className="fas fa-download"></i>
                                                        </button>
                                                    </div>

                                                    {/* STORY PREVIEW CONTAINER */}
                                                    <div className="relative overflow-hidden shadow-2xl rounded-xl group bg-white">
                                                        {/* Actual 9:16 layout rendered here */}
                                                        <div
                                                            ref={el => { storyRefs.current[i] = el }}
                                                            className={`w-[1080px] h-[1920px] bg-gradient-to-tr ${bgGradient} text-white relative flex flex-col items-center overflow-hidden`}
                                                            style={{
                                                                transform: 'scale(0.25)',
                                                                transformOrigin: 'top left',
                                                                width: '1080px',
                                                                height: '1920px',
                                                                marginBottom: '-1440px', // Compensate for scale (1920 - 1920*0.25 = 1440)
                                                                marginRight: '-810px' // (1080 - 1080*0.25 = 810)
                                                            }}
                                                        >

                                                            {/* Background Decoration */}
                                                            {match.teamImage && match.teamImage !== '/logo.png' && showTeamPhoto ? (
                                                                <div className="absolute inset-0 z-0">
                                                                    <img
                                                                        src={match.teamImage}
                                                                        className="w-full h-full object-cover opacity-50 mix-blend-overlay"
                                                                        alt=""
                                                                    />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="absolute top-0 w-full h-1/2 bg-sbc skew-y-12 transform -translate-y-1/2 opacity-20"></div>
                                                                    <div className="absolute bottom-0 w-full h-1/3 bg-black/50 backdrop-blur-3xl"></div>
                                                                </>
                                                            )}
                                                            <div className="absolute inset-0 bg-[url('/img/pattern.png')] opacity-5"></div>

                                                            {/* Header */}
                                                            <div className="pt-24 text-center z-10 w-full px-12">
                                                                <img src="/logo.png" alt="SBC" className="w-48 h-48 mx-auto mb-8 drop-shadow-2xl" />
                                                                <h1 className="text-5xl font-black uppercase tracking-widest text-sbc-light mb-4">
                                                                    {mode === 'match-resultat' ? 'RÉSULTAT DU MATCH' : 'MATCH DAY'}
                                                                </h1>
                                                                <div className="h-2 w-32 bg-white mx-auto rounded-full"></div>
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-grow flex flex-col justify-center items-center z-10 w-full px-12 space-y-16">

                                                                {/* Versus Block */}
                                                                <div className="flex flex-col items-center gap-12 w-full">
                                                                    <div className="text-center w-full">
                                                                        {/* HOME TEAM */}
                                                                        <h2 className="text-7xl font-black leading-tight drop-shadow-lg uppercase break-words px-8">
                                                                            {match.homeDisplay || match.home}
                                                                        </h2>
                                                                        <p className="text-3xl font-bold text-gray-400 mt-2">DOMICILE</p>
                                                                    </div>

                                                                    {mode === 'match-resultat' ? (
                                                                        <div className="flex items-center gap-16 bg-black/40 px-12 py-6 rounded-3xl backdrop-blur-md border border-white/10">
                                                                            <span className={`text-9xl font-black ${parseInt(match.scoreHome || '0') > parseInt(match.scoreVisitor || '0') ? 'text-green-400' : 'text-white'}`}>{match.scoreHome}</span>
                                                                            <span className="text-6xl font-bold text-gray-500">-</span>
                                                                            <span className={`text-9xl font-black ${parseInt(match.scoreVisitor || '0') > parseInt(match.scoreHome || '0') ? 'text-green-400' : 'text-white'}`}>{match.scoreVisitor}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-8xl font-black text-sbc-light italic transform -skew-x-12">VS</div>
                                                                    )}

                                                                    <div className="text-center w-full">
                                                                        {/* VISITOR TEAM */}
                                                                        <h2 className="text-7xl font-black leading-tight drop-shadow-lg uppercase break-words px-8">
                                                                            {match.visitorDisplay || match.visitor}
                                                                        </h2>
                                                                        <p className="text-3xl font-bold text-gray-400 mt-2">VISITEUR</p>
                                                                    </div>
                                                                </div>

                                                            </div>

                                                            {/* Footer Info */}
                                                            <div className="pb-32 text-center z-10 w-full px-12 space-y-8">
                                                                <div className="inline-flex items-center gap-6 bg-sbc px-10 py-6 rounded-3xl shadow-xl">
                                                                    <i className="fas fa-calendar-alt text-4xl"></i>
                                                                    <span className="text-4xl font-bold">{match.date}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center w-full px-8">
                                                                    <div className="flex items-center gap-4">
                                                                        <i className="far fa-clock text-4xl text-sbc-light"></i>
                                                                        <span className="text-3xl font-bold">{match.time}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <i className="fas fa-map-marker-alt text-4xl text-sbc-light"></i>
                                                                        <span className="text-2xl font-bold uppercase truncate max-w-[400px] text-right">{match.location}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            }
                        </>
                    )}
                </div >
            )}
        </div >
    );
}
