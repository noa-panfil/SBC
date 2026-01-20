import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    const session: any = await getServerSession(authOptions);

    if (!session || session.user.role !== 'coach') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "Le nouveau mot de passe doit faire au moins 6 caractères" }, { status: 400 });
        }

        // 1. Fetch current user from DB to verify old password
        const [rows]: any = await pool.query('SELECT password FROM login_coachs WHERE id = ?', [session.user.id]);

        if (rows.length === 0) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ error: "L'ancien mot de passe est incorrect" }, { status: 400 });
        }

        // 2. Hash and update
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE login_coachs SET password = ? WHERE id = ?', [hashedPassword, session.user.id]);

        return NextResponse.json({ success: true, message: "Mot de passe mis à jour avec succès" });
    } catch (error: any) {
        console.error("Error changing coach password:", error);
        return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
    }
}
