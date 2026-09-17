// backend/src/routes/notification.routes.ts
import { Router } from 'express';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../controllers/notification.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: List the current user's notifications
 *     description: Returns notifications for the authenticated user, newest first. Optionally filtered by type.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, exam, alert, grade, system]
 *         description: Filter by notification type. Omit or pass "all" for every type.
 *     responses:
 *       200:
 *         description: List of notifications.
 *       401:
 *         description: Unauthorised – missing or invalid token.
 */
router.get('/notifications', authMiddleware, listNotifications);

/**
 * @openapi
 * /api/notifications/read-all:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Mark all of the current user's notifications as read
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All notifications marked as read.
 *       401:
 *         description: Unauthorised – missing or invalid token.
 */
router.patch('/notifications/read-all', authMiddleware, markAllNotificationsRead);

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Mark a single notification as read
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read.
 *       404:
 *         description: Notification not found.
 *       401:
 *         description: Unauthorised – missing or invalid token.
 */
router.patch('/notifications/:id/read', authMiddleware, markNotificationRead);

/**
 * @openapi
 * /api/notifications/{id}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Delete a notification
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted.
 *       404:
 *         description: Notification not found.
 *       401:
 *         description: Unauthorised – missing or invalid token.
 */
router.delete('/notifications/:id', authMiddleware, deleteNotification);

export default router;
