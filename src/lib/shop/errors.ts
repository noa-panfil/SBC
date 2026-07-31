export function isMissingShopTable(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    if (!("code" in error)) return false;
    return ["ER_NO_SUCH_TABLE", "ER_BAD_DB_ERROR"].includes((error as { code?: string }).code || "");
}

export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Erreur inconnue";
}
