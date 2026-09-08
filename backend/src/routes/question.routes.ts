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
  moveQuestion,
  reorderQuestions,
} from '../controllers/question.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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
router.post('/exams/:examId/sections', authMiddleware, createSection);

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
router.put('/exams/:examId/sections/reorder', authMiddleware, reorderSections);

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
 *               sectionId:
 *                 type: string
 *                 description: ID of the parent section
 *               type:
 *                 type: string
 *                 enum: [MCQ, MULTIPLE_SELECT, TRUE_FALSE, SHORT_ANSWER, ESSAY, FILL_IN_BLANK, MATCHING, CHECKBOX, FILE_UPLOAD, MATH_FORMULA]
 *               title:
 *                 type: string
 *                 description: Optional short title
 *               description:
 *                 type: string
 *                 description: Optional extended description
 *               text:
 *                 type: string
 *                 description: The question prompt
 *               points:
 *                 type: integer
 *                 default: 1
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD, MIXED]
 *                 default: MEDIUM
 *               required:
 *                 type: boolean
 *                 default: true
 *               metadata:
 *                 type: object
 *                 description: Type‑specific configurations (e.g., wordLimit, rubric, matchingPairs)
 *               options:
 *                 type: array
 *                 description: Required for MCQ, MULTIPLE_SELECT, TRUE_FALSE, CHECKBOX
 *                 items:
 *                   type: object
 *                   required: [text, isCorrect]
 *                   properties:
 *                     text: { type: string }
 *                     isCorrect: { type: boolean }
 *                     order: { type: integer }
 *     responses:
 *       201:
 *         description: Question created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       400:
 *         description: Validation error (e.g., invalid type, missing options)
 */
router.post('/questions', authMiddleware, createQuestion);

/**
 * @openapi
 * /api/questions/{questionId}:
 *   put:
 *     tags: [Questions & Sections]
 *     summary: Update an existing question
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
 *               type:
 *                 type: string
 *                 enum: [MCQ, MULTIPLE_SELECT, TRUE_FALSE, SHORT_ANSWER, ESSAY, FILL_IN_BLANK, MATCHING, CHECKBOX, FILE_UPLOAD, MATH_FORMULA]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               text:
 *                 type: string
 *               points:
 *                 type: integer
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD, MIXED]
 *               required:
 *                 type: boolean
 *               metadata:
 *                 type: object
 *               options:
 *                 type: array
 *                 description: If provided, replaces all existing options (for option‑based types)
 *                 items:
 *                   type: object
 *                   properties:
 *                     text: { type: string }
 *                     isCorrect: { type: boolean }
 *                     order: { type: integer }
 *     responses:
 *       200:
 *         description: Question updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       400:
 *         description: Validation error
 */
router.put('/questions/:questionId', authMiddleware, updateQuestion);

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
router.delete('/questions/:questionId', authMiddleware, deleteQuestion);

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
router.post('/exams/:examId/questions/import', authMiddleware, upload.single('file'), importQuestions);

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
router.post('/exams/:examId/questions/ai/upload-material', authMiddleware, upload.single('file'), uploadMaterial);

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
 *             required: [materialId, count, language, complexity]
 *             properties:
 *               materialId: { type: string }
 *               count: { type: integer, minimum: 1 }
 *               language: { type: string, example: "English" }
 *               complexity: { type: string, enum: [Easy, Medium, Hard, Mixed] }
 *     responses:
 *       200:
 *         description: Questions generated
 */
router.post('/exams/:examId/questions/ai/generate', authMiddleware, generateAIQuestions);

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
router.post('/questions/ai/batch-review', authMiddleware, batchReviewQuestions);


/**
 * @openapi
 * /api/questions/{questionId}/duplicate:
 *   post:
 *     tags: [Questions & Sections]
 *     summary: Duplicate an existing question (including options)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Duplicate question created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       400:
 *         description: Invalid question ID
 *       404:
 *         description: Question not found
 */
router.post('/questions/:questionId/duplicate', authMiddleware, duplicateQuestion);

/**
 * @openapi
 * /api/sections/{sectionId}/questions/reorder:
 *   put:
 *     tags: [Questions & Sections]
 *     summary: Reorder questions within a section
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questions]
 *             properties:
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [id, order]
 *                   properties:
 *                     id: { type: string }
 *                     order: { type: integer }
 *     responses:
 *       200:
 *         description: Questions reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       400:
 *         description: Invalid request (e.g., question not in section)
 *       404:
 *         description: Section not found
 */
router.put('/sections/:sectionId/questions/reorder', authMiddleware, reorderQuestions);

/**
 * @openapi
 * /api/questions/{questionId}/move:
 *   put:
 *     tags: [Questions & Sections]
 *     summary: Move a question to a different section
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
 *             required: [targetSectionId]
 *             properties:
 *               targetSectionId:
 *                 type: string
 *               newOrder:
 *                 type: integer
 *                 description: Optional new order in the target section (appends if omitted)
 *     responses:
 *       200:
 *         description: Question moved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Question or target section not found
 */
router.put('/questions/:questionId/move', authMiddleware, moveQuestion);

export default router;