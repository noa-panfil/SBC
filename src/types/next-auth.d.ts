import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: DefaultSession["user"] & {
            id: string;
            role: "admin" | "coach" | "volunteer";
            personId?: number;
            volunteerId?: number;
        };
    }

    interface User extends DefaultUser {
        role: "admin" | "coach" | "volunteer";
        personId?: number;
        volunteerId?: number;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role?: "admin" | "coach" | "volunteer";
        personId?: number;
        volunteerId?: number;
    }
}
