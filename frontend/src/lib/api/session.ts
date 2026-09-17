import { fetchApi } from "./client";

export async function joinByCode(code: string) {
  return fetchApi<any>("/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function registerStudent(examId: string, name: string, studentId: string, email: string) {
  return fetchApi<any>("/join/register", {
    method: "POST",
    body: JSON.stringify({ examId, name, studentId, email }),
  });
}

export async function validateAttempt(attemptId: string, examId: string) {
  return fetchApi<{ valid: boolean; reason?: string; attemptId?: string }>("/join/validate", {
    method: "POST",
    body: JSON.stringify({ attemptId, examId }),
  });
}

export async function getSessionState(examId: string) {
  return fetchApi<any>(`/session/${examId}/state`, {
    method: "GET",
  });
}

export async function startExamSession(examId: string) {
  return fetchApi<any>(`/session/${examId}/start`, {
    method: "POST",
  });
}

export async function endExamSession(examId: string) {
  return fetchApi<any>(`/session/${examId}/end`, {
    method: "POST",
  });
}

export async function getExamState() {
  return fetchApi<any>("/exam/state", {
    method: "GET",
  });
}

export async function autosaveAnswers(attemptId: string, answers: Record<string, { answer: unknown }>) {
  return fetchApi<any>("/exam/autosave", {
    method: "POST",
    body: JSON.stringify({ attemptId, answers }),
  });
}

export async function submitExam(attemptId: string, answers: Record<string, any>) {
  return fetchApi<any>("/exam/submit", {
    method: "POST",
    body: JSON.stringify({ attemptId, answers }),
  });
}

export async function approveLateEntry(examId: string, attemptId: string) {
  return fetchApi<any>(`/session/${examId}/approve/${attemptId}`, { method: "POST" });
}

export async function rejectLateEntry(examId: string, attemptId: string) {
  return fetchApi<any>(`/session/${examId}/reject/${attemptId}`, { method: "POST" });
}

export async function reportViolation(attemptId: string, payload: { eventType: string; count?: number; action?: string; detail?: string; batchCount?: number }) {
  return fetchApi<any>(`/attempts/${attemptId}/violations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
