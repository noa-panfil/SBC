function normalizeColorName(value: string): string {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

const namedColors: Array<[RegExp, string]> = [
    [/noir|black/, "#111111"],
    [/blanc|white|ecru/, "#f8fafc"],
    [/marine|navy/, "#172554"],
    [/bleu roi|royal/, "#1d4ed8"],
    [/bleu ciel|ciel/, "#7dd3fc"],
    [/bleu|blue/, "#2563eb"],
    [/bordeaux|burgundy/, "#7f1d1d"],
    [/rouge|red/, "#dc2626"],
    [/vert fonce|dark green/, "#14532d"],
    [/vert|green/, "#16a34a"],
    [/gris fonce|anthracite/, "#374151"],
    [/gris|grey|gray/, "#9ca3af"],
    [/rose|pink/, "#ec4899"],
    [/jaune|yellow/, "#facc15"],
    [/orange/, "#f97316"],
    [/violet|purple/, "#7c3aed"],
    [/beige|sable/, "#d6c3a5"],
    [/marron|brown/, "#78350f"],
];

export function colorHex(name: string, configured?: string | null): string {
    if (configured && /^#[0-9a-f]{6}$/i.test(configured)) return configured;
    const normalized = normalizeColorName(name);
    return namedColors.find(([pattern]) => pattern.test(normalized))?.[1] || "#64748b";
}
