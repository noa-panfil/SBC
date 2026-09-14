import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";
import InstallPWA from "@/components/InstallPWA";
import VolunteersManager from "@/components/admin/VolunteersManager";
import BureauManager from "@/components/admin/BureauManager";
import AdminEventsManager from "./AdminEventsManager";
import AdminAppearanceManager from "./AdminAppearanceManager";
import AdminStoryGenerator from "./AdminStoryGenerator";
import AdminBirthdayGenerator from "./AdminBirthdayGenerator";
import AdminMaintenanceManager from "./AdminMaintenanceManager";
import AdminMatchesManager from "./AdminMatchesManager";
import AdminTeamManagement from "./AdminTeamManagement";

async function getMaintenanceMode() {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT value FROM settings WHERE key_name = 'maintenance_mode' LIMIT 1");
    return rows[0]?.value === "true";
}

async function getStats() {
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
            (SELECT COUNT(DISTINCT p.id) FROM persons p) AS persons,
            (SELECT COUNT(DISTINCT pr.person_id)
             FROM person_roles pr
             JOIN roles r ON r.id = pr.role_id
             WHERE r.code = 'player') AS players,
            (SELECT COUNT(DISTINCT pr.person_id)
             FROM person_roles pr
             JOIN roles r ON r.id = pr.role_id
             WHERE r.code IN ('coach', 'assistant_coach')) AS coaches,
            (SELECT COUNT(DISTINCT b.person_id) FROM bureau_members b) AS bureau,
            (SELECT COUNT(DISTINCT v.person_id) FROM volunteers v) AS volunteers,
            (SELECT COUNT(*) FROM contact_messages WHERE status = 'new') AS contacts
    `);
    const stats = rows[0];
    return {
        persons: Number(stats.persons),
        players: Number(stats.players),
        coaches: Number(stats.coaches),
        bureau: Number(stats.bureau),
        volunteers: Number(stats.volunteers),
        contacts: Number(stats.contacts),
    };
}

async function getSeasons() {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT id, label, is_current FROM seasons ORDER BY starts_on DESC");
    return rows.map((row) => ({ id: Number(row.id), label: String(row.label), is_current: Number(row.is_current) }));
}

async function getTeams() {
    const [teamRows] = await pool.query<RowDataPacket[]>(`
        SELECT t.id, t.season_id, t.name, t.category, t.widget_id,
               t.image_id, t.story_image_id, s.label AS season
        FROM teams t JOIN seasons s ON s.id = t.season_id
        WHERE t.active = 1
        ORDER BY s.starts_on DESC, t.display_order, t.name
    `);
    const [memberRows] = await pool.query<RowDataPacket[]>(`
        SELECT tm.person_id, tm.team_id, tm.membership_role, tm.jersey_number,
               p.firstname, p.lastname, p.birthdate, p.gender, p.image_id
        FROM team_memberships tm JOIN persons p ON p.id = tm.person_id
    `);
    const [trainingSlotRows] = await pool.query<RowDataPacket[]>(`
        SELECT team_id, schedule_text
        FROM team_training_slots
        ORDER BY team_id, display_order, id
    `);
    return teamRows.map((team) => {
        const members = memberRows.filter((member) => Number(member.team_id) === Number(team.id));
        const formatMember = (member: RowDataPacket) => ({
            person_id: Number(member.person_id), name: `${member.firstname} ${member.lastname}`.trim(),
            role: member.membership_role, num: member.jersey_number,
            img: member.image_id ? `/api/image/${member.image_id}?scope=person` : null,
            image_id: member.image_id, birth: member.birthdate ? new Date(member.birthdate).toLocaleDateString("fr-FR") : null,
            sexe: member.gender,
        });
        return {
            id: String(team.id), season_id: Number(team.season_id), season: team.season,
            name: team.name, category: team.category,
            image: team.image_id ? `/api/image/${team.image_id}?scope=team` : null, image_id: team.image_id,
            storyImage: team.story_image_id ? `/api/image/${team.story_image_id}?scope=team` : null, story_image_id: team.story_image_id,
            trainingSlots: trainingSlotRows
                .filter((slot) => Number(slot.team_id) === Number(team.id))
                .map((slot) => String(slot.schedule_text)),
            widgetId: team.widget_id,
            coaches: members.filter((member) => member.membership_role !== "player").map(formatMember),
            players: members.filter((member) => member.membership_role === "player").map(formatMember),
        };
    });
}

async function getVolunteersForBirthdays() {
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT v.id, CONCAT(p.firstname, ' ', p.lastname) AS name,
               DATE_FORMAT(p.birthdate, '%d/%m/%Y') AS birth_date,
               p.image_id, v.title AS role
        FROM volunteers v JOIN persons p ON p.id = v.person_id
        WHERE v.display = 1 AND p.birthdate IS NOT NULL ORDER BY p.lastname, p.firstname
    `);
    return rows.map((row) => ({ id: row.id, name: row.name, birth: row.birth_date, img: row.image_id ? `/api/image/${row.image_id}?scope=person` : null, role: row.role }));
}

