// backend/src/routes/question.routes.ts
import { Router } from 'express';
import {
  createSection,
  reorderSections,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions,
  uploadMaterial,
  generateAIQuestions,
  batchReviewQuestions,
  duplicateQuestion,
} from '../controllers/question.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /api/exams/{examId}/sections:
 *   post:
 *     tags: [Questions & Sections]
 *     summary: Create a new section in an exam
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               order: { type: integer }
 *               randomization: { type: boolean }
 *               shuffleAnswers: { type: boolean }
 *     responses:
 *       201:
 *         description: Section created
 */
router.post('/exams/:examId/sections', createSection);

/**
 * @openapi
 * /api/exams/{examId}/sections/reorder:
 *   put:
 *     tags: [Questions & Sections]
 *     summary: Reorder sections of an exam
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sections]
 *             properties:
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     order: { type: integer }
 *     responses:
 *       200:
 *         description: Sections reordered
 */
router.put('/exams/:examId/sections/reorder', reorderSections);

/**
 * @openapi
 * /api/questions:
 *   post:
 *     tags: [Questions & Sections]
 *     summary: Create a new question in a section
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sectionId, type, text]
 *             properties:
 *               sectionId: { type: string }
 *               type: { type: string, enum: [MCQ, TRUE_FALSE, ESSAY] }
 *               text: { type: string }
 *               points: { type: number, default: 1 }
 *               difficulty: { type: integer, minimum: 1, maximum: 5 }
 *               bloomLevel: { type: string }
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text: { type: string }
 *                     isCorrect: { type: boolean }
 *                     order: { type: integer }
 *     responses:
 *       201:
 *         description: Question created
 */
router.post('/questions', createQuestion);

/**
 * @openapi
 * /api/questions/{questionId}:
 *   put:
 *     tags: [Questions & Sections]
 *     summary: Update a question
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: { type: string }
 *               points: { type: number }
 *               difficulty: { type: integer }
 *               bloomLevel: { type: string }
 *               # options update would be complex; we can handle separately
 *     responses:
 *       200:
 *         description: Question updated
 */
router.put('/questions/:questionId', updateQuestion);

/**
 * @openapi
 * /api/questions/{questionId}:
 *   delete:
 *     tags: [Questions & Sections]
 *     summary: Delete a question
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Question deleted
 */
router.delete('/questions/:questionId', deleteQuestion);

/**
 * @openapi
 * /api/exams/{examId}/questions/import:
 *   post:
 *     tags: [Questions & Sections]
 *     summary: Import questions from a file (PDF, DOCX, TXT)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import successful
 */
router.post('/exams/:examId/questions/import', upload.single('file'), importQuestions);

/**
 * @openapi
 * /api/exams/{examId}/questions/ai/upload-material:
 *   post:
 *     tags: [AI Generation]
 *     summary: Upload learning material for AI question generation
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               materialText: { type: string }
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Material uploaded
 */
router.post('/exams/:examId/questions/ai/upload-material', upload.single('file'), uploadMaterial);

/**
 * @openapi
 * /api/exams/{examId}/questions/ai/generate:
 *   post:
 *     tags: [AI Generation]
 *     summary: Generate AI questions from uploaded material
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [materialId, count, language, bloomLevel, complexity]
 *             properties:
 *               materialId: { type: string }
 *               count: { type: integer, minimum: 1 }
 *               language: { type: string, example: "English" }
 *               bloomLevel: { type: string, enum: [Remember, Understand, Apply, Analyze, Evaluate, Create] }
 *               complexity: { type: string, enum: [Easy, Medium, Hard] }
 *     responses:
 *       200:
 *         description: Questions generated
 */
router.post('/exams/:examId/questions/ai/generate', generateAIQuestions);

/**
 * @openapi
 * /api/questions/ai/batch-review:
 *   post:
 *     tags: [AI Generation]
 *     summary: Bulk review AI-generated questions (accept/reject)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questionIds, action]
 *             properties:
 *               questionIds: { type: array, items: { type: string } }
 *               action: { type: string, enum: [accept, reject] }
 *     responses:
 *       200:
 *         description: Review completed
 */
router.post('/questions/ai/batch-review', batchReviewQuestions);

router.post('/questions/:questionId/duplicate', duplicateQuestion);

export default router;