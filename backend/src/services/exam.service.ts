// backend/src/services/exam.service.ts
import prisma from '../config/database.js';
import { ExamStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Generate a short unique code (e.g., 8 alphanumeric)
function generateUniqueCode(length: number = 8): string {
  const min = 10 ** (length - 1); // e.g., 100000
  const max = 10 ** length - 1;   // e.g., 999999
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

// Generate a secure magic link token (JWT)
function generateMagicLinkToken(examId: string): string {
  const payload = { examId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }; // 7 days
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret');
}

// Helper to check if an exam has any attempts
async function hasAttempts(examId: string): Promise<boolean> {
  const count = await prisma.examAttempt.count({ where: { examId } });
  return count > 0;
}

export class ExamService {
  async createExam(ownerId: string, data: any) {
    return prisma.exam.create({
      data: { ownerId, status: 'DRAFT', ...data },
    });
  }

  async getExams(ownerId: string, filters?: any) {
    const where: any = { ownerId };
    if (filters?.status) where.status = filters.status;
    if (filters?.subject) where.subject = filters.subject;
    if (filters?.startDateFrom) where.startDate = { gte: filters.startDateFrom };
    if (filters?.startDateTo) where.startDate = { ...where.startDate, lte: filters.startDateTo };
    return prisma.exam.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sections: { include: { questions: { include: { options: true } } } },
      },
    });
  }

  async getExamById(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        sections: { include: { questions: { include: { options: true } } } },
      },
    });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) throw new Error('Access denied');
    return exam;
  }

  // All updates allowed – no status or attempts checks
  async updateExam(examId: string, ownerId: string, data: any) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) throw new Error('Access denied');
    // Allow everything – even if archived or has attempts
    return prisma.exam.update({
      where: { id: examId },
      data,
    });
  }

  // Delete allowed anytime (even published/archived) – but careful with data integrity
  async deleteExam(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) throw new Error('Access denied');
    //Delete regardless of status (cascades to sections, questions, options, attempts?)
    // You may want to handle attempts deletion or keep them orphaned – we'll delete all
    await prisma.exam.delete({ where: { id: examId } });
    return { message: 'Exam deleted successfully' };
  }
  // -------- Duplicate Exam (clone everything into a new draft) --------
  async duplicateExam(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        sections: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) throw new Error('Access denied');

    // Create a new exam with draft status, same metadata (except title may be "Copy of ...")
    const newTitle = `Copy of ${exam.title}`;
    const newExam = await prisma.exam.create({
      data: {
        ownerId,
        title: newTitle,
        description: exam.description,
        subject: exam.subject,
        startDate: exam.startDate,
        endDate: exam.endDate,
        duration: exam.duration,
        passingScore: exam.passingScore,
        maxAttempts: exam.maxAttempts,
        isPublic: exam.isPublic,
        status: 'DRAFT',
        // do NOT copy uniqueCode/magicLinkToken
      },
    });

    // Clone sections and their questions/options
    for (const section of exam.sections) {
      const newSection = await prisma.section.create({
        data: {
          examId: newExam.id,
          title: section.title,
          order: section.order,
          randomization: section.randomization,
          shuffleAnswers: section.shuffleAnswers,
        },
      });

      for (const question of section.questions) {
        const newQuestion = await prisma.question.create({
          data: {
            sectionId: newSection.id,
            type: question.type,
            text: question.text,
            points: question.points,
            difficulty: question.difficulty,
            bloomLevel: question.bloomLevel,
            order: question.order,
            reviewed: question.reviewed,
          },
        });

        // Clone options
        if (question.options.length > 0) {
          await prisma.option.createMany({
            data: question.options.map((opt) => ({
              questionId: newQuestion.id,
              text: opt.text,
              isCorrect: opt.isCorrect,
              order: opt.order,
            })),
          });
        }
      }
    }

    // Return the newly created exam (with its sections)
    return prisma.exam.findUnique({
      where: { id: newExam.id },
      include: {
        sections: { include: { questions: { include: { options: true } } } },
      },
    });
  }

  // -------- Publish Exam (generate access tokens) --------
  async publishExam(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) throw new Error('Access denied');
    if (exam.status === 'ARCHIVED') throw new Error('Archived exams cannot be published');

    // Generate new keys (if you want to regenerate each time)
    const uniqueCode = generateUniqueCode();
    const magicLinkToken = generateMagicLinkToken(examId);

    // If already published, we might want to keep existing keys unless you want to regenerate.
    // For now, we'll always generate new keys.
    const updated = await prisma.exam.update({
      where: { id: examId },
      data: {
        status: 'PUBLISHED',
        uniqueCode,
        magicLinkToken,
      },
    });

    // Build magic link...
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const magicLink = `${frontendBase}/join?token=${magicLinkToken}`;

    return {
      message: 'Exam published successfully',
      exam: updated,
      access: { uniqueCode, magicLink },
    };
  }

  // -------- Archive Exam --------
  async archiveExam(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) throw new Error('Access denied');
    return prisma.exam.update({
      where: { id: examId },
      data: { status: 'ARCHIVED' },
    });
  }

  // -------- Preview Exam (student view, without exposing answers) --------
  async previewExam(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        sections: {
          include: {
            questions: {
              include: { options: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) throw new Error('Access denied');

    // For preview, we strip out correct answers and show only the question structure.
    // We'll also remove any isCorrect flags from options.
    const preview = {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      subject: exam.subject,
      duration: exam.duration,
      sections: exam.sections.map((section) => ({
        id: section.id,
        title: section.title,
        questions: section.questions.map((q) => ({
          id: q.id,
          type: q.type,
          text: q.text,
          points: q.points,
          options: q.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
            // isCorrect is NOT sent
          })),
        })),
      })),
    };
    return preview;
  }
  async startExamSession(examId: string, studentId?: string) {
  // Fetch the exam with all its structure
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      sections: {
        include: {
          questions: {
            include: { options: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });
  if (!exam) throw new Error('Exam not found');
  // Optionally check if exam is published/archived, but you may allow draft as well.

  // Build the snapshot (exclude sensitive info like ownerId, etc.)
  const snapshot = {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    subject: exam.subject,
    duration: exam.duration,
    passingScore: exam.passingScore,
    sections: exam.sections.map((section) => ({
      id: section.id,
      title: section.title,
      randomization: section.randomization,
      shuffleAnswers: section.shuffleAnswers,
      questions: section.questions.map((q) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        points: q.points,
        difficulty: q.difficulty,
        bloomLevel: q.bloomLevel,
        order: q.order,
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          // **Do not send isCorrect** to students
          order: opt.order,
        })),
      })),
    })),
  };

  // Create the attempt record with snapshot
  const attempt = await prisma.examAttempt.create({
    data: {
      examId: exam.id,
      studentId: studentId || `anonymous_${Date.now()}`,
      snapshot: snapshot,
    },
  });

  return {
    attemptId: attempt.id,
    snapshot: snapshot,
    // Also return the duration and any other session info
  };
}
}