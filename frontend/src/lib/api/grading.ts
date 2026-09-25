import { fetchApi, API_URL } from "./client";

export interface StudentAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  question?: any; // Added for ManualGrading
  textAnswer?: string;
  fileUrl?: string;
  score?: number;
  feedback?: string;
  status: "auto_graded" | "needs_review" | "manual_graded";
  createdAt: string;
  updatedAt: string;
  attempt?: {
    id: string;
    studentId: string;
    submittedAt: string;
  };
}

export interface GradeAnswerRow {
  answerId: string;
  questionId: string;
  number: number;
  text: string;
  type: string;
  score: number | null;
  maxScore: number;
  status: "auto_graded" | "needs_review" | "graded";
  feedback: string | null;
  studentAnswer: string;
  // null when a person has to judge it (essay / short answer / file upload)
  correctAnswer: string | null;
}

export interface GradeAttemptRow {
  attemptId: string;
  attemptNumber: number;
  studentName: string;
  studentRoll: string | null;
  studentEmail: string | null;
  submittedAt: string | null;
  timeTakenMinutes: number | null;
  score: number;
  totalScore: number;
  maxScore: number;
  grade: string | null; // null while manual grading is pending
  passed: boolean | null;
  gradingStatus: "graded" | "needs_review";
  needsReviewCount: number;
  autoSubmitted: boolean;
  answers: GradeAnswerRow[];
}

export interface ExamGrades {
  exam: { id: string; title: string; passingScore: number | null; questionCount: number };
  summary: { totalAttempts: number; graded: number; needsReview: number; average: number; highest: number; lowest: number; passRate: number };
  attempts: GradeAttemptRow[];
}

export type GradeExportFormat = "csv" | "excel" | "pdf";
export type GradeExportField = "name" | "score" | "grade" | "breakdown" | "time" | "attempt" | "submitted";

export const gradingApi = {
  getExamGrades: (examId: string) => fetchApi<ExamGrades>(`/exams/${examId}/grades`),

  // Binary download — bypasses fetchApi, which always parses the body as JSON.
  exportGrades: async (examId: string, format: GradeExportFormat, fields: GradeExportField[]): Promise<void> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`${API_URL}/exams/${examId}/grades/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ format, fields }),
    });
    if (!res.ok) {
      let message = "Export failed. Please try again.";
      try { const body = await res.json(); message = body.error || body.message || message; } catch { /* non-JSON error body */ }
      throw new Error(message);
    }
    const blob = await res.blob();
    const filenameMatch = res.headers.get("Content-Disposition")?.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch?.[1] || `grades.${format === "excel" ? "xlsx" : format}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  getPendingReviews: (examId: string, all: boolean = false) =>
    fetchApi<StudentAnswer[]>(`/exams/${examId}/attempts/pending-review${all ? '?all=true' : ''}`),

  gradeStudentAnswer: (answerId: string, score: number, feedback?: string) =>
    fetchApi<StudentAnswer>(`/student-answers/${answerId}/grade`, {
      method: "PUT",
      body: JSON.stringify({ score, feedback }),
    }),

  batchGradeAnswers: (grades: { answerId: string; score: number; feedback?: string }[]) =>
    fetchApi<{ count: number }>(`/student-answers/batch-grade`, {
      method: "POST",
      body: JSON.stringify({ grades }),
    }),

  regradeAttempt: (examId: string, attemptId: string) =>
    fetchApi(`/exams/${examId}/attempts/${attemptId}/regrade`, {
      method: "POST",
    }),
};
