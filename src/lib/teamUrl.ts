export function slugifyTeamName(name: string) {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "equipe";
}

export function getTeamPath(name: string) {
    return `/equipe/${slugifyTeamName(name)}`;
}
