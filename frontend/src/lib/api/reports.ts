import { fetchApi, API_URL } from "./client";

export interface DashboardAnalytics {
  primaryStats: {
    totalExams: number;
    activeStudents: number;
    passRate: number;
    avgScore: number;
  };
  examStatus: {
    ongoing: number;
    upcoming: number;
    completed: number;
    review: number;
  };
  recentExams: Array<{
    id: string;
    title: string;
    subject: string;
    date: string;
    students: number;
    avgScore: number;
    passRate: number;
    status: string;
  }>;
  chartData: {
    scoreTrend: Array<{ month: string; avg: number; pass: number }>;
    subjectPerformance: Array<{ subject: string; avg: number; pass: number }>;
    passFailDistribution: Array<{ name: string; value: number }>;
    participationTrend: Array<{ month: string; rate: number }>;
    difficultyAnalysis: Array<{ level: string; pass: number; fail: number }>;
  };
}

export interface AntiCheatingSummary {
  totalExams: number;
  totalFlags: number;
  criticalFlags: number;
  autoSubmitted: number;
  resolved: number;
}

export interface AntiCheatEventCount {
  type: string;
  count: number;
}

export interface AntiCheatExamRow {
  examId: string;
  examTitle: string;
  date: string | null;
  students: number;
  autoSubmitted: number;
  totalFlags: number;
  criticalFlags: number;
  resolvedFlags: number;
  events: AntiCheatEventCount[];
}

export interface AttendanceExamRow {
  examId: string;
  examTitle: string;
  subject: string | null;
  date: string | null;
  // null until a roster has been uploaded for this exam (Exam detail → Roster tab)
  enrolled: number | null;
  joined: number;
  absent: number | null;
  submitted: number;
  notSubmitted: number;
  autoSubmitted: number;
  lateStart: number;
  attendanceRate: number;
}

export interface AttendanceSummary {
  totalExams: number;
  totalJoined: number;
  totalSubmitted: number;
  avgAttendance: number;
  submissionRate: number;
  // null when no exam in scope has a roster uploaded yet
  totalEnrolled: number | null;
  totalAbsent: number | null;
}

export interface ScoreExamResult {
  examId: string;
  examTitle: string;
  score: number;
  submittedAt: string;
  passed: boolean | null;
}

export interface ScoreStudent {
  studentId: string | null; // roll number, if the student entered one
  name: string;
  email: string;
  latestScore: number;
  examsAttempted: number;
  scores: ScoreExamResult[];
  highestScore: number;
  lowestScore: number;
  passed: number;
  failed: number;
  averageScore: number;
  rank: number;
}

export interface ScoresSummary {
  totalStudents: number;
  totalAttempts: number;
  classAverage: number;
  passRate: number;
  highestScore: number;
  lowestScore: number;
}

export interface QuestionAnalyticsItem {
  questionId: string;
  examId: string;
  examTitle: string;
  order: number;
  questionText: string;
  type: string; // QuestionType enum: MCQ, TRUE_FALSE, SHORT_ANSWER, ESSAY, ...
  difficulty: string; // EASY | MEDIUM | HARD | MIXED
  points: number;
  totalAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  correctRate: number;
  avgScore: number;
  discriminationIndex: number | null;
  flagged: boolean;
}

export interface QuestionAnalysisSummary {
  totalQuestions: number;
  avgCorrectRate: number;
  flaggedCount: number;
  hardestQuestion: QuestionAnalyticsItem | null;
  easiestQuestion: QuestionAnalyticsItem | null;
}

export type ReportExportType = "SCORES" | "ATTENDANCE" | "ANTI_CHEATING" | "QUESTION_ANALYSIS" | "EXAM";
export type ReportExportFormat = "pdf" | "excel" | "csv";

export const reportsApi = {
  getAnalytics: async (): Promise<DashboardAnalytics> => {
    return fetchApi<DashboardAnalytics>("/reports/analytics");
  },
  getScores: async (examId?: string): Promise<{ summary: ScoresSummary; students: ScoreStudent[] }> => {
    return fetchApi<{ summary: ScoresSummary; students: ScoreStudent[] }>(`/reports/scores${examId ? `?examId=${examId}` : ''}`);
  },
  getQuestions: async (examId?: string): Promise<{ summary: QuestionAnalysisSummary; questions: QuestionAnalyticsItem[] }> => {
    return fetchApi<{ summary: QuestionAnalysisSummary; questions: QuestionAnalyticsItem[] }>(`/reports/questions${examId ? `?examId=${examId}` : ''}`);
  },
  getAntiCheating: async (examId?: string): Promise<{ summary: AntiCheatingSummary; exams: AntiCheatExamRow[] }> => {
    return fetchApi<{ summary: AntiCheatingSummary; exams: AntiCheatExamRow[] }>(`/reports/anti-cheating${examId ? `?examId=${examId}` : ''}`);
  },
  getAttendance: async (examId?: string): Promise<{ summary: AttendanceSummary; exams: AttendanceExamRow[] }> => {
    return fetchApi<{ summary: AttendanceSummary; exams: AttendanceExamRow[] }>(`/reports/attendance${examId ? `?examId=${examId}` : ''}`);
  },

  // Binary download — bypasses fetchApi since that always parses the body as
  // JSON, which would choke on a PDF/XLSX/CSV response.
  // `filters` only applies to type "EXAM" (the Export tab's sidebar filters).
  export: async (
    type: ReportExportType,
    format: ReportExportFormat,
    examId?: string,
    filters?: { status?: string; subjects?: string[]; dateFrom?: string; dateTo?: string }
  ): Promise<void> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`${API_URL}/export/${format}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ type, examId, filters }),
    });
    if (!res.ok) {
      let message = "Export failed. Please try again.";
      try { message = (await res.json()).message || message; } catch { /* non-JSON error body */ }
      throw new Error(message);
    }
    const blob = await res.blob();
    const filenameMatch = res.headers.get("Content-Disposition")?.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch?.[1] || `report.${format === "excel" ? "xlsx" : format}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
