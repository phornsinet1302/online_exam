// src/services/session.service.ts
import prisma from '../config/database.js';
import jwt from 'jsonwebtoken';
import { ExamSessionState } from '@prisma/client';

// ─── SSE client registry ──────────────────────────────────────────────────────
// Two separate maps:
//  sseClients        – students waiting in lobby / taking the exam
//  sseTeacherClients – teacher dashboard (live monitoring, violation alerts)
const sseClients        = new Map<string, Set<any>>();
const sseTeacherClients = new Map<string, Set<any>>();

const onlineStudents = new Map<string, Set<any>>();

export function isStudentOnline(attemptId: string) {
  return onlineStudents.has(attemptId) && onlineStudents.get(attemptId)!.size > 0;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Compute the true end time. Prefers Exam.endDate; otherwise start + duration.
function computeEndDate(exam: {
  endDate: Date | null;
  startDate: Date | null;
  duration: number | null;
  lateAllowanceMinutes?: number | null;
}): Date | null {
  if (exam.endDate) return exam.endDate;
  if (!exam.startDate || !exam.duration) return null;
  const extra = (exam.duration + (exam.lateAllowanceMinutes ?? 0)) * 60_000;
  return new Date(exam.startDate.getTime() + extra);
}

// ─── Auto-start scheduler ─────────────────────────────────────────────────────
// Keeps NodeJS timer handles so we can cancel them if needed
const autoStartTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Schedule an exam to auto-start at its startDate.
 * Safe to call multiple times — previous timer for the same exam is cancelled.
 */
export function scheduleAutoStart(examId: string, startDate: Date) {
  // Cancel any existing timer for this exam
  const existing = autoStartTimers.get(examId);
  if (existing) clearTimeout(existing);

  const msUntilStart = startDate.getTime() - Date.now();
  if (msUntilStart <= 0) return; // Already past start time

  const timer = setTimeout(async () => {
    autoStartTimers.delete(examId);
    try {
      const exam = await prisma.exam.findUnique({ where: { id: examId } });
      if (!exam || exam.sessionState !== ExamSessionState.WAITING) return;

      const now = new Date();
      const durationMin = exam.duration ?? 0;
      const lateMin = exam.lateAllowanceMinutes ?? 0;
      const newEndDate = durationMin > 0
        ? new Date(now.getTime() + (durationMin + lateMin) * 60_000)
        : exam.endDate;

      await prisma.exam.update({
        where: { id: examId },
        data: { sessionState: ExamSessionState.ACTIVE, endDate: newEndDate },
      });

      await prisma.examAttempt.updateMany({
        where: { examId, submittedAt: null },
        data: { startedAt: now },
      });

      const payload = { examId, startedAt: now.toISOString(), endDate: newEndDate?.toISOString() ?? null, autoStarted: true };
      broadcast(examId, 'exam_started', payload);
      broadcastToTeacher(examId, 'exam_started', payload);
      console.log(`[AutoStart] Exam ${examId} auto-started at scheduled time.`);
    } catch (err) {
      console.error(`[AutoStart] Failed to auto-start exam ${examId}:`, err);
    }
  }, msUntilStart);

  autoStartTimers.set(examId, timer);
  console.log(`[AutoStart] Exam ${examId} scheduled to start in ${Math.round(msUntilStart / 1000)}s`);
}

/**
 * On server boot, re-schedule all WAITING exams that have a future startDate.
 * Call this once during app startup.
 */
export async function restoreAutoStartSchedules() {
  try {
    const now = new Date();
    const pendingExams = await prisma.exam.findMany({
      where: {
        status: 'PUBLISHED',
        sessionState: ExamSessionState.WAITING,
        startDate: { gt: now },
      },
      select: { id: true, startDate: true, title: true },
    });

    for (const exam of pendingExams) {
      if (exam.startDate) {
        scheduleAutoStart(exam.id, exam.startDate);
      }
    }
    console.log(`[AutoStart] Restored ${pendingExams.length} pending exam schedule(s).`);
  } catch (err) {
    console.error('[AutoStart] Failed to restore schedules:', err);
  }
}

export async function registerSSEClient(examId: string, res: any, attemptId?: string) {
  if (!sseClients.has(examId)) sseClients.set(examId, new Set());
  sseClients.get(examId)!.add(res);
  if (attemptId) {
    const isNewConnection = !onlineStudents.has(attemptId);
    if (isNewConnection) onlineStudents.set(attemptId, new Set());
    onlineStudents.get(attemptId)!.add(res);

    if (isNewConnection) {
      try {
        const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
        if (attempt) {
          const joinedPayload = {
            attemptId: attempt.id,
            studentInfo: (attempt.answers as any)?.studentInfo || {},
            joinedAt: attempt.startedAt
          };
          // Exclude the newly connecting client — they'll get the full
          // student list via session_state instead (avoids duplicate entries)
          broadcast(examId, 'student_joined', joinedPayload, res);
          broadcastToTeacher(examId, 'student_joined', joinedPayload);
        }
      } catch (e) {}
    }
  }
}

export function unregisterSSEClient(examId: string, res: any, attemptId?: string) {
  sseClients.get(examId)?.delete(res);
  
  if (attemptId) {
    const connections = onlineStudents.get(attemptId);
    if (connections) {
      connections.delete(res);
      if (connections.size === 0) {
        onlineStudents.delete(attemptId);
        // Delay the offline broadcast to avoid flickering on page reload
        setTimeout(() => {
          if (!onlineStudents.has(attemptId)) {
            broadcast(examId, 'student_offline', { attemptId });
            broadcastToTeacher(examId, 'student_offline', { attemptId });
          }
        }, 3000);
      }
    }
  }
}

/** Broadcast an event to all students listening on an exam channel. */
function broadcastToStudents(examId: string, event: string, data: object, exclude?: any) {
  const clients = sseClients.get(examId);
  if (!clients) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    if (client === exclude) continue;
    try { client.write(payload); } catch { /* client disconnected */ }
  }
}

