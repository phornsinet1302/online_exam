// backend/src/routes/roster.routes.ts
import { Router } from 'express';
import { uploadRoster, getRoster, removeRosterStudent } from '../controllers/roster.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/exams/{examId}/roster:
 *   get:
 *     tags: [Roster]
 *     summary: List the expected-student roster for an exam
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Roster entries
 *   put:
 *     tags: [Roster]
 *     summary: Replace the roster for an exam (owner-only)
 *     description: Replaces the full roster with the given list, so attendance reports can distinguish "didn't join" from "was never invited".
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
 *             required: [entries]
 *             properties:
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [email]
 *                   properties:
 *                     email: { type: string, format: email }
 *                     name: { type: string }
 *     responses:
 *       200:
 *         description: Updated roster
 */
router.get('/exams/:examId/roster', getRoster);
router.put('/exams/:examId/roster', uploadRoster);

/**
 * @openapi
 * /api/exams/{examId}/roster/{studentId}:
 *   delete:
 *     tags: [Roster]
 *     summary: Remove a single student from the roster
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Removed
 */
router.delete('/exams/:examId/roster/:studentId', removeRosterStudent);

export default router;
