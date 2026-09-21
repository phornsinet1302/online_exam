// Service responsible for handling exam-related business logic
// backend/src/services/exam.service.ts
import prisma from '../config/database.js';
import { ExamStatus } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { parse } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { CollaborationService } from './collaboration.service.js';
import { hashPassword } from '../utils/password.js';
import { maskMatchingPairs } from '../utils/snapshot.js';
import { orderSectionForStudent } from '../utils/studentOrdering.js';

const collaborationService = new CollaborationService();

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

// The stored (hashed) exam password must never leave the server — clients only
// learn whether one is set.
function sanitizeExam<T extends { password?: string | null }>(exam: T): Omit<T, 'password'> & { hasPassword: boolean } {
  const { password, ...rest } = exam;
  return { ...rest, hasPassword: !!password };
}

// Resolves when the exam window closes. An explicit end (same MM/dd/yyyy +
// hh:mm a format as the start, or an ISO string from API clients) wins;
// otherwise it's derived as start + duration + late-entry allowance.
function resolveEndDate(opts: {
  start?: Date | null;
  endDate?: string | null;
  endTime?: string;
  timezone: string;
  durationMin: number;
  lateMin: number;
}): Date | null {
  const { start, endDate, endTime, timezone, durationMin, lateMin } = opts;
  let explicit: Date | undefined;
  if (endDate) {
    explicit = /^\d{2}\/\d{2}\/\d{4}$/.test(endDate)
      ? combineDateAndTime(endDate, endTime, timezone)
      : new Date(endDate);
    if (!explicit || isNaN(explicit.getTime())) throw new Error('Invalid end date or time format');
  }

  if (explicit) {
    if (start && explicit <= start) throw new Error('End date must be after the start date.');
    if (start && durationMin > 0 && explicit.getTime() < start.getTime() + durationMin * 60_000) {
      throw new Error('End date must leave room for the full exam duration after the start.');
    }
    return explicit;
  }
  return start && durationMin > 0 ? new Date(start.getTime() + (durationMin + lateMin) * 60_000) : null;
}

function generateUniqueCode(length: number = 6): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').toUpperCase().slice(0, length);
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