// Keep backward-compat alias used by startSession / endSession
function broadcast(examId: string, event: string, data: object, exclude?: any) {
  broadcastToStudents(examId, event, data, exclude);
}


// ── Teacher channel ────────────────────────────────────────────────────────
export function registerSSETeacherClient(examId: string, res: any) {
  if (!sseTeacherClients.has(examId)) sseTeacherClients.set(examId, new Set());
  sseTeacherClients.get(examId)!.add(res);
}

export function unregisterSSETeacherClient(examId: string, res: any) {
  sseTeacherClients.get(examId)?.delete(res);
}

/**
 * Broadcast an event to all teacher dashboards watching this exam.
 * Called by AntiCheatService for violation alerts and auto-submit notices.
 */
export function broadcastToTeacher(examId: string, event: string, data: object) {
  const clients = sseTeacherClients.get(examId);
  if (!clients) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try { res.write(payload); } catch { /* client disconnected */ }
  }
}

// ─── Student token helpers ────────────────────────────────────────────────────

const STUDENT_TOKEN_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export function signStudentToken(payload: { attemptId: string; examId: string; studentId: string }) {
  return jwt.sign(payload, STUDENT_TOKEN_SECRET, { expiresIn: '12h' });
}

export function verifyStudentToken(token: string): { attemptId: string; examId: string; studentId: string } {
  return jwt.verify(token, STUDENT_TOKEN_SECRET) as any;
}

// ─── Service class ────────────────────────────────────────────────────────────

