import { create } from "zustand";
import { authService } from "@/lib/services/auth.service";
import { useKeyStore } from "@/features/auth/key-store";
import { logger } from "@/lib/logger";

type AuthUser = { userId: string; email: string };

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
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
      if (user) {
        await fetch("/api/auth/sync", { method: "POST" }).catch(() => {});
        void useKeyStore.getState().initializeKey();
      }
    } catch (error) {
      logger.error("Failed to hydrate auth session", error);
      set({ error: "Failed to read session", loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await authService.login(email, password);
      set({ loading: false });
      // Sync user to app DB (must complete before data operations)
      await fetch("/api/auth/sync", { method: "POST" }).catch(() => {});
      void authService
        .getCurrentUser()
        .then((user) => set({ user }))
        .catch((error) => logger.error("Failed to hydrate auth session after login", error));
      // Initialize E2E encryption key (server-derived, no password needed)
      void useKeyStore.getState().initializeKey().catch((error) =>
        logger.error("Failed to initialize encryption key", error),
      );
      return true;
    } catch (error) {
      logger.error("Login failed", error);
      set({ error: error instanceof Error ? error.message : "Login failed", loading: false });
      return false;
    }
  },

  register: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      await authService.register(email, password, name);
      set({ loading: false });
      return true;
    } catch (error) {
      logger.error("Registration failed", error);
      set({ error: error instanceof Error ? error.message : "Registration failed", loading: false });
      return false;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      useKeyStore.getState().clearKey();
      await authService.logout();
      set({ user: null, loading: false });
    } catch (error) {
      logger.error("Logout failed", error);
      set({ error: "Logout failed", loading: false });
    }
  },
}));
