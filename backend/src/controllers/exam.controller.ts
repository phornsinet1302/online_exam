// backend/src/controllers/exam.controller.ts
import { Request, Response } from 'express';
import { ExamService } from '../services/exam.service.js';
import { ExamStatus } from '@prisma/client';
import { z } from 'zod';
import id from 'zod/v4/locales/id.js';

const examService = new ExamService();

// Helper to get ownerId from authenticated request
const getOwnerId = (req: Request): string => (req as any).user.id;

const idSchema = z.object({id: z.string()});

export const createExam = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    const exam = await examService.createExam(ownerId, req.body);
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