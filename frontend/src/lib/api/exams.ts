import { fetchApi } from "./client";

// Basic types matching backend schema
export interface Exam {
  id: string;
  title: string;
  description: string | null;
  status: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  subject: string | null;
  startDate: string | null;
  endDate: string | null;
  duration: number | null;
  passingScore: number | null;
  maxAttempts: number | null;
  timezone: string | null;
  uniqueCode: string | null;
  sessionState?: string;
  questionsCount?: number;
  studentsCount?: number;
  sections?: any[];
  requireLateApproval?: boolean;
  // Session requirements (anti-cheat) — persisted, not yet enforced by the
  // student exam-taking flow.
  requireCamera?: boolean;
  lockFullscreen?: boolean;
  browserLockdown?: boolean;
  screenshotIntervalSec?: number;
}

export const examsApi = {
  getAll: async (): Promise<Exam[]> => {
    return fetchApi<Exam[]>("/exams", { method: "GET" });
  },

  getById: async (id: string): Promise<Exam> => {
    return fetchApi<Exam>(`/exams/${id}`, { method: "GET" });
  },

  create: async (data: any): Promise<Exam> => {
    return fetchApi<Exam>("/exams", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any): Promise<Exam> => {
    return fetchApi<Exam>(`/exams/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return fetchApi<void>(`/exams/${id}`, { method: "DELETE" });
  },
  
  publish: async (id: string): Promise<Exam> => {
    return fetchApi<Exam>(`/exams/${id}/publish`, { method: "POST" });
  },

  duplicate: async (id: string): Promise<Exam> => {
    return fetchApi<Exam>(`/exams/${id}/duplicate`, { method: "POST" });
  },

  archive: async (id: string): Promise<Exam> => {
    return fetchApi<Exam>(`/exams/${id}/archive`, { method: "POST" });
  }
};
