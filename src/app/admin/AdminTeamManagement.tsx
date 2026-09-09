"use client";

import { useState } from "react";
import AdminSeasonManager, { CreatedTeam } from "./AdminSeasonManager";
import AdminTeamsClient from "./AdminTeamsClient";

type Season = { id: number; label: string; is_current: number };
type Candidate = {
    id: number;
    name: string;
    image_id: number | null;
    img: string | null;
    birth: string | null;
    sexe: string;
    roles: string[];
};

export default function AdminTeamManagement({ seasons, teams, candidates }: {
    seasons: Season[];
    teams: Parameters<typeof AdminTeamsClient>[0]["teams"];
    candidates: Candidate[];
}) {
    const [teamToOpen, setTeamToOpen] = useState<CreatedTeam | null>(null);

    return <>
        <AdminSeasonManager seasons={seasons} onTeamCreated={setTeamToOpen} />
        <AdminTeamsClient teams={teams} candidates={candidates} teamToOpen={teamToOpen} />
    </>;
}
