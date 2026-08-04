export type MatchInput = {
    matchDate: string;
    matchTime: string;
    category: string;
    opponent: string;
    location: string;
    matchType: string;
};

function cleanText(value: unknown, max: number): string | null {
    if (typeof value !== "string") return null;
    const result = value.trim();
    return result && result.length <= max ? result : null;
}

export function parseMatch(value: unknown): MatchInput | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const body = value as Record<string, unknown>;
    const matchDate = cleanText(body.match_date, 10);
    const matchTime = cleanText(body.match_time, 5);
    const category = cleanText(body.category, 100);
    const opponent = cleanText(body.opponent, 160);
    const location = cleanText(body.location, 255);
    const matchType = body.match_type == null || body.match_type === ""
        ? "Championnat"
        : cleanText(body.match_type, 100);
    if (!matchDate || !/^\d{4}-\d{2}-\d{2}$/.test(matchDate) ||
        !matchTime || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(matchTime) ||
        !category || !opponent || !location || !matchType) return null;
    return { matchDate, matchTime, category, opponent, location, matchType };
}
