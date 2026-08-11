// src/controllers/grading.controller.ts
import { Request, Response } from 'express';
import { GradingService } from '../services/grading.service.js';
import { z } from 'zod';

const gradingService = new GradingService();

// ─── Validation Schemas ───────────────────────────────────────────────────────

const submittedAnswerSchema = z.object({
  questionId: z.string(),
  selectedOptionIds: z.array(z.string()).optional(),
  textAnswer: z.string().optional(),
  matchingPairs: z
    .array(z.object({ leftId: z.string(), rightId: z.string() }))
    .optional(),
  fileUrl: z.string().url().optional(),
});

const submitSchema = z.object({
  answers: z.array(submittedAnswerSchema).min(1, 'At least one answer is required'),
});

const gradeAnswerSchema = z.object({
  score: z.number().min(0),
  feedback: z.string().optional(),
});

const batchGradeSchema = z.object({
  grades: z.array(
    z.object({
      answerId: z.string(),
      score: z.number().min(0),
      feedback: z.string().optional(),
    })
  ).min(1),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTeacherId = (req: Request): string => (req as any).user.id;

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/exams/:examId/attempts/:attemptId/submit
 * Save student answers and trigger auto-grading.
 */
export const submitAttempt = async (req: Request, res: Response) => {
  try {
    const { attemptId } = z.object({ attemptId: z.string() }).parse(req.params);
    const { answers } = submitSchema.parse(req.body);

    const result = await gradingService.submitAndGrade(attemptId, answers);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/exams/:examId/attempts?status=needs_review
 * Fetch student answers awaiting manual grading (teacher only).
 */
export const getPendingReviews = async (req: Request, res: Response) => {
  try {
    const { examId } = z.object({ examId: z.string() }).parse(req.params);
    const pending = await gradingService.getPendingReviews(examId);
    return res.status(200).json(pending);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * PUT /api/student-answers/:answerId/grade
 * Teacher assigns a score (and optional feedback) to a single answer.
 */
export const gradeStudentAnswer = async (req: Request, res: Response) => {
  try {
    const { answerId } = z.object({ answerId: z.string() }).parse(req.params);
    const { score, feedback } = gradeAnswerSchema.parse(req.body);
    const gradedBy = getTeacherId(req);

    const result = await gradingService.gradeAnswer(answerId, score, feedback, gradedBy);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * POST /api/student-answers/batch-grade
 * Teacher grades multiple answers in one request.
 */
export const batchGradeAnswers = async (req: Request, res: Response) => {
  try {
    const { grades } = batchGradeSchema.parse(req.body);
    const gradedBy = getTeacherId(req);

    const results = await gradingService.batchGradeAnswers(grades, gradedBy);
    return res.status(200).json({ graded: results.length, results });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * POST /api/exams/:examId/attempts/:attemptId/regrade
 * Re-run auto-grading on a specific attempt (e.g., after answer key changes).
 */
export const regradeAttempt = async (req: Request, res: Response) => {
  try {
    const { attemptId } = z.object({ attemptId: z.string() }).parse(req.params);
    const result = await gradingService.regradeAttempt(attemptId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
