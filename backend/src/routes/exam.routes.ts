// backend/src/routes/exam.routes.ts
import { Router } from 'express';
import {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  duplicateExam,
  publishExam,
  archiveExam,
  previewExam,
  startExamSession,
} from '../controllers/exam.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware); // all routes require auth

/**
 * @openapi
 * components:
 *   schemas:
 *     Exam:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *         subject:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         duration:
 *           type: integer
 *         passingScore:
 *           type: number
 *         maxAttempts:
 *           type: integer
 *         isPublic:
 *           type: boolean
 *         uniqueCode:
 *           type: string
 *         magicLinkToken:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         sections:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Section'
 *     ExamInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         subject:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         duration:
 *           type: integer
 *         passingScore:
 *           type: number
 *         maxAttempts:
 *           type: integer
 *         isPublic:
 *           type: boolean
 *     Section:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         order:
 *           type: integer
 *         randomization:
 *           type: boolean
 *         shuffleAnswers:
 *           type: boolean
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Question'
 *     Question:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [MCQ, TRUE_FALSE, ESSAY]
 *         text:
 *           type: string
 *         points:
 *           type: number
 *         difficulty:
 *           type: integer
 *         bloomLevel:
 *           type: string
 *         order:
 *           type: integer
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Option'
 *     Option:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         text:
 *           type: string
 *         order:
 *           type: integer
 *         # isCorrect is omitted for preview purposes
 */

/**
 * @openapi
 * /api/exams:
 *   get:
 *     tags: [Exams]
 *     summary: Get all exams for the authenticated teacher
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { enum: [DRAFT, PUBLISHED, ARCHIVED] }
 *       - in: query
 *         name: subject
 *         schema: { type: string }
 *       - in: query
 *         name: startDateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: startDateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: List of exams
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Exam'
 *   post:
 *     tags: [Exams]
 *     summary: Create a new exam (draft)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExamInput'
 *     responses:
 *       201:
 *         description: Exam created
 */
router.get('/exams', getExams);
router.post('/exams', createExam);

/**
 * @openapi
 * /api/exams/{id}:
 *   get:
 *     tags: [Exams]
 *     summary: Get a single exam by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Exam object
 *   put:
 *     tags: [Exams]
 *     summary: Update an exam (only draft)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExamInput'
 *     responses:
 *       200:
 *         description: Updated exam
 *   delete:
 *     tags: [Exams]
 *     summary: Delete an exam (only draft)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deletion confirmation
 */
router.get('/exams/:id', getExamById);
router.put('/exams/:id', updateExam);
router.delete('/exams/:id', deleteExam);

/**
 * @openapi
 * /api/exams/{id}/duplicate:
 *   post:
 *     tags: [Exams]
 *     summary: Duplicate an existing exam into a new draft
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: New draft exam
 */
router.post('/exams/:id/duplicate', duplicateExam);

/**
 * @openapi
 * /api/exams/{id}/publish:
 *   post:
 *     tags: [Exams]
 *     summary: Publish an exam (generate access tokens)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Published exam with access tokens
 */
router.post('/exams/:id/publish', publishExam);

/**
 * @openapi
 * /api/exams/{id}/archive:
 *   post:
 *     tags: [Exams]
 *     summary: Archive a published exam
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Archived exam
 */
router.post('/exams/:id/archive', archiveExam);

/**
 * @openapi
 * /api/exams/{id}/preview:
 *   get:
 *     tags: [Exams]
 *     summary: Get exam preview for student view (no answers)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Preview structure
 */
router.get('/exams/:id/preview', previewExam);

router.post('/exams/:examId/start', startExamSession);


export default router;