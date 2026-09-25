// backend/src/services/roster.service.ts
import prisma from '../config/database.js';

export interface RosterEntryInput {
  email: string;
  name?: string;
}

export class RosterService {
  // ── Replace the full roster for an exam ────────────────────────────────
  async replaceRoster(examId: string, requesterId: string, entries: RosterEntryInput[]) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== requesterId) throw new Error('Only the exam owner can manage the roster');

    // De-dupe by email (case-insensitive) — last occurrence wins for the name
    const byEmail = new Map<string, string | null>();
    for (const entry of entries) {
      const email = entry.email.trim().toLowerCase();
      if (!email) continue;
      byEmail.set(email, entry.name?.trim() || null);
    }
    if (byEmail.size === 0) throw new Error('No valid student emails were provided');

    await prisma.$transaction([
      prisma.enrolledStudent.deleteMany({ where: { examId } }),
      prisma.enrolledStudent.createMany({
        data: Array.from(byEmail.entries()).map(([email, name]) => ({ examId, email, name })),
      }),
    ]);

    return this.getRoster(examId, requesterId);
  }

  // ── List roster for an exam ─────────────────────────────────────────────
  async getRoster(examId: string, requesterId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== requesterId) throw new Error('Only the exam owner can view the roster');

    return prisma.enrolledStudent.findMany({
      where: { examId },
      orderBy: { email: 'asc' },
    });
  }

  // ── Remove a single student from the roster ─────────────────────────────
  async removeStudent(examId: string, studentId: string, requesterId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== requesterId) throw new Error('Only the exam owner can manage the roster');

    const entry = await prisma.enrolledStudent.findUnique({ where: { id: studentId } });
    if (!entry || entry.examId !== examId) throw new Error('Student not found on this roster');

    await prisma.enrolledStudent.delete({ where: { id: studentId } });
    return { message: 'Removed from roster.' };
  }
}
