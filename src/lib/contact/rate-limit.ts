import { createHmac } from "crypto";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

const WINDOW_MINUTES = 10;
const MAX_ATTEMPTS = 5;

type RateLimitRow = RowDataPacket & { request_count: number; retry_after_seconds: number };

export async function consumeContactRateLimit(request: Request) {
    const secret = process.env.NEXTAUTH_SECRET?.trim();
    if (!secret) throw new Error("NEXTAUTH_SECRET manquant pour la limitation du formulaire contact.");
    // Le proxy de production doit remplacer x-real-ip par l'adresse réellement observée.
    const address = request.headers.get("x-real-ip")?.trim()
        || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || "unknown";
    const keyHash = createHmac("sha256", secret).update(`contact:${address}`).digest();

    await pool.query(
        `INSERT INTO contact_rate_limits (key_hash, window_started_at, request_count)
         VALUES (?, NOW(), 1)
         ON DUPLICATE KEY UPDATE
            request_count = IF(window_started_at <= DATE_SUB(NOW(), INTERVAL ${WINDOW_MINUTES} MINUTE), 1, request_count + 1),
            window_started_at = IF(window_started_at <= DATE_SUB(NOW(), INTERVAL ${WINDOW_MINUTES} MINUTE), NOW(), window_started_at),
            updated_at = NOW()`,
        [keyHash]
    );
    const [rows] = await pool.query<RateLimitRow[]>(
        `SELECT request_count,
                GREATEST(1, ${WINDOW_MINUTES * 60} - TIMESTAMPDIFF(SECOND, window_started_at, NOW())) AS retry_after_seconds
         FROM contact_rate_limits WHERE key_hash = ?`,
        [keyHash]
    );
    const current = rows[0];
    if (!current) throw new Error("Contact rate limit row missing");
    if (Math.random() < 0.02) {
        await pool.query("DELETE FROM contact_rate_limits WHERE updated_at < DATE_SUB(NOW(), INTERVAL 2 DAY) LIMIT 100").catch(() => undefined);
    }
    return { allowed: Number(current.request_count) <= MAX_ATTEMPTS, retryAfterSeconds: Number(current.retry_after_seconds) };
}
