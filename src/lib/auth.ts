import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";

function requireNextAuthSecret(): string {
    const secret = process.env.NEXTAUTH_SECRET?.trim();
    const normalized = secret?.toLowerCase().replace(/[^a-z]/g, "") || "";
    if (!secret || secret.length < 32 || normalized.includes("changeme")) {
        throw new Error("NEXTAUTH_SECRET doit contenir un secret aléatoire d'au moins 32 caractères.");
    }
    return secret;
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const [adminRows] = await pool.query<RowDataPacket[]>(
                        "SELECT * FROM admins WHERE email = ?",
                        [credentials.email]
                    );

                    if (adminRows && adminRows.length > 0) {
                        const user = adminRows[0];
                        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
                        if (isValid) {
                            return { id: user.id.toString(), email: user.email, role: 'admin' };
                        }
                    }

                    return null;
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                if (token.role) session.user.role = token.role;
                if (token.id) session.user.id = token.id;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    secret: requireNextAuthSecret(),
};
