import { logger } from "@/lib/logger";

const NOTIFIED_KEY = "notified_items";
const PERMISSION_ASKED_KEY = "notification_permission_asked";

interface NotifiableItem {
  id: string;
  title: string;
  body: string;
  tag: string;
  url: string;
}

function getNotifiedSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(NOTIFIED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function markNotified(key: string) {
  const set = getNotifiedSet();
  set.add(key);
  try {
    sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]));
  } catch { /* quota */ }
}

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | null {
  if (!isNotificationSupported()) return null;
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

export function hasAskedPermission(): boolean {
  try {
    return sessionStorage.getItem(PERMISSION_ASKED_KEY) === "true";
  } catch {
    return false;
  }
}

export function markPermissionAsked() {
  try {
    sessionStorage.setItem(PERMISSION_ASKED_KEY, "true");
  } catch { /* quota */ }
}

export function sendNotification(item: NotifiableItem) {
  if (Notification.permission !== "granted") return;

  const notifiedSet = getNotifiedSet();
  const dailyKey = `${item.id}_${new Date().toISOString().slice(0, 10)}`;
  if (notifiedSet.has(dailyKey)) return;

  try {
    const notification = new Notification(item.title, {
      body: item.body,
      tag: item.tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: item.url },
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = item.url;
      notification.close();
    };

    markNotified(dailyKey);
    logger.info(`Notification sent: ${item.title}`);
  } catch (err) {
    logger.error("Failed to send notification", err);
  }
}

interface TaskLike {
  id: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
  priority?: string;
}

interface TripLike {
  id: string;
  name: string;
  destination: string;
  startDate: string;
}

export function checkAndNotify(tasks: TaskLike[], trips: TripLike[]) {
  if (Notification.permission !== "granted") return;

  const todayStr = new Date().toISOString().slice(0, 10);

  // Tasks due today or overdue
  for (const task of tasks) {
    if (task.completed || !task.dueDate) continue;

    if (task.dueDate === todayStr) {
      sendNotification({
        id: `task-due-${task.id}`,
        title: "📋 Task Due Today",
        body: task.title,
        tag: `task-${task.id}`,
        url: `/tasks/${task.id}`,
      });
    } else if (task.dueDate < todayStr) {
      sendNotification({
        id: `task-overdue-${task.id}`,
        title: "⚠️ Overdue Task",
        body: `${task.title} was due ${task.dueDate}`,
        tag: `task-${task.id}`,
        url: `/tasks/${task.id}`,
      });
    }
  }

  // Trips starting today
  for (const trip of trips) {
    if (trip.startDate === todayStr) {
      sendNotification({
        id: `trip-today-${trip.id}`,
        title: "✈️ Trip Today!",
        body: `${trip.name} — ${trip.destination}`,
        tag: `trip-${trip.id}`,
        url: "/travel",
      });
    }

    // Trip starting tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    if (trip.startDate === tomorrowStr) {
      sendNotification({
        id: `trip-tomorrow-${trip.id}`,
        title: "✈️ Trip Tomorrow!",
        body: `${trip.name} — ${trip.destination}`,
        tag: `trip-${trip.id}`,
        url: "/travel",
      });
    }
  }
}
