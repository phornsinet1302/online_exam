// backend/src/controllers/collaboration.controller.ts
import { Request, Response } from 'express';
import { CollaborationService } from '../services/collaboration.service.js';
import { z } from 'zod';

const collaborationService = new CollaborationService();
const getUserId = (req: Request): string => (req as any).user.id;

const inviteSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['COLLABORATOR', 'INVIGILATOR']),
});

const updateRoleSchema = z.object({
  role: z.enum(['COLLABORATOR', 'INVIGILATOR']),
});

// ── Invite a collaborator ────────────────────────────────────────────────
export const inviteCollaborator = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { examId } = z.object({ examId: z.string() }).parse(req.params);
    const { email, role } = inviteSchema.parse(req.body);
    const result = await collaborationService.inviteCollaborator(examId, userId, email, role);
    res.status(201).json(result);
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404
      : error.message.includes('Access denied') || error.message.includes('Only the') ? 403
      : 400;
    res.status(status).json({ message: error.message });
  }
};

// ── List collaborators ───────────────────────────────────────────────────
export const getCollaborators = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { examId } = z.object({ examId: z.string() }).parse(req.params);
    const collaborators = await collaborationService.getCollaborators(examId, userId);
    res.status(200).json(collaborators);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ── Update collaborator role ─────────────────────────────────────────────
export const updateCollaboratorRole = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const params = z.object({ examId: z.string(), id: z.string() }).parse(req.params);
    const { role } = updateRoleSchema.parse(req.body);
    const result = await collaborationService.updateCollaboratorRole(
      params.examId, params.id, role, userId
    );
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ── Remove a collaborator ────────────────────────────────────────────────
export const removeCollaborator = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const params = z.object({ examId: z.string(), id: z.string() }).parse(req.params);
    const result = await collaborationService.removeCollaborator(params.examId, params.id, userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ── Accept invitation ────────────────────────────────────────────────────
export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const result = await collaborationService.acceptInvitation(id, userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ── Decline invitation ───────────────────────────────────────────────────
export const declineInvitation = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const result = await collaborationService.declineInvitation(id, userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ── Get my collaborations ────────────────────────────────────────────────
export const getMyCollaborations = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const collaborations = await collaborationService.getMyCollaborations(userId);
    res.status(200).json(collaborations);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
