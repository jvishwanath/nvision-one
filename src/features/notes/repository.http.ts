import { apiClient } from "@/lib/api-client";
import type { CreateNoteInput, Note } from "./types";

export const noteHttpRepository = {
  getAll: () => apiClient<Note[]>("/api/notes"),
  getById: (id: string) => apiClient<Note>(`/api/notes/${id}`),
  create: (input: CreateNoteInput) =>
    apiClient<Note>("/api/notes", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, changes: Partial<Note>) =>
    apiClient<Note>(`/api/notes/${id}`, { method: "PATCH", body: JSON.stringify(changes) }),
  remove: (id: string) => apiClient<void>(`/api/notes/${id}`, { method: "DELETE" }),
  search: (query: string) => apiClient<Note[]>(`/api/notes/search?q=${encodeURIComponent(query)}`),
  count: async () => (await noteHttpRepository.getAll()).length,
};