// Helper: sync sections and questions
async function syncSectionsAndQuestions(examId: string, fullSections: any[], randomizeQuestions: boolean, shuffleAnswers: boolean) {
  const processedSectionIds: string[] = [];
  const processedQuestionIds: string[] = [];
  const processedOptionIds: string[] = [];

  for (let i = 0; i < fullSections.length; i++) {
    const sec = fullSections[i];
    let sectionId = sec.id;

    if (!sectionId || sectionId.startsWith('section-')) {
      const newSec = await prisma.section.create({
        data: {
          examId,
          title: sec.title || `Section ${i + 1}`,
          order: i,
          randomization: randomizeQuestions,
          shuffleAnswers
        }
      });
      sectionId = newSec.id;
    } else {
      await prisma.section.update({
        where: { id: sectionId },
        data: { title: sec.title, order: i, randomization: randomizeQuestions, shuffleAnswers }
      });
    }
    processedSectionIds.push(sectionId);

    for (let j = 0; j < sec.questions.length; j++) {
      const q = sec.questions[j];
      let qId = q.id;

      let qType = (q.type || "MCQ").toUpperCase();
      if (qType === "TRUEFALSE") qType = "TRUE_FALSE";
      if (qType === "SHORT") qType = "SHORT_ANSWER";
      if (qType === "FILL") qType = "FILL_IN_BLANK";
      if (qType === "CHECKBOX") qType = "MULTIPLE_SELECT";
      if (qType === "FILE") qType = "FILE_UPLOAD";
      if (qType === "MATH") qType = "MATH_FORMULA";

      const isChoiceType = ["TRUE_FALSE", "MULTIPLE_SELECT", "MCQ", "CHECKBOX", "DROPDOWN"].includes(qType);

      let metadata: any = {};
      if (q.metadata) {
        metadata = { ...q.metadata };
      }
      if (q.hint) {
        metadata.hint = q.hint;
      }
      if (qType === "MATCHING") {
        const pairs = (q.pairs || []).map((p: any) => ({
          L: p.left || '',
          R: p.right || '',
        }));
        metadata.pairs = pairs;
        metadata.correctPairs = pairs.map((p: any) => ({ leftId: p.L, rightId: p.R }));
      } else if (qType === "FILL_IN_BLANK") {
        metadata.expectedText = q.answer || q.expectedText;
        metadata.caseSensitive = !!q.caseSensitive;
      } else if (qType === "TRUE_FALSE") {
        metadata.expectedText = q.answer; // Contains "True" or "False"
      }

      if (!qId || qId.startsWith('question-')) {
        const newQ = await prisma.question.create({
          data: {
            sectionId: sectionId,
            type: qType as any,
            text: q.title || "Untitled Question",
            points: parseInt(q.points, 10) || 1,
            difficulty: "MEDIUM",
            order: j,
            required: !!q.required,
            description: q.description || "",
            metadata: metadata
          }
        });
        qId = newQ.id;
      } else {
        const existing = await prisma.question.findUnique({
          where: { id: qId },
          select: { metadata: true },
        });
        const existingMetadata = (existing?.metadata as any) || {};
        const mergedMetadata = { ...existingMetadata, ...metadata };

        await prisma.question.update({
          where: { id: qId },
          data: {
            type: qType as any,
            text: q.title || "Untitled Question",
            points: parseInt(q.points, 10) || 1,
            order: j,
            required: !!q.required,
            description: q.description || "",
            metadata: mergedMetadata
          }
        });
      }
      processedQuestionIds.push(qId);

      if (isChoiceType && q.options) {
        for (let k = 0; k < q.options.length; k++) {
          const opt = q.options[k];
          let optId = opt.id;
          if (!optId || optId.startsWith('option-') || optId.startsWith(`${q.id}-opt-`)) {
            const newOpt = await prisma.option.create({
              data: {
                questionId: qId,
                text: opt.text || "Option",
                isCorrect: !!opt.correct,
                order: k
              }
            });
            processedOptionIds.push(newOpt.id);
          } else {
            await prisma.option.update({
              where: { id: optId },
              data: {
                text: opt.text || "Option",
                isCorrect: !!opt.correct,
                order: k
              }
            });
            processedOptionIds.push(optId);
          }
        }
      }
    }
  }

  // Cleanup removed options
  await prisma.option.deleteMany({
    where: {
      questionId: { in: processedQuestionIds },
      id: { notIn: processedOptionIds }
    }
  });

  // Cleanup removed questions
  await prisma.question.deleteMany({
    where: {
      sectionId: { in: processedSectionIds },
      id: { notIn: processedQuestionIds }
    }
  });

  // Cleanup removed sections
  await prisma.section.deleteMany({
    where: {
      examId: examId,
      id: { notIn: processedSectionIds }
    }
  });
}

export class ExamService {
  // -------- Create Exam --------
  async createExam(ownerId: string, data: any) {
    const { startDate, startTime, endDate: rawEndDate, endTime, timezone, fullSections, password, ...rest } = data;
    // A manual-start exam has no scheduled close: the session ends duration
    // after the teacher presses Start (or when they end it).
    const endDate = rest.manualStart ? undefined : rawEndDate;
    const tz = timezone || 'UTC';
    const combinedStartDate = combineDateAndTime(startDate, startTime, tz);

    const endDateResolved = resolveEndDate({
      start: combinedStartDate,
      endDate,
      endTime,
      timezone: tz,
      durationMin: Number(rest.duration ?? 0),
      lateMin: Number(rest.lateAllowanceMinutes ?? 0),
    });

    const accessType = rest.accessType || 'PUBLIC';
    if (accessType === 'PASSWORD_PROTECTED' && !(typeof password === 'string' && password.trim())) {
      throw new Error('A password is required for password-protected exams.');
    }

    const examData = {
      status: 'DRAFT',
      timezone: tz,
      uniqueCode: generateUniqueCode(),
      ...rest,
      ownerId, // after ...rest so a request body can never assign another owner
      accessType,
      password: accessType === 'PASSWORD_PROTECTED' ? hashPassword(password.trim()) : null,
      startDate: combinedStartDate,
      endDate: endDateResolved,
      endDateFixed: !!endDate,
    };

    const exam = await prisma.exam.create({ data: examData as any });
    if (fullSections) {
      await syncSectionsAndQuestions(exam.id, fullSections, !!rest.randomizeQuestions, !!rest.shuffleAnswers);
    }
    return sanitizeExam(exam);
  }

