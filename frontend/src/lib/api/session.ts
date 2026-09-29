import { fetchApi, API_URL } from "./client";

// EventSource can't send an Authorization header, so the teacher live stream
// is authenticated by a signed, exam-scoped token passed in the query string.
export async function getTeacherStreamUrl(examId: string): Promise<string> {
  const { token } = await fetchApi<{ token: string }>(`/session/${examId}/teacher-live-token`, { method: "POST" });
  return `${API_URL}/session/${examId}/teacher-live?token=${encodeURIComponent(token)}`;
}

export async function joinByCode(code: string) {
  return fetchApi<any>("/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

// googleToken: the Google session from the sign-in redirect. The server reads the
// student's verified email and name from it, so the email is never sent directly.
export async function registerStudent(examId: string, name: string, studentId: string, opts: { password?: string; googleToken?: string } = {}) {
  return fetchApi<any>("/join/register", {
    method: "POST",
    body: JSON.stringify({ examId, name, studentId, password: opts.password, googleToken: opts.googleToken }),
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