export class SessionService {
  /**
   * Validate an exam code and return safe public exam info.
   * Called when a student enters their code.
   */
  async joinByCode(code: string) {
    const exam = await prisma.exam.findUnique({
      where: { uniqueCode: code },
      include: {
        sections: {
          include: { questions: { select: { id: true } } },
        },
      },
    });

    if (!exam) throw new Error('Exam not found. Please check your code.');
    if (exam.status !== 'PUBLISHED') throw new Error('This exam is not currently available.');

    const now = new Date();
    const derivedEndDate = exam.endDate || (exam.startDate && exam.duration ? new Date(exam.startDate.getTime() + (exam.duration + exam.lateAllowanceMinutes) * 60_000) : null);

    if (exam.sessionState === 'ENDED' || (derivedEndDate && now >= derivedEndDate)) {
      throw new Error('This exam has already concluded.');
    }

    const lateDeadline = exam.startDate
      ? new Date(exam.startDate.getTime() + exam.lateAllowanceMinutes * 60_000)
      : null;

    if (lateDeadline && now > lateDeadline) {
      throw new Error('The late-join window for this exam has closed.');
    }

    const totalQuestions = exam.sections.reduce(
      (sum, s) => sum + s.questions.length, 0
    );

    return {
      examId: exam.id,
      title: exam.title,
      description: exam.description,
      subject: exam.subject,
      duration: exam.duration,
      startDate: exam.startDate,
      lateAllowanceMinutes: exam.lateAllowanceMinutes,
      sessionState: exam.sessionState,
      totalQuestions,
      sectionCount: exam.sections.length,
    };
  }

  /**
   * Register a student, create an attempt, return studentToken + snapshot.
   */
  async registerStudent(examId: string, studentInfo: { name: string; studentId: string; email: string }) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        sections: {
          include: {
            questions: { include: { options: true }, orderBy: { order: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!exam) throw new Error('Exam not found.');
    if (exam.status !== 'PUBLISHED') throw new Error('Exam not available.');

    const now = new Date();
    const effectiveEnd = computeEndDate(exam);
    if (exam.sessionState === 'ENDED') throw new Error('This exam has ended. Registration is closed.');
    if (effectiveEnd && now >= effectiveEnd) throw new Error('This exam has already concluded.');

    // Build snapshot (no isCorrect exposed)
    const snapshot = {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      subject: exam.subject,
      duration: exam.duration,
      passingScore: exam.passingScore,
      sections: exam.sections.map((section) => ({
        id: section.id,
        title: section.title,
        randomization: section.randomization,
        shuffleAnswers: section.shuffleAnswers,
        questions: section.questions.map((q) => ({
          id: q.id,
          type: q.type,
          text: q.text,
          points: q.points,
          order: q.order,
          metadata: {
            pairs: (q.metadata as any)?.pairs,
            hint: (q.metadata as any)?.hint,
          },
          options: q.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
            order: opt.order,
          })),
        })),
      })),
    };

    // Build private grading key
    const gradingKey = exam.sections.flatMap((section) =>
      section.questions.map((q) => {
        const meta = (q.metadata ?? {}) as Record<string, any>;
        return {
          questionId: q.id,
          type: q.type,
          points: q.points,
          correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
          expectedText: meta.expectedText as string | undefined,
          caseSensitive: meta.caseSensitive as boolean | undefined,
          correctPairs: meta.correctPairs as { leftId: string; rightId: string }[] | undefined,
        };
      })
    );

    const studentIdStr = studentInfo.email.toLowerCase().trim();

    // Check if an attempt already exists for this email
    let attempt = await prisma.examAttempt.findFirst({
      where: {
        examId: exam.id,
        studentId: studentIdStr,
      },
    });

    if (attempt) {
      // Update the attempt with the latest studentInfo so they can fix typos in their Student ID
      const currentAnswers = (attempt.answers as any) || {};
      await prisma.examAttempt.update({
        where: { id: attempt.id },
        data: {
          answers: { ...currentAnswers, studentInfo }
        }
      });

      // If it exists, just return a new token for the existing attempt
      const token = signStudentToken({
        attemptId: attempt.id,
        examId: exam.id,
        studentId: studentIdStr,
      });
      return { token, attemptId: attempt.id, snapshot: attempt.snapshot, isApproved: attempt.isApproved };
    }

