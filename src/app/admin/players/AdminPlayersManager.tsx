"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo, useState } from "react";

type Person = { id: number; firstname: string; lastname: string; image_id: number | null; celebration_image_id: number | null; teams: string | null; roles: string | null; active: number };

export default function AdminPlayersManager({ initialPlayers }: { initialPlayers: Person[] }) {
    const [search, setSearch] = useState("");
    const people = useMemo(() => {
        const value = search.trim().toLowerCase();
        if (!value) return initialPlayers;
        return initialPlayers.filter((person: Person) => [person.firstname, person.lastname, person.teams, person.roles].some((field) => field?.toLowerCase().includes(value)));
    }, [initialPlayers, search]);

    return <div className="space-y-5">
        <div className="relative rounded-2xl border bg-white p-4 shadow-sm"><i className="fas fa-search absolute left-8 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par nom, fonction, équipe ou saison…" className="w-full rounded-xl border bg-gray-50 py-3 pl-12 pr-4 outline-none focus:border-sbc" /></div>
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            {people.map((person: Person) => <Link key={person.id} href={`/admin/players/${person.id}`} className="flex items-center gap-4 border-b p-4 transition last:border-0 hover:bg-gray-50 md:p-5">
                <div className="group/photo relative h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">{person.image_id ? <img src={`/api/image/${person.image_id}?scope=person`} alt="" className={`absolute inset-0 h-full w-full object-contain object-bottom transition ${person.celebration_image_id ? "group-hover/photo:opacity-0" : ""}`} /> : <span className="flex h-full items-center justify-center text-gray-300"><i className="fas fa-user" /></span>}{person.celebration_image_id && <img src={`/api/image/${person.celebration_image_id}?scope=person`} alt="" className="absolute inset-0 h-full w-full object-contain object-bottom opacity-0 transition group-hover/photo:opacity-100" />}</div>
                <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate font-black">{person.lastname.toUpperCase()} {person.firstname}</p>{!person.active && <span className="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500">Inactive</span>}</div><p className="truncate text-sm font-semibold text-sbc">{person.roles || "Aucune fonction"}</p><p className="truncate text-xs text-gray-400">{person.teams || "Aucune équipe"}</p></div>
                <i className="fas fa-chevron-right text-gray-300" />
            </Link>)}
            {!people.length && <p className="p-12 text-center text-gray-400">Aucune personne trouvée.</p>}
        </div>
    </div>;
}
