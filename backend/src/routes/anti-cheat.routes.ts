// src/routes/anti-cheat.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  getExamRules,
  updateExamRules,
  reportViolation,
  flushOfflineQueue,
  getStudentAntiCheatConfig,
  getViolationLogs,
  getAllViolationLogs,
  exportViolationsCsv,
  getLiveStudentSummary,
  resolveViolation,
  getMyViolations,
  exportMyViolationsCsv,
} from '../controllers/anti-cheat.controller.js';

const router = Router();

// ── Teacher: rule configuration ───────────────────────────────────────────────
router.get( '/exams/:examId/anti-cheat/rules',     authMiddleware, getExamRules);
router.put( '/exams/:examId/anti-cheat/rules',     authMiddleware, updateExamRules);

// ── Student: report violations ────────────────────────────────────────────────
// NOTE: uses student JWT (verified in controller), NOT authMiddleware (teacher JWT)
router.get( '/attempts/:attemptId/anti-cheat/config',      getStudentAntiCheatConfig);
router.post('/attempts/:attemptId/violations',             reportViolation);
router.post('/attempts/:attemptId/violations/offline-flush', flushOfflineQueue);

// ── Teacher: read violations ──────────────────────────────────────────────────
router.get( '/exams/:examId/violations',              authMiddleware, getViolationLogs);
router.get( '/exams/:examId/violations/export',       authMiddleware, exportViolationsCsv);
router.get( '/exams/:examId/violations/live-summary', authMiddleware, getLiveStudentSummary);
router.patch('/violations/:id/resolve',               authMiddleware, resolveViolation);

// ── Teacher: violations across all owned exams (Security Logs page) ────────────
router.get( '/violations',        authMiddleware, getMyViolations);
router.get( '/violations/export', authMiddleware, exportMyViolationsCsv);

export default router;
