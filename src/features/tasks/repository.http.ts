import { apiClient } from "@/lib/api-client";
import type { CreateTaskInput, Task } from "./types";

export const taskHttpRepository = {
  getAll: () => apiClient<Task[]>("/api/tasks"),
  getById: (id: string) => apiClient<Task>(`/api/tasks/${id}`),
  create: (input: CreateTaskInput) =>
    apiClient<Task>("/api/tasks", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, changes: Partial<Task>) =>
    apiClient<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(changes) }),
  remove: (id: string) => apiClient<void>(`/api/tasks/${id}`, { method: "DELETE" }),
  toggleComplete: (id: string) => apiClient<Task>(`/api/tasks/${id}/toggle`, { method: "PATCH" }),
  async getByPriority(priority: Task["priority"]): Promise<Task[]> {
    const tasks = await this.getAll();
    return tasks.filter((task) => task.priority === priority);
  },
  count: async () => (await taskHttpRepository.getAll()).length,
  countCompleted: async () => (await taskHttpRepository.getAll()).filter((task) => task.completed).length,
};
