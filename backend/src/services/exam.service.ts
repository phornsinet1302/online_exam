// backend/src/services/exam.service.ts
import prisma from '../config/database.js';
import { ExamStatus } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { parse } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

// Helper: combine date (MM/dd/yyyy), time (hh:mm a) and timezone into a UTC Date
function combineDateAndTime(
  dateStr?: string,
  timeStr?: string,
  timezone: string = 'UTC'
): Date | undefined {
  if (!dateStr) return undefined;

  // Parse the date in MM/dd/yyyy and time in hh:mm a (e.g., "09:00 AM")
  const dateTimeStr = `${dateStr} ${timeStr || '12:00 AM'}`;
  const parsedDate = parse(dateTimeStr, 'MM/dd/yyyy hh:mm a', new Date());

  if (isNaN(parsedDate.getTime())) {
    throw new Error('Invalid date or time format');
  }

  // Convert the local time (as if in the given timezone) to UTC
  return fromZonedTime(parsedDate, timezone);
}

// Generate short unique code (8 digits)
function generateUniqueCode(length: number = 8): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

// Generate JWT magic link token (7 days expiry)
function generateMagicLinkToken(examId: string): string {
  const payload = { examId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 };
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret');
}

// Helper: check if exam has attempts
async function hasAttempts(examId: string): Promise<boolean> {
  const count = await prisma.examAttempt.count({ where: { examId } });
  return count > 0;
}

export class ExamService {
  // -------- Create Exam --------
  async createExam(ownerId: string, data: any) {
    const { startDate, startTime, timezone, ...rest } = data;
    const combinedStartDate = combineDateAndTime(startDate, startTime, timezone || 'UTC');

    const examData = {
      ownerId,
      status: 'DRAFT',
      timezone: timezone || 'UTC',
      accessType: rest.accessType || 'PUBLIC',
      ...rest,
      startDate: combinedStartDate,
    };
    delete examData.startTime;
    return prisma.exam.create({ data: examData });
  }

  // -------- Get Exams (filterable) --------
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

  // -------- Get Exam by ID --------
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

