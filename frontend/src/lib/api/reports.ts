import { fetchApi } from "./client";

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

export const reportsApi = {
  getAnalytics: async (): Promise<DashboardAnalytics> => {
    return fetchApi<DashboardAnalytics>("/reports/analytics");
  }
};
