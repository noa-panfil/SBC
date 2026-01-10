import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";

const handler = NextAuth({
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
                    const [rows] = await pool.query<RowDataPacket[]>(
                        "SELECT * FROM admins WHERE email = ?",
                        [credentials.email]
                    );

                    if (!rows || rows.length === 0) return null;

                    const user = rows[0];
                    const isValid = await bcrypt.compare(credentials.password, user.password_hash);

                    if (isValid) {
                        return { id: user.id.toString(), email: user.email };
                    }
                    return null;
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            }
        })
    ],
    pages: {
        signIn: '/admin/login',
    },
    secret: process.env.NEXTAUTH_SECRET || "sbc-secret-key-change-me",
});

export { handler as GET, handler as POST };