  // -------- Update Exam --------
  async updateExam(examId: string, ownerId: string, data: any) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) throw new Error('Access denied');

    const { startDate, startTime, ...rest } = data;
    const combinedStartDate = combineDateAndTime(startDate, startTime);
    const updateData = {
      ...rest,
      startDate: combinedStartDate,
    };
    delete updateData.startTime;

    return prisma.exam.update({
      where: { id: examId },
      data: updateData,
    });
  }

  // -------- Delete Exam --------
  async deleteExam(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) throw new Error('Access denied');
    await prisma.exam.delete({ where: { id: examId } });
    return { message: 'Exam deleted successfully' };
  }

  // -------- Duplicate Exam --------
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

    const newTitle = `Copy of ${exam.title}`;
    const newExam = await prisma.exam.create({
      data: {
        ownerId,
        title: newTitle,
        description: exam.description,
        subject: exam.subject,
        startDate: exam.startDate,
        duration: exam.duration,
        timezone: exam.timezone,
        passingScore: exam.passingScore,
        maxAttempts: exam.maxAttempts,
        randomizeQuestions: exam.randomizeQuestions,
        showResults: exam.showResults,
        accessType: exam.accessType,
        password: exam.password,
        status: 'DRAFT',
        // DO NOT copy uniqueCode, magicLinkToken
      },
    });

    // Clone sections, questions, options (same as before)
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
            order: question.order,
            reviewed: question.reviewed,
          },
        });

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

    return prisma.exam.findUnique({
      where: { id: newExam.id },
      include: {
        sections: { include: { questions: { include: { options: true } } } },
      },
    });
  }

  // -------- Publish Exam --------
  async publishExam(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) throw new Error('Access denied');
    if (exam.status === 'ARCHIVED') throw new Error('Archived exams cannot be published');

    const uniqueCode = generateUniqueCode();
    const magicLinkToken = generateMagicLinkToken(examId);

    const updated = await prisma.exam.update({
      where: { id: examId },
      data: {
        status: 'PUBLISHED',
        uniqueCode,
        magicLinkToken,
      },
    });

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

  // -------- Preview Exam --------
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
          })),
        })),
      })),
    };
    return preview;
  }

  // ════════════════════════════════════════════════════════════════════════
  // TIMER CONFIGURATION (SRS 3.9)
  // ════════════════════════════════════════════════════════════════════════

  // -------- Update Timer Config --------
  async updateTimerConfig(examId: string, ownerId: string, config: {
    duration?: number;
    autoStart?: boolean;
    autoClose?: boolean;
    autoSubmit?: boolean;
    showCountdown?: boolean;
    lateAllowanceMinutes?: number;
    endDate?: string;
  }) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) throw new Error('Access denied');

    const updateData: any = {};
    if (config.duration !== undefined) updateData.duration = config.duration;
    if (config.autoStart !== undefined) updateData.autoStart = config.autoStart;
    if (config.autoClose !== undefined) updateData.autoClose = config.autoClose;
    if (config.autoSubmit !== undefined) updateData.autoSubmit = config.autoSubmit;
    if (config.showCountdown !== undefined) updateData.showCountdown = config.showCountdown;
    if (config.lateAllowanceMinutes !== undefined) updateData.lateAllowanceMinutes = config.lateAllowanceMinutes;
    if (config.endDate !== undefined) updateData.endDate = new Date(config.endDate);

    return prisma.exam.update({
      where: { id: examId },
      data: updateData,
    });
  }

  // -------- Set Extra Time for a Student --------
  async setExtraTime(examId: string, ownerId: string, studentId: string, extraMinutes: number) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) throw new Error('Access denied');

    // Find the student's active attempt
    const attempt = await prisma.examAttempt.findFirst({
      where: { examId, studentId, submittedAt: null },
    });
    if (!attempt) throw new Error('No active attempt found for this student');

    // Recalculate deadline
    const baseDuration = exam.duration || 0;
    const totalMinutes = baseDuration + extraMinutes;
    const deadline = new Date(attempt.startedAt.getTime() + totalMinutes * 60 * 1000);

    return prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        extraTimeMinutes: extraMinutes,
        deadline,
      },
    });
  }

  // -------- Auto-Submit an Attempt --------
  async autoSubmitAttempt(attemptId: string) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: true },
    });
    if (!attempt) throw new Error('Attempt not found');
    if (attempt.submittedAt) throw new Error('Attempt already submitted');

    return prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: new Date(),
        autoSubmitted: true,
      },
    });
  }

  // -------- Get Timer Status for an Attempt --------
  async getTimerStatus(attemptId: string) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: true },
    });
    if (!attempt) throw new Error('Attempt not found');

    const exam = attempt.exam;
    const baseDuration = exam.duration || 0;
    const extraTime = attempt.extraTimeMinutes || 0;
    const totalMinutes = baseDuration + extraTime;
    const deadline = attempt.deadline || new Date(attempt.startedAt.getTime() + totalMinutes * 60 * 1000);
    const now = new Date();
    const remainingMs = Math.max(0, deadline.getTime() - now.getTime());
    const remainingSeconds = Math.floor(remainingMs / 1000);
    const isExpired = remainingMs <= 0;

    return {
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      deadline,
      baseDuration,
      extraTime,
      totalMinutes,
      remainingSeconds,
      isExpired,
      autoSubmit: exam.autoSubmit,
      showCountdown: exam.showCountdown,
      isSubmitted: !!attempt.submittedAt,
      autoSubmitted: attempt.autoSubmitted,
    };
  }

  // -------- Start Exam Session (student) --------
  async startExamSession(examId: string, studentId?: string) {
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

    // Check late entry allowance
    if (exam.startDate && exam.lateAllowanceMinutes !== undefined) {
      const now = new Date();
      const allowanceMs = exam.lateAllowanceMinutes * 60 * 1000;
      const lateCutoff = new Date(exam.startDate.getTime() + (exam.duration || 0) * 60 * 1000);
      if (now > lateCutoff) {
        throw new Error('This exam has ended. Late entry is no longer allowed.');
      }
    }

    // Calculate deadline based on exam duration
    const startedAt = new Date();
    const baseDuration = exam.duration || 0;
    const deadline = baseDuration > 0
      ? new Date(startedAt.getTime() + baseDuration * 60 * 1000)
      : null;

    const snapshot = {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      subject: exam.subject,
      duration: exam.duration,
      passingScore: exam.passingScore,
      autoSubmit: exam.autoSubmit,
      showCountdown: exam.showCountdown,
      autoClose: exam.autoClose,
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
          order: q.order,
          options: q.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
            order: opt.order,
            // isCorrect intentionally omitted from student snapshot
          })),
        })),
      })),
    };

    // Build a private grading key (never sent to the student)
    const gradingKey = exam.sections.flatMap((section) =>
      section.questions.map((q) => {
        const meta = (q.metadata ?? {}) as Record<string, any>;
        return {
          questionId: q.id,
          type: q.type,
          points: q.points,
          correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
          // FILL_IN_BLANK: expected text stored in metadata.expectedText
          expectedText: meta.expectedText as string | undefined,
          caseSensitive: meta.caseSensitive as boolean | undefined,
          // MATCHING: correct pairs stored in metadata.correctPairs
          correctPairs: meta.correctPairs as { leftId: string; rightId: string }[] | undefined,
        };
      })
    );

    const attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        studentId: studentId || `anonymous_${Date.now()}`,
        startedAt,
        snapshot: snapshot,
        gradingKey: gradingKey,
        deadline,
      },
    });

    return {
      attemptId: attempt.id,
      snapshot: snapshot,
      timer: {
        deadline,
        durationMinutes: baseDuration,
        showCountdown: exam.showCountdown,
        autoSubmit: exam.autoSubmit,
      },
    };
  }
}