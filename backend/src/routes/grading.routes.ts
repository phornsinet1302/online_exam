// src/routes/grading.routes.ts
import { Router } from 'express';
import {
  submitAttempt,
  getPendingReviews,
  gradeStudentAnswer,
  batchGradeAnswers,
  regradeAttempt,
} from '../controllers/grading.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     SubmittedAnswer:
 *       type: object
 *       required: [questionId]
 *       properties:
 *         questionId:
 *           type: string
 *         selectedOptionIds:
 *           type: array
 *           items: { type: string }
 *           description: Option IDs for MCQ, TRUE_FALSE, MULTIPLE_SELECT, CHECKBOX
 *         textAnswer:
 *           type: string
 *           description: Text for SHORT_ANSWER, ESSAY, FILL_IN_BLANK, MATH_FORMULA
 *         matchingPairs:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               leftId: { type: string }
 *               rightId: { type: string }
 *         fileUrl:
 *           type: string
 *           format: uri
 *     StudentAnswer:
 *       type: object
 *       properties:
 *         id:           { type: string }
 *         attemptId:    { type: string }
 *         questionId:   { type: string }
 *         score:        { type: number, nullable: true }
 *         maxScore:     { type: number }
 *         status:
 *           type: string
 *           enum: [auto_graded, needs_review, graded]
 *         feedback:     { type: string, nullable: true }
 *         gradedBy:     { type: string, nullable: true }
 *         gradedAt:     { type: string, format: date-time, nullable: true }
 */

/**
 * @openapi
 * /api/exams/{examId}/attempts/{attemptId}/submit:
 *   post:
 *     tags: [Grading]
 *     summary: Submit student answers and trigger auto-grading
 *     description: >
 *       Saves all student answers for the attempt. Objective questions
 *       (MCQ, TRUE_FALSE, MULTIPLE_SELECT, CHECKBOX, FILL_IN_BLANK, MATCHING)
 *       are graded immediately. Subjective questions are queued as `needs_review`.
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [answers]
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/SubmittedAnswer'
 *     responses:
 *       200:
 *         description: Attempt submitted and graded
 *       400:
 *         description: Validation error or already submitted
 */
router.post('/exams/:examId/attempts/:attemptId/submit', submitAttempt);

/**
 * @openapi
 * /api/exams/{examId}/attempts/pending-review:
 *   get:
 *     tags: [Grading]
 *     summary: Get answers awaiting manual review (teacher only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of StudentAnswer objects with status=needs_review
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StudentAnswer'
 */
router.get('/exams/:examId/attempts/pending-review', authMiddleware, getPendingReviews);

/**
 * @openapi
 * /api/student-answers/{answerId}/grade:
 *   put:
 *     tags: [Grading]
 *     summary: Grade a single student answer (teacher only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [score]
 *             properties:
 *               score:
 *                 type: number
 *                 minimum: 0
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated StudentAnswer
 *       400:
 *         description: Score out of range or answer not found
 */
router.put('/student-answers/:answerId/grade', authMiddleware, gradeStudentAnswer);

/**
 * @openapi
 * /api/student-answers/batch-grade:
 *   post:
 *     tags: [Grading]
 *     summary: Batch grade multiple answers in one request (teacher only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grades]
 *             properties:
 *               grades:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [answerId, score]
 *                   properties:
 *                     answerId: { type: string }
 *                     score:    { type: number, minimum: 0 }
 *                     feedback: { type: string }
 *     responses:
 *       200:
 *         description: Summary of graded answers
 */
router.post('/student-answers/batch-grade', authMiddleware, batchGradeAnswers);

/**
 * @openapi
 * /api/exams/{examId}/attempts/{attemptId}/regrade:
 *   post:
 *     tags: [Grading]
 *     summary: Re-run auto-grading on an attempt (teacher only)
 *     description: >
 *       Re-grades all objective answers using the current grading key.
 *       Useful when the teacher changes the correct answer after students
 *       have already submitted. Manual grades are preserved.
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
 *         description: Updated attempt with re-graded scores
 */
router.post('/exams/:examId/attempts/:attemptId/regrade', authMiddleware, regradeAttempt);

export default router;
