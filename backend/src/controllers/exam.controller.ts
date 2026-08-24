// backend/src/controllers/exam.controller.ts
import { Request, Response } from 'express';
import { ExamService } from '../services/exam.service.js';
import { ExamStatus } from '@prisma/client';
import { z } from 'zod';

const examService = new ExamService();

// Helper to get ownerId from authenticated request
const getOwnerId = (req: Request): string => (req as any).user.id;

const idSchema = z.object({id: z.string()});
// Define the validation schema for creating/updating exam
const examSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subject: z.string().optional(),
  startDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format must be MM/dd/yyyy').optional(),
  startTime: z.string().regex(/^\d{2}:\d{2} (AM|PM)$/, 'Format must be hh:mm AM/PM').optional(),
  duration: z.number().int().positive().optional(),
  timezone: z.string().optional(),
  passingScore: z.number().optional(),
  maxAttempts: z.number().int().positive().optional(),
  randomizeQuestions: z.boolean().optional(),
  showResults: z.boolean().optional(),
  accessType: z.enum(['PUBLIC', 'PRIVATE', 'PASSWORD_PROTECTED']).optional(),
  password: z.string().optional(),
  // status is handled separately
}).refine((data) => {
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
    const validatedData = examSchema.parse(req.body);
    const exam = await examService.createExam(ownerId, validatedData);
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

export const getExamById = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const exam = await examService.getExamById(id, ownerId);
    res.status(200).json(exam);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const exam = await examService.updateExam(id, ownerId, req.body);
    res.status(200).json(exam);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const result = await examService.deleteExam(id, ownerId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const duplicateExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const newExam = await examService.duplicateExam(id, ownerId);
    res.status(201).json(newExam);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const publishExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const result = await examService.publishExam(id, ownerId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const archiveExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const exam = await examService.archiveExam(id, ownerId);
    res.status(200).json(exam);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const previewExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = idSchema.parse(req.params);
    const preview = await examService.previewExam(id, ownerId);
    res.status(200).json(preview);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
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
    res.status(400).json({ message: error.message });
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
    res.status(400).json({ message: error.message });
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