import express from 'express';
import { uploadAndGenerate, batchReview } from '../controllers/ai.controller.js';
import { uploadPDF } from '../middleware/upload.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

/**
 * @openapi
 * /api/test-gemini:
 *   get:
 *     summary: Test AI router and say hello
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/test-gemini', async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('Say hello');
    res.json({ result: result.response.text() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/generate-from-pdf:
 *   post:
 *     tags: [AI Generation]
 *     summary: Extract text from uploaded PDF and generate AI questions in one step
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [examId, sectionId, subject, difficulty, numQuestions, questionType]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The PDF file containing learning material
 *               examId:
 *                 type: string
 *                 description: ID of the exam
 *               sectionId:
 *                 type: string
 *                 description: ID of the section to save generated questions under
 *               subject:
 *                 type: string
 *                 description: Subject name
 *               topic:
 *                 type: string
 *                 description: Topic of focus (optional)
 *               difficulty:
 *                 type: string
 *                 enum: [Easy, Medium, Hard, Mixed]
 *               numQuestions:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of questions to generate
 *               questionType:
 *                 type: string
 *                 enum: [MCQ, TRUE_FALSE, ESSAY]
 *               language:
 *                 type: string
 *                 default: English
 *     responses:
 *       201:
 *         description: Questions generated and saved as drafts successfully
 *       400:
 *         description: Invalid input or missing parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Section not found
 *       500:
 *         description: Server error
 */
router.post(
  '/generate-from-pdf',
  authMiddleware,
  uploadPDF,
  uploadAndGenerate
);

/**
 * @openapi
 * /api/batch-review:
 *   post:
 *     tags: [AI Generation]
 *     summary: Bulk review AI-generated questions (approve/reject)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questionIds, action]
 *             properties:
 *               questionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of question IDs to review
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Action to perform on the questions
 *     responses:
 *       200:
 *         description: Questions approved or rejected successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/batch-review',
  authMiddleware,
  batchReview
);

/**
 * @openapi
 * /api/test:
 *   get:
 *     summary: Test AI router
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/test', (req, res) => res.json({ message: 'AI router works' }));

export default router;