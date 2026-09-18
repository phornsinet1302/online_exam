import { fetchApi, API_URL } from "./client";

export interface ViolationLog {
  id: string;
  attemptId: string;
  examId: string;
  examTitle: string;
  eventType: string;
  detail: string | null;
  severity: string; // "info" | "warn" | "critical"
  actionTaken: string | null; // "ignored" | "warned" | "flagged" | "blocked" | "auto_submitted"
  occurrenceCount: number;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  studentId: string | null;
  studentName: string;
  studentEmail: string;
}

export interface ViolationExamOption {
  id: string;
  title: string;
}

export interface ViolationListResult {
  total: number;
  page: number;
  pageSize: number;
  logs: ViolationLog[];
  exams: ViolationExamOption[];
}

export interface ViolationFilters {
  examId?: string;
  severity?: string;
  eventType?: string;
  resolved?: boolean;
  page?: number;
  pageSize?: number;
}

function toQuery(filters: ViolationFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.examId) params.set("examId", filters.examId);
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.eventType) params.set("eventType", filters.eventType);
  if (filters.resolved !== undefined) params.set("resolved", String(filters.resolved));
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const violationsApi = {
  // Across every exam the teacher owns — powers the Security Logs page.
  list: async (filters: ViolationFilters = {}): Promise<ViolationListResult> => {
    return fetchApi<ViolationListResult>(`/violations${toQuery(filters)}`, { method: "GET" });
  },

  resolve: async (id: string): Promise<ViolationLog> => {
    return fetchApi<ViolationLog>(`/violations/${id}/resolve`, { method: "PATCH" });
  },

  // Binary download — bypasses fetchApi since that always parses as JSON.
  exportCsv: async (filters: ViolationFilters = {}): Promise<void> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`${API_URL}/violations/export${toQuery(filters)}`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let message = "Export failed. Please try again.";
      try { const body = await res.json(); message = body.message || body.error || message; } catch { /* non-JSON error body */ }
      throw new Error(message);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "security-logs.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
