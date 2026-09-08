// src/routes/session.routes.ts
import { Router } from 'express';
import {
  joinByCode,
  registerStudent,
  getSessionState,
  liveSessionStream,
  liveTeacherStream,
  startSession,
  endSession,
  saveProgress,
  kickStudent,
  validateAttempt,
  approveLateStudent,
  rejectLateStudent,
} from '../controllers/session.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/join:
 *   post:
 *     tags: [Student Session]
 *     summary: Validate exam code and get public exam info
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, example: "MATH-2026-XZ" }
 *     responses:
 *       200:
 *         description: Exam info (public fields only)
 *       400:
 *         description: Invalid code, exam not published, or late-join window closed
 */
router.post('/join', joinByCode);

/**
 * @openapi
 * /api/join/register:
 *   post:
 *     tags: [Student Session]
 *     summary: Register student info and create exam attempt
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [examId, name, studentId, email]
 *             properties:
 *               examId:    { type: string }
 *               name:      { type: string }
 *               studentId: { type: string }
 *               email:     { type: string, format: email }
 *     responses:
 *       201:
 *         description: Student token and exam snapshot
 */
router.post('/join/register', registerStudent);

/**
 * @openapi
 * /api/join/validate:
 *   post:
 *     tags: [Student Session]
 *     summary: Validate that a student attempt still exists
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [attemptId, examId]
 *             properties:
 *               attemptId: { type: string }
 *               examId:    { type: string }
 *     responses:
 *       200:
 *         description: Validation result
 */
router.post('/join/validate', validateAttempt);

/**
 * @openapi
 * /api/session/{examId}/state:
 *   get:
 *     tags: [Student Session]
 *     summary: Get current session state (WAITING / ACTIVE / ENDED)
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session state object
 */
router.get('/session/:examId/state', getSessionState);

/**
 * @openapi
 * /api/session/{examId}/live:
 *   get:
 *     tags: [Student Session]
 *     summary: SSE stream for live exam state events
 *     description: >
 *       Server-Sent Events stream. Emits:
 *       - `session_state` on connect (current state)
 *       - `exam_started` when teacher starts the exam
 *       - `exam_ended` when teacher ends or time runs out
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: text/event-stream
 */
router.get('/session/:examId/live', liveSessionStream);

/**
 * @openapi
 * /api/session/{examId}/teacher-live:
 *   get:
 *     tags: [Student Session]
 *     summary: SSE stream for teacher — receives violation alerts and session events
 *     description: >
 *       Server-Sent Events stream (teacher channel). Emits:
 *       - `session_state` on connect
 *       - `violation` when a student triggers an anti-cheat event
 *       - `student_auto_submitted` when a student is auto-submitted
 *       - `exam_started` / `exam_ended`
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: text/event-stream
 */
router.get('/session/:examId/teacher-live', liveTeacherStream);

/**
 * @openapi
 * /api/session/{examId}/start:
 *   post:
 *     tags: [Student Session]
 *     summary: Teacher starts the exam (broadcasts exam_started SSE event)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session started
 */
router.post('/session/:examId/start', authMiddleware, startSession);

/**
 * @openapi
 * /api/session/{examId}/end:
 *   post:
 *     tags: [Student Session]
 *     summary: Teacher ends the exam (broadcasts exam_ended SSE event)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session ended
 */
router.post('/session/:examId/end', authMiddleware, endSession);

/**
 * @openapi
 * /api/attempts/{attemptId}/progress:
 *   patch:
 *     tags: [Student Session]
 *     summary: Auto-save student progress (partial answers, no final grading)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [answers]
 *             properties:
 *               attemptId:
 *                 type: string
 *                 description: Required if no Bearer token
 *               answers:
 *                 type: object
 *                 description: Map of questionId to student answer value
 *     responses:
 *       200:
 *         description: Progress saved timestamp
 */
router.patch('/attempts/:attemptId/progress', saveProgress);

/**
 * @openapi
 * /api/session/{examId}/attempts/{attemptId}:
 *   delete:
 *     tags: [Student Session]
 *     summary: Teacher kicks a student from the session
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Student removed successfully
 */
router.delete('/session/:examId/attempts/:attemptId', authMiddleware, kickStudent);

/**
 * @openapi
 * /api/session/{examId}/approve/{attemptId}:
 *   post:
 *     tags: [Student Session]
 *     summary: Teacher approves a late student
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Student approved successfully
 */
router.post('/session/:examId/approve/:attemptId', authMiddleware, approveLateStudent);

/**
 * @openapi
 * /api/session/{examId}/reject/{attemptId}:
 *   post:
 *     tags: [Student Session]
 *     summary: Teacher rejects a late student
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Student rejected successfully
 */
router.post('/session/:examId/reject/:attemptId', authMiddleware, rejectLateStudent);

export default router;
