// backend/src/services/notification.service.ts
import prisma from '../config/database.js';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  // List a user's notifications, newest first, optionally filtered by type
  async list(userId: string, type?: string) {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(type && type !== 'all' ? { type: type as NotificationType } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, type: NotificationType, title: string, body: string) {
    return prisma.notification.create({
      data: { userId, type, title, body },
    });
  }

  async markRead(userId: string, notificationId: string) {
    const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notif || notif.userId !== userId) throw new Error('Notification not found');
    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { message: 'All notifications marked as read.' };
  }

  async remove(userId: string, notificationId: string) {
    const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notif || notif.userId !== userId) throw new Error('Notification not found');
    await prisma.notification.delete({ where: { id: notificationId } });
    return { message: 'Notification deleted.' };
  }
}
