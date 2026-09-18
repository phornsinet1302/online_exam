// backend/src/services/collaboration.service.ts
import prisma from '../config/database.js';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { CollaboratorRole, InviteStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from './notification.service.js';

const notificationService = new NotificationService();

const INVITE_JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const INVITE_LINK_TTL_DAYS = 7;

// Permission matrix based on SRS 3.10
const PERMISSIONS: Record<string, Record<string, boolean>> = {
  OWNER: {
    edit_exam: true,
    delete_exam: true,
    publish_exam: true,
    invite_teachers: true,
    view_analytics: true,
    manage_grades: true,
    edit_questions: true,
    add_questions: true,
    remove_questions: true,
    update_exam_details: true,
    monitor_students: true,
    receive_alerts: true,
    replay_activities: true,
    transfer_ownership: true,
  },
  COLLABORATOR: {
    edit_exam: true,
    delete_exam: false,
    publish_exam: false,
    invite_teachers: false,
    view_analytics: true,
    manage_grades: false,
    edit_questions: true,
    add_questions: true,
    remove_questions: true,
    update_exam_details: true,
    monitor_students: true,
    receive_alerts: true,
    replay_activities: true,
    transfer_ownership: false,
  },
  INVIGILATOR: {
    edit_exam: false,
    delete_exam: false,
    publish_exam: false,
    invite_teachers: false,
    view_analytics: false,
    manage_grades: false,
    edit_questions: false,
    add_questions: false,
    remove_questions: false,
    update_exam_details: false,
    monitor_students: true,
    receive_alerts: true,
    replay_activities: true,
    transfer_ownership: false,
  },
};

export class CollaborationService {
  // ── Invite a collaborator ──────────────────────────────────────────────
  async inviteCollaborator(
    examId: string,
    inviterUserId: string,
    targetEmail: string,
    role: CollaboratorRole
  ) {
    // Verify exam ownership
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== inviterUserId) throw new Error('Only the exam owner can invite collaborators');

    const inviter = await prisma.user.findUnique({ where: { supabaseId: inviterUserId } });
    if (!inviter) throw new Error('Inviter not found');
    if (targetEmail === inviter.email) throw new Error('Cannot invite yourself');

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Find target user by email
    let targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
    let isNewAccount = false;

    if (!targetUser) {
      // Not registered in OUR db yet — rather than failing outright, use
      // Supabase's own invite-email flow: it creates the auth user
      // immediately (so we can add them as a Collaborator right away,
      // visible as "Pending") and sends the email through Supabase's
      // infrastructure — no domain verification needed, unlike a
      // third-party sender.
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(targetEmail, {
        data: { name: targetEmail, role: 'teacher' },
        redirectTo: `${baseUrl}/auth/callback`,
      });

      let supabaseUserId: string;
      let inviteEmailSent = true;

      if (error || !data.user) {
        // "Already registered" means a Supabase auth account exists for this
        // email even though it was never synced into our own User table —
        // e.g. they started signing up directly but never logged in (sync
        // only happens on login). Look up their existing id instead of
        // failing; we just can't (re)send an invite email for them.
        if (error?.code === 'email_exists' || error?.message?.toLowerCase().includes('already been registered')) {
          const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
          const existingAuthUser = list?.users.find((u) => u.email === targetEmail);
          if (listError || !existingAuthUser) {
            throw new Error('This email is already registered but could not be looked up. Please try again.');
          }
          supabaseUserId = existingAuthUser.id;
          inviteEmailSent = false;
        } else {
          throw new Error(error?.message || 'Failed to invite this email.');
        }
      } else {
        supabaseUserId = data.user.id;
      }

      targetUser = await prisma.user.create({
        data: { supabaseId: supabaseUserId, email: targetEmail, name: targetEmail, role: 'teacher' },
      });
      isNewAccount = inviteEmailSent;
    }

    // Check if already a collaborator
    const existing = await prisma.collaborator.findUnique({
      where: { examId_userId: { examId, userId: targetUser.supabaseId } },
    });
    if (existing) throw new Error('User is already a collaborator on this exam');

    const collaborator = await prisma.collaborator.create({
      data: {
        examId,
        userId: targetUser.supabaseId,
        role,
        invitedBy: inviterUserId,
        status: 'PENDING',
      },
      include: { user: true, exam: true, inviter: true },
    });

    // Best-effort — the invite is already persisted, so a notification/email
    // failure shouldn't fail the request. Not awaited so the response isn't
    // held up by outbound email latency.
    const roleLabel = role === 'COLLABORATOR' ? 'Collaborator' : 'Invigilator';
    notificationService
      .create(targetUser.supabaseId, 'exam', `${collaborator.inviter.name} invited you`, `You've been added as ${roleLabel} on "${exam.title}".`)
      .catch((e) => console.error('Failed to create invite notification:', e));
    // Brand-new accounts already got Supabase's own invite email above.
    // For an existing account, notify them by email too — via Supabase's
    // magic-link send rather than a third-party sender, since that would
    // need a verified domain to reach anyone but our own account owner.
    // shouldCreateUser is false since we already know this account exists.
    if (!isNewAccount) {
      supabase.auth.signInWithOtp({
        email: targetUser.email,
        options: { shouldCreateUser: false, emailRedirectTo: `${baseUrl}/auth/callback` },
      }).then(({ error }) => {
        if (error) console.error('Failed to send collaborator invite email:', error);
      });
    }

    return { status: 'INVITED' as const, collaborator, isNewAccount };
  }

  // ── List collaborators for an exam ─────────────────────────────────────
  async getCollaborators(examId: string, requesterId: string) {
    // Owner or collaborator can view
    await this.requireAccess(examId, requesterId, 'view_analytics');

    return prisma.collaborator.findMany({
      where: { examId },
      include: {
        user: { select: { name: true, email: true, avatarUrl: true, supabaseId: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Update collaborator role ───────────────────────────────────────────
  async updateCollaboratorRole(
    examId: string,
    collaboratorId: string,
    newRole: CollaboratorRole,
    requesterId: string
  ) {
    // Only owner can change roles
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== requesterId) throw new Error('Only the exam owner can change roles');

    const collaborator = await prisma.collaborator.findUnique({ where: { id: collaboratorId } });
    if (!collaborator || collaborator.examId !== examId) throw new Error('Collaborator not found');

    return prisma.collaborator.update({
      where: { id: collaboratorId },
      data: { role: newRole },
      include: { user: true },
    });
  }

  // ── Remove a collaborator ─────────────────────────────────────────────
  async removeCollaborator(examId: string, collaboratorId: string, requesterId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== requesterId) throw new Error('Only the exam owner can remove collaborators');

    const collaborator = await prisma.collaborator.findUnique({ where: { id: collaboratorId } });
    if (!collaborator || collaborator.examId !== examId) throw new Error('Collaborator not found');

    await prisma.collaborator.delete({ where: { id: collaboratorId } });
    return { message: 'Collaborator removed successfully' };
  }

  // ── Accept invitation ──────────────────────────────────────────────────
  async acceptInvitation(collaboratorId: string, userId: string) {
    const collaborator = await prisma.collaborator.findUnique({ where: { id: collaboratorId } });
    if (!collaborator) throw new Error('Invitation not found');
    if (collaborator.userId !== userId) throw new Error('This invitation is not for you');
    if (collaborator.status !== 'PENDING') throw new Error('Invitation already responded to');

    return prisma.collaborator.update({
      where: { id: collaboratorId },
      data: { status: 'ACCEPTED' },
      include: { exam: true },
    });
  }

  // ── Decline invitation ─────────────────────────────────────────────────
  async declineInvitation(collaboratorId: string, userId: string) {
    const collaborator = await prisma.collaborator.findUnique({ where: { id: collaboratorId } });
    if (!collaborator) throw new Error('Invitation not found');
    if (collaborator.userId !== userId) throw new Error('This invitation is not for you');
    if (collaborator.status !== 'PENDING') throw new Error('Invitation already responded to');

    return prisma.collaborator.update({
      where: { id: collaboratorId },
      data: { status: 'DECLINED' },
    });
  }

  // ── Get or create a shareable invite link for an exam+role ─────────────
  async getOrCreateInviteLink(examId: string, requesterId: string, role: CollaboratorRole) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== requesterId) throw new Error('Only the exam owner can create invite links');

    const now = new Date();
    const existing = await prisma.collaboratorInviteLink.findFirst({
      where: { examId, role, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing;

    const expiresAt = new Date(Date.now() + INVITE_LINK_TTL_DAYS * 24 * 60 * 60 * 1000);
    const token = jwt.sign(
      { type: 'collaborator-invite-link', examId, role, jti: uuidv4() },
      INVITE_JWT_SECRET,
      { expiresIn: `${INVITE_LINK_TTL_DAYS}d` }
    );

    return prisma.collaboratorInviteLink.create({
      data: { examId, role, token, createdBy: requesterId, expiresAt },
    });
  }

  // ── Accept a shareable invite link ──────────────────────────────────────
  async acceptInviteLink(token: string, acceptingUserId: string) {
    let payload: { type: string; examId: string; role: CollaboratorRole };
    try {
      payload = jwt.verify(token, INVITE_JWT_SECRET) as typeof payload;
    } catch {
      throw new Error('This invite link is invalid or has expired.');
    }
    if (payload.type !== 'collaborator-invite-link') {
      throw new Error('This invite link is invalid.');
    }

    const link = await prisma.collaboratorInviteLink.findUnique({ where: { token } });
    if (!link) throw new Error('This invite link was not found or has been revoked.');
    if (new Date() > link.expiresAt) throw new Error('This invite link has expired.');

    const exam = await prisma.exam.findUnique({ where: { id: link.examId } });
    if (!exam) throw new Error('This exam no longer exists.');
    if (exam.ownerId === acceptingUserId) throw new Error('You already own this exam.');

    const collaborator = await prisma.collaborator.upsert({
      where: { examId_userId: { examId: link.examId, userId: acceptingUserId } },
      update: { role: link.role, status: 'ACCEPTED' },
      create: {
        examId: link.examId,
        userId: acceptingUserId,
        role: link.role,
        status: 'ACCEPTED',
        invitedBy: link.createdBy,
      },
    });

    return { collaborator, examId: exam.id, examTitle: exam.title, role: link.role };
  }

  // ── Get collaborations for the current user ────────────────────────────
  async getMyCollaborations(userId: string) {
    return prisma.collaborator.findMany({
      where: { userId },
      include: {
        exam: { select: { id: true, title: true, subject: true, status: true, ownerId: true } },
        inviter: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Permission check ──────────────────────────────────────────────────
  async checkPermission(examId: string, userId: string, action: string): Promise<boolean> {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return false;

    // Owner has all permissions
    if (exam.ownerId === userId) {
      return PERMISSIONS.OWNER[action] ?? false;
    }

    // Check collaborator role
    const collaborator = await prisma.collaborator.findUnique({
      where: { examId_userId: { examId, userId } },
    });

    if (!collaborator || collaborator.status !== 'ACCEPTED') return false;

    const rolePerms = PERMISSIONS[collaborator.role];
    return rolePerms?.[action] ?? false;
  }

  // ── Require access (throws if no permission) ──────────────────────────
  async requireAccess(examId: string, userId: string, action: string): Promise<void> {
    const hasPermission = await this.checkPermission(examId, userId, action);
    if (!hasPermission) {
      throw new Error(`Access denied: you do not have '${action}' permission for this exam`);
    }
  }

  // ── Get user's effective role for an exam ──────────────────────────────
  async getUserRole(examId: string, userId: string): Promise<string | null> {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return null;

    if (exam.ownerId === userId) return 'OWNER';

    const collaborator = await prisma.collaborator.findUnique({
      where: { examId_userId: { examId, userId } },
    });

    if (!collaborator || collaborator.status !== 'ACCEPTED') return null;
    return collaborator.role;
  }
}
