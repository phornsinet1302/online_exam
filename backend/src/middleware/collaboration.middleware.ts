// backend/src/middleware/collaboration.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { CollaborationService } from '../services/collaboration.service.js';

const collaborationService = new CollaborationService();

/**
 * Middleware factory to check exam access permissions.
 * Use: router.put('/exams/:id', requireExamAccess('edit_exam'), updateExam)
 */
export function requireExamAccess(action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Extract exam ID from route params (supports :id, :examId)
      const examId = req.params.id || req.params.examId;
      if (!examId) {
        return res.status(400).json({ message: 'Exam ID is required' });
      }

      const hasPermission = await collaborationService.checkPermission(String(examId), userId, action);
      if (!hasPermission) {
        return res.status(403).json({
          message: `Access denied: insufficient permissions for '${action}'`,
        });
      }

      next();
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  };
}
