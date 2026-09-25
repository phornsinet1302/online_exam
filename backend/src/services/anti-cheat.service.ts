// src/services/anti-cheat.service.ts
import prisma from '../config/database.js';
import { broadcastToTeacher } from './session.service.js';
import { CollaborationService } from './collaboration.service.js';
import { GradingService } from './grading.service.js';
import { NotificationService } from './notification.service.js';

const collaborationService = new CollaborationService();
const gradingService = new GradingService();
const notificationService = new NotificationService();

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventType =
  | 'tab_switch'
  | 'copy'
  | 'paste'
  | 'right_click'
  | 'keyboard_shortcut'
  | 'fullscreen_exit'
  | 'window_blur'
  | 'devtools'
  | 'print_screen'
  | 'idle'
  | 'disconnect_internet'
  | 'disconnect_camera'
  | 'disconnect_mic'
  | 'resize'
  | 'multiple_windows'
  | 'extension_detected';

export type RuleAction = 'ignore' | 'warn' | 'flag' | 'block' | 'auto_submit';
export type Severity   = 'info'   | 'warn' | 'critical';

export interface RuleInput {
  eventType: EventType;
  enabled:   boolean;
  action:    RuleAction;
  threshold?: number | null;
}

// ─── Default rules ────────────────────────────────────────────────────────────

const SEVERITY_MAP: Record<EventType, Severity> = {
  tab_switch:          'warn',
  copy:                'warn',
  paste:               'warn',
  right_click:         'info',
  keyboard_shortcut:   'warn',
  fullscreen_exit:     'warn',
  window_blur:         'warn',
  devtools:            'info',
  print_screen:        'info',
  idle:                'warn',
  disconnect_internet: 'warn',
  disconnect_camera:   'critical',
  disconnect_mic:      'warn',
  resize:              'info',
  multiple_windows:    'critical',
  extension_detected:  'info',
};

const DEFAULT_RULES: Omit<RuleInput, never>[] = [
  { eventType: 'tab_switch',          enabled: true,  action: 'flag',        threshold: 3  },
  { eventType: 'copy',                enabled: true,  action: 'warn',        threshold: null },
  { eventType: 'paste',               enabled: true,  action: 'warn',        threshold: null },
  { eventType: 'right_click',         enabled: true,  action: 'ignore',      threshold: null },
  { eventType: 'keyboard_shortcut',   enabled: true,  action: 'warn',        threshold: null },
  { eventType: 'fullscreen_exit',     enabled: true,  action: 'warn',        threshold: null },
  { eventType: 'window_blur',         enabled: true,  action: 'flag',        threshold: 3  },
  { eventType: 'devtools',            enabled: true,  action: 'ignore',      threshold: null },
  { eventType: 'print_screen',        enabled: false, action: 'ignore',      threshold: null },
  { eventType: 'idle',                enabled: true,  action: 'warn',        threshold: null },
  { eventType: 'disconnect_internet', enabled: true,  action: 'warn',        threshold: null },
  { eventType: 'disconnect_camera',   enabled: true,  action: 'flag',        threshold: 5  },
  { eventType: 'disconnect_mic',      enabled: false, action: 'warn',        threshold: null },
  { eventType: 'resize',              enabled: false, action: 'ignore',      threshold: null },
  { eventType: 'multiple_windows',    enabled: true,  action: 'flag',        threshold: 1  },
  { eventType: 'extension_detected',  enabled: false, action: 'ignore',      threshold: null },
];

const EVENT_LABELS: Record<EventType, string> = {
  tab_switch:          'Tab switch',
  copy:                'Copy attempt',
  paste:               'Paste attempt',
  right_click:         'Right-click attempt',
  keyboard_shortcut:   'Keyboard shortcut',
  fullscreen_exit:     'Fullscreen exit',
  window_blur:         'Other application opened',
  devtools:            'DevTools opened',
  print_screen:        'Screenshot attempt',
  idle:                'Idle timeout',
  disconnect_internet: 'Internet disconnected',
  disconnect_camera:   'Camera disconnected',
  disconnect_mic:      'Microphone disconnected',
  resize:              'Window resized',
  multiple_windows:    'Multiple windows',
  extension_detected:  'Browser extension detected',
};

