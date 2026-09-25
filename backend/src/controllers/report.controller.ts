// backend/src/controllers/report.controller.ts
import { Request, Response } from 'express';
import { ReportService } from '../services/report.service.js';
import { z } from 'zod';

const reportService = new ReportService();
const getUserId = (req: Request): string => (req as any).user.id;

// ── Scores Report ────────────────────────────────────────────────────────
export const getScoresReport = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const examId = req.query.examId as string | undefined;
    const report = await reportService.getScoresReport(userId, examId);
    res.status(200).json(report);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ── Attendance Report ────────────────────────────────────────────────────
export const getAttendanceReport = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const examId = req.query.examId as string | undefined;
    const report = await reportService.getAttendanceReport(userId, examId);
    res.status(200).json(report);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ── Anti-Cheating Report ─────────────────────────────────────────────────
export const getAntiCheatingReport = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const examId = req.query.examId as string | undefined;
    const report = await reportService.getAntiCheatingReport(userId, examId);
    res.status(200).json(report);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ── Question Analysis Report ─────────────────────────────────────────────
export const getQuestionAnalysisReport = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const examId = req.query.examId as string | undefined;
    const report = await reportService.getQuestionAnalysis(userId, examId);
    res.status(200).json(report);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ── Exam Analytics (overview) ────────────────────────────────────────────
export const getExamAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const report = await reportService.getExamAnalytics(userId);
    res.status(200).json(report);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ── Export Report ─────────────────────────────────────────────────────────
const exportSchema = z.object({
  type: z.enum(['SCORES', 'ATTENDANCE', 'EXAM', 'ANTI_CHEATING', 'QUESTION_ANALYSIS']),
  examId: z.string().optional(),
  // Only used by type: 'EXAM' — the Reports → Export tab's sidebar filters.
  filters: z.object({
    status: z.string().optional(),
    subjects: z.array(z.string()).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }).optional(),
});

const toExamListFilters = (filters?: { status?: string; subjects?: string[]; dateFrom?: string; dateTo?: string }) =>
  filters && {
    status: filters.status,
    subjects: filters.subjects,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
  };

export const exportPDF = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { type, examId, filters } = exportSchema.parse(req.body);
    const result = await reportService.exportReport(type, 'PDF', userId, examId, toExamListFilters(filters));
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const exportExcel = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { type, examId, filters } = exportSchema.parse(req.body);
    const result = await reportService.exportReport(type, 'EXCEL', userId, examId, toExamListFilters(filters));
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const exportCSV = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { type, examId, filters } = exportSchema.parse(req.body);
    const result = await reportService.exportReport(type, 'CSV', userId, examId, toExamListFilters(filters));
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
