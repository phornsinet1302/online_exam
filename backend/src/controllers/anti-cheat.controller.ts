// src/controllers/anti-cheat.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { AntiCheatService, EventType, RuleAction, RuleInput } from '../services/anti-cheat.service.js';
import { verifyStudentToken } from '../services/session.service.js';
import { CollaborationService } from '../services/collaboration.service.js';
import prisma from '../config/database.js';

const svc = new AntiCheatService();
const collaborationService = new CollaborationService();

const getTeacherId = (req: Request): string => (req as any).user.id;
const statusFromError = (message: string) =>
  message.includes('not found') ? 404
    : message.includes('Access denied') ? 403
      : 400;

// ─── Rule endpoints (teacher) ─────────────────────────────────────────────────

/**
 * @openapi
 * /api/exams/{examId}/anti-cheat/rules:
 *   get:
 *     tags: [Anti-Cheat]
 *     summary: Get anti-cheat rules for an exam
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of rule objects
 */
export const getExamRules = async (req: Request, res: Response) => {
  try {
    const { examId } = z.object({ examId: z.string() }).parse(req.params);
    const requesterId = getTeacherId(req);
    const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { ownerId: true } });
    if (!exam) return res.status(404).json({ error: 'Exam not found.' });
    if (exam.ownerId !== requesterId && !(await collaborationService.getUserRole(examId, requesterId))) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const rules = await svc.getExamRules(examId);
    return res.json(rules);
  } catch (err: any) {
    return res.status(statusFromError(err.message)).json({ error: err.message });
  }
};

/**
 * @openapi
 * /api/exams/{examId}/anti-cheat/rules:
 *   put:
 *     tags: [Anti-Cheat]
 *     summary: Save anti-cheat rules for an exam (teacher only)
 *     security: [{ bearerAuth: [] }]
 */
export const updateExamRules = async (req: Request, res: Response) => {
  try {
    const { examId } = z.object({ examId: z.string() }).parse(req.params);

    const ruleSchema = z.object({
      eventType: z.string(),
      enabled:   z.boolean(),
      action:    z.enum(['ignore', 'warn', 'flag', 'block', 'auto_submit']),
      threshold: z.number().int().positive().nullable().optional(),
    });
    const { rules } = z.object({ rules: z.array(ruleSchema) }).parse(req.body);

    // Rule configuration is exam settings — owner or Collaborator, not Invigilator.
    const ownerId = getTeacherId(req);
    const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { ownerId: true } });
    if (!exam) return res.status(404).json({ error: 'Exam not found.' });
    if (exam.ownerId !== ownerId) {
      await collaborationService.requireAccess(examId, ownerId, 'update_exam_details');
    }

    const saved = await svc.upsertRules(examId, rules as RuleInput[]);
    return res.json(saved);
  } catch (err: any) {
    return res.status(statusFromError(err.message)).json({ error: err.message });
  }
};

// ─── Violation endpoints (student) ────────────────────────────────────────────

/**
 * @openapi
 * /api/attempts/{attemptId}/violations:
 *   post:
 *     tags: [Anti-Cheat]
 *     summary: Report a violation event (student JWT required)
 *     security: [{ bearerAuth: [] }]
 */
export const reportViolation = async (req: Request, res: Response) => {
  try {
    // Student MUST authenticate with their JWT — no body fallback
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Student token required.' });
    }
    const payload = verifyStudentToken(authHeader.split(' ')[1]);

    const paramAttemptId = z.object({ attemptId: z.string() }).parse(req.params).attemptId;
    // Ensure the token's attemptId matches the route param
    if (payload.attemptId !== paramAttemptId) {
      return res.status(403).json({ error: 'Token does not match attempt.' });
    }

    const body = z.object({
      eventType:  z.string(),
      detail:     z.string().optional(),
      batchCount: z.number().int().min(1).max(100).optional().default(1),
    }).parse(req.body);

    const result = await svc.recordViolation(
      payload.attemptId,
      body.eventType as EventType,
      body.detail,
      body.batchCount,
    );

    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

/**
 * @openapi
 * /api/attempts/{attemptId}/violations/offline-flush:
 *   post:
 *     tags: [Anti-Cheat]
 *     summary: Flush violations collected while offline (student JWT required)
 *     security: [{ bearerAuth: [] }]
 */
export const flushOfflineQueue = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Student token required.' });
    }
    const payload = verifyStudentToken(authHeader.split(' ')[1]);
    const paramAttemptId = z.object({ attemptId: z.string() }).parse(req.params).attemptId;
    if (payload.attemptId !== paramAttemptId) {
      return res.status(403).json({ error: 'Token does not match attempt.' });
    }

    const queueSchema = z.array(z.object({
      eventType:  z.string(),
      detail:     z.string().optional(),
      occurredAt: z.string(),
      batchCount: z.number().int().min(1).optional(),
    }));
    const queue = queueSchema.parse(req.body);

    const results = await svc.flushOfflineQueue(
      payload.attemptId,
      queue as any[],
    );
    return res.json({ flushed: results.length, results });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

/**
 * @openapi
 * /api/attempts/{attemptId}/anti-cheat/config:
 *   get:
 *     tags: [Anti-Cheat]
 *     summary: Rules the student's exam page must enforce (student token)
 */
export const getStudentAntiCheatConfig = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Student token required.' });
    }
    const payload = verifyStudentToken(authHeader.split(' ')[1]);
    const attemptId = z.object({ attemptId: z.string() }).parse(req.params).attemptId;
    if (payload.attemptId !== attemptId) {
      return res.status(403).json({ error: 'Token does not match attempt.' });
    }
    return res.json(await svc.getStudentConfig(payload.examId));
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

