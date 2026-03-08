"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/features/auth/store";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
