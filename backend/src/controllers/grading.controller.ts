// src/controllers/grading.controller.ts
import { Request, Response } from 'express';
import { GradingService } from '../services/grading.service.js';
import { GradeReportService, GRADE_EXPORT_FIELDS } from '../services/grade-report.service.js';
import { z } from 'zod';

const gradingService = new GradingService();
const gradeReportService = new GradeReportService();

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
const statusFromError = (message: string) =>
  message.includes('not found') ? 404
    : message.includes('Access denied') ? 403
      : 400;

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
 * GET /api/exams/:examId/attempts/pending-review
 * Fetch student answers for manual grading (teacher only).
 * Query param ?all=true fetches all answers for overriding.
 */
export const getPendingReviews = async (req: Request, res: Response) => {
  try {
    const { examId } = z.object({ examId: z.string() }).parse(req.params);
    const requesterId = getTeacherId(req);
    const filterAll = req.query.all === 'true';
    const pending = await gradingService.getReviews(examId, requesterId, filterAll);
    return res.status(200).json(pending);
  } catch (error: any) {
    return res.status(statusFromError(error.message)).json({ error: error.message });
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
    return res.status(statusFromError(error.message)).json({ error: error.message });
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
    return res.status(statusFromError(error.message)).json({ error: error.message });
  }
};

/**
 * POST /api/exams/:examId/attempts/:attemptId/regrade
 * Re-run auto-grading on a specific attempt (e.g., after answer key changes).
 */
export const regradeAttempt = async (req: Request, res: Response) => {
  try {
    const { attemptId } = z.object({ attemptId: z.string() }).parse(req.params);
    const requesterId = getTeacherId(req);
    const result = await gradingService.regradeAttempt(attemptId, requesterId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(statusFromError(error.message)).json({ error: error.message });
  }
};

/**
 * GET /api/exams/:examId/grades
 * Every submitted attempt with its score, grade, status and per-question
 * answer-vs-correct-answer breakdown (owner / Collaborator).
 */
export const getExamGrades = async (req: Request, res: Response) => {
  try {
    const { examId } = z.object({ examId: z.string() }).parse(req.params);
    const result = await gradeReportService.getExamGrades(examId, getTeacherId(req));
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(statusFromError(error.message)).json({ error: error.message });
  }
};

/**
 * POST /api/exams/:examId/grades/export
 * Downloads the grade sheet as CSV / Excel / PDF with the chosen fields.
 */
export const exportExamGrades = async (req: Request, res: Response) => {
  try {
    const { examId } = z.object({ examId: z.string() }).parse(req.params);
    const { format, fields } = z.object({
      format: z.enum(['csv', 'excel', 'pdf']),
      fields: z.array(z.enum(GRADE_EXPORT_FIELDS)).min(1, 'Select at least one field to export.'),
    }).parse(req.body);
    const result = await gradeReportService.exportGrades(examId, getTeacherId(req), format, fields);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.data);
  } catch (error: any) {
    const message = error?.issues?.[0]?.message ?? error.message;
    return res.status(statusFromError(message)).json({ error: message });
  }
};
