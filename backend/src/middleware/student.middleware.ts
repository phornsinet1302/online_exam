// backend/src/middleware/student.middleware.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';

export type StudentRequest = Request & { attempt?: any };

/**
 * Middleware: validate that `attemptId` exists and has not yet been submitted.
 * The attemptId can come from:
 *   - req.body.attemptId
 *   - req.query.attemptId
 *
 * On success, attaches `req.attempt` for downstream controllers.
 */
export const validateAttempt = async (
  req: StudentRequest,
  res: Response,
  next: NextFunction
) => {
  const attemptId =
    (req.body?.attemptId as string) ||
    (req.query?.attemptId as string);

  if (!attemptId) {
    return res.status(400).json({ message: 'attemptId is required.' });
  }

  try {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: true },
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }

    if (attempt.submittedAt) {
      return res.status(409).json({
        message: 'This attempt has already been submitted.',
        submittedAt: attempt.submittedAt,
      });
    }

    req.attempt = attempt;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to validate attempt.' });
  }
};
