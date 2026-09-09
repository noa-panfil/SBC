"use client";

import { useEffect, useState } from "react";

type Team = { id: number; name: string; season_id: number };
type Season = { id: number; label: string; is_current: number };
type Match = {
    id?: number; team_id: number | null; season_id: number; match_code: string;
    match_date: string; match_time: string; opponent: string; venue: string;
    home_away: "home" | "away" | "neutral"; competition: string;
    status: "scheduled" | "postponed" | "cancelled" | "played"; is_featured: boolean;
    team_name?: string; season?: string;
};

const blank = (seasonId = 0): Match => ({
    team_id: null, season_id: seasonId, match_code: "", match_date: "", match_time: "",
    opponent: "", venue: "", home_away: "home", competition: "Championnat",
    status: "scheduled", is_featured: false,
});

export default function AdminMatchesManager({ teams, seasons }: { teams: Team[]; seasons: Season[] }) {
    const currentSeason = seasons.find((season) => season.is_current)?.id || seasons[0]?.id || 0;
    const [matches, setMatches] = useState<Match[]>([]);
    const [form, setForm] = useState<Match>(blank(currentSeason));
    const [open, setOpen] = useState(false);
    const [error, setError] = useState("");

    const load = async () => {
        const response = await fetch("/api/admin/matches");
        if (response.ok) setMatches(await response.json());
    };
    useEffect(() => {
        let active = true;
        fetch("/api/admin/matches").then(async (response) => {
            if (active && response.ok) setMatches(await response.json());
        });
        return () => { active = false; };
    }, []);

    const save = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        const response = await fetch("/api/admin/matches", {
            method: form.id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            setError(data.error || "Impossible d’enregistrer le match.");
            return;
        }
        setOpen(false);
        setForm(blank(currentSeason));
        await load();
    };

    const remove = async (id?: number) => {
        if (!id || !confirm("Supprimer ce match du calendrier ?")) return;
        await fetch(`/api/admin/matches?id=${id}`, { method: "DELETE" });
        await load();
    };

    const visibleTeams = teams.filter((team) => team.season_id === Number(form.season_id));

    return <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex items-center justify-between gap-4">
            <div><h3 className="text-xl font-black">Calendrier des matchs</h3><p className="text-sm text-gray-500">Domicile et extérieur dans une seule liste.</p></div>
            <button onClick={() => { setForm(blank(currentSeason)); setOpen(true); }} className="rounded-xl bg-sbc px-4 py-3 font-bold text-white"><i className="fas fa-plus mr-2" />Ajouter</button>
        </div>
        <div className="mt-6 space-y-2">
            {matches.map((match) => <article key={match.id} className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center">
                <div className="min-w-28 font-black">{new Date(`${match.match_date}T12:00:00`).toLocaleDateString("fr-FR")}<span className="ml-2 text-sbc">{match.match_time}</span></div>
                <div className="min-w-0 flex-1"><p className="truncate font-bold">{match.team_name || "Équipe SBC"} — {match.opponent}</p><p className="text-xs text-gray-500">{match.home_away === "home" ? "Domicile" : match.home_away === "away" ? "Extérieur" : "Terrain neutre"} · {match.competition} · {match.season}</p></div>
                <div className="flex gap-2"><button onClick={() => { setForm({ ...match, is_featured: !!match.is_featured }); setOpen(true); }} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold">Modifier</button><button onClick={() => remove(match.id)} className="rounded-lg bg-red-50 px-3 py-2 text-red-700"><i className="fas fa-trash" /></button></div>
            </article>)}
            {!matches.length && <p className="rounded-2xl border-2 border-dashed p-8 text-center text-gray-400">Aucun match enregistré.</p>}
        </div>
        {open && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"><form onSubmit={save} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between"><h3 className="text-2xl font-black">{form.id ? "Modifier" : "Ajouter"} un match</h3><button type="button" onClick={() => setOpen(false)} className="h-10 w-10 rounded-full bg-gray-100"><i className="fas fa-times" /></button></div>
            <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-bold">Saison<select required value={form.season_id} onChange={(e) => setForm({ ...form, season_id: Number(e.target.value), team_id: null })} className="mt-1 w-full rounded-xl border p-3">{seasons.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
                <label className="text-sm font-bold">Équipe<select value={form.team_id || ""} onChange={(e) => setForm({ ...form, team_id: e.target.value ? Number(e.target.value) : null })} className="mt-1 w-full rounded-xl border p-3"><option value="">Équipe non renseignée</option>{visibleTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
                <label className="text-sm font-bold">Date<input required type="date" value={form.match_date} onChange={(e) => setForm({ ...form, match_date: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
                <label className="text-sm font-bold">Heure<input type="time" value={form.match_time} onChange={(e) => setForm({ ...form, match_time: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
                <label className="text-sm font-bold">Adversaire<input required value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
                <label className="text-sm font-bold">Lieu<input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
                <label className="text-sm font-bold">Terrain<select value={form.home_away} onChange={(e) => setForm({ ...form, home_away: e.target.value as Match["home_away"] })} className="mt-1 w-full rounded-xl border p-3"><option value="home">Domicile</option><option value="away">Extérieur</option><option value="neutral">Neutre</option></select></label>
                <label className="text-sm font-bold">Compétition<input value={form.competition} onChange={(e) => setForm({ ...form, competition: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
                <label className="text-sm font-bold">Statut<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Match["status"] })} className="mt-1 w-full rounded-xl border p-3"><option value="scheduled">Programmé</option><option value="postponed">Reporté</option><option value="cancelled">Annulé</option><option value="played">Joué</option></select></label>
                <label className="flex items-center gap-3 self-end rounded-xl bg-gray-50 p-3 font-bold"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />À la une</label>
            </div>
            {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
            <button className="mt-6 w-full rounded-xl bg-sbc py-4 font-black text-white">Enregistrer</button>
        </form></div>}
    </div>;
}