// ─── Violation log endpoints (teacher) ────────────────────────────────────────

/**
 * @openapi
 * /api/exams/{examId}/violations:
 *   get:
 *     tags: [Anti-Cheat]
 *     summary: Get violation logs for an exam (teacher only)
 *     security: [{ bearerAuth: [] }]
 */
export const getViolationLogs = async (req: Request, res: Response) => {
  try {
    const { examId } = z.object({ examId: z.string() }).parse(req.params);
    const ownerId = getTeacherId(req);
    const q = z.object({
      severity:   z.string().optional(),
      eventType:  z.string().optional(),
      resolved:   z.enum(['true', 'false']).optional(),
      attemptId:  z.string().optional(),
      page:       z.coerce.number().int().min(1).default(1),
      pageSize:   z.coerce.number().int().min(1).max(200).default(50),
    }).parse(req.query);

    const result = await svc.getViolationLogs(examId, ownerId, {
      severity:  q.severity,
      eventType: q.eventType,
      resolved:  q.resolved !== undefined ? q.resolved === 'true' : undefined,
      attemptId: q.attemptId,
      page:      q.page,
      pageSize:  q.pageSize,
    });
    return res.json(result);
  } catch (err: any) {
    const status = err.message === 'Exam not found.' ? 404 : err.message === 'Access denied.' ? 403 : 400;
    return res.status(status).json({ error: err.message });
  }
};

/**
 * @openapi
 * /api/violations:
 *   get:
 *     tags: [Anti-Cheat]
 *     summary: Violation logs across all of the teacher's exams (Security Logs page)
 *     security: [{ bearerAuth: [] }]
 */
export const getMyViolations = async (req: Request, res: Response) => {
  try {
    const ownerId = getTeacherId(req);
    const q = z.object({
      examId:     z.string().optional(),
      severity:   z.string().optional(),
      eventType:  z.string().optional(),
      resolved:   z.enum(['true', 'false']).optional(),
      page:       z.coerce.number().int().min(1).default(1),
      pageSize:   z.coerce.number().int().min(1).max(500).default(200),
    }).parse(req.query);

    const result = await svc.getViolationLogsForOwner(ownerId, {
      examId:    q.examId,
      severity:  q.severity,
      eventType: q.eventType,
      resolved:  q.resolved !== undefined ? q.resolved === 'true' : undefined,
      page:      q.page,
      pageSize:  q.pageSize,
    });
    return res.json(result);
  } catch (err: any) {
    const status = err.message === 'Exam not found.' ? 404 : 400;
    return res.status(status).json({ error: err.message });
  }
};

/**
 * @openapi
 * /api/violations/export:
 *   get:
 *     tags: [Anti-Cheat]
 *     summary: Export violation logs across all of the teacher's exams as CSV
 *     security: [{ bearerAuth: [] }]
 */
export const exportMyViolationsCsv = async (req: Request, res: Response) => {
  try {
    const ownerId = getTeacherId(req);
    const q = z.object({
      examId:    z.string().optional(),
      severity:  z.string().optional(),
      eventType: z.string().optional(),
      resolved:  z.enum(['true', 'false']).optional(),
    }).parse(req.query);

    const csv = await svc.exportCsvForOwner(ownerId, {
      examId:    q.examId,
      severity:  q.severity,
      eventType: q.eventType,
      resolved:  q.resolved !== undefined ? q.resolved === 'true' : undefined,
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="security-logs.csv"');
    return res.send(csv);
  } catch (err: any) {
    return res.status(statusFromError(err.message)).json({ error: err.message });
  }
};

/**
 * @openapi
 * /api/exams/{examId}/violations/export:
 *   get:
 *     tags: [Anti-Cheat]
 *     summary: Export violation logs as CSV (teacher only)
 *     security: [{ bearerAuth: [] }]
 */
export const exportViolationsCsv = async (req: Request, res: Response) => {
  try {
    const { examId } = z.object({ examId: z.string() }).parse(req.params);
    const ownerId = getTeacherId(req);
    const csv = await svc.exportCsv(examId, ownerId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="violations-${examId}.csv"`);
    return res.send(csv);
  } catch (err: any) {
    const status = err.message === 'Exam not found.' ? 404 : err.message === 'Access denied.' ? 403 : 400;
    return res.status(status).json({ error: err.message });
  }
};

/**
 * @openapi
 * /api/exams/{examId}/violations/live-summary:
 *   get:
 *     tags: [Anti-Cheat]
 *     summary: Per-student violation summary for live monitoring (teacher only)
 *     security: [{ bearerAuth: [] }]
 */
export const getLiveStudentSummary = async (req: Request, res: Response) => {
  try {
    const { examId } = z.object({ examId: z.string() }).parse(req.params);
    const ownerId = getTeacherId(req);
    const summary = await svc.getLiveStudentSummary(examId, ownerId);
    return res.json(summary);
  } catch (err: any) {
    const status = err.message === 'Exam not found.' ? 404 : err.message === 'Access denied.' ? 403 : 400;
    return res.status(status).json({ error: err.message });
  }
};

/**
 * @openapi
 * /api/violations/{id}/resolve:
 *   patch:
 *     tags: [Anti-Cheat]
 *     summary: Mark a violation as resolved (teacher only)
 *     security: [{ bearerAuth: [] }]
 */
export const resolveViolation = async (req: Request, res: Response) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const ownerId = getTeacherId(req);
    const resolved = await svc.resolveViolation(id, ownerId);
    return res.json(resolved);
  } catch (err: any) {
    const status = err.message === 'Violation log not found.' ? 404 : err.message === 'Access denied.' ? 403 : 400;
    return res.status(status).json({ error: err.message });
  }
};