    // Determine if student needs approval (joining late)
    const needsApproval = exam.requireLateApproval && exam.sessionState === 'ACTIVE';

    // Otherwise, create a new attempt
    attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        studentId: studentIdStr,
        snapshot,
        gradingKey,
        isApproved: !needsApproval,
        answers: { studentInfo }, // store info in legacy answers field
      },
    });

    const token = signStudentToken({
      attemptId: attempt.id,
      examId: exam.id,
      studentId: studentIdStr,
    });

    // Broadcast student joined event
    const joinedPayload = {
      attemptId: attempt.id,
      studentInfo,
      joinedAt: new Date().toISOString(),
      isApproved: !needsApproval,
    };
    broadcast(exam.id, 'student_joined', joinedPayload);
    broadcastToTeacher(exam.id, 'student_joined', joinedPayload);

    return { token, attemptId: attempt.id, snapshot, isApproved: !needsApproval };
  }

  /**
   * Get current live session state for an exam.
   */
  async getSessionState(examId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { 
        sessionState: true, 
        startDate: true, 
        duration: true,
        title: true,
        subject: true,
        attempts: {
          select: { id: true, answers: true, startedAt: true, isApproved: true, submittedAt: true }
        }
      },
    });
    if (!exam) throw new Error('Exam not found.');

    // Return students who are currently online OR who have submitted
    const joinedStudents = exam.attempts
      .filter(a => isStudentOnline(a.id) || a.submittedAt !== null)
      .map(a => {
        const answers = a.answers as any;
        const studentInfo = answers?.studentInfo || {};
        // Progress object stores violations
        const progress = answers?.progress || {};
        const violationCount = progress.violationCount || 0;
        
        return {
          attemptId: a.id,
          studentInfo,
          joinedAt: a.startedAt,
          isApproved: a.isApproved,
          submitted: a.submittedAt !== null,
          violationCount,
        };
      });

    return { ...exam, joinedStudents };
  }

  /**
   * Teacher starts the exam → broadcasts SSE event to all waiting students.
   */
  async startSession(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found.');
    if (exam.ownerId !== ownerId) throw new Error('Access denied.');

    const now = new Date();
    const durationMin = exam.duration ?? 0;
    const lateMin = exam.lateAllowanceMinutes ?? 0;
    const newEndDate = durationMin > 0
      ? new Date(now.getTime() + (durationMin + lateMin) * 60_000)
      : exam.endDate;

    await prisma.exam.update({
      where: { id: examId },
      data: {
        sessionState: ExamSessionState.ACTIVE,
        endDate: newEndDate,
      },
    });

    // Reset startedAt for all un-submitted attempts to the time the exam started
    await prisma.examAttempt.updateMany({
      where: { examId, submittedAt: null },
      data: { startedAt: now },
    });

    const startPayload = {
      examId,
      startedAt: now.toISOString(),
      endDate: newEndDate?.toISOString() ?? null,
    };
    broadcast(examId, 'exam_started', startPayload);
    broadcastToTeacher(examId, 'exam_started', startPayload);

    return { message: 'Exam session started.' };
  }

  /**
   * Teacher ends the exam → broadcasts SSE event, triggers auto-submit for all active attempts.
   */
  async endSession(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found.');
    if (exam.ownerId !== ownerId) throw new Error('Access denied.');

    await prisma.exam.update({
      where: { id: examId },
      data: { sessionState: ExamSessionState.ENDED },
    });

    // Auto-submit all remaining attempts
    await prisma.examAttempt.updateMany({
      where: { examId, submittedAt: null },
      data: { submittedAt: new Date(), autoSubmitted: true },
    });

    const endPayload = { examId, endedAt: new Date().toISOString() };
    broadcast(examId, 'exam_ended', endPayload);
    broadcastToTeacher(examId, 'exam_ended', endPayload);

    return { message: 'Exam session ended.' };
  }

  /**
   * Auto-save student progress (partial, not final submission).
   * Upserts into the legacy answers JSON — lightweight, no grading.
   */
  async saveProgress(attemptId: string, answers: Record<string, any>) {
    const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new Error('Attempt not found.');
    if (attempt.submittedAt) throw new Error('Attempt already submitted.');

    await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        answers: {
          ...(attempt.answers as object ?? {}),
          progress: answers,
          lastSavedAt: new Date().toISOString(),
        },
      },
    });

    return { savedAt: new Date().toISOString() };
  }

  /**
   * Teacher kicks a student from the active session or waiting room.
   */
  async kickStudent(examId: string, attemptId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found.');
    if (exam.ownerId !== ownerId) throw new Error('Access denied.');

    const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.examId !== examId) throw new Error('Attempt not found.');

    await prisma.examAttempt.delete({ where: { id: attemptId } });

    // Notify the kicked student so their frontend can navigate out
    broadcast(examId, 'student_kicked', { attemptId });
    // Notify the teacher dashboard to update list
    broadcastToTeacher(examId, 'student_kicked', { attemptId });

    return { message: 'Student removed successfully.' };
  }

  /**
   * Validate that a student's attempt still exists (not kicked/deleted).
   * Used by frontend to check stale tokens before auto-redirecting.
   */
  async validateAttempt(attemptId: string, examId: string) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, examId: true, submittedAt: true },
    });

    if (!attempt || attempt.examId !== examId) {
      return { valid: false, reason: 'Attempt not found or was removed.' };
    }
    if (attempt.submittedAt) {
      return { valid: false, reason: 'Exam already submitted.' };
    }

    return { valid: true, attemptId: attempt.id };
  }

  /**
   * Approve a late student to enter the exam.
   */
  async approveLateStudent(examId: string, attemptId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found.');
    if (exam.ownerId !== ownerId) throw new Error('Access denied.');

    await prisma.examAttempt.update({
      where: { id: attemptId },
      data: { isApproved: true },
    });

    broadcast(examId, 'late_approved', { attemptId });
    broadcastToTeacher(examId, 'late_approved', { attemptId });

    return { message: 'Student approved.' };
  }

  /**
   * Reject a late student from entering the exam.
   */
  async rejectLateStudent(examId: string, attemptId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found.');
    if (exam.ownerId !== ownerId) throw new Error('Access denied.');

    await prisma.examAttempt.delete({ where: { id: attemptId } });

    broadcast(examId, 'late_rejected', { attemptId });
    broadcastToTeacher(examId, 'late_rejected', { attemptId });

    return { message: 'Student rejected.' };
  }

  /**
   * Refresh a student JWT token
   */
  async refreshStudentToken(oldToken: string) {
    try {
      // Decode ignoring expiration to get the payload
      const decoded = jwt.decode(oldToken) as any;
      if (!decoded || !decoded.attemptId) {
        throw new Error('Invalid token structure');
      }

      const attempt = await prisma.examAttempt.findUnique({
        where: { id: decoded.attemptId },
        include: { exam: true }
      });

      if (!attempt) throw new Error('Attempt not found');
      if (attempt.submittedAt) throw new Error('Attempt already submitted');
      if (attempt.isApproved === false) throw new Error('Attempt not approved or kicked');

      // Re-sign token
      const newToken = signStudentToken({
        attemptId: attempt.id,
        examId: attempt.examId,
        studentId: attempt.studentId || '',
      });

      return { token: newToken };
    } catch (err: any) {
      throw new Error(`Failed to refresh token: ${err.message}`);
    }
  }

  /**
   * Mark a student offline instantly via beacon / API
   */
  async handleStudentLeave(attemptId: string) {
    const connections = onlineStudents.get(attemptId);
    if (connections) {
      connections.forEach(res => {
        try {
          res.end();
        } catch(e) {}
      });
      onlineStudents.delete(attemptId);
    }
    
    // Broadcast offline immediately
    const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (attempt) {
      broadcast(attempt.examId, 'student_offline', { attemptId });
      broadcastToTeacher(attempt.examId, 'student_offline', { attemptId });
    }
  }
}

