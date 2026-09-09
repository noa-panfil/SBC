"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Season = { id: number; label: string; is_current: number };

export type CreatedTeam = {
    id: string;
    season_id: number;
    season: string;
    name: string;
    category: string;
    image: null;
    storyImage: null;
    trainingSlots: string[];
    widgetId: string;
    coaches: [];
    players: [];
};

export default function AdminSeasonManager({ seasons, onTeamCreated }: { seasons: Season[]; onTeamCreated?: (team: CreatedTeam) => void }) {
    const router = useRouter();
    const [seasonOpen, setSeasonOpen] = useState(false);
    const [teamOpen, setTeamOpen] = useState(false);
    const [season, setSeason] = useState({ label: "", starts_on: "", ends_on: "", is_current: true, copy_from: seasons[0]?.id || 0 });
    const [team, setTeam] = useState({ season_id: seasons.find((item) => item.is_current)?.id || seasons[0]?.id || 0, name: "", category: "" });

    const post = async (url: string, body: object) => {
        const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) { alert(result.error || "Enregistrement impossible."); return null; }
        router.refresh(); return result;
    };

    return <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border bg-white p-4 shadow-sm">
        <button onClick={() => setTeamOpen(!teamOpen)} className="rounded-xl bg-sbc px-4 py-3 font-bold text-white"><i className="fas fa-plus mr-2" />Nouvelle équipe</button>
        <button onClick={() => setSeasonOpen(!seasonOpen)} className="rounded-xl bg-gray-950 px-4 py-3 font-bold text-white"><i className="fas fa-calendar-plus mr-2" />Nouvelle saison</button>
        {teamOpen && <form className="grid w-full gap-3 border-t pt-4 md:grid-cols-4" onSubmit={async (event) => { event.preventDefault(); const result = await post("/api/admin/teams", team); if (!result) return; const selectedSeason = seasons.find((item) => item.id === team.season_id); onTeamCreated?.({ id: String(result.id), season_id: team.season_id, season: selectedSeason?.label || "", name: team.name.trim(), category: team.category, image: null, storyImage: null, trainingSlots: [], widgetId: "", coaches: [], players: [] }); setTeam({ ...team, name: "", category: "" }); setTeamOpen(false); }}><select value={team.season_id} onChange={(e) => setTeam({ ...team, season_id: Number(e.target.value) })} className="input">{seasons.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><input required placeholder="Nom de l’équipe" value={team.name} onChange={(e) => setTeam({ ...team, name: e.target.value })} className="input" /><input placeholder="Catégorie" value={team.category} onChange={(e) => setTeam({ ...team, category: e.target.value })} className="input" /><button className="mt-1 rounded-xl bg-sbc font-black text-white">Créer et modifier</button></form>}
        {seasonOpen && <form className="grid w-full gap-3 border-t pt-4 md:grid-cols-3" onSubmit={async (event) => { event.preventDefault(); if (await post("/api/admin/seasons", season)) setSeasonOpen(false); }}><input required placeholder="2027-2028" value={season.label} onChange={(e) => setSeason({ ...season, label: e.target.value })} className="input" /><input required type="date" value={season.starts_on} onChange={(e) => setSeason({ ...season, starts_on: e.target.value })} className="input" /><input required type="date" value={season.ends_on} onChange={(e) => setSeason({ ...season, ends_on: e.target.value })} className="input" /><label className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm font-bold"><input type="checkbox" checked={season.is_current} onChange={(e) => setSeason({ ...season, is_current: e.target.checked })} />Définir comme saison courante</label><label className="text-sm font-bold">Recopier la structure de<select value={season.copy_from} onChange={(e) => setSeason({ ...season, copy_from: Number(e.target.value) })} className="input"><option value="0">Ne rien recopier</option>{seasons.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><button className="mt-1 rounded-xl bg-gray-950 font-black text-white">Créer la saison</button><p className="text-xs text-gray-500 md:col-span-3">La copie recrée les équipes sans affecter automatiquement les personnes : vous gardez ainsi l’historique et choisissez les montées depuis chaque fiche.</p></form>}
    </div>;
}