async function getPersonsForBureau() {
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT p.id, p.firstname, p.lastname, p.image_id,
               GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ', ') AS teams,
               GROUP_CONCAT(DISTINCT r.label ORDER BY r.label SEPARATOR ', ') AS roles
        FROM persons p
        LEFT JOIN team_memberships tm ON tm.person_id = p.id
        LEFT JOIN teams t ON t.id = tm.team_id
        LEFT JOIN person_roles pr ON pr.person_id = p.id
        LEFT JOIN roles r ON r.id = pr.role_id
        WHERE p.active = 1
        GROUP BY p.id ORDER BY p.lastname, p.firstname
    `);
    return rows.map((row) => ({ id: Number(row.id), fullname: `${String(row.lastname).toUpperCase()} ${row.firstname}`.trim(), image_id: row.image_id, team: row.teams || null, role: row.roles || null }));
}

async function getTeamCandidates() {
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT p.id, p.firstname, p.lastname, p.image_id, p.gender,
               DATE_FORMAT(p.birthdate, '%d/%m/%Y') AS birth,
               GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ',') AS role_codes
        FROM persons p
        LEFT JOIN person_roles pr ON pr.person_id = p.id
        LEFT JOIN roles r ON r.id = pr.role_id
        WHERE p.active = 1
        GROUP BY p.id
        ORDER BY p.lastname, p.firstname
    `);
    return rows.map((row) => ({
        id: Number(row.id),
        name: `${row.firstname} ${row.lastname}`.trim(),
        image_id: row.image_id == null ? null : Number(row.image_id),
        img: row.image_id ? `/api/image/${row.image_id}?scope=person` : null,
        birth: row.birth || null,
        sexe: row.gender || "",
        roles: row.role_codes ? String(row.role_codes).split(",") : [],
    }));
}

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") redirect("/login");

    const [stats, teams, seasons, volunteers, officials, teamCandidates, maintenanceEnabled] = await Promise.all([
        getStats(), getTeams(), getSeasons(), getVolunteersForBirthdays(), getPersonsForBureau(), getTeamCandidates(), getMaintenanceMode(),
    ]);

    const cards = [
        { label: "Personnes", value: stats.persons, icon: "fa-users", link: "/admin/players" },
        { label: "Joueurs", value: stats.players, icon: "fa-basketball-ball", link: "/admin/players" },
        { label: "Coachs", value: stats.coaches, icon: "fa-user-tie", link: "/admin/players" },
        { label: "Bureau", value: stats.bureau, icon: "fa-users-cog", link: "#bureau" },
        { label: "Bénévoles", value: stats.volunteers, icon: "fa-hands-helping", link: "#volunteers" },
        { label: "Équipes", value: teams.length, icon: "fa-shield-alt", link: "#teams" },
        { label: "Contacts", value: stats.contacts, icon: "fa-inbox", link: "/admin/contacts" },
    ];

    return <div className="mx-auto w-full max-w-7xl space-y-10 overflow-x-hidden p-4 pb-20 md:p-8">
        <header className="sticky top-0 z-40 flex flex-col gap-4 rounded-2xl border bg-white/90 p-6 shadow-sm backdrop-blur md:top-4 md:flex-row md:items-center md:justify-between">
            <div><h1 className="text-3xl font-black">Tableau de bord</h1><p className="text-sm text-gray-500">Session : <span className="font-bold text-sbc">{session.user?.email}</span></p></div>
            <div className="flex gap-3"><InstallPWA /><Link href="/" className="rounded-xl bg-gray-100 px-4 py-3 text-xs font-black uppercase">Voir le site</Link></div>
        </header>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">{cards.map((card) => <Link key={card.label} href={card.link} className="rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><i className={`fas ${card.icon} mb-4 text-2xl text-sbc`} /><p className="text-xs font-black uppercase tracking-wider text-gray-400">{card.label}</p><p className="text-3xl font-black">{card.value}</p></Link>)}</div>

        <section id="teams" className="scroll-mt-24"><SectionTitle>Équipes par saison</SectionTitle><AdminTeamManagement seasons={seasons} teams={teams as never[]} candidates={teamCandidates} /></section>
        <section id="matches" className="scroll-mt-24"><SectionTitle>Matchs</SectionTitle><AdminMatchesManager teams={teams.map((team) => ({ id: Number(team.id), name: String(team.name), season_id: team.season_id }))} seasons={seasons} /></section>
        <section id="bureau" className="scroll-mt-24"><SectionTitle>Membres du bureau</SectionTitle><BureauManager officials={officials} /></section>
        <section id="volunteers" className="scroll-mt-24"><SectionTitle>Bénévoles</SectionTitle><VolunteersManager /></section>
        <section id="events" className="scroll-mt-24"><SectionTitle>Événements</SectionTitle><AdminEventsManager teams={teams as never[]} /></section>
        <section id="stories" className="scroll-mt-24"><SectionTitle>Stories</SectionTitle><AdminStoryGenerator teams={teams as never[]} /></section>
        <section id="appearance" className="scroll-mt-24"><SectionTitle>Apparence</SectionTitle><AdminAppearanceManager /></section>
        <section id="birthdays" className="scroll-mt-24"><SectionTitle>Anniversaires</SectionTitle><AdminBirthdayGenerator teams={teams as never[]} volunteers={volunteers} /></section>
        <AdminMaintenanceManager initialEnabled={maintenanceEnabled} />
    </div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <div className="mb-6 flex items-center gap-3"><h2 className="whitespace-nowrap text-xl font-black uppercase tracking-tight md:text-2xl">{children}</h2><div className="h-px flex-1 bg-gray-200" /></div>;
}
