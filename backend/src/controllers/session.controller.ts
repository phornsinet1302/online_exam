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
} from '../services/session.service.js';

const sessionService = new SessionService();

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
    });
    const { examId, name, studentId, email } = schema.parse(req.body);
    const result = await sessionService.registerStudent(examId, { name, studentId, email });
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

  // Send initial state immediately
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

  registerSSEClient(examId as string, res);

  req.on('close', () => {
    clearInterval(heartbeat);
    unregisterSSEClient(examId as string, res);
  });
};

/**
 * GET /api/session/:examId/teacher-live
 * SSE stream — teacher subscribes to receive violation alerts and session events.
 */
export const liveTeacherStream = async (req: Request, res: Response) => {
  const { examId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send current session state immediately
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

  registerSSETeacherClient(examId as string, res);

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
