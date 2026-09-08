// backend/src/middleware/student.middleware.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';

import { verifyStudentToken } from '../services/session.service.js';

export type StudentRequest = Request & { attempt?: any };

/**
 * Middleware: validate that `attemptId` exists and has not yet been submitted.
 * The attemptId can come from:
 *   - req.body.attemptId
 *   - req.query.attemptId
 *   - Authorization header (JWT)
 *
 * On success, attaches `req.attempt` for downstream controllers.
 */
export const validateAttempt = async (
  req: StudentRequest,
  res: Response,
  next: NextFunction
) => {
  let attemptId =
    (req.body?.attemptId as string) ||
    (req.query?.attemptId as string);

  if (!attemptId && req.headers.authorization?.startsWith('Bearer ')) {
    try {
      const payload = verifyStudentToken(req.headers.authorization.split(' ')[1]);
      attemptId = payload.attemptId;
    } catch (err: any) {
      console.error('validateAttempt JWT error:', err.message);
      return res.status(401).json({ message: 'Invalid or expired student token.' });
    }
  }

  if (!attemptId) {
    return res.status(400).json({ message: 'attemptId is required.' });
  }

  try {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: true },
    });

    if (!attempt) {
      console.error('validateAttempt error: Attempt not found for id:', attemptId);
      return res.status(404).json({ message: 'Attempt not found.' });
    }

    if (attempt.submittedAt) {
      console.error('validateAttempt error: Attempt already submitted for id:', attemptId);
      return res.status(409).json({
        message: 'This attempt has already been submitted.',
        submittedAt: attempt.submittedAt,
      });
    }

    if (attempt.isApproved === false) {
      console.error('validateAttempt error: Attempt not approved or kicked for id:', attemptId);
      return res.status(403).json({
        message: 'You have been removed from this exam.',
      });
    }

    req.attempt = attempt;
    next();
  } catch (error) {
    console.error('validateAttempt error:', error);
    return res.status(500).json({ message: 'Failed to validate attempt.' });
  }
};
