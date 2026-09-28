import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import AdminPartnersManager from "./AdminPartnersManager";
import AdminPalmaresManager from "./AdminPalmaresManager";
import { adminFeatures, AdminFeature, AdminFeatureKey, getAdminFeature } from "@/lib/admin-features";

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
            (SELECT COUNT(*) FROM partners) AS partners,
            (SELECT COUNT(*) FROM palmares) AS palmares,
            (SELECT COUNT(*) FROM teams WHERE active = 1) AS teams,
            (SELECT COUNT(*) FROM contact_messages WHERE status = 'new') AS contacts
    `);
    const stats = rows[0];
    return {
        persons: Number(stats.persons),
        players: Number(stats.players),
        coaches: Number(stats.coaches),
        bureau: Number(stats.bureau),
        volunteers: Number(stats.volunteers),
        partners: Number(stats.partners),
        palmares: Number(stats.palmares),
        teams: Number(stats.teams),
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
               p.firstname, p.lastname, p.birthdate, p.gender,
               CASE WHEN pri.person_id IS NULL THEN p.image_id ELSE pri.image_id END AS image_id
        FROM team_memberships tm
        JOIN persons p ON p.id = tm.person_id
        LEFT JOIN person_role_images pri ON pri.person_id = p.id
             AND pri.role_context = CASE WHEN tm.membership_role = 'player' THEN 'player' ELSE 'coach' END
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
        SELECT p.id, p.firstname, p.lastname,
               CASE WHEN bri.person_id IS NULL THEN p.image_id ELSE bri.image_id END AS image_id,
               GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ', ') AS teams,
               GROUP_CONCAT(DISTINCT r.label ORDER BY r.label SEPARATOR ', ') AS roles
        FROM persons p
        LEFT JOIN person_role_images bri ON bri.person_id = p.id AND bri.role_context = 'bureau'
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
        SELECT p.id, p.firstname, p.lastname, p.gender,
               CASE WHEN COALESCE(role_images.has_player_context, 0) = 1 THEN role_images.player_image_id ELSE p.image_id END AS player_image_id,
               CASE WHEN COALESCE(role_images.has_coach_context, 0) = 1 THEN role_images.coach_image_id ELSE p.image_id END AS coach_image_id,
               DATE_FORMAT(p.birthdate, '%d/%m/%Y') AS birth,
               GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ',') AS role_codes
        FROM persons p
        LEFT JOIN (
            SELECT person_id,
                   MAX(role_context = 'player') AS has_player_context,
                   MAX(role_context = 'coach') AS has_coach_context,
                   MAX(CASE WHEN role_context = 'player' THEN image_id END) AS player_image_id,
                   MAX(CASE WHEN role_context = 'coach' THEN image_id END) AS coach_image_id
            FROM person_role_images GROUP BY person_id
        ) role_images ON role_images.person_id = p.id
        LEFT JOIN person_roles pr ON pr.person_id = p.id
        LEFT JOIN roles r ON r.id = pr.role_id
        WHERE p.active = 1
        GROUP BY p.id
        ORDER BY p.lastname, p.firstname
    `);
    return rows.map((row) => ({
        id: Number(row.id),
        name: `${row.firstname} ${row.lastname}`.trim(),
        player_image_id: row.player_image_id == null ? null : Number(row.player_image_id),
        coach_image_id: row.coach_image_id == null ? null : Number(row.coach_image_id),
        player_img: row.player_image_id ? `/api/image/${row.player_image_id}?scope=person` : null,
        coach_img: row.coach_image_id ? `/api/image/${row.coach_image_id}?scope=person` : null,
        birth: row.birth || null,
        sexe: row.gender || "",
        roles: row.role_codes ? String(row.role_codes).split(",") : [],
    }));
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ view?: string | string[] }> }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") redirect("/login");
    const { view } = await searchParams;
    const requestedView = Array.isArray(view) ? view[0] : view;
    const selectedFeature = getAdminFeature(requestedView);
    if (requestedView && !selectedFeature) redirect("/admin");

    if (selectedFeature) {
        return <FeatureView feature={selectedFeature} email={session.user?.email || "Administrateur"} />;
    }

    const stats = await getStats();
    const statCards = [
        { label: "Personnes", value: stats.persons, icon: "fa-users", href: "/admin/players", color: "text-emerald-700", background: "bg-emerald-50" },
        { label: "Joueurs", value: stats.players, icon: "fa-basketball-ball", href: "/admin/players", color: "text-orange-700", background: "bg-orange-50" },
        { label: "Coachs", value: stats.coaches, icon: "fa-user-tie", href: "/admin/players", color: "text-blue-700", background: "bg-blue-50" },
        { label: "Équipes", value: stats.teams, icon: "fa-shield-alt", href: "/admin?view=teams", color: "text-teal-700", background: "bg-teal-50" },
        { label: "Palmarès", value: stats.palmares, icon: "fa-trophy", href: "/admin?view=palmares", color: "text-amber-700", background: "bg-amber-50" },
        { label: "Bureau", value: stats.bureau, icon: "fa-users-cog", href: "/admin?view=bureau", color: "text-violet-700", background: "bg-violet-50" },
        { label: "Bénévoles", value: stats.volunteers, icon: "fa-hands-helping", href: "/admin?view=volunteers", color: "text-rose-700", background: "bg-rose-50" },
        { label: "Partenaires", value: stats.partners, icon: "fa-handshake", href: "/admin?view=partners", color: "text-cyan-700", background: "bg-cyan-50" },
        { label: "À traiter", value: stats.contacts, icon: "fa-inbox", href: "/admin/contacts", color: "text-red-700", background: "bg-red-50" },
    ];

    return <main className="mx-auto w-full max-w-[1480px] overflow-x-hidden px-4 pb-28 pt-4 sm:px-6 md:px-8 md:pb-12 md:pt-8">
        <header className="relative isolate overflow-hidden rounded-[2rem] bg-[#071f17] px-6 py-8 text-white shadow-[0_24px_70px_rgba(7,31,23,.18)] sm:px-8 md:px-10 md:py-10">
            <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_0%,rgba(34,197,94,.28),transparent_34%),radial-gradient(circle_at_88%_90%,rgba(249,115,22,.18),transparent_30%)]" />
            <Image src="/logo.png" alt="" width={340} height={340} className="pointer-events-none absolute -right-16 top-1/2 -z-10 w-64 -translate-y-1/2 object-contain opacity-[0.07] grayscale md:right-4 md:w-80" />
            <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_0_6px_rgba(74,222,128,.12)]" /><p className="text-xs font-black uppercase tracking-[0.23em] text-green-300">Centre de contrôle</p></div>
                    <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[.95] tracking-[-0.045em] sm:text-5xl md:text-6xl">Pilotez le club depuis un seul espace.</h1>
                    <p className="mt-5 text-sm text-white/55">Connecté en tant que <span className="font-bold text-white/85">{session.user?.email}</span></p>
                </div>
                <div className="flex flex-wrap gap-3"><InstallPWA className="bg-green-500 hover:bg-green-400" /><Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-white backdrop-blur transition hover:bg-white/15">Voir le site <i className="fas fa-arrow-up-right-from-square" /></Link></div>
            </div>
        </header>

        <section className="mt-8">
            <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-sbc">Vue d’ensemble</p><h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-gray-950 md:text-3xl">Le club en chiffres</h2></div><span className="hidden text-sm font-semibold text-gray-400 sm:block">Données actualisées</span></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
                {statCards.map((card) => <Link key={card.label} href={card.href} className="group rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,.045)] transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg md:p-5"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.background} ${card.color}`}><i className={`fas ${card.icon}`} /></span><p className="mt-5 text-3xl font-black tracking-[-0.04em] text-gray-950">{card.value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400 group-hover:text-gray-600">{card.label}</p></Link>)}
            </div>
        </section>

        <section className="mt-12">
            <div className="mb-6 max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Outils du quotidien</p><h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-gray-950 md:text-4xl">Que voulez-vous gérer ?</h2><p className="mt-3 leading-7 text-gray-500">Chaque espace s’ouvre seul pour garder une interface claire, rapide et concentrée sur la tâche en cours.</p></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {adminFeatures.map((feature, index) => <FeatureCard key={feature.key} feature={feature} index={index + 1} />)}
            </div>
        </section>
    </main>;
}

function FeatureCard({ feature, index }: { feature: AdminFeature; index: number }) {
    return <Link href={feature.href} className="group relative isolate min-h-52 overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,.05)] transition duration-300 hover:-translate-y-1.5 hover:border-gray-300 hover:shadow-[0_22px_50px_rgba(15,23,42,.1)] md:p-7">
        <span className={`absolute -right-10 -top-12 -z-10 h-40 w-40 rounded-full blur-2xl transition duration-500 group-hover:scale-125 ${feature.glowClass}`} />
        <span className={`absolute inset-x-0 top-0 h-1 ${feature.accentClass}`} />
        <div className="flex items-start justify-between"><span className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl transition duration-300 group-hover:-rotate-3 group-hover:scale-110 ${feature.iconClass}`}><i className={`fas ${feature.icon}`} /></span><span className="font-mono text-xs font-bold text-gray-300">{String(index).padStart(2, "0")}</span></div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">{feature.category}</p>
        <div className="mt-1 flex items-end justify-between gap-4"><div><h3 className="text-xl font-black tracking-[-0.03em] text-gray-950 md:text-2xl">{feature.title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">{feature.description}</p></div><span className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-950 text-xs text-white transition group-hover:bg-sbc"><i className="fas fa-arrow-right" /></span></div>
    </Link>;
}

