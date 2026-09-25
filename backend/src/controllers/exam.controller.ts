// backend/src/controllers/exam.controller.ts
import { Request, Response } from 'express';
import { ExamService } from '../services/exam.service.js';
import { ExamStatus } from '@prisma/client';
import { z } from 'zod';
import { scheduleAutoStart } from '../services/session.service.js';

const examService = new ExamService();

// Helper to get ownerId from authenticated request
const getOwnerId = (req: Request): string => (req as any).user.id;
const statusFromError = (message: string) =>
  message.includes('not found') ? 404
    : message.includes('Access denied') ? 403
      : 400;

const idSchema = z.object({id: z.string()});
// Define the validation schema for creating/updating exam
const examSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subject: z.string().optional(),
  startDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format must be MM/dd/yyyy').optional(),
  startTime: z.string().regex(/^\d{2}:\d{2} (AM|PM)$/, 'Format must be hh:mm AM/PM').optional(),
  // Optional explicit close time; blank means start + duration + late allowance.
  endDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format must be MM/dd/yyyy').nullable().optional(),
  endTime: z.string().regex(/^\d{2}:\d{2} (AM|PM)$/, 'Format must be hh:mm AM/PM').nullable().optional(),
  duration: z.number().int().positive().optional(),
  timezone: z.string().optional(),
  passingScore: z.number().optional(),
  // null = unlimited attempts
  maxAttempts: z.number().int().positive().nullable().optional(),
  randomizeQuestions: z.boolean().optional(),
  shuffleAnswers: z.boolean().optional(),
  showResults: z.boolean().optional(),
  requireLateApproval: z.boolean().optional(),
  lateAllowanceMinutes: z.number().int().min(0).max(480).optional(),
  // true = the teacher starts the exam by hand; it never auto-starts on schedule
  manualStart: z.boolean().optional(),
  accessType: z.enum(['PUBLIC', 'PRIVATE', 'PASSWORD_PROTECTED']).optional(),
  password: z.string().optional(),
  fullSections: z.array(z.any()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
}).passthrough().refine((data) => {
  // If accessType is PASSWORD_PROTECTED, password must be provided
  if (data.accessType === 'PASSWORD_PROTECTED' && !data.password) {
    return false;
  }
  return true;
}, {
  message: 'Password is required when accessType is PASSWORD_PROTECTED',
  path: ['password'],
});

export const createExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const data = examSchema.parse(req.body);
    const exam = await examService.createExam(ownerId, data);
    if (data.status === 'PUBLISHED') {
      const result = await examService.publishExam(exam.id, ownerId);
      if (result.exam.startDate && new Date(result.exam.startDate) > new Date()) {
        scheduleAutoStart(result.exam.id, new Date(result.exam.startDate));
      }
      return res.status(201).json(result.exam);
    }
    res.status(201).json(exam);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getExams = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const filters = {
      status: req.query.status as ExamStatus,
      subject: req.query.subject as string,
      startDateFrom: req.query.startDateFrom ? new Date(req.query.startDateFrom as string) : undefined,
      startDateTo: req.query.startDateTo ? new Date(req.query.startDateTo as string) : undefined,
    };
    const exams = await examService.getExams(ownerId, filters);
    res.status(200).json(exams);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getAccessibleExams = async (req: Request, res: Response) => {
  try {
    const userId = getOwnerId(req);
    const exams = await examService.getAccessibleExams(userId);
    res.status(200).json(exams);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const getExamById = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const exam = await examService.getExamById(id, ownerId);
    res.status(200).json(exam);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const updateExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const exam = await examService.updateExam(id, ownerId, req.body);
    // Re-schedule auto-start if this exam has a future startDate and is published
    if (exam.startDate && exam.status === 'PUBLISHED') {
      scheduleAutoStart(exam.id, new Date(exam.startDate));
    }
    res.status(200).json(exam);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const deleteExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const result = await examService.deleteExam(id, ownerId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const duplicateExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const newExam = await examService.duplicateExam(id, ownerId);
    res.status(201).json(newExam);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const publishExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const result = await examService.publishExam(id, ownerId);
    // Schedule auto-start if exam has a future startDate
    const exam = (result as any).exam || result;
    if (exam.startDate && new Date(exam.startDate) > new Date()) {
      scheduleAutoStart(exam.id, new Date(exam.startDate));
    }
    res.status(200).json(result);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const archiveExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const exam = await examService.archiveExam(id, ownerId);
    res.status(200).json(exam);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const unarchiveExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const exam = await examService.unarchiveExam(id, ownerId);
    res.status(200).json(exam);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

const reopenSchema = z.object({
  // Minutes from now until the (re)scheduled start. 0 means start immediately.
  startsInMinutes: z.number().int().min(0).max(60 * 24 * 14).default(0),
  duration: z.number().int().min(1).optional(),
  endDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format must be MM/dd/yyyy').nullable().optional(),
  endTime: z.string().regex(/^\d{2}:\d{2} (AM|PM)$/, 'Format must be hh:mm AM/PM').nullable().optional(),
});

export const reopenExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const opts = reopenSchema.parse(req.body ?? {});
    const exam = await examService.reopenExam(id, ownerId, opts);
    // The 15s sweeper would catch it too, but this starts it on the dot.
    if (exam.startDate) scheduleAutoStart(exam.id, new Date(exam.startDate));
    res.status(200).json(exam);
  } catch (error: any) {
    const message = error?.issues?.[0]?.message ?? error.message;
    res.status(statusFromError(message)).json({ message });
  }
};

export const previewExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const preview = await examService.previewExam(id, ownerId);
    res.status(200).json(preview);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};
export const startExamSession = async (req: Request, res: Response) => {
  try {
        const schema = z.object({ examId: z.string() });
        const { examId } = schema.parse(req.params);
    // Optionally get studentId from query/body if authenticated
    const studentId = req.body.studentId || undefined;
    const result = await examService.startExamSession(examId, studentId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// TIMER ENDPOINTS (SRS 3.9)
// ════════════════════════════════════════════════════════════════════════════

const timerConfigSchema = z.object({
  duration: z.number().int().positive().optional(),
  autoStart: z.boolean().optional(),
  autoClose: z.boolean().optional(),
  autoSubmit: z.boolean().optional(),
  showCountdown: z.boolean().optional(),
  lateAllowanceMinutes: z.number().int().min(0).optional(),
  endDate: z.string().optional(),
});

export const updateTimerConfig = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const config = timerConfigSchema.parse(req.body);
    const exam = await examService.updateTimerConfig(id, ownerId, config);
    res.status(200).json(exam);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

const extraTimeSchema = z.object({
  studentId: z.string(),
  extraMinutes: z.number().int().min(0),
});

export const setExtraTime = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const { studentId, extraMinutes } = extraTimeSchema.parse(req.body);
    const result = await examService.setExtraTime(id, ownerId, studentId, extraMinutes);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const autoSubmitAttempt = async (req: Request, res: Response) => {
  try {
    const { attemptId } = z.object({ attemptId: z.string() }).parse(req.params);
    const result = await examService.autoSubmitAttempt(attemptId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTimerStatus = async (req: Request, res: Response) => {
  try {
    const { attemptId } = z.object({ attemptId: z.string() }).parse(req.params);
    const status = await examService.getTimerStatus(attemptId);
    res.status(200).json(status);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};