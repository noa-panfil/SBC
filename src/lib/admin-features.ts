export type AdminFeatureKey =
    | "teams"
    | "players"
    | "matches"
    | "events"
    | "bureau"
    | "volunteers"
    | "palmares"
    | "partners"
    | "contacts"
    | "shop"
    | "stories"
    | "birthdays"
    | "appearance"
    | "maintenance";

export type AdminFeature = {
    key: AdminFeatureKey;
    title: string;
    navLabel: string;
    description: string;
    category: "Sportif" | "Vie du club" | "Communication" | "Pilotage";
    icon: string;
    href: string;
    internal: boolean;
    iconClass: string;
    accentClass: string;
    glowClass: string;
};

export const adminFeatures: AdminFeature[] = [
    {
        key: "teams", title: "Équipes & saisons", navLabel: "Équipes",
        description: "Composez les effectifs, attribuez les coachs et organisez les saisons.",
        category: "Sportif", icon: "fa-shield-alt", href: "/admin?view=teams", internal: true,
        iconClass: "bg-emerald-100 text-emerald-800", accentClass: "bg-emerald-500", glowClass: "bg-emerald-300/25",
    },
    {
        key: "players", title: "Personnes", navLabel: "Personnes",
        description: "Gérez les joueurs, coachs et profils utilisés dans les équipes du club.",
        category: "Sportif", icon: "fa-user-friends", href: "/admin/players", internal: false,
        iconClass: "bg-lime-100 text-lime-800", accentClass: "bg-lime-500", glowClass: "bg-lime-300/25",
    },
    {
        key: "matches", title: "Matchs", navLabel: "Matchs",
        description: "Planifiez les rencontres et tenez le calendrier sportif à jour.",
        category: "Sportif", icon: "fa-calendar-check", href: "/admin?view=matches", internal: true,
        iconClass: "bg-blue-100 text-blue-800", accentClass: "bg-blue-500", glowClass: "bg-blue-300/25",
    },
    {
        key: "events", title: "Événements", navLabel: "Événements",
        description: "Publiez les temps forts du club et suivez les inscriptions reçues.",
        category: "Vie du club", icon: "fa-calendar-alt", href: "/admin?view=events", internal: true,
        iconClass: "bg-orange-100 text-orange-800", accentClass: "bg-orange-500", glowClass: "bg-orange-300/25",
    },
    {
        key: "bureau", title: "Membres du bureau", navLabel: "Bureau",
        description: "Mettez à jour la composition et les fonctions du bureau de l’association.",
        category: "Vie du club", icon: "fa-users-cog", href: "/admin?view=bureau", internal: true,
        iconClass: "bg-violet-100 text-violet-800", accentClass: "bg-violet-500", glowClass: "bg-violet-300/25",
    },
    {
        key: "volunteers", title: "Bénévoles", navLabel: "Bénévoles",
        description: "Valorisez les personnes qui font vivre le club au quotidien.",
        category: "Vie du club", icon: "fa-hands-helping", href: "/admin?view=volunteers", internal: true,
        iconClass: "bg-rose-100 text-rose-800", accentClass: "bg-rose-500", glowClass: "bg-rose-300/25",
    },
    {
        key: "palmares", title: "Palmarès", navLabel: "Palmarès",
        description: "Enrichissez la salle des trophées et l’histoire sportive du SBC.",
        category: "Vie du club", icon: "fa-trophy", href: "/admin?view=palmares", internal: true,
        iconClass: "bg-amber-100 text-amber-800", accentClass: "bg-amber-500", glowClass: "bg-amber-300/25",
    },
    {
        key: "partners", title: "Partenaires", navLabel: "Partenaires",
        description: "Gérez les logos, liens et informations des partenaires du club.",
        category: "Vie du club", icon: "fa-handshake", href: "/admin?view=partners", internal: true,
        iconClass: "bg-cyan-100 text-cyan-800", accentClass: "bg-cyan-500", glowClass: "bg-cyan-300/25",
    },
    {
        key: "contacts", title: "Boîte de réception", navLabel: "Contacts",
        description: "Traitez les contacts simples et les demandes de partenariat.",
        category: "Pilotage", icon: "fa-inbox", href: "/admin/contacts", internal: false,
        iconClass: "bg-teal-100 text-teal-800", accentClass: "bg-teal-500", glowClass: "bg-teal-300/25",
    },
    {
        key: "shop", title: "Boutique", navLabel: "Boutique",
        description: "Pilotez le catalogue, les commandes et les lots fournisseur.",
        category: "Pilotage", icon: "fa-shopping-basket", href: "/admin/boutique", internal: false,
        iconClass: "bg-green-100 text-green-800", accentClass: "bg-green-600", glowClass: "bg-green-300/25",
    },
    {
        key: "stories", title: "Stories", navLabel: "Stories",
        description: "Créez rapidement les visuels de match aux couleurs du club.",
        category: "Communication", icon: "fa-mobile-alt", href: "/admin?view=stories", internal: true,
        iconClass: "bg-fuchsia-100 text-fuchsia-800", accentClass: "bg-fuchsia-500", glowClass: "bg-fuchsia-300/25",
    },
    {
        key: "birthdays", title: "Anniversaires", navLabel: "Anniversaires",
        description: "Préparez les publications d’anniversaire des membres du SBC.",
        category: "Communication", icon: "fa-birthday-cake", href: "/admin?view=birthdays", internal: true,
        iconClass: "bg-pink-100 text-pink-800", accentClass: "bg-pink-500", glowClass: "bg-pink-300/25",
    },
    {
        key: "appearance", title: "Apparence du site", navLabel: "Apparence",
        description: "Ajustez les visuels et éléments graphiques affichés au public.",
        category: "Pilotage", icon: "fa-paint-brush", href: "/admin?view=appearance", internal: true,
        iconClass: "bg-indigo-100 text-indigo-800", accentClass: "bg-indigo-500", glowClass: "bg-indigo-300/25",
    },
    {
        key: "maintenance", title: "Disponibilité du site", navLabel: "Maintenance",
        description: "Ouvrez le site au public ou activez proprement le mode maintenance.",
        category: "Pilotage", icon: "fa-tools", href: "/admin?view=maintenance", internal: true,
        iconClass: "bg-slate-200 text-slate-800", accentClass: "bg-slate-600", glowClass: "bg-slate-300/30",
    },
];

export function getAdminFeature(value: string | undefined) {
    return adminFeatures.find((feature) => feature.internal && feature.key === value) || null;
}
