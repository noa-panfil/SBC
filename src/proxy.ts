import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

type MaintenanceSettingRow = RowDataPacket & {
    value: string;
};

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const isAdminAccess = pathname === "/admin" || pathname.startsWith("/admin/");
    const isLoginAccess = pathname === "/login";
    const isMaintenancePage = pathname === "/maintenance";

    if (isAdminAccess || isLoginAccess || isMaintenancePage) {
        return NextResponse.next();
    }

    try {
        const [rows] = await pool.query<MaintenanceSettingRow[]>(
            "SELECT value FROM settings WHERE key_name = 'maintenance_mode' LIMIT 1"
        );

        if (rows[0]?.value === "true") {
            return NextResponse.redirect(new URL("/maintenance", request.url));
        }
    } catch (error) {
        // En cas d'indisponibilité de la base, le site reste accessible.
        console.error("Impossible de vérifier le mode maintenance :", error);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next|.*\\..*).*)",
    ],
};
