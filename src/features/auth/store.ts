import { create } from "zustand";
import { authService } from "@/lib/services";
import { logger } from "@/lib/logger";

type AuthUser = { userId: string; email: string };

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

  hydrate: async () => {
    set({ loading: true, error: null });
    try {
      const user = await authService.getCurrentUser();
      set({ user, loading: false });
    } catch (error) {
      logger.error("Failed to hydrate auth session", error);
      set({ error: "Failed to read session", loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await authService.login(email, password);
      const user = await authService.getCurrentUser();
      set({ user, loading: false });
      return true;
    } catch (error) {
      logger.error("Login failed", error);
      set({ error: error instanceof Error ? error.message : "Login failed", loading: false });
      return false;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await authService.logout();
      set({ user: null, loading: false });
    } catch (error) {
      logger.error("Logout failed", error);
      set({ error: "Logout failed", loading: false });
    }
  },
}));
