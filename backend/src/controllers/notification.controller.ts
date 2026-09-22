// backend/src/controllers/notification.controller.ts
import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service.js';

const notificationService = new NotificationService();

export const listNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // from authMiddleware
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const notifications = await notificationService.list(user.id, type);
    res.status(200).json(notifications);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const notif = await notificationService.markRead(user.id, req.params.id as string);
    res.status(200).json(notif);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await notificationService.markAllRead(user.id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await notificationService.remove(user.id, req.params.id as string);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};
