// backend/src/controllers/student.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import * as StudentService from '../services/student.service.js';
import { StudentRequest } from '../middleware/student.middleware.js';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/exam/state?attemptId=<id>
// ─────────────────────────────────────────────────────────────────────────────
export const getExamState = async (req: StudentRequest, res: Response) => {
  try {
    const attemptId = req.attempt!.id;
    const state = await StudentService.getExamState(attemptId);
    res.status(200).json(state);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/exam/autosave
// ─────────────────────────────────────────────────────────────────────────────
const autosaveSchema = z.object({
  attemptId: z.string(),
  answers: z.record(
    z.string(),
    z.object({ answer: z.unknown() })
  ),
});

export const autosaveAnswers = async (req: StudentRequest, res: Response) => {
  try {
    const { answers } = autosaveSchema.parse(req.body);
    const attemptId = req.attempt!.id;
    const result = await StudentService.autosaveAnswers(attemptId, answers);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/exam/questions/:id/review
// ─────────────────────────────────────────────────────────────────────────────
const reviewSchema = z.object({
  attemptId: z.string(),
});

export const toggleReviewFlag = async (req: StudentRequest, res: Response) => {
  try {
    const { id: questionId } = z.object({ id: z.string() }).parse(req.params);
    const attemptId = req.attempt!.id;
    const result = await StudentService.toggleReviewFlag(attemptId, questionId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/exam/math-upload/session
// ─────────────────────────────────────────────────────────────────────────────
export const createMathUploadSession = async (
  req: StudentRequest,
  res: Response
) => {
  try {
    const attemptId = req.attempt!.id;
    const session = await StudentService.createMathUploadSession(attemptId);
    res.status(201).json(session);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/exam/math-upload
// ─────────────────────────────────────────────────────────────────────────────
const mathUploadBodySchema = z.object({
  sessionToken: z.string(),
  questionId: z.string().optional(),
});

export const processMathUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Provide a file in the "file" field.' });
    }

    const { sessionToken, questionId } = mathUploadBodySchema.parse(req.body);
    const result = await StudentService.processMathUpload(
      sessionToken,
      req.file,
      questionId
    );
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/exam/submit
// ─────────────────────────────────────────────────────────────────────────────
export const submitExam = async (req: StudentRequest, res: Response) => {
  try {
    const attemptId = req.attempt!.id;
    const result = await StudentService.submitExam(attemptId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
