import { fetchApi } from "./client";

export type RuleAction = "ignore" | "warn" | "flag" | "block" | "auto_submit";
export type Severity = "info" | "warn" | "critical";

export interface AntiCheatRule {
  eventType: string;
  enabled: boolean;
  action: RuleAction;
  threshold: number | null;
  severity: Severity;
}

export interface RuleUpdate {
  eventType: string;
  enabled: boolean;
  action: RuleAction;
  threshold?: number | null;
}

export const antiCheatApi = {
  getRules: async (examId: string): Promise<AntiCheatRule[]> => {
    return fetchApi<AntiCheatRule[]>(`/exams/${examId}/anti-cheat/rules`, { method: "GET" });
  },

  updateRules: async (examId: string, rules: RuleUpdate[]): Promise<AntiCheatRule[]> => {
    return fetchApi<AntiCheatRule[]>(`/exams/${examId}/anti-cheat/rules`, {
      method: "PUT",
      body: JSON.stringify({ rules }),
    });
  },
};
