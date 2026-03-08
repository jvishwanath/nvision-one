"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/features/auth/store";
import { useNotifications } from "@/lib/hooks/use-notifications";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useNotifications();

  return <>{children}</>;
}
