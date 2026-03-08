import { createClient } from "@/lib/supabase/client";

export interface IAuthService {
    login(email: string, password: string): Promise<{ userId: string; token: string }>;
    register(email: string, password: string, name: string): Promise<{ userId: string }>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<{ userId: string; email: string } | null>;
    forgotPassword(email: string, redirectTo: string): Promise<void>;
    updatePassword(newPassword: string): Promise<void>;
}

export class SupabaseAuthService implements IAuthService {
    async login(email: string, password: string) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            if (error.message.includes("Invalid login")) {
                throw new Error("Invalid email or password. Please try again.");
            }
            throw new Error(error.message);
        }

        if (!data.user) {
            throw new Error("Login failed. Please try again.");
        }

        return { userId: data.user.id, token: data.session?.access_token ?? "session" };
    }

    async register(email: string, password: string, name: string) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });

        if (error) {
            if (error.message.includes("already registered")) {
                throw new Error("Email already registered.");
            }
            throw new Error(error.message);
        }

        if (!data.user) {
            throw new Error("Registration failed. Please try again.");
        }

        return { userId: data.user.id };
    }

    async logout() {
        const supabase = createClient();
        await supabase.auth.signOut();
    }

    async forgotPassword(email: string, redirectTo: string) {
        const supabase = createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });
        if (error) {
            throw new Error(error.message);
        }
    }

    async updatePassword(newPassword: string) {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            throw new Error(error.message);
        }
    }

    async getCurrentUser() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id || !user.email) {
            return null;
        }

        return {
            userId: user.id,
            email: user.email,
        };
    }
}

export const authService: IAuthService = new SupabaseAuthService();
