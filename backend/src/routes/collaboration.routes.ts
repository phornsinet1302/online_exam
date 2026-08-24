// backend/src/routes/collaboration.routes.ts
import { Router } from 'express';
import {
  inviteCollaborator,
  getCollaborators,
  updateCollaboratorRole,
  removeCollaborator,
  acceptInvitation,
  declineInvitation,
  getMyCollaborations,
} from '../controllers/collaboration.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * components:
 *   schemas:
 *     Collaborator:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         examId:
 *           type: string
 *         userId:
 *           type: string
 *         role:
 *           type: string
 *           enum: [COLLABORATOR, INVIGILATOR]
 *         status:
 *           type: string
 *           enum: [PENDING, ACCEPTED, DECLINED]
 *         invitedBy:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     InviteInput:
 *       type: object
 *       required: [email, role]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [COLLABORATOR, INVIGILATOR]
 */

/**
 * @openapi
 * /api/exams/{examId}/collaborators:
 *   post:
 *     tags: [Collaboration]
 *     summary: Invite a collaborator to an exam
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
 *             $ref: '#/components/schemas/InviteInput'
 *     responses:
 *       201:
 *         description: Collaborator invited
 *   get:
 *     tags: [Collaboration]
 *     summary: List all collaborators for an exam
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of collaborators
 */
router.post('/exams/:examId/collaborators', inviteCollaborator);
router.get('/exams/:examId/collaborators', getCollaborators);

/**
 * @openapi
 * /api/exams/{examId}/collaborators/{id}:
 *   put:
 *     tags: [Collaboration]
 *     summary: Update a collaborator's role
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [COLLABORATOR, INVIGILATOR]
 *     responses:
 *       200:
 *         description: Updated collaborator
 *   delete:
 *     tags: [Collaboration]
 *     summary: Remove a collaborator from an exam
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Collaborator removed
 */
router.put('/exams/:examId/collaborators/:id', updateCollaboratorRole);
router.delete('/exams/:examId/collaborators/:id', removeCollaborator);

/**
 * @openapi
 * /api/collaborations/{id}/accept:
 *   post:
 *     tags: [Collaboration]
 *     summary: Accept a collaboration invitation
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invitation accepted
 */
router.post('/collaborations/:id/accept', acceptInvitation);

/**
 * @openapi
 * /api/collaborations/{id}/decline:
 *   post:
 *     tags: [Collaboration]
 *     summary: Decline a collaboration invitation
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invitation declined
 */
router.post('/collaborations/:id/decline', declineInvitation);

/**
 * @openapi
 * /api/collaborations/mine:
 *   get:
 *     tags: [Collaboration]
 *     summary: Get all collaborations for the current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of collaborations
 */
router.get('/collaborations/mine', getMyCollaborations);

export default router;
