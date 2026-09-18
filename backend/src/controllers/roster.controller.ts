// backend/src/controllers/roster.controller.ts
import { Request, Response } from 'express';
import { RosterService } from '../services/roster.service.js';
import { z } from 'zod';

const rosterService = new RosterService();
const getUserId = (req: Request): string => (req as any).user.id;

const statusFromError = (message: string) =>
  message.includes('not found') ? 404
    : message.includes('Only the') ? 403
      : 400;

const uploadSchema = z.object({
  entries: z.array(z.object({
    email: z.string().email('Each entry needs a valid email'),
    name: z.string().optional(),
  })).min(1, 'At least one student is required'),
});

// ── Replace the roster ───────────────────────────────────────────────────
export const uploadRoster = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { examId } = z.object({ examId: z.string() }).parse(req.params);
    const { entries } = uploadSchema.parse(req.body);
    const roster = await rosterService.replaceRoster(examId, userId, entries);
    res.status(200).json(roster);
  } catch (error: any) {
    res.status(statusFromError(error.message || '')).json({ message: error.message });
  }
};

// ── List the roster ──────────────────────────────────────────────────────
export const getRoster = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { examId } = z.object({ examId: z.string() }).parse(req.params);
    const roster = await rosterService.getRoster(examId, userId);
    res.status(200).json(roster);
  } catch (error: any) {
    res.status(statusFromError(error.message || '')).json({ message: error.message });
  }
};

// ── Remove a single roster entry ─────────────────────────────────────────
export const removeRosterStudent = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { examId, studentId } = z.object({ examId: z.string(), studentId: z.string() }).parse(req.params);
    const result = await rosterService.removeStudent(examId, studentId, userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(statusFromError(error.message || '')).json({ message: error.message });
  }
};
