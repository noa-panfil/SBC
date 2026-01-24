import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import AdminTeamsClient from "./AdminTeamsClient";
import AdminCoachesManager from "./AdminCoachesManager";
import AdminEventsManager from "./AdminEventsManager";

import AdminCoachLoginsManager from "./AdminCoachLoginsManager";
import AdminOTMManager from "./AdminOTMManager";
import { authOptions } from "@/lib/auth";
import InstallPWA from "@/components/InstallPWA";

async function getStats() {
    try {
        const [playerRows] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(DISTINCT person_id) as count FROM team_members WHERE role NOT LIKE '%Coach%'"
        );
        const [coachRows] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(DISTINCT person_id) as count FROM team_members WHERE role LIKE '%Coach%'"
        );

        return {
            players: playerRows[0].count,
            coaches: coachRows[0].count
        };
    } catch (e) {
        console.error(e);
        return { players: 0, coaches: 0 };
    }
}

async function getCoachLogins() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>("SELECT id, firstname, lastname, email FROM login_coachs ORDER BY lastname ASC");
        return rows.map((r: any) => ({
            id: r.id,
            firstname: r.firstname,
            lastname: r.lastname,
            email: r.email
        }));
    } catch (e) {
        console.error("Error fetching coach logins", e);
        return [];
    }
}

async function getTeams() {
    try {
        const [teamRows] = await pool.query<RowDataPacket[]>(
            'SELECT id, name, category, schedule, widget_id, image_id FROM teams ORDER BY name'
        );
        const [memberRows] = await pool.query<RowDataPacket[]>(
            `SELECT tm.person_id, tm.team_id, tm.role, tm.number, p.firstname, p.lastname, p.birthdate, p.gender, p.image_id
             FROM team_members tm
             JOIN persons p ON tm.person_id = p.id`
        );

        const teams = teamRows.map((team: any) => {
            const members = memberRows.filter((m: any) => m.team_id === team.id);

            const coaches = members
                .filter((m: any) => m.role.toLowerCase().includes('coach'))
                .map((m: any) => ({
                    person_id: m.person_id,
                    name: `${m.firstname} ${m.lastname || ''}`.trim(),
                    role: m.role,
                    img: m.image_id ? `/api/image/${m.image_id}` : null,
                    birth: m.birthdate ? new Date(m.birthdate).toLocaleDateString('fr-FR') : null,
                    sexe: m.gender
                }));

            const players = members
                .filter((m: any) => !m.role.toLowerCase().includes('coach'))
                .map((m: any) => ({
                    person_id: m.person_id,
                    name: `${m.firstname} ${m.lastname || ''}`.trim(),
                    num: m.number,
                    img: m.image_id ? `/api/image/${m.image_id}` : null,
                    birth: m.birthdate ? new Date(m.birthdate).toLocaleDateString('fr-FR') : null,
                    sexe: m.gender
                }));

            return {
                id: team.id.toString(),
                name: team.name,
                category: team.category,
                image: team.image_id ? `/api/image/${team.image_id}` : null,
                image_id: team.image_id, // Added: Essential for persistence on edit!
                schedule: team.schedule,
                widgetId: team.widget_id,
                coaches: coaches,
                players: players
            };
        });

        // Helper to determine sort weight
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
            else score = 9999; // Others at the end

            // 2. Gender Priority (Same level: F < M)
            // If it contains "F" (and not just in "Enfant" or generic words), give small bonus
            // Actually, let's look for specific patterns like "U11 F", "SF", "Seniors F"
            const isFemale = n.includes(' F') || n.includes('-F') || n.endsWith(' F') || n.includes('FILLE');
            const isMale = n.includes(' M') || n.includes('-M') || n.endsWith(' M') || n.includes('GARCON') || n.includes(' MASC');

            if (isFemale) score += 0;
            else if (isMale) score += 5;
            else score += 2; // Mixed/Undefined in between or after female? Usually Baby is mixed (0+2=102). U11F(400) < U11M(405).

            // 3. Team Level (1 < 2 < 3)
            if (n.includes(' 2') || n.includes('-2')) score += 1;
            else if (n.includes(' 3') || n.includes('-3')) score += 2;
            else if (n.includes(' 4') || n.includes('-4')) score += 3;

            return score;
        };

        const sortedTeams = teams.sort((a: any, b: any) => {
            return getTeamWeight(a.name) - getTeamWeight(b.name);
        });

        return sortedTeams;
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function getOtmMatches() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT * FROM otm_matches 
            ORDER BY match_date ASC, match_time ASC
        `);
        return rows.map((row: any) => ({
            ...row,
            match_date: row.match_date.toISOString(),
            created_at: row.created_at.toISOString(),
        }));
    } catch (e) {
        console.error("Error fetching OTM matches", e);
        return [];
    }
}

async function getAllPersons() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT p.id, p.firstname, p.lastname, p.image_id, t.name as team_name, tm.role
            FROM persons p
            LEFT JOIN team_members tm ON p.id = tm.person_id
            LEFT JOIN teams t ON tm.team_id = t.id
            ORDER BY p.lastname, p.firstname
        `);

        const personMap = new Map<number, any>();
        rows.forEach((r: any) => {
            const fullname = `${r.lastname.toUpperCase()} ${r.firstname}`.trim();
            if (!personMap.has(r.id)) {
                personMap.set(r.id, {
                    id: r.id,
                    fullname,
                    image_id: r.image_id,
                    team: r.team_name,
                    teams: r.team_name ? [r.team_name] : [],
                    role: r.role
                });
            } else {
                const existing = personMap.get(r.id);
                // If we encounter a team name and didn't have one (or just adding to list)
                if (r.team_name) {
                    if (!existing.teams.includes(r.team_name)) {
                        existing.teams.push(r.team_name);
                    }
                    // Prioritize non-coach team for display if current is coach or null
                    if ((!existing.team || (existing.role && existing.role.includes('Coach'))) && r.role && !r.role.includes('Coach')) {
                        existing.team = r.team_name;
                        existing.role = r.role;
                    }
                }
            }
        });
        return Array.from(personMap.values());

    } catch (e) {
        console.error("Error fetching all persons", e);
        return [];
    }
}

