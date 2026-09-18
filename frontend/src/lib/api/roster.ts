import { fetchApi } from "./client";

export interface RosterEntry {
  id: string;
  examId: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export const rosterApi = {
  get: async (examId: string): Promise<RosterEntry[]> => {
    return fetchApi<RosterEntry[]>(`/exams/${examId}/roster`, { method: "GET" });
  },

  // Replaces the full roster with the given list.
  upload: async (examId: string, entries: { email: string; name?: string }[]): Promise<RosterEntry[]> => {
    return fetchApi<RosterEntry[]>(`/exams/${examId}/roster`, {
      method: "PUT",
      body: JSON.stringify({ entries }),
    });
  },

  remove: async (examId: string, studentId: string): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>(`/exams/${examId}/roster/${studentId}`, { method: "DELETE" });
  },
};
