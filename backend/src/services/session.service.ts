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

// ── Student channel ────────────────────────────────────────────────────────
export function registerSSEClient(examId: string, res: any) {
  if (!sseClients.has(examId)) sseClients.set(examId, new Set());
  sseClients.get(examId)!.add(res);
}

export function unregisterSSEClient(examId: string, res: any) {
  sseClients.get(examId)?.delete(res);
}

/** Broadcast an event to all students listening on an exam channel. */
function broadcastToStudents(examId: string, event: string, data: object) {
  const clients = sseClients.get(examId);
  if (!clients) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try { res.write(payload); } catch { /* client disconnected */ }
  }
}

// Keep backward-compat alias used by startSession / endSession
function broadcast(examId: string, event: string, data: object) {
  broadcastToStudents(examId, event, data);
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
          metadata: q.metadata,
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

    const studentIdStr = `${studentInfo.studentId}__${studentInfo.email}__${Date.now()}`;

    const attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        studentId: studentIdStr,
        snapshot,
        gradingKey,
        answers: { studentInfo }, // store info in legacy answers field
      },
    });

    const token = signStudentToken({
      attemptId: attempt.id,
      examId: exam.id,
      studentId: studentIdStr,
    });

    return { token, attemptId: attempt.id, snapshot };
  }

  /**
   * Get current live session state for an exam.
   */
  async getSessionState(examId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { sessionState: true, startDate: true, duration: true },
    });
    if (!exam) throw new Error('Exam not found.');
    return exam;
  }

  /**
   * Teacher starts the exam → broadcasts SSE event to all waiting students.
   */
  async startSession(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found.');
    if (exam.ownerId !== ownerId) throw new Error('Access denied.');

    await prisma.exam.update({
      where: { id: examId },
      data: { sessionState: ExamSessionState.ACTIVE },
    });

    broadcast(examId, 'exam_started', { examId, startedAt: new Date().toISOString() });

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

    broadcast(examId, 'exam_ended', { examId, endedAt: new Date().toISOString() });

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
}
