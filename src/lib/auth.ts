import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";

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
                    // 1. Check Admin
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

                    // 2. Check Coach
                    const [coachRows] = await pool.query<RowDataPacket[]>(
                        "SELECT * FROM login_coachs WHERE email = ?",
                        [credentials.email]
                    );

                    if (coachRows && coachRows.length > 0) {
                        const user = coachRows[0];
                        const isValid = await bcrypt.compare(credentials.password, user.password);
                        if (isValid) {
                            return {
                                id: user.id.toString(),
                                email: user.email,
                                name: `${user.firstname} ${user.lastname}`,
                                role: 'coach',
                                personId: user.person_id
                            };
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
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.personId = user.personId;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.personId = token.personId;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET || "sbc-secret-key-change-me",
};
