export interface IAuthService {
    login(email: string, password: string): Promise<{ userId: string; token: string }>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<{ userId: string; email: string } | null>;
}

/** Stub implementation — swap with Supabase / Firebase when ready */
export class MockAuthService implements IAuthService {
    async login(_email: string, _password: string) {
        return { userId: "local-user", token: "mock-token" };
    }

    async logout() {
        /* no-op */
    }

    async getCurrentUser() {
        return { userId: "local-user", email: "user@lifeos.local" };
    }
}

export const authService: IAuthService = new MockAuthService();
