import { fetchApi } from "./client";

export type NotificationType = "exam" | "alert" | "grade" | "system";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: async (type?: string): Promise<Notification[]> => {
    const qs = type && type !== "all" ? `?type=${encodeURIComponent(type)}` : "";
    return fetchApi<Notification[]>(`/notifications${qs}`, { method: "GET" });
  },

  markRead: async (id: string): Promise<Notification> => {
    return fetchApi<Notification>(`/notifications/${id}/read`, { method: "PATCH" });
  },

  markAllRead: async (): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>("/notifications/read-all", { method: "PATCH" });
  },

  remove: async (id: string): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>(`/notifications/${id}`, { method: "DELETE" });
  },
};
