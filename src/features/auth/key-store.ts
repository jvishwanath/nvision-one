import { create } from "zustand";
import {
  generateMasterKey,
  wrapMasterKey,
  unwrapMasterKey,
} from "@/lib/crypto";
import type { WrappedKeyBundle } from "@/lib/crypto";
import { logger } from "@/lib/logger";

interface KeyState {
  masterKey: CryptoKey | null;
  ready: boolean;
  initializeKey: () => Promise<void>;
  clearKey: () => void;
}

async function fetchDerivedKey(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/derive-key");
    if (!res.ok) return null;
    const data = await res.json();
    return data.derivedKey ?? null;
  } catch {
    return null;
  }
}

async function fetchKeyBundle(): Promise<WrappedKeyBundle | null> {
  try {
    const res = await fetch("/api/auth/keys");
    if (!res.ok) return null;
    const data = await res.json();
    if (data.wrappedKey && data.salt && data.iv) {
      return data as WrappedKeyBundle;
    }
    return null;
  } catch {
    return null;
  }
}

async function saveKeyBundle(bundle: WrappedKeyBundle): Promise<void> {
  const res = await fetch("/api/auth/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bundle),
  });
  if (!res.ok) {
    throw new Error("Failed to save encryption key bundle");
  }
}

export const useKeyStore = create<KeyState>((set) => ({
  masterKey: null,
  ready: false,

  initializeKey: async () => {
    try {
      const derivedKey = await fetchDerivedKey();
      if (!derivedKey) {
        logger.error("No derived key from server");
        set({ masterKey: null, ready: true });
        return;
      }

      const existing = await fetchKeyBundle();
      if (existing) {
        const masterKey = await unwrapMasterKey(existing, derivedKey);
        set({ masterKey, ready: true });
        return;
      }

      const masterKey = await generateMasterKey();
      const bundle = await wrapMasterKey(masterKey, derivedKey);
      await saveKeyBundle(bundle);
      set({ masterKey, ready: true });
    } catch (error) {
      logger.error("Failed to initialize encryption key", error);
      set({ masterKey: null, ready: true });
    }
  },

  clearKey: () => {
    set({ masterKey: null, ready: false });
  },
}));