function FeatureView({ feature, email }: { feature: AdminFeature; email: string }) {
    return <main className="mx-auto min-h-screen w-full max-w-[1480px] overflow-x-hidden px-4 pb-28 pt-4 sm:px-6 md:px-8 md:pb-12 md:pt-8">
        <header className="relative isolate overflow-hidden rounded-[2rem] bg-[#071f17] px-6 py-7 text-white shadow-[0_20px_60px_rgba(7,31,23,.15)] sm:px-8 md:px-10">
            <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_82%_10%,rgba(34,197,94,.22),transparent_30%),radial-gradient(circle_at_10%_100%,rgba(249,115,22,.13),transparent_26%)]" />
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div><Link href="/admin" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-green-300 transition hover:text-white"><i className="fas fa-arrow-left" /> Tableau de bord</Link><div className="mt-6 flex items-center gap-4"><span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl ${feature.iconClass}`}><i className={`fas ${feature.icon}`} /></span><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{feature.category}</p><h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">{feature.title}</h1></div></div><p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">{feature.description}</p></div>
                <div className="flex items-center gap-3"><span className="hidden max-w-56 truncate text-xs font-bold text-white/40 lg:block">{email}</span><Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-wider backdrop-blur transition hover:bg-white/15">Voir le site <i className="fas fa-arrow-up-right-from-square" /></Link></div>
            </div>
        </header>
        <section className="mt-7"><AdminFeatureContent featureKey={feature.key} /></section>
    </main>;
}

