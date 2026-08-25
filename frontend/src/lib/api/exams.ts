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
  uniqueCode: string | null;
  sections?: any[];
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
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return fetchApi<void>(`/exams/${id}`, { method: "DELETE" });
  },
  
  publish: async (id: string): Promise<Exam> => {
    return fetchApi<Exam>(`/exams/${id}/publish`, { method: "PATCH" });
  }
};
