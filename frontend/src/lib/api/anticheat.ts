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

// ── Student side (the exam page — uses the student token automatically) ────────

export interface StudentRule {
  eventType: string;
  enabled: boolean;
  action: RuleAction;
  threshold: number | null;
}

export interface StudentAntiCheatConfig {
  rules: StudentRule[];
  requireCamera: boolean;
}

export type ViolationOutcome = "ignored" | "warned" | "flagged" | "blocked" | "auto_submitted";

export interface ViolationResult {
  actionTaken: ViolationOutcome;
  severity: Severity;
  message: string;
  occurrenceCount: number;
}

export interface QueuedViolation {
  eventType: string;
  detail?: string;
  occurredAt: string;
}

export const studentAntiCheatApi = {
  getConfig: async (attemptId: string): Promise<StudentAntiCheatConfig> => {
    return fetchApi<StudentAntiCheatConfig>(`/attempts/${attemptId}/anti-cheat/config`, { method: "GET" });
  },

  reportViolation: async (attemptId: string, eventType: string, detail?: string): Promise<ViolationResult> => {
    return fetchApi<ViolationResult>(`/attempts/${attemptId}/violations`, {
      method: "POST",
      body: JSON.stringify({ eventType, detail }),
    });
  },

  // Events that happened while the student was offline, sent once they're back.
  flushOfflineQueue: async (attemptId: string, queue: QueuedViolation[]): Promise<{ flushed: number; results: ViolationResult[] }> => {
    return fetchApi(`/attempts/${attemptId}/violations/offline-flush`, {
      method: "POST",
      body: JSON.stringify(queue),
    });
  },
};
