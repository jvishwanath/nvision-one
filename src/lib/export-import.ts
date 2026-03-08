import { apiClient } from "@/lib/api-client";
import type { Note } from "@/features/notes/types";
import type { Task } from "@/features/tasks/types";
import type { Trip, ItineraryItem } from "@/features/travel/types";
import {
  decryptNoteFields,
  decryptTaskFields,
  decryptTripFields,
  decryptItineraryFields,
  encryptNoteFields,
  encryptTaskFields,
  encryptTripFields,
  encryptItineraryFields,
  decryptArray,
} from "@/lib/crypto/entity-crypto";

export interface ExportBundle {
  version: 1;
  exportedAt: string;
  notes: Note[];
  tasks: Task[];
  trips: Array<Trip & { itinerary: ItineraryItem[] }>;
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? "");
          return val.includes(",") || val.includes('"') || val.includes("\n")
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        })
        .join(","),
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportNotes(): Promise<Note[]> {
  const raw = await apiClient<Note[]>("/api/notes");
  return decryptArray(raw, decryptNoteFields);
}

export async function exportTasks(): Promise<Task[]> {
  const raw = await apiClient<Task[]>("/api/tasks");
  return decryptArray(raw, decryptTaskFields);
}

export async function exportTrips(): Promise<Array<Trip & { itinerary: ItineraryItem[] }>> {
  const rawTrips = await apiClient<Trip[]>("/api/travel/trips");
  const trips = await decryptArray(rawTrips, decryptTripFields);

  const results: Array<Trip & { itinerary: ItineraryItem[] }> = [];
  for (const trip of trips) {
    const rawItinerary = await apiClient<ItineraryItem[]>(
      `/api/travel/trips/${trip.id}/itinerary`,
    );
    const itinerary = await decryptArray(rawItinerary, decryptItineraryFields);
    results.push({ ...trip, itinerary });
  }
  return results;
}

export async function exportAll(): Promise<ExportBundle> {
  const [notes, tasks, trips] = await Promise.all([
    exportNotes(),
    exportTasks(),
    exportTrips(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    notes,
    tasks,
    trips,
  };
}

export function downloadNotesJson(notes: Note[]) {
  downloadJson(notes, `notes-export-${Date.now()}.json`);
}

export function downloadTasksJson(tasks: Task[]) {
  downloadJson(tasks, `tasks-export-${Date.now()}.json`);
}

export function downloadTasksCsv(tasks: Task[]) {
  const rows = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    completed: t.completed,
    dueDate: t.dueDate,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
  downloadCsv(rows, `tasks-export-${Date.now()}.csv`);
}

export function downloadTripsJson(trips: Array<Trip & { itinerary: ItineraryItem[] }>) {
  downloadJson(trips, `trips-export-${Date.now()}.json`);
}

export function downloadAllJson(bundle: ExportBundle) {
  downloadJson(bundle, `lifeos-export-${Date.now()}.json`);
}

export async function importNotes(notes: Array<{ title: string; content: string; tags: string[] }>) {
  for (const note of notes) {
    const encrypted = await encryptNoteFields(note);
    await apiClient("/api/notes", {
      method: "POST",
      body: JSON.stringify({ ...note, title: encrypted.title, content: encrypted.content }),
    });
  }
}

export async function importTasks(
  tasks: Array<{
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string | null;
    completed?: boolean;
    subtasks?: Array<{ id: string; title: string; completed: boolean }>;
  }>,
) {
  for (const task of tasks) {
    const normalized = {
      ...task,
      description: task.description ?? "",
      priority: task.priority ?? "medium",
      dueDate: task.dueDate ?? null,
      completed: task.completed ?? false,
    };
    const encrypted = await encryptTaskFields({ ...normalized, description: normalized.description });
    await apiClient("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ ...normalized, title: encrypted.title, description: encrypted.description }),
    });
  }
}

export async function importTrips(
  trips: Array<{
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    itinerary?: Array<{
      date: string;
      activity: string;
      time: string;
      notes: string;
      tag: string;
    }>;
  }>,
) {
  for (const trip of trips) {
    const encrypted = await encryptTripFields(trip);
    const created = await apiClient<Trip>("/api/travel/trips", {
      method: "POST",
      body: JSON.stringify({ ...trip, name: encrypted.name, destination: encrypted.destination }),
    });

    if (trip.itinerary) {
      for (const item of trip.itinerary) {
        const encItem = await encryptItineraryFields(item);
        await apiClient(`/api/travel/trips/${created.id}/itinerary`, {
          method: "POST",
          body: JSON.stringify({
            ...item,
            tripId: created.id,
            activity: encItem.activity,
            notes: encItem.notes,
          }),
        });
      }
    }
  }
}
