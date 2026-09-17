// src/controllers/anti-cheat.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { AntiCheatService, EventType, RuleAction, RuleInput } from '../services/anti-cheat.service.js';
import { verifyStudentToken } from '../services/session.service.js';

const svc = new AntiCheatService();

const getTeacherId = (req: Request): string => (req as any).user.id;

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
    const rules = await svc.getExamRules(examId);
    return res.json(rules);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
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

    // Verify ownership
    const ownerId = getTeacherId(req);
    const { default: prisma } = await import('../config/database.js');
    const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { ownerId: true } });
    if (!exam)              return res.status(404).json({ error: 'Exam not found.' });
    if (exam.ownerId !== ownerId) return res.status(403).json({ error: 'Access denied.' });

    const saved = await svc.upsertRules(examId, rules as RuleInput[]);
    return res.json(saved);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
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
    const q = z.object({
      severity:   z.string().optional(),
      eventType:  z.string().optional(),
      resolved:   z.enum(['true', 'false']).optional(),
      attemptId:  z.string().optional(),
      page:       z.coerce.number().int().min(1).default(1),
      pageSize:   z.coerce.number().int().min(1).max(200).default(50),
    }).parse(req.query);

    const result = await svc.getViolationLogs(examId, {
      severity:  q.severity,
      eventType: q.eventType,
      resolved:  q.resolved !== undefined ? q.resolved === 'true' : undefined,
      attemptId: q.attemptId,
      page:      q.page,
      pageSize:  q.pageSize,
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

/**
 * @openapi
 * /api/violations:
 *   get:
 *     tags: [Anti-Cheat]
 *     summary: Get all violation logs for all exams owned by the teacher
 *     security: [{ bearerAuth: [] }]
 */
export const getAllViolationLogs = async (req: Request, res: Response) => {
  try {
    const ownerId = getTeacherId(req);
    const q = z.object({
      severity:   z.string().optional(),
      eventType:  z.string().optional(),
      resolved:   z.enum(['true', 'false']).optional(),
      attemptId:  z.string().optional(),
      examId:     z.string().optional(),
      page:       z.coerce.number().int().min(1).default(1),
      pageSize:   z.coerce.number().int().min(1).max(200).default(50),
    }).parse(req.query);

    const result = await svc.getAllViolationLogs(ownerId, {
      severity:  q.severity,
      eventType: q.eventType,
      resolved:  q.resolved !== undefined ? q.resolved === 'true' : undefined,
      attemptId: q.attemptId,
      examId:    q.examId,
      page:      q.page,
      pageSize:  q.pageSize,
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
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
    const csv = await svc.exportCsv(examId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="violations-${examId}.csv"`);
    return res.send(csv);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
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
    const summary = await svc.getLiveStudentSummary(examId);
    return res.json(summary);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
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
    return res.status(400).json({ error: err.message });
  }
};