// A student can trigger the same flagged event many times in a row; one bell
// notification per student + event + action a minute is plenty.
const ALERT_COOLDOWN_MS = 60_000;

// ─── Service ──────────────────────────────────────────────────────────────────

export class AntiCheatService {
  private lastAlertAt = new Map<string, number>();

  /**
   * Persistent in-app alert (the header bell) for everyone watching this exam,
   * so a flagged student is noticed even when the Live Monitor isn't open.
   * Owner and accepted collaborators/invigilators all hold `receive_alerts`;
   * each can opt out with the "Proctoring flags" notification preference.
   */
  private async notifyTeachers(
    examId: string, attemptId: string, eventType: EventType, actionTaken: string,
    studentName: string, examTitle: string, occurrence: number,
  ) {
    const key = `${attemptId}:${eventType}:${actionTaken}`;
    const now = Date.now();
    if (now - (this.lastAlertAt.get(key) ?? 0) < ALERT_COOLDOWN_MS) return;
    this.lastAlertAt.set(key, now);

    const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { ownerId: true } });
    if (!exam) return;
    const collaborators = await prisma.collaborator.findMany({
      where: { examId, status: 'ACCEPTED' },
      select: { userId: true },
    });
    const users = await prisma.user.findMany({
      where: { supabaseId: { in: [exam.ownerId, ...collaborators.map(c => c.userId)] } },
      select: { supabaseId: true, notificationPrefs: true },
    });

    const outcome: Record<string, string> = {
      flagged:        'was flagged for review',
      blocked:        'was blocked (exam screen locked)',
      auto_submitted: 'caused the exam to be auto-submitted',
    };
    const title = `${studentName}: ${EVENT_LABELS[eventType]}`;
    const body  = `In "${examTitle}" — this ${outcome[actionTaken] ?? 'was recorded'} (occurrence #${occurrence}).`;

    await Promise.all(
      users
        .filter(u => (u.notificationPrefs as any)?.flagAlerts !== false)
        .map(u => notificationService.create(u.supabaseId, 'alert', title, body).catch(() => {})),
    );
  }

  /** What a student's exam page needs to know to enforce the teacher's rules. */
  async getStudentConfig(examId: string) {
    const [rules, exam] = await Promise.all([
      this.getExamRules(examId),
      prisma.exam.findUnique({ where: { id: examId }, select: { requireCamera: true } }),
    ]);
    return {
      rules: rules.map(({ eventType, enabled, action, threshold }) => ({ eventType, enabled, action, threshold })),
      requireCamera: exam?.requireCamera ?? false,
    };
  }

  // ── Access guards ────────────────────────────────────────────────────────
  // Owner, Collaborator and Invigilator all have `monitor_students` per SRS
  // 3.10 — proctoring visibility is the one thing every role gets.
  private async assertCanMonitor(examId: string, requesterId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { ownerId: true } });
    if (!exam) throw new Error('Exam not found.');
    if (exam.ownerId === requesterId) return;
    await collaborationService.requireAccess(examId, requesterId, 'monitor_students');
  }


  // ── Rules ──────────────────────────────────────────────────────────────────

  /**
   * Returns rules for an exam, merging DB rows with defaults so all 16 event
   * types are always present in the response.
   */
  async getExamRules(examId: string) {
    const saved = await prisma.examAntiCheatRule.findMany({ where: { examId } });
    const savedMap = new Map(saved.map(r => [r.eventType, r]));

    return DEFAULT_RULES.map(def => {
      const row = savedMap.get(def.eventType);
      return {
        eventType: def.eventType,
        enabled:   row?.enabled   ?? def.enabled,
        action:    (row?.action   ?? def.action) as RuleAction,
        threshold: row?.threshold ?? def.threshold ?? null,
        severity:  SEVERITY_MAP[def.eventType as EventType],
      };
    });
  }

  /**
   * Upsert per-exam rules. Owner-only (checked by controller before calling).
   */
  async upsertRules(examId: string, rules: RuleInput[]) {
    const ops = rules.map(r =>
      prisma.examAntiCheatRule.upsert({
        where:  { examId_eventType: { examId, eventType: r.eventType } },
        create: { examId, eventType: r.eventType, enabled: r.enabled, action: r.action, threshold: r.threshold ?? null },
        update: {                                  enabled: r.enabled, action: r.action, threshold: r.threshold ?? null },
      })
    );
    await prisma.$transaction(ops);
    return this.getExamRules(examId);
  }

  // ── Violations ─────────────────────────────────────────────────────────────

  /**
   * Record a violation event from a student's browser.
   * Evaluates the configured rule and returns the action that was taken.
   *
   * Supports batched violations (count > 1) for debounced events.
   */
  async recordViolation(
    attemptId: string,
    eventType: EventType,
    detail?:   string,
    batchCount: number = 1,
  ): Promise<{ actionTaken: string; severity: Severity; message: string; occurrenceCount: number }> {
    if (!DEFAULT_RULES.some(d => d.eventType === eventType)) {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    // Load attempt to get examId and verify it exists / is active
    const attempt = await prisma.examAttempt.findUnique({
      where:   { id: attemptId },
      include: { exam: { select: { id: true, ownerId: true, title: true } } },
    });
    if (!attempt)         throw new Error('Attempt not found.');
    if (attempt.submittedAt) throw new Error('Attempt already submitted.');

    const examId    = attempt.examId;
    const severity  = SEVERITY_MAP[eventType] ?? 'warn';

    // Evaluate rule
    const rule = await prisma.examAntiCheatRule.findUnique({
      where: { examId_eventType: { examId, eventType } },
    });
    const defaultRule = DEFAULT_RULES.find(d => d.eventType === eventType)!;
    const enabled   = rule?.enabled   ?? defaultRule.enabled;
    const action    = (rule?.action   ?? defaultRule.action) as RuleAction;
    const threshold = rule?.threshold ?? defaultRule.threshold ?? null;

    // Count previous occurrences for this attempt + eventType
    const prevCount = await prisma.violationLog.count({
      where: { attemptId, eventType },
    });
    const totalAfter = prevCount + batchCount;

    // Write the log
    const log = await prisma.violationLog.create({
      data: {
        attemptId,
        examId,
        eventType,
        detail:          detail ?? null,
        severity,
        occurrenceCount: totalAfter,
        actionTaken:     null, // filled below
      },
    });

    // Determine effective action
    let actionTaken: string = 'ignored';
    let triggerAction = false;

    if (!enabled) {
      actionTaken = 'ignored';
    } else if (threshold !== null) {
      // Only trigger when we cross (or re-cross) the threshold
      triggerAction = totalAfter >= threshold;
    } else {
      triggerAction = true;
    }

    if (triggerAction && action !== 'ignore') {
      switch (action) {
        case 'warn':        actionTaken = 'warned';        break;
        case 'flag':        actionTaken = 'flagged';       break;
        case 'block':       actionTaken = 'blocked';       break;
        case 'auto_submit': actionTaken = 'auto_submitted'; break;
      }
    }

    // Update the log with the actual action taken
    await prisma.violationLog.update({
      where: { id: log.id },
      data:  { actionTaken },
    });

    // ── SSE broadcast to teacher ────────────────────────────────────────────
    // Fetch student name from attempt.answers (stored on registration)
    const answersBlob = attempt.answers as Record<string, any> | null;
    const studentInfo = answersBlob?.studentInfo as Record<string, any> | undefined;
    const studentName = studentInfo?.name ?? attempt.studentId ?? 'Unknown';

    // Events the rules allow (or that haven't reached their threshold yet) are
    // still logged above, but aren't worth a live alert.
    if (actionTaken !== 'ignored') {
      broadcastToTeacher(examId, 'violation', {
        violationId:    log.id,
        attemptId,
        studentId:      attempt.studentId,
        studentName,
        examTitle:      attempt.exam.title,
        eventType,
        severity,
        actionTaken,
        occurrenceCount: totalAfter,
        detail:          detail ?? null,
        createdAt:       log.createdAt.toISOString(),
      });
    }

    // Persistent bell notification for the serious outcomes.
    if (actionTaken === 'flagged' || actionTaken === 'blocked' || actionTaken === 'auto_submitted') {
      this.notifyTeachers(examId, attemptId, eventType, actionTaken, studentName, attempt.exam.title, totalAfter)
        .catch(err => console.error('[AntiCheat] Failed to notify teachers:', err));
    }

    // ── Auto-submit ─────────────────────────────────────────────────────────
    if (actionTaken === 'auto_submitted') {
      await this._autoSubmit(attemptId, examId, eventType);
    }

    const friendlyMessages: Record<string, string> = {
      ignored:        'Event recorded.',
      warned:         'You have received a warning for this action.',
      flagged:        'This activity has been flagged and your proctor has been notified.',
      blocked:        'Your exam has been temporarily locked due to a policy violation.',
      auto_submitted: 'Your exam has been automatically submitted due to repeated violations.',
    };

    return {
      actionTaken,
      severity,
      message: friendlyMessages[actionTaken] ?? 'Event recorded.',
      occurrenceCount: totalAfter,
    };
  }

  private async _autoSubmit(attemptId: string, examId: string, reason: string) {
    // Grade whatever the student had saved so far — the same as when a
    // teacher ends the session — instead of leaving the attempt submitted but
    // unscored (it would then drop out of every score report).
    try {
      await gradingService.submitAndGradeFromAutosave(attemptId);
    } catch (err) {
      console.error(`[AntiCheat] Failed to grade auto-submitted attempt ${attemptId}:`, err);
      await prisma.examAttempt.updateMany({
        where: { id: attemptId, submittedAt: null },
        data:  { submittedAt: new Date() },
      });
    }
    await prisma.examAttempt.update({ where: { id: attemptId }, data: { autoSubmitted: true } });

    broadcastToTeacher(examId, 'student_auto_submitted', {
      attemptId,
      reason,
      submittedAt: new Date().toISOString(),
    });
    broadcastToTeacher(examId, 'student_submitted', { attemptId });
  }

  // ── Violation logs (teacher read) ──────────────────────────────────────────

  /**
   * Retrieve violation logs for an exam with optional filters.
   */
  async getViolationLogs(
    examId: string,
    ownerId: string,
    filters: {
      severity?:  string;
      eventType?: string;
      resolved?:  boolean;
      attemptId?: string;
      page?:      number;
      pageSize?:  number;
    } = {},
  ) {
    await this.assertCanMonitor(examId, ownerId);

    const { severity, eventType, resolved, attemptId, page = 1, pageSize = 50 } = filters;
    const where: Record<string, any> = { examId };
    if (severity)  where.severity  = severity;
    if (eventType) where.eventType = eventType;
    if (resolved !== undefined) where.resolved = resolved;
    if (attemptId) where.attemptId = attemptId;

    const [total, logs] = await prisma.$transaction([
      prisma.violationLog.count({ where }),
      prisma.violationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
        include: {
          attempt: {
            select: {
              studentId: true,
              answers:   true,  // contains studentInfo
            },
          },
        },
      }),
    ]);

    const enriched = logs.map(log => {
      const answers = log.attempt.answers as Record<string, any> | null;
      const info    = answers?.studentInfo as Record<string, any> | undefined;
      return {
        id:              log.id,
        attemptId:       log.attemptId,
        examId:          log.examId,
        eventType:       log.eventType,
        detail:          log.detail,
        severity:        log.severity,
        actionTaken:     log.actionTaken,
        occurrenceCount: log.occurrenceCount,
        resolved:        log.resolved,
        resolvedBy:      log.resolvedBy,
        resolvedAt:      log.resolvedAt,
        createdAt:       log.createdAt,
        studentId:       log.attempt.studentId,
        studentName:     info?.name    ?? 'Unknown',
        studentEmail:    info?.email   ?? '',
      };
    });

    return { total, page, pageSize, logs: enriched };
  }

  /**
   * Retrieve violation logs across all exams owned by the teacher.
   */
  async getAllViolationLogs(
    ownerId: string,
    filters: {
      severity?:  string;
      eventType?: string;
      resolved?:  boolean;
      attemptId?: string;
      examId?:    string;
      page?:      number;
      pageSize?:  number;
    } = {},
  ) {
    const { severity, eventType, resolved, attemptId, examId, page = 1, pageSize = 50 } = filters;
    const where: Record<string, any> = { attempt: { exam: { ownerId } } };
    if (examId)    where.examId = examId;
    if (severity)  where.severity = severity;
    if (eventType) where.eventType = eventType;
    if (resolved !== undefined) where.resolved = resolved;
    if (attemptId) where.attemptId = attemptId;

    const [total, logs] = await prisma.$transaction([
      prisma.violationLog.count({ where }),
      prisma.violationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
        include: {
          attempt: {
            select: {
              studentId: true,
              answers:   true,  // contains studentInfo
              exam: { select: { title: true } }
            },
          },
        },
      }),
    ]);

    const enriched = logs.map(log => {
      const answers = log.attempt?.answers as Record<string, any> | null;
      const info    = answers?.studentInfo as Record<string, any> | undefined;
      return {
        id:              log.id,
        attemptId:       log.attemptId,
        examId:          log.examId,
        examTitle:       log.attempt?.exam?.title ?? 'Unknown Exam',
        eventType:       log.eventType,
        detail:          log.detail,
        severity:        log.severity,
        actionTaken:     log.actionTaken,
        occurrenceCount: log.occurrenceCount,
        resolved:        log.resolved,
        resolvedBy:      log.resolvedBy,
        resolvedAt:      log.resolvedAt,
        createdAt:       log.createdAt,
        studentId:       log.attempt?.studentId,
        studentName:     info?.name    ?? 'Unknown',
        studentEmail:    info?.email   ?? '',
      };
    });

    return { total, page, pageSize, logs: enriched };
  }

  /**
   * Get per-student summary for a live exam (used by LiveMonitoring).
   */
  async getLiveStudentSummary(examId: string, ownerId: string) {
    await this.assertCanMonitor(examId, ownerId);

    const attempts = await prisma.examAttempt.findMany({
      where: { examId },
      select: {
        id:          true,
        studentId:   true,
        answers:     true,
        submittedAt: true,
        violations:  { select: { severity: true, eventType: true, createdAt: true } },
      },
    });

    return attempts.map(a => {
      const answers = a.answers as Record<string, any> | null;
      const info    = answers?.studentInfo as Record<string, any> | undefined;
      const flags   = a.violations.filter(v => v.severity === 'critical').length;
      const warns   = a.violations.filter(v => v.severity === 'warn').length;
      const lastViolation = a.violations.sort((x, y) =>
        y.createdAt.getTime() - x.createdAt.getTime()
      )[0];

      return {
        attemptId:         a.id,
        studentId:         a.studentId,
        studentName:       info?.name  ?? 'Unknown',
        studentEmail:      info?.email ?? '',
        status:            a.submittedAt ? 'done' : (flags > 0 ? 'flag' : 'ok'),
        totalViolations:   a.violations.length,
        flagCount:         flags,
        warnCount:         warns,
        lastViolationType: lastViolation?.eventType ?? null,
        lastViolationAt:   lastViolation?.createdAt ?? null,
      };
    });
  }

  /**
   * Mark a violation as resolved by a teacher.
   */
  async resolveViolation(violationId: string, resolvedBy: string) {
    const log = await prisma.violationLog.findUnique({
      where: { id: violationId },
      include: { attempt: { select: { examId: true, exam: { select: { ownerId: true } } } } },
    });
    if (!log) throw new Error('Violation log not found.');
    // Resolving is a judgment call on the exam, not just watching it — owner
    // and Collaborator can, Invigilator (monitor-only) cannot.
    if (log.attempt.exam.ownerId !== resolvedBy) {
      await collaborationService.requireAccess(log.attempt.examId, resolvedBy, 'edit_exam');
    }

    return prisma.violationLog.update({
      where: { id: violationId },
      data:  {
        resolved:   true,
        resolvedBy,
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Flush an offline violation queue submitted on reconnect.
   * Each item must have { eventType, detail?, occurredAt, batchCount? }.
   */
  async flushOfflineQueue(
    attemptId: string,
    queue: { eventType: EventType; detail?: string; occurredAt: string; batchCount?: number }[],
  ) {
    const results = [];
    for (const item of queue) {
      try {
        const result = await this.recordViolation(
          attemptId,
          item.eventType,
          `[offline] ${item.detail ?? ''} at ${item.occurredAt}`.trim(),
          item.batchCount ?? 1,
        );
        results.push({ eventType: item.eventType, ...result });
      } catch {
        // Skip already-submitted attempts
        results.push({ eventType: item.eventType, actionTaken: 'skipped', severity: 'info', message: 'Skipped.' });
      }
    }
    return results;
  }

  /**
   * Generate CSV string from violation logs.
   */
  async exportCsv(examId: string, ownerId: string): Promise<string> {
    const { logs } = await this.getViolationLogs(examId, ownerId, { pageSize: 10000 });
    const header = ['Timestamp','Student','Email','Event','Severity','Action Taken','Count','Resolved','Details'];
    const rows   = logs.map(l => [
      new Date(l.createdAt).toISOString(),
      l.studentName,
      l.studentEmail,
      l.eventType,
      l.severity,
      l.actionTaken ?? '',
      String(l.occurrenceCount),
      l.resolved ? 'Yes' : 'No',
      l.detail ?? '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    return [header.join(','), ...rows].join('\r\n');
  }

  // ── Cross-exam violation logs (teacher's Security Logs page) ────────────────

  /**
   * Violation logs across every exam the teacher owns, optionally narrowed
   * to one exam. Also returns the teacher's exam list so the UI can offer a
   * full "filter by exam" dropdown even for exams with zero violations.
   */
  async getViolationLogsForOwner(
    ownerId: string,
    filters: {
      examId?:    string;
      severity?:  string;
      eventType?: string;
      resolved?:  boolean;
      page?:      number;
      pageSize?:  number;
    } = {},
  ) {
    const { examId, severity, eventType, resolved, page = 1, pageSize = 200 } = filters;

    // Every exam this teacher can monitor — owned, or an accepted
    // Collaborator/Invigilator seat — not just the ones they own.
    const accessibleIds = await collaborationService.getAccessibleExamIds(ownerId);
    const exams = await prisma.exam.findMany({
      where: { id: { in: accessibleIds } },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    });
    if (examId && !exams.some(e => e.id === examId)) throw new Error('Exam not found.');

    const examTitleById = new Map(exams.map(e => [e.id, e.title]));
    const where: Record<string, any> = { examId: examId ? examId : { in: exams.map(e => e.id) } };
    if (severity)  where.severity  = severity;
    if (eventType) where.eventType = eventType;
    if (resolved !== undefined) where.resolved = resolved;

    const [total, logs] = await prisma.$transaction([
      prisma.violationLog.count({ where }),
      prisma.violationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
        include: {
          attempt: {
            select: { studentId: true, answers: true },
          },
        },
      }),
    ]);

    const enriched = logs.map(log => {
      const answers = log.attempt.answers as Record<string, any> | null;
      const info    = answers?.studentInfo as Record<string, any> | undefined;
      return {
        id:              log.id,
        attemptId:       log.attemptId,
        examId:          log.examId,
        examTitle:       examTitleById.get(log.examId) ?? 'Unknown exam',
        eventType:       log.eventType,
        detail:          log.detail,
        severity:        log.severity,
        actionTaken:     log.actionTaken,
        occurrenceCount: log.occurrenceCount,
        resolved:        log.resolved,
        resolvedBy:      log.resolvedBy,
        resolvedAt:      log.resolvedAt,
        createdAt:       log.createdAt,
        studentId:       log.attempt.studentId,
        studentName:     info?.name    ?? 'Unknown',
        studentEmail:    info?.email   ?? '',
      };
    });

    return { total, page, pageSize, logs: enriched, exams };
  }

  async exportCsvForOwner(
    ownerId: string,
    filters: { examId?: string; severity?: string; eventType?: string; resolved?: boolean } = {},
  ): Promise<string> {
    const { logs } = await this.getViolationLogsForOwner(ownerId, { ...filters, pageSize: 10000 });
    const header = ['Timestamp','Student','Email','Exam','Event','Severity','Action Taken','Count','Resolved','Details'];
    const rows   = logs.map(l => [
      new Date(l.createdAt).toISOString(),
      l.studentName,
      l.studentEmail,
      l.examTitle,
      l.eventType,
      l.severity,
      l.actionTaken ?? '',
      String(l.occurrenceCount),
      l.resolved ? 'Yes' : 'No',
      l.detail ?? '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    return [header.join(','), ...rows].join('\r\n');
  }
}
