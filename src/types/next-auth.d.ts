import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: DefaultSession["user"] & {
            id: string;
            role: "admin";
        };
    }

    interface User extends DefaultUser {
        role: "admin";
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role?: "admin";
    }
}