// ─── Background Sweeper ────────────────────────────────────────────────────────
let sweepTimer: ReturnType<typeof setInterval> | null = null;

async function runSweep() {
  const now = new Date();

  // 1) Auto-start exams that should have started (includes server-restart case)
  const toStart = await prisma.exam.findMany({
    where: {
      status: 'PUBLISHED',
      sessionState: ExamSessionState.WAITING,
      startDate: { lte: now },
    },
    select: { id: true, startDate: true, duration: true, lateAllowanceMinutes: true, endDate: true },
  });
  for (const exam of toStart) {
    const durationMin = exam.duration ?? 0;
    const lateMin = exam.lateAllowanceMinutes ?? 0;
    const newEndDate = durationMin > 0
      ? new Date(now.getTime() + (durationMin + lateMin) * 60_000)
      : exam.endDate;

    await prisma.exam.update({
      where: { id: exam.id },
      data: { sessionState: ExamSessionState.ACTIVE, endDate: newEndDate },
    });
    await prisma.examAttempt.updateMany({
      where: { examId: exam.id, submittedAt: null },
      data: { startedAt: now },
    });
    const p = { examId: exam.id, startedAt: now.toISOString(), autoStarted: true };
    broadcast(exam.id, 'exam_started', p);
    broadcastToTeacher(exam.id, 'exam_started', p);
    console.log(`[Sweep] Auto-started exam ${exam.id}`);
  }

  // 2) Auto-submit attempts whose deadline passed
  const expired = await prisma.examAttempt.findMany({
    where: {
      submittedAt: null,
      deadline: { lte: now },
      exam: { autoSubmit: true },
    },
    select: { id: true, examId: true },
  });
  for (const a of expired) {
    await prisma.examAttempt.update({
      where: { id: a.id },
      data: { submittedAt: now, autoSubmitted: true },
    });
    broadcast(a.examId, 'attempt_auto_submitted', { attemptId: a.id });
    broadcastToTeacher(a.examId, 'attempt_auto_submitted', { attemptId: a.id });
    console.log(`[Sweep] Auto-submitted attempt ${a.id}`);
  }

  // 3) Auto-close exams whose endDate passed OR whose derived end date passed (for legacy exams)
  const activeExams = await prisma.exam.findMany({
    where: { sessionState: ExamSessionState.ACTIVE },
    select: { id: true, endDate: true, startDate: true, duration: true, lateAllowanceMinutes: true },
  });

  const toClose = activeExams.filter(e => {
    if (e.endDate) return e.endDate <= now;
    if (e.startDate && e.duration) {
      const derived = new Date(e.startDate.getTime() + (e.duration + e.lateAllowanceMinutes) * 60_000);
      return derived <= now;
    }
    return false;
  });

  for (const exam of toClose) {
    await prisma.exam.update({
      where: { id: exam.id },
      data: { sessionState: ExamSessionState.ENDED },
    });
    // Submit all remaining attempts
    await prisma.examAttempt.updateMany({
      where: { examId: exam.id, submittedAt: null },
      data: { submittedAt: now, autoSubmitted: true },
    });
    const p = { examId: exam.id, endedAt: now.toISOString(), autoClosed: true };
    broadcast(exam.id, 'exam_ended', p);
    broadcastToTeacher(exam.id, 'exam_ended', p);
    console.log(`[Sweep] Auto-closed exam ${exam.id}`);
  }
}

export function startExpirySweeper() {
  if (sweepTimer) return;
  sweepTimer = setInterval(() => {
    runSweep().catch(err => console.error('[Sweep] error:', err));
  }, 15_000); // every 15s
  console.log('[Sweep] Expiry sweeper started (15s interval).');
}