export default async function AdminDashboard() {
    const session: any = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    if (session.user.role !== 'admin') {
        redirect("/login");
    }

    const stats = await getStats();
    const teams = await getTeams();
    const coachLogins = await getCoachLogins();
    const otmMatches = await getOtmMatches();
    const rawOfficials = await getAllPersons();

    // Disambiguate
    const nameCounts: Record<string, number> = {};
    rawOfficials.forEach((p: any) => {
        nameCounts[p.fullname] = (nameCounts[p.fullname] || 0) + 1;
    });

    const officials = rawOfficials.map((p: any) => ({
        ...p,
        originalName: p.fullname,
        fullname: nameCounts[p.fullname] > 1 ? `${p.fullname} (${p.team})` : p.fullname
    }));

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-10 pb-20 overflow-x-hidden">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/90 backdrop-blur-md sticky top-0 md:top-4 z-40 p-6 md:rounded-2xl shadow-sm border-b md:border border-gray-100 md:border-white/20">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Tableau de bord</h1>
                    <p className="text-xs md:text-sm text-gray-500 font-medium truncate">Session : <span className="text-sbc font-bold">{session.user?.email}</span></p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <InstallPWA />
                    <Link href="/" className="flex-1 md:flex-none justify-center px-4 py-2.5 text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center gap-2 uppercase tracking-wider">
                        <i className="fas fa-external-link-alt text-[10px]"></i> Site public
                    </Link>
                    <div className="px-3 py-2 bg-sbc/10 text-sbc text-[10px] font-black rounded-xl uppercase tracking-widest border border-sbc/20">
                        Status: Live
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {[
                    { label: "Joueurs", value: stats.players, icon: "fas fa-users", color: "from-blue-500 to-indigo-600", link: "/admin/players" },
                    { label: "Coachs", value: stats.coaches, icon: "fas fa-user-tie", color: "from-emerald-500 to-teal-600", link: null },
                    { label: "Équipes", value: teams.length, icon: "fas fa-shield-alt", color: "from-sbc to-sbc-dark", link: "#teams", fullMobile: true },
                ].map((stat, i) => (
                    <div key={i} className={`group relative ${stat.fullMobile ? 'col-span-2 lg:col-span-1' : 'col-span-1'}`}>
                        {stat.link ? (
                            <Link href={stat.link} className="absolute inset-0 z-10" />
                        ) : null}
                        <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 transition-all duration-300 active:scale-95 md:hover:shadow-xl md:hover:-translate-y-1">
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br ${stat.color} text-white flex items-center justify-center text-xl md:text-2xl shadow-lg mb-3 md:mb-4 transition-transform`}>
                                <i className={stat.icon}></i>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs md:text-sm font-black uppercase tracking-widest">{stat.label}</p>
                                <p className="text-2xl md:text-3xl font-black text-gray-900 mt-0.5 md:mt-1">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <section id="teams" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight whitespace-nowrap">Équipes</h2>
                    <div className="h-px flex-grow bg-gray-200"></div>
                </div>
                <AdminTeamsClient teams={teams} />
            </section>

            <section id="coaches" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight whitespace-nowrap">Staff Technique</h2>
                    <div className="h-px flex-grow bg-gray-200"></div>
                </div>
                <AdminCoachesManager teams={teams} />
                <div className="mt-8">
                    <AdminCoachLoginsManager initialLogins={coachLogins} />
                </div>
            </section>

            <section id="events" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight whitespace-nowrap">Événements</h2>
                    <div className="h-px flex-grow bg-gray-200"></div>
                </div>
                <AdminEventsManager teams={teams} />
            </section>

            <section id="otm" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight whitespace-nowrap">Gestion OTM</h2>
                    <div className="h-px flex-grow bg-gray-200"></div>
                </div>
                <AdminOTMManager initialMatches={otmMatches} teams={teams} officials={officials} />
            </section>

            <div className="bg-sbc-dark rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 text-white overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sbc-light opacity-10 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-16 -mb-16"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black mb-1">Actions rapides</h2>
                        <p className="text-gray-400 text-xs md:text-base font-medium">Gérez votre contenu en toute simplicité.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
                        <Link href="/admin/images" className="w-full md:w-auto bg-white/10 hover:bg-white/20 px-8 py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-base uppercase tracking-widest flex items-center justify-center gap-3 transition-all backdrop-blur-sm border border-white/10">
                            <i className="fas fa-images text-lg"></i> Médiathèque
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    );
}
