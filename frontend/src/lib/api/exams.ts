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
  // true = the teacher presses Start; the exam never auto-starts on its schedule
  manualStart?: boolean;
  accessType?: "PUBLIC" | "PRIVATE" | "PASSWORD_PROTECTED";
  // The hashed password never leaves the server — only whether one is set.
  hasPassword?: boolean;
  // True when the teacher set the end date explicitly (vs. derived from start + duration).
  endDateFixed?: boolean;
  randomizeQuestions?: boolean;
  shuffleAnswers?: boolean;
  showResults?: boolean;
  lateAllowanceMinutes?: number;
  // The caller's role on this exam — only present on GET /exams/:id.
  myRole?: "OWNER" | "COLLABORATOR" | "INVIGILATOR";
  // Session requirements (anti-cheat) — persisted, not yet enforced by the
  // student exam-taking flow.
  requireCamera?: boolean;
  lockFullscreen?: boolean;
  browserLockdown?: boolean;
  screenshotIntervalSec?: number;
}

export interface AccessibleExam {
  id: string;
  title: string;
  subject: string | null;
  status: string;
  startDate: string | null;
  sessionState: string;
  studentsCount: number;
  role: "OWNER" | "COLLABORATOR" | "INVIGILATOR";
}

export const examsApi = {
  getAll: async (): Promise<Exam[]> => {
    return fetchApi<Exam[]>("/exams", { method: "GET" });
  },

  // Owned exams + accepted collaborations/invigilations, each tagged with
  // role — used by pickers that need everything a teacher has access to.
  getAccessible: async (): Promise<AccessibleExam[]> => {
    return fetchApi<AccessibleExam[]>("/exams/accessible", { method: "GET" });
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
  },

  // Restores an archived exam to DRAFT (it must be republished on purpose).
  unarchive: async (id: string): Promise<Exam> => {
    return fetchApi<Exam>(`/exams/${id}/unarchive`, { method: "POST" });
  },

  // Gives an ended exam a new session: waiting room open, starting
  // `startsInMinutes` from now (0 to start immediately). 
  // duration (optional) overrides the exam's previous duration.
  // endDate/endTime optionally set a hard close.
  reopen: async (id: string, opts: { startsInMinutes: number; duration?: number; endDate?: string | null; endTime?: string | null }): Promise<Exam> => {
    return fetchApi<Exam>(`/exams/${id}/reopen`, { method: "POST", body: JSON.stringify(opts) });
  }
};