  // -------- Get Exams (filterable) --------
  async getExams(ownerId: string, filters?: any) {
    const where: any = { ownerId };
    if (filters?.status) where.status = filters.status;
    if (filters?.subject) where.subject = filters.subject;
    if (filters?.startDateFrom) where.startDate = { gte: filters.startDateFrom };
    if (filters?.startDateTo) where.startDate = { ...where.startDate, lte: filters.startDateTo };
    const exams = await prisma.exam.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { attempts: true },
        },
        sections: {
          include: {
            _count: {
              select: { questions: true }
            }
          }
        }
      },
    });

    return exams.map((exam: any) => {
      const { _count, sections, ...rest } = exam;
      const questionsCount = sections.reduce((acc: number, sec: any) => acc + sec._count.questions, 0);
      return {
        ...sanitizeExam(rest),
        studentsCount: _count.attempts,
        questionsCount,
      };
    });
  }

  // -------- Get Exams accessible to a user (owned + accepted collaborations) --------
  // Used by pickers/selectors that need every exam a teacher has a stake in,
  // not just the ones they own — e.g. the Live Monitoring exam dropdown.
  async getAccessibleExams(userId: string) {
    const [owned, collaborations] = await Promise.all([
      prisma.exam.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { attempts: true } } },
      }),
      prisma.collaborator.findMany({
        where: { userId, status: 'ACCEPTED' },
        include: { exam: { include: { _count: { select: { attempts: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const ownedMapped = owned.map(e => ({
      id: e.id,
      title: e.title,
      subject: e.subject,
      status: e.status,
      startDate: e.startDate,
      sessionState: e.sessionState,
      studentsCount: e._count.attempts,
      role: 'OWNER' as const,
    }));
    const collabMapped = collaborations.map(c => ({
      id: c.exam.id,
      title: c.exam.title,
      subject: c.exam.subject,
      status: c.exam.status,
      startDate: c.exam.startDate,
      sessionState: c.exam.sessionState,
      studentsCount: c.exam._count.attempts,
      role: c.role as 'COLLABORATOR' | 'INVIGILATOR',
    }));

    return [...ownedMapped, ...collabMapped];
  }

  // -------- Get Exam by ID --------
  async getExamById(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        sections: { include: { questions: { include: { options: true } } } },
        attempts: {
          orderBy: { startedAt: 'desc' },
          take: 50 // Limit to recent 50 attempts for dashboard preview
        },
        _count: {
          select: { attempts: true },
        },
      },
    });
    if (!exam) throw new Error('Exam not found');
    // Owner, collaborator, and invigilator can all view exam details —
    // collaborators need it to edit, invigilators to know what they're proctoring.
    const myRole = await collaborationService.getUserRole(examId, ownerId);
    if (!myRole) throw new Error('Access denied');

    const questionsCount = exam.sections.reduce((acc, sec) => acc + sec.questions.length, 0);

    return {
      ...sanitizeExam(exam),
      questionsCount,
      studentsCount: exam._count.attempts,
      myRole,
    };
  }

  async updateExam(examId: string, ownerId: string, data: any) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) {
      await collaborationService.requireAccess(examId, ownerId, 'update_exam_details');
    }
    if (exam.sessionState === 'ENDED') throw new Error('Cannot edit an exam that has already ended.');

    // The body is applied to the exam row wholesale, so guard the fields a
    // Collaborator must not be able to reach through a general "update":
    // ownership (never client-settable — there's no transfer flow) and the
    // publish/archive lifecycle + access credentials (owner-only per SRS 3.10).
    delete data.id;
    delete data.ownerId;
    if (exam.ownerId !== ownerId) {
      delete data.uniqueCode;
      delete data.magicLinkToken;
      // The editor sends status "DRAFT" on every plain save — for a
      // Collaborator that must neither 403 nor unpublish, so just ignore it.
      if (data.status === 'DRAFT') delete data.status;
      if (data.status !== undefined && data.status !== exam.status) {
        await collaborationService.requireAccess(examId, ownerId, 'publish_exam');
      }
    }

    const { startDate, startTime, endDate: rawEndDate, endTime, fullSections, password, ...rest } = data;
    const manual = rest.manualStart ?? exam.manualStart;
    const endDate = manual ? undefined : rawEndDate;
    const tz = rest.timezone || exam.timezone || 'UTC';
    const updateData: any = { ...rest };
    // Switching to manual start drops any hard close left over from scheduling.
    if (rest.manualStart === true) updateData.endDateFixed = false;

    // Only touch the schedule when the request actually carries schedule
    // fields — a settings-only save (e.g. privacy) must not wipe the end date.
    const timingTouched = startDate !== undefined || endDate !== undefined
      || rest.duration !== undefined || rest.lateAllowanceMinutes !== undefined;
    if (timingTouched) {
      const start = startDate !== undefined ? combineDateAndTime(startDate, startTime, tz) : exam.startDate;
      if (startDate !== undefined) updateData.startDate = start;
      updateData.endDateFixed = !!endDate;
      updateData.endDate = resolveEndDate({
        start,
        endDate,
        endTime,
        timezone: tz,
        durationMin: Number(rest.duration ?? exam.duration ?? 0),
        lateMin: Number(rest.lateAllowanceMinutes ?? exam.lateAllowanceMinutes ?? 0),
      });
    }

    // Exam password: hashed at rest, blank means "keep the current one".
    if (rest.accessType !== undefined || password !== undefined) {
      const effectiveAccess = rest.accessType ?? exam.accessType;
      if (effectiveAccess === 'PASSWORD_PROTECTED') {
        if (typeof password === 'string' && password.trim()) {
          updateData.password = hashPassword(password.trim());
        } else if (!exam.password) {
          throw new Error('A password is required for password-protected exams.');
        }
      } else {
        updateData.password = null;
      }
    }

    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: updateData,
    });

    if (fullSections) {
      await syncSectionsAndQuestions(exam.id, fullSections, updatedExam.randomizeQuestions, updatedExam.shuffleAnswers);
    }

    return sanitizeExam(updatedExam);
  }

  // -------- Delete Exam --------
  async deleteExam(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) {
      await collaborationService.requireAccess(examId, ownerId, 'delete_exam');
    }
    await prisma.exam.delete({ where: { id: examId } });
    return { message: 'Exam deleted successfully' };
  }

  // -------- Duplicate Exam --------
  async duplicateExam(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        antiCheatRules: true,
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
        endDate: exam.endDate,
        duration: exam.duration,
        timezone: exam.timezone,
        passingScore: exam.passingScore,
        maxAttempts: exam.maxAttempts,
        randomizeQuestions: exam.randomizeQuestions,
        showResults: exam.showResults,
        accessType: exam.accessType,
        password: exam.password,
        lateAllowanceMinutes: exam.lateAllowanceMinutes,
        requireLateApproval: exam.requireLateApproval,
        autoStart: exam.autoStart,
        manualStart: exam.manualStart,
        autoClose: exam.autoClose,
        autoSubmit: exam.autoSubmit,
        showCountdown: exam.showCountdown,
        requireCamera: exam.requireCamera,
        lockFullscreen: exam.lockFullscreen,
        browserLockdown: exam.browserLockdown,
        screenshotIntervalSec: exam.screenshotIntervalSec,
        status: 'DRAFT',
        // Generate a fresh unique code — do NOT copy the original's code
        uniqueCode: generateUniqueCode(),
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
            // Without these a copy silently loses the answer key for
            // fill-in-blank / matching / true-false questions, plus the
            // question's title, description and required flag.
            required: question.required,
            title: question.title,
            description: question.description,
            ...(question.metadata ? { metadata: question.metadata as any } : {}),
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

    if (exam.antiCheatRules.length > 0) {
      await prisma.examAntiCheatRule.createMany({
        data: exam.antiCheatRules.map((r) => ({
          examId: newExam.id,
          eventType: r.eventType,
          enabled: r.enabled,
          action: r.action,
          threshold: r.threshold,
        })),
      });
    }

    const copy = await prisma.exam.findUnique({
      where: { id: newExam.id },
      include: {
        sections: { include: { questions: { include: { options: true } } } },
      },
    });
    return copy ? sanitizeExam(copy) : copy;
  }

  // -------- Publish Exam --------
  async publishExam(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) {
      await collaborationService.requireAccess(examId, ownerId, 'publish_exam');
    }
    if (exam.status === 'ARCHIVED') throw new Error('Archived exams cannot be published');

    // Keep the exam's existing code: it's already on the Sharing tab / QR, so
    // regenerating it on publish would silently break links shared as a draft.
    const uniqueCode = exam.uniqueCode || generateUniqueCode();

    const updated = await prisma.exam.update({
      where: { id: examId },
      data: {
        status: 'PUBLISHED',
        uniqueCode,
      },
    });

    // Same link the Sharing tab and QR code use — /join/:code hands the
    // student straight into the entry flow.
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const magicLink = `${frontendBase}/join/${uniqueCode.toLowerCase()}`;

    return {
      message: 'Exam published successfully',
      exam: sanitizeExam(updated),
      access: { uniqueCode, magicLink },
    };
  }

  // -------- Archive Exam --------
  async archiveExam(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) throw new Error('Access denied');
    return sanitizeExam(await prisma.exam.update({
      where: { id: examId },
      data: { status: 'ARCHIVED' },
    }));
  }

  // -------- Reopen Exam --------
  // Gives an ended exam a fresh session: waiting room open, scheduled to start
  // `startsInMinutes` from now. Existing attempts are kept (they were already
  // submitted when the session ended), and Max Attempts still decides who may
  // sit it again. The start is deliberately in the future — join closes at the
  // scheduled start plus the late-entry allowance, so a start of "now" would
  // lock students out before they could enter the code.
  async reopenExam(
    examId: string,
    ownerId: string,
    opts: { startsInMinutes: number; endDate?: string | null; endTime?: string | null },
  ) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) throw new Error('Access denied');
    if (exam.status !== 'PUBLISHED') throw new Error('Only a published exam can be reopened.');
    if (exam.sessionState !== 'ENDED') throw new Error('Only an ended exam can be reopened.');

    // Manual-start exams have no schedule to set: reopening just opens the
    // lobby, and the teacher presses Start when ready.
    if (exam.manualStart) {
      const reopened = await prisma.exam.update({
        where: { id: examId },
        data: { sessionState: 'WAITING', endDate: null, endDateFixed: false },
      });
      return sanitizeExam(reopened);
    }

    const start = new Date(Date.now() + opts.startsInMinutes * 60_000);
    const end = resolveEndDate({
      start,
      endDate: opts.endDate,
      endTime: opts.endTime ?? undefined,
      timezone: exam.timezone || 'UTC',
      durationMin: exam.duration ?? 0,
      lateMin: exam.lateAllowanceMinutes ?? 0,
    });

    const updated = await prisma.exam.update({
      where: { id: examId },
      data: { sessionState: 'WAITING', startDate: start, endDate: end, endDateFixed: !!opts.endDate },
    });
    return sanitizeExam(updated);
  }

  // -------- Unarchive Exam --------
  // Restores to DRAFT rather than PUBLISHED: an archived exam may have sat for
  // a while, so the owner re-checks it and republishes on purpose.
  async unarchiveExam(examId: string, ownerId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.ownerId !== ownerId) throw new Error('Access denied');
    if (exam.status !== 'ARCHIVED') throw new Error('Only archived exams can be unarchived');
    return sanitizeExam(await prisma.exam.update({
      where: { id: examId },
      data: { status: 'DRAFT' },
    }));
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
    if (exam.ownerId !== ownerId && !(await collaborationService.getUserRole(examId, ownerId))) {
      throw new Error('Access denied');
    }

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
    if (exam.ownerId !== ownerId) {
      await collaborationService.requireAccess(examId, ownerId, 'update_exam_details');
    }

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
    if (exam.ownerId !== ownerId) {
      await collaborationService.requireAccess(examId, ownerId, 'update_exam_details');
    }

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

    const now0 = new Date();
    const effectiveEnd = exam.endDate
      ? exam.endDate
      : (exam.startDate && exam.duration
          ? new Date(exam.startDate.getTime() + (exam.duration + (exam.lateAllowanceMinutes ?? 0)) * 60_000)
          : null);

    if (exam.sessionState === 'ENDED') throw new Error('This exam has already ended.');
    if (effectiveEnd && now0 >= effectiveEnd) throw new Error('This exam has already ended.');

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
        questions: orderSectionForStudent(section).map((q, qIndex) => ({
          id: q.id,
          type: q.type,
          text: q.text,
          points: q.points,
          difficulty: q.difficulty,
          order: qIndex,
          metadata: {
            pairs: maskMatchingPairs((q.metadata as any)?.pairs),
            hint: (q.metadata as any)?.hint,
          },
          options: q.options.map((opt, oIndex) => ({
            id: opt.id,
            text: opt.text,
            order: oIndex,
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
        deadline,
        gradingKey: gradingKey,
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