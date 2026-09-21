// src/controllers/session.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import {
  SessionService,
  registerSSEClient,
  unregisterSSEClient,
  registerSSETeacherClient,
  unregisterSSETeacherClient,
  verifyStudentToken,
  signTeacherStreamToken,
  verifyTeacherStreamToken,
} from '../services/session.service.js';
import { CollaborationService } from '../services/collaboration.service.js';

const sessionService = new SessionService();
const collaborationService = new CollaborationService();

// ─── Student auth helper ─────────────────────────────────────────────────────

function getStudentPayload(req: Request) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) throw new Error('Missing student token.');
  return verifyStudentToken(auth.split(' ')[1]);
}

const getTeacherId = (req: Request): string => (req as any).user.id;

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/join
 * Student enters exam code → get public exam info.
 */
export const joinByCode = async (req: Request, res: Response) => {
  try {
    const { code } = z.object({ code: z.string().min(1) }).parse(req.body);
    const examInfo = await sessionService.joinByCode(code.toUpperCase().trim());
    return res.status(200).json(examInfo);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * POST /api/join/register
 * Student submits their info → get studentToken + attempt snapshot.
 */
export const registerStudent = async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      examId: z.string(),
      name: z.string().min(1),
      studentId: z.string().min(1),
      email: z.string().email(),
      password: z.string().optional(),
    });
    const { examId, name, studentId, email, password } = schema.parse(req.body);
    const result = await sessionService.registerStudent(
      examId,
      { name, studentId, email },
      { password, clientKey: req.ip },
    );
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/session/:examId/state
 * Get current session state (polling fallback or initial load).
 */
export const getSessionState = async (req: Request, res: Response) => {
  try {
    const { examId } = z.object({ examId: z.string() }).parse(req.params);
    const state = await sessionService.getSessionState(examId);
    return res.status(200).json(state);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/session/:examId/live
 * SSE stream — student subscribes for live updates.
 */
export const liveSessionStream = async (req: Request, res: Response) => {
  const { examId } = req.params;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const attemptId = req.query.attemptId as string | undefined;

  // Register the client FIRST so that:
  // 1. The student is counted as "online" in getSessionState
  // 2. The student_joined broadcast reaches other already-connected clients
  await registerSSEClient(examId as string, res, attemptId);

  // THEN send the authoritative session state to this client.
  // Because we registered first, the student will see themselves as online.
  try {
    const state = await sessionService.getSessionState(examId as string);
    res.write(`event: session_state\ndata: ${JSON.stringify(state)}\n\n`);
  } catch {
    res.write(`event: error\ndata: ${JSON.stringify({ error: 'Exam not found' })}\n\n`);
    res.end();
    return;
  }

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 20_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unregisterSSEClient(examId as string, res, attemptId);
  });
};

/**
 * POST /api/session/:examId/teacher-live-token
 * Issues the token the teacher SSE stream requires. Anyone who may monitor
 * the exam (owner, Collaborator, Invigilator) can get one.
 */
export const issueTeacherStreamToken = async (req: Request, res: Response) => {
  try {
    const examId = req.params.examId as string;
    const userId = getTeacherId(req);
    if (!(await collaborationService.getUserRole(examId, userId))) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    await collaborationService.requireAccess(examId, userId, 'monitor_students');
    return res.status(200).json({ token: signTeacherStreamToken({ examId, userId }) });
  } catch (error: any) {
    return res.status(403).json({ error: error.message });
  }
};

/**
 * GET /api/session/:examId/teacher-live?token=...
 * SSE stream — teacher subscribes to receive violation alerts and session events.
 */
export const liveTeacherStream = async (req: Request, res: Response) => {
  const { examId } = req.params;

  // EventSource can't send Authorization headers, so the stream is gated by a
  // signed token from issueTeacherStreamToken, scoped to this exam.
  try {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    const payload = verifyTeacherStreamToken(token);
    if (payload.examId !== examId) throw new Error('Token does not match exam');
  } catch {
    return res.status(401).json({ error: 'A valid stream token is required.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Register first so subsequent broadcasts are received
  registerSSETeacherClient(examId as string, res);

  // Then send current session state
  try {
    const state = await sessionService.getSessionState(examId as string);
    res.write(`event: session_state\ndata: ${JSON.stringify(state)}\n\n`);
  } catch {
    res.write(`event: error\ndata: ${JSON.stringify({ error: 'Exam not found' })}\n\n`);
    res.end();
    return;
  }

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 20_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unregisterSSETeacherClient(examId as string, res);
  });
};

/**
 * POST /api/session/:examId/start
 * Teacher starts the exam session.
 */
export const startSession = async (req: Request, res: Response) => {
  try {
    const examId = req.params.examId as string;
    const ownerId = getTeacherId(req);
    const result = await sessionService.startSession(examId, ownerId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * POST /api/session/:examId/end
 * Teacher ends the exam session.
 */
export const endSession = async (req: Request, res: Response) => {
  try {
    const examId = req.params.examId as string;
    const ownerId = getTeacherId(req);
    const result = await sessionService.endSession(examId, ownerId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * PATCH /api/attempts/:attemptId/progress
 * Auto-save student progress (partial answers, no grading).
 */
export const saveProgress = async (req: Request, res: Response) => {
  try {
    let attemptId: string;

    // Accept either student JWT or just the attemptId in body (for offline flush)
    try {
      const payload = getStudentPayload(req);
      attemptId = payload.attemptId;
    } catch {
      const body = z.object({ attemptId: z.string() }).parse(req.body);
      attemptId = body.attemptId;
    }

    const { answers } = z.object({ answers: z.record(z.string(), z.any()) }).parse(req.body);
    const result = await sessionService.saveProgress(attemptId, answers);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * DELETE /api/session/:examId/attempts/:attemptId
 * Teacher kicks a student from the session.
 */
export const kickStudent = async (req: Request, res: Response) => {
  try {
    const { examId, attemptId } = z.object({ examId: z.string(), attemptId: z.string() }).parse(req.params);
    const ownerId = getTeacherId(req);
    const result = await sessionService.kickStudent(examId, attemptId, ownerId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * POST /api/join/validate
 * Validate that a student's attempt still exists (not kicked/deleted).
 */
export const validateAttempt = async (req: Request, res: Response) => {
  try {
    const { attemptId, examId } = z.object({ attemptId: z.string(), examId: z.string() }).parse(req.body);
    const result = await sessionService.validateAttempt(attemptId, examId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * POST /api/session/:examId/approve/:attemptId
 * Teacher approves a late student.
 */
export const approveLateStudent = async (req: Request, res: Response) => {
  try {
    const { examId, attemptId } = z.object({ examId: z.string(), attemptId: z.string() }).parse(req.params);
    const ownerId = getTeacherId(req);
    const result = await sessionService.approveLateStudent(examId, attemptId, ownerId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * POST /api/session/:examId/reject/:attemptId
 * Teacher rejects a late student.
 */
export const rejectLateStudent = async (req: Request, res: Response) => {
  try {
    const { examId, attemptId } = z.object({ examId: z.string(), attemptId: z.string() }).parse(req.params);
    const ownerId = getTeacherId(req);
    const result = await sessionService.rejectLateStudent(examId, attemptId, ownerId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
