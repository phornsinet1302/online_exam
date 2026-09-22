// src/services/session.service.ts
import prisma from '../config/database.js';
import { verifyPassword } from '../utils/password.js';
import { maskMatchingPairs } from '../utils/snapshot.js';
import { orderSectionForStudent } from '../utils/studentOrdering.js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { GradingService } from './grading.service.js';
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

// End of a session that starts at `now`: start + duration + late allowance,
// but never past a teacher-set end date (an explicit end is a hard stop).
function computeSessionEnd(
  exam: { duration: number | null; lateAllowanceMinutes: number | null; endDate: Date | null; endDateFixed: boolean },
  now: Date,
): Date | null {
  const durationMin = exam.duration ?? 0;
  const derived = durationMin > 0
    ? new Date(now.getTime() + (durationMin + (exam.lateAllowanceMinutes ?? 0)) * 60_000)
    : exam.endDate;
  if (exam.endDateFixed && exam.endDate && derived && exam.endDate < derived) return exam.endDate;
  return derived;
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
      if (!exam || exam.manualStart || exam.sessionState !== ExamSessionState.WAITING) return;

      const now = new Date();
      const newEndDate = computeSessionEnd(exam, now);

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
        manualStart: false,
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

export function signStudentToken(payload: { attemptId: string; examId: string; studentId: string; name?: string }) {
  return jwt.sign(payload, STUDENT_TOKEN_SECRET, { expiresIn: '12h' });
}

export function verifyStudentToken(token: string): { attemptId: string; examId: string; studentId: string } {
  return jwt.verify(token, STUDENT_TOKEN_SECRET) as any;
}

// ─── Teacher live-stream token ───────────────────────────────────────────────
// The browser's EventSource can't send an Authorization header, so the teacher
// SSE endpoint authenticates with a signed, exam-scoped token in the query
// string instead. Issued only to users who may monitor the exam (see
// issueTeacherStreamToken in session.controller.ts).
export function signTeacherStreamToken(payload: { examId: string; userId: string }) {
  return jwt.sign({ ...payload, type: 'teacher-stream' }, STUDENT_TOKEN_SECRET, { expiresIn: '12h' });
}

export function verifyTeacherStreamToken(token: string): { examId: string; userId: string } {
  const payload = jwt.verify(token, STUDENT_TOKEN_SECRET) as any;
  if (payload?.type !== 'teacher-stream') throw new Error('Invalid stream token');
  return { examId: payload.examId, userId: payload.userId };
}

// ─── Exam-password brute-force throttle ──────────────────────────────────────
// In-memory, per exam + client — enough to make guessing a password impractical
// without needing extra infrastructure.
const MAX_PASSWORD_FAILURES = 8;
const PASSWORD_LOCK_MS = 10 * 60_000;
const passwordFailures = new Map<string, { count: number; resetAt: number }>();

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

    // A manual-start exam that hasn't been started has no clock running: its
    // dates are just a plan, so they must not close the lobby. Once the teacher
    // starts it, startSession() records the real start and the normal rules apply.
    const awaitingManualStart = exam.manualStart && exam.sessionState === 'WAITING';

    if (exam.sessionState === 'ENDED' || (!awaitingManualStart && derivedEndDate && now >= derivedEndDate)) {
      throw new Error('This exam has already concluded.');
    }

    const lateDeadline = exam.startDate
      ? new Date(exam.startDate.getTime() + exam.lateAllowanceMinutes * 60_000)
      : null;

    if (!awaitingManualStart && lateDeadline && now > lateDeadline) {
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
      // Lets the entry form ask for the password up front. The password
      // itself never leaves the server.
      accessType: exam.accessType,
      requiresPassword: exam.accessType === 'PASSWORD_PROTECTED',
    };
  }

  /**
   * Register a student, create an attempt, return studentToken + snapshot.
   */
  async registerStudent(
    examId: string,
    // email is optional: a student can join with just a full name and Student ID.
    // Only Google sign-in gives a verified email (needed for private exams).
    studentInfo: { name: string; studentId: string; email?: string },
    // resumeAttemptId: the attempt the caller already holds a valid token for
    opts: { password?: string; clientKey?: string; resumeAttemptId?: string } = {},
  ) {
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
    const awaitingManualStart = exam.manualStart && exam.sessionState === 'WAITING';
    if (!awaitingManualStart && effectiveEnd && now >= effectiveEnd) throw new Error('This exam has already concluded.');

    // ── Exam privacy (SRS 3.3) ───────────────────────────────────────────────
    const studentEmail = (studentInfo.email || '').toLowerCase().trim();
    // Who this student is. A verified email when they signed in with Google;
    // otherwise the Student ID they typed (prefixed so it can never collide with an email).
    const identity = studentEmail || `id:${studentInfo.studentId.trim().toLowerCase()}`;
    studentInfo = { name: studentInfo.name.trim(), studentId: studentInfo.studentId.trim(), email: studentEmail };
    if (exam.accessType === 'PRIVATE') {
      // Private = invitation only, checked against the Roster by email — which a
      // typed name and ID can't prove, so those students must sign in with Google.
      if (!studentEmail) {
        throw new Error('This is a private exam. Please continue with Google, using the email your teacher invited.');
      }
      const invited = await prisma.enrolledStudent.findFirst({
        where: { examId: exam.id, email: studentEmail },
        select: { id: true },
      });
      if (!invited) {
        throw new Error("This is a private exam and your email hasn't been invited. Please ask your teacher to add you.");
      }
    } else if (exam.accessType === 'PASSWORD_PROTECTED') {
      const throttleKey = `${exam.id}:${opts.clientKey || studentEmail}`;
      const failures = passwordFailures.get(throttleKey);
      if (failures && failures.resetAt > Date.now() && failures.count >= MAX_PASSWORD_FAILURES) {
        throw new Error('Too many incorrect passwords. Please wait a few minutes and try again.');
      }
      if (!opts.password || !verifyPassword(opts.password, exam.password)) {
        const entry = failures && failures.resetAt > Date.now() ? failures : { count: 0, resetAt: Date.now() + PASSWORD_LOCK_MS };
        entry.count++;
        passwordFailures.set(throttleKey, entry);
        throw new Error(opts.password ? 'Incorrect exam password.' : 'This exam requires a password.');
      }
      passwordFailures.delete(throttleKey);
    }

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
        questions: orderSectionForStudent(section).map((q, qIndex) => ({
          id: q.id,
          type: q.type,
          text: q.text,
          points: q.points,
          order: qIndex,
          metadata: {
            pairs: maskMatchingPairs((q.metadata as any)?.pairs),
            hint: (q.metadata as any)?.hint,
          },
          options: q.options.map((opt, oIndex) => ({
            id: opt.id,
            text: opt.text,
            order: oIndex,
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

    const studentIdStr = identity;

    // Attempts already made by this student, newest first
    const previousAttempts = await prisma.examAttempt.findMany({
      where: { examId: exam.id, studentId: studentIdStr },
      orderBy: { startedAt: 'desc' },
    });
    let attempt: (typeof previousAttempts)[number] | null = previousAttempts[0] ?? null;

    // A finished attempt only counts against Max Attempts (null = unlimited);
    // with attempts left the student gets a fresh one, otherwise they're done.
    if (attempt?.submittedAt) {
      const limit = exam.maxAttempts;
      if (limit !== null && previousAttempts.length >= limit) {
        throw new Error(`You have already used ${limit === 1 ? 'your only attempt' : `all ${limit} attempts`} for this exam.`);
      }
      attempt = null;
    }

    // An unfinished attempt is resumed rather than duplicated
    if (attempt) {
      // With only a typed Student ID there is nothing to prove who is asking, so
      // resuming needs the token this device got when it first joined. Otherwise
      // typing a classmate's ID would hand over their attempt. (Emails are
      // verified by Google, so those resume freely.) The teacher can remove the
      // student from the session to let a locked-out student back in.
      if (!studentEmail && opts.resumeAttemptId !== attempt.id) {
        throw new Error('This Student ID has already joined this exam from another device or browser. If that was you, ask your teacher to remove you from the session, then join again.');
      }
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
        name: studentInfo.name,
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
      name: studentInfo.name,
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
    if (exam.status !== 'PUBLISHED') throw new Error('Publish the exam before starting it.');
    // Restarting a running session would reset every student's timer, and an
    // ended one has to go through Reopen so its schedule is set deliberately.
    if (exam.sessionState === ExamSessionState.ACTIVE) throw new Error('This exam has already started.');
    if (exam.sessionState === ExamSessionState.ENDED) throw new Error('This exam has ended. Reopen it to run it again.');

    const now = new Date();
    const newEndDate = computeSessionEnd(exam, now);

    await prisma.exam.update({
      where: { id: examId },
      data: {
        sessionState: ExamSessionState.ACTIVE,
        endDate: newEndDate,
        // For a manual-start exam the start date is when the teacher pressed
        // Start — the late-join window is measured from it.
        ...(exam.manualStart ? { startDate: now } : {}),
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

    // Auto-submit all remaining attempts via GradingService
    const remaining = await prisma.examAttempt.findMany({
      where: { examId, submittedAt: null },
      select: { id: true },
    });
    const gradingService = new GradingService();
    for (const a of remaining) {
      await prisma.examAttempt.update({
        where: { id: a.id },
        data: { autoSubmitted: true },
      });
      try {
        await gradingService.submitAndGradeFromAutosave(a.id);
      } catch (err) {
        console.error(`[endSession] Failed to auto-grade attempt ${a.id}:`, err);
        await prisma.examAttempt.update({
          where: { id: a.id },
          data: { submittedAt: new Date() },
        });
      }
    }

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
        name: (attempt.answers as any)?.studentInfo?.name,
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
      manualStart: false,
      startDate: { lte: now },
    },
    select: { id: true, startDate: true, duration: true, lateAllowanceMinutes: true, endDate: true, endDateFixed: true },
  });
  for (const exam of toStart) {
    const newEndDate = computeSessionEnd(exam, now);

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
  const gradingService = new GradingService();
  for (const a of expired) {
    await prisma.examAttempt.update({
      where: { id: a.id },
      data: { autoSubmitted: true },
    });
    try {
      await gradingService.submitAndGradeFromAutosave(a.id);
    } catch (err) {
      console.error(`[Sweep] Failed to auto-grade attempt ${a.id}:`, err);
      await prisma.examAttempt.update({
        where: { id: a.id },
        data: { submittedAt: now },
      });
    }
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
    // Submit all remaining attempts via GradingService
    const remaining = await prisma.examAttempt.findMany({
      where: { examId: exam.id, submittedAt: null },
      select: { id: true }
    });
    for (const a of remaining) {
      await prisma.examAttempt.update({
        where: { id: a.id },
        data: { autoSubmitted: true },
      });
      try {
        await gradingService.submitAndGradeFromAutosave(a.id);
      } catch (err) {
        console.error(`[Sweep] Failed to auto-grade attempt ${a.id} on close:`, err);
        await prisma.examAttempt.update({
          where: { id: a.id },
          data: { submittedAt: now },
        });
      }
    }
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
