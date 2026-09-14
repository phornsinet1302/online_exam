import { fetchApi } from "./client";

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

export const gradingApi = {
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
