export type ContactKind = "contact" | "partnership";

export type ContactPayload = {
    kind: ContactKind;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    organization: string | null;
    message: string;
};

function text(value: unknown, maxLength: number): string | null {
    if (typeof value !== "string") return null;
    const cleaned = value.trim().replace(/\r\n/g, "\n");
    return cleaned.length > 0 && cleaned.length <= maxLength ? cleaned : null;
}

export function parseContactPayload(value: unknown): ContactPayload | null {
    if (!value || typeof value !== "object") return null;
    const body = value as Record<string, unknown>;
    if (body.kind !== "contact" && body.kind !== "partnership") return null;
    const firstName = text(body.firstName, 100);
    const lastName = text(body.lastName, 100);
    const email = text(body.email, 254)?.toLowerCase() || null;
    const phone = body.phone === "" || body.phone == null ? null : text(body.phone, 40);
    const organization = body.organization === "" || body.organization == null ? null : text(body.organization, 160);
    const message = text(body.message, 5000);
    if (!firstName || !lastName || !email || !message || message.length < 10 || body.consent !== true) return null;
    if (!/^\S+@\S+\.\S+$/.test(email)) return null;
    if (phone && !/^[0-9+().\s-]{6,40}$/.test(phone)) return null;
    return { kind: body.kind, firstName, lastName, email, phone, organization, message };
}

export function parseContactId(value: unknown): number | null {
    const id = typeof value === "string" ? Number(value) : value;
    return typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? id : null;
}