async function AdminFeatureContent({ featureKey }: { featureKey: AdminFeatureKey }) {
    switch (featureKey) {
        case "teams": {
            const [teams, seasons, candidates] = await Promise.all([getTeams(), getSeasons(), getTeamCandidates()]);
            return <AdminTeamManagement seasons={seasons} teams={teams as never[]} candidates={candidates} />;
        }
        case "matches": {
            const [teams, seasons] = await Promise.all([getTeams(), getSeasons()]);
            return <AdminMatchesManager teams={teams.map((team) => ({ id: Number(team.id), name: String(team.name), season_id: team.season_id }))} seasons={seasons} />;
        }
        case "bureau": return <BureauManager officials={await getPersonsForBureau()} />;
        case "volunteers": return <VolunteersManager />;
        case "events": return <AdminEventsManager teams={(await getTeams()) as never[]} />;
        case "stories": return <AdminStoryGenerator teams={(await getTeams()) as never[]} />;
        case "birthdays": {
            const [teams, volunteers] = await Promise.all([getTeams(), getVolunteersForBirthdays()]);
            return <AdminBirthdayGenerator teams={teams as never[]} volunteers={volunteers} />;
        }
        case "appearance": return <AdminAppearanceManager />;
        case "partners": return <AdminPartnersManager />;
        case "palmares": return <AdminPalmaresManager />;
        case "maintenance": return <AdminMaintenanceManager initialEnabled={await getMaintenanceMode()} />;
        default: redirect("/admin");
    }
}
