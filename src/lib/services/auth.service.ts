import { getSession, signIn, signOut } from "next-auth/react";

export interface IAuthService {
    login(email: string, password: string): Promise<{ userId: string; token: string }>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<{ userId: string; email: string } | null>;
}

export class NextAuthService implements IAuthService {
    async login(email: string, password: string) {
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (!result || result.error) {
            const errorCode = result?.error ?? "";
            if (errorCode === "CredentialsSignin") {
                throw new Error("Invalid email or password. Please try again.");
            }
            throw new Error("Login failed. Please try again.");
        }

        const user = await this.getCurrentUser();
        if (!user) {
            throw new Error("Unable to resolve current user session");
        }

        return { userId: user.userId, token: "session" };
    }

    async logout() {
        await signOut({ redirect: false });
    }

    async getCurrentUser() {
        const session = await getSession();
        const user = session?.user;
        if (!user?.id || !user.email) {
            return null;
        }

        return {
            userId: user.id,
            email: user.email,
        };
    }
}

export const authService: IAuthService = new NextAuthService();
