import { createHmac } from "crypto";
import { RowDataPacket } from "mysql2";
import pool from "./db";

const CHECKOUT_WINDOW_MINUTES = 10;
const CHECKOUT_MAX_ATTEMPTS = 8;

type RateLimitRow = RowDataPacket & {
    request_count: number;
    retry_after_seconds: number;
};

function clientAddress(request: Request): string {
    // En production, Nginx doit écraser cet en-tête avec $remote_addr.
    // Les en-têtes transférés fournis directement par le client ne sont pas utilisés.
    const realIp = request.headers.get("x-real-ip")?.trim();
    return realIp || "unknown";
}

export async function consumeCheckoutRateLimit(
    request: Request,
    secret: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
    // L'adresse n'est jamais stockée en clair. Le HMAC empêche aussi de retrouver
    // facilement une IPv4 à partir d'une fuite de la table de limitation.
    const keyHash = createHmac("sha256", secret)
        .update(`checkout:${clientAddress(request)}`)
        .digest();

    await pool.query(
        `INSERT INTO shop_checkout_rate_limits (key_hash, window_started_at, request_count)
         VALUES (?, NOW(), 1)
         ON DUPLICATE KEY UPDATE
            request_count = IF(
                window_started_at <= DATE_SUB(NOW(), INTERVAL ${CHECKOUT_WINDOW_MINUTES} MINUTE),
                1,
                request_count + 1
            ),
            window_started_at = IF(
                window_started_at <= DATE_SUB(NOW(), INTERVAL ${CHECKOUT_WINDOW_MINUTES} MINUTE),
                NOW(),
                window_started_at
            ),
            updated_at = NOW()`,
        [keyHash]
    );

    const [rows] = await pool.query<RateLimitRow[]>(
        `SELECT request_count,
                GREATEST(1, ${CHECKOUT_WINDOW_MINUTES * 60} - TIMESTAMPDIFF(SECOND, window_started_at, NOW()))
                    AS retry_after_seconds
         FROM shop_checkout_rate_limits WHERE key_hash = ?`,
        [keyHash]
    );
    const current = rows[0];
    if (!current) throw new Error("Checkout rate limit row missing");

    // Nettoyage opportuniste et borné des anciennes fenêtres.
    if (Math.random() < 0.02) {
        await pool.query(
            "DELETE FROM shop_checkout_rate_limits WHERE updated_at < DATE_SUB(NOW(), INTERVAL 2 DAY) LIMIT 100"
        ).catch(() => undefined);
    }

    return {
        allowed: Number(current.request_count) <= CHECKOUT_MAX_ATTEMPTS,
        retryAfterSeconds: Number(current.retry_after_seconds),
    };
}
