import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'volunteer') {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Tous les champs sont obligatoires" }, { status: 400 });
        }

        // Récupérer le mot de passe actuel en base
        const [rows]: any = await pool.query('SELECT password FROM login_volunteers WHERE email = ?', [session.user.email]);
        
        if (rows.length === 0) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour en base
        await pool.query('UPDATE login_volunteers SET password = ? WHERE email = ?', [hashedPassword, session.user.email]);

        return NextResponse.json({ success: true, message: "Mot de passe mis à jour avec succès" });
    } catch (error: any) {
        console.error("Erreur changement de mot de passe bénévole:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
