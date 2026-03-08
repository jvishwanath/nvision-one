"use client";

import { useEffect, useRef } from "react";
import {
  isNotificationSupported,
  requestNotificationPermission,
  hasAskedPermission,
  markPermissionAsked,
  checkAndNotify,
} from "@/lib/notifications";
import { useKeyStore } from "@/features/auth/key-store";
import { useAuthStore } from "@/features/auth/store";
import { taskRepository } from "@/features/tasks/repository";
import { travelRepository } from "@/features/travel/repository";
import { decryptTaskFields, decryptTripFields, decryptArray } from "@/lib/crypto/entity-crypto";
import { logger } from "@/lib/logger";

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export function useNotifications() {
  const keyReady = useKeyStore((s) => s.ready);
  const user = useAuthStore((s) => s.user);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user || !keyReady || !isNotificationSupported()) return;

    // Ask for permission once per session
    if (!hasAskedPermission()) {
      markPermissionAsked();
      void requestNotificationPermission();
    }

    async function runCheck() {
      try {
        const [rawTasks, rawTrips] = await Promise.all([
          taskRepository.getAll(),
          travelRepository.getAllTrips(),
        ]);
        const tasks = await decryptArray(rawTasks, decryptTaskFields);
        const trips = await decryptArray(rawTrips, decryptTripFields);
        checkAndNotify(tasks, trips);
      } catch (err) {
        logger.error("Notification check failed", err);
      }
    }

    // Initial check
    void runCheck();

    // Periodic check
    intervalRef.current = setInterval(() => {
      void runCheck();
    }, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, keyReady]);
}
