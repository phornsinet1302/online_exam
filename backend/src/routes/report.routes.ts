// backend/src/routes/report.routes.ts
import { Router } from 'express';
import {
  getScoresReport,
  getAttendanceReport,
  getAntiCheatingReport,
  getQuestionAnalysisReport,
  getExamAnalytics,
  exportPDF,
  exportExcel,
  exportCSV,
} from '../controllers/report.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/reports/scores:
 *   get:
 *     tags: [Reports]
 *     summary: Get student scores report
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: examId
 *         schema: { type: string }
 *         description: Filter by specific exam (optional)
 *     responses:
 *       200:
 *         description: Scores report data
 */
router.get('/reports/scores', getScoresReport);

/**
 * @openapi
 * /api/reports/attendance:
 *   get:
 *     tags: [Reports]
 *     summary: Get attendance report
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: examId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attendance report data
 */
router.get('/reports/attendance', getAttendanceReport);

/**
 * @openapi
 * /api/reports/anti-cheating:
 *   get:
 *     tags: [Reports]
 *     summary: Get anti-cheating report
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: examId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Anti-cheating report data
 */
router.get('/reports/anti-cheating', getAntiCheatingReport);

/**
 * @openapi
 * /api/reports/questions:
 *   get:
 *     tags: [Reports]
 *     summary: Get question analysis report
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: examId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Question analysis report data
 */
router.get('/reports/questions', getQuestionAnalysisReport);

/**
 * @openapi
 * /api/reports/analytics:
 *   get:
 *     tags: [Reports]
 *     summary: Get exam analytics overview
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Analytics overview data
 */
router.get('/reports/analytics', getExamAnalytics);

/**
 * @openapi
 * /api/export/pdf:
 *   post:
 *     tags: [Export]
 *     summary: Export report as PDF
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [SCORES, ATTENDANCE, EXAM, ANTI_CHEATING, QUESTION_ANALYSIS]
 *               examId:
 *                 type: string
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf: {}
 */
router.post('/export/pdf', exportPDF);

/**
 * @openapi
 * /api/export/excel:
 *   post:
 *     tags: [Export]
 *     summary: Export report as Excel
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [SCORES, ATTENDANCE, EXAM, ANTI_CHEATING, QUESTION_ANALYSIS]
 *               examId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Excel file download
 */
router.post('/export/excel', exportExcel);

/**
 * @openapi
 * /api/export/csv:
 *   post:
 *     tags: [Export]
 *     summary: Export report as CSV
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [SCORES, ATTENDANCE, EXAM, ANTI_CHEATING, QUESTION_ANALYSIS]
 *               examId:
 *                 type: string
 *     responses:
 *       200:
 *         description: CSV file download
 */
router.post('/export/csv', exportCSV);

export default router;
