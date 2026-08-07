// backend/src/services/question.service.ts
import prisma from '../config/database.js';
import { ExamStatus, QuestionType, Difficulty } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { processFileImport } from '../utils/fileProcessor.js';
import { AIGenerationService } from './ai/generation.service.js';

// This interface should match what processFileImport returns
// We'll make all fields optional except the required ones.
interface ParsedQuestion {
  type: string; // will be mapped to QuestionType
  text: string;
  points?: number;
  difficulty?: Difficulty;
  order?: number;
  options?: { text: string; isCorrect: boolean }[];
}

const normalizeDifficulty = (value: unknown): Difficulty | undefined => {
  if (typeof value !== 'string') return undefined;

  const normalized = value.toUpperCase();
  return Object.values(Difficulty).includes(normalized as Difficulty)
    ? (normalized as Difficulty)
    : undefined;
};

export class QuestionService {
  private aiGenerationService = new AIGenerationService();

  // -------- Section Management --------
  async createSection(examId: string, title: string, order?: number, randomization = false, shuffleAnswers = false) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');

    if (order === undefined) {
      const lastSection = await prisma.section.findFirst({
        where: { examId },
        orderBy: { order: 'desc' },
      });
      order = lastSection ? lastSection.order + 1 : 0;
    }

    return prisma.section.create({
      data: {
        examId,
        title,
        order,
        randomization,
        shuffleAnswers,
      },
    });
  }

  async reorderSections(examId: string, sectionOrder: { id: string; order: number }[]) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    // if (exam.status !== 'DRAFT') throw new Error('Cannot modify a published or archived exam');

    const sectionIds = sectionOrder.map(s => s.id);
    const sections = await prisma.section.findMany({
      where: { id: { in: sectionIds }, examId },
    });
    if (sections.length !== sectionIds.length) {
      throw new Error('Some sections do not belong to this exam');
    }

    await prisma.$transaction(
      sectionOrder.map(({ id, order }) =>
        prisma.section.update({ where: { id }, data: { order } })
      )
    );
    return { message: 'Sections reordered successfully' };
  }

  // -------- Question Management --------
  async createQuestion(
    sectionId: string,
    type: string,
    text: string,
    points: number,
    options?: { text: string; isCorrect: boolean; order?: number }[],
    difficulty?: Difficulty,
    metadata?: any,
    title?: string,
    description?: string,
    required?: boolean,
  ) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { exam: true },
    });
    if (!section) throw new Error('Section not found');

    const lastQuestion = await prisma.question.findFirst({
      where: { sectionId },
      orderBy: { order: 'desc' },
    });
    const order = lastQuestion ? lastQuestion.order + 1 : 0;

    // Validate type
    if (!Object.values(QuestionType).includes(type as QuestionType)) {
      throw new Error(`Invalid question type: ${type}`);
    }

    const typesRequiringOptions = ['MCQ', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'CHECKBOX'];
    if (typesRequiringOptions.includes(type) && (!options || options.length === 0)) {
      throw new Error(`Options are required for ${type}`);
    }
    if (!typesRequiringOptions.includes(type) && options) {
      throw new Error(`Options are not allowed for ${type}`);
    }

    // Specific validation for TRUE_FALSE
    if (type === 'TRUE_FALSE' && options) {
      if (options.length !== 2) throw new Error('True/False questions must have exactly 2 options');
      if (options.filter(opt => opt.isCorrect).length !== 1) {
        throw new Error('True/False questions must have exactly 1 correct answer');
      }
    }

    const questionData: any = {
      sectionId,
      type: type as QuestionType,
      text,
      points,
      difficulty: normalizeDifficulty(difficulty) || Difficulty.MEDIUM,
      order,
      required: required ?? true,
      title: title || null,
      description: description || null,
    };
    if (metadata) {
      questionData.metadata = metadata;
    }
    if (options) {
      questionData.options = {
        create: options.map((opt, idx) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
          order: opt.order ?? idx,
        }))
      };
    }

    return prisma.question.create({
      data: questionData,
      include: { options: true }
    });
  }

  async updateQuestion(questionId: string, data: any) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true, section: { include: { exam: true } } },
    });
    if (!question) throw new Error('Question not found');
    // if (question.section.exam.status !== 'DRAFT') throw new Error('Cannot modify a published or archived exam');

    const { options, ...questionData } = data;

    // Determine effective type for validation
    const effectiveType = questionData.type || question.type;
    if (!Object.values(QuestionType).includes(effectiveType as QuestionType)) {
      throw new Error(`Invalid question type: ${effectiveType}`);
    }

    const typesRequiringOptions = ['MCQ', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'CHECKBOX'];
    const requiresOptions = typesRequiringOptions.includes(effectiveType);

    let optionsUpdate: any = undefined;

    if (options !== undefined) {
      // Options provided; validate
      if (requiresOptions) {
        if (options.length === 0) throw new Error(`Options are required for ${effectiveType}`);
        if (effectiveType === 'TRUE_FALSE') {
          if (options.length !== 2) throw new Error('True/False must have exactly 2 options');
          if (options.filter((o: any) => o.isCorrect).length !== 1) {
            throw new Error('True/False must have exactly one correct answer');
          }
        }
        // Replace options: delete all and create new
        optionsUpdate = {
          deleteMany: {},
          create: options.map((opt: any, idx: number) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: opt.order ?? idx,
          })),
        };
      } else {
        // Non-option type
        if (options.length > 0) throw new Error(`Options are not allowed for ${effectiveType}`);
        // Empty array provided, so delete all existing options
        optionsUpdate = { deleteMany: {} };
      }
    } else {
      // options not provided
      // If type is changing, we need to handle
      if (questionData.type) {
        if (requiresOptions) {
          throw new Error(`Options are required for ${effectiveType}`);
        } else {
          // Type changed to non-option; delete any existing options
          optionsUpdate = { deleteMany: {} };
        }
      }
      // if type not changed, leave options unchanged
    }

    // Build update data
    const updateData: any = { ...questionData };
    if (optionsUpdate) {
      updateData.options = optionsUpdate;
    }

    return prisma.question.update({
      where: { id: questionId },
      data: updateData,
      include: { options: true },
    });
  }

  async deleteQuestion(questionId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { section: { include: { exam: true } } },
    });
    if (!question) throw new Error('Question not found');
    // if (question.section.exam.status !== 'DRAFT') throw new Error('Cannot modify a published or archived exam');

    await prisma.question.delete({ where: { id: questionId } });
    return { message: 'Question deleted successfully' };
  }

  // -------- Import Questions from File --------
  async importQuestions(examId: string, fileBuffer: Buffer, fileName: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    // if (exam.status !== 'DRAFT') throw new Error('Cannot modify a published or archived exam');

    const parsedQuestions: ParsedQuestion[] = await processFileImport(fileBuffer, fileName);

    let section = await prisma.section.findFirst({ where: { examId }, orderBy: { order: 'asc' } });
    if (!section) {
      section = await prisma.section.create({
        data: { examId, title: 'Imported Questions', order: 0 },
      });
    }

    const created = [];
    for (const q of parsedQuestions) {
      // Validate type
      if (!Object.values(QuestionType).includes(q.type as QuestionType)) {
        throw new Error(`Invalid question type: ${q.type}`);
      }

      const question = await prisma.question.create({
        data: {
          sectionId: section.id,
          type: q.type as QuestionType,
          text: q.text,
          points: q.points ?? 1,
          difficulty: q.difficulty || Difficulty.MEDIUM,
          order: q.order ?? 0,
          options: q.options
            ? {
                create: q.options.map((opt, idx) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                  order: idx,
                })),
              }
            : undefined,
        },
      });
      created.push(question);
    }

    return { message: `Imported ${created.length} questions`, count: created.length };
  }

  // -------- AI Question Generation --------
  async uploadMaterial(examId: string, materialText: string, fileBuffer?: Buffer) {
    let content = materialText;
    if (fileBuffer && !content) {
      try {
        content = await this.aiGenerationService.extractTextFromPDF(fileBuffer);
      } catch (error) {
        console.error('Failed to extract PDF text during material upload:', error);
      }
    }

    const material = await prisma.material.create({
      data: {
        examId,
        content,
        fileUrl: fileBuffer ? 'uploaded-file-url' : null,
      },
    });
    return { materialId: material.id };
  }

  async generateAIQuestions(
    examId: string,
    materialId: string,
    count: number,
    language: string,
    complexity: string
  ) {
    const material = await prisma.material.findUnique({ where: { id: materialId, examId } });
    if (!material) throw new Error('Material not found for this exam');

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    // if (exam.status !== 'DRAFT') throw new Error('Cannot modify a published or archived exam');
    let section = await prisma.section.findFirst({
      where: { examId, title: { contains: 'AI Generated' } },
    });
    if (!section) {
      section = await prisma.section.create({
        data: {
          examId,
          title: 'AI Generated Questions',
          order: await prisma.section.count({ where: { examId } }),
        },
      });
    }

    let difficulty: Difficulty | null = null;
    if (complexity) {
      const upperComplexity = complexity.toUpperCase();
      if (Object.values(Difficulty).includes(upperComplexity as Difficulty)) {
        difficulty = upperComplexity as Difficulty;
      }
    }

    // Call real Gemini API
    const generated = await this.aiGenerationService.generateQuestions({
      materialText: material.content ?? '',
      subject: exam.subject || 'General',
      difficulty: difficulty || Difficulty.MEDIUM,
      numQuestions: count,
      questionType: QuestionType.MCQ,
      language: language || 'English',
    });

    const lastQuestion = await prisma.question.findFirst({
      where: { sectionId: section.id },
      orderBy: { order: 'desc' },
    });
    let nextOrder = lastQuestion ? lastQuestion.order + 1 : 0;

    const created = [];
    for (const q of generated) {
      const qType = (q.type as QuestionType) || QuestionType.MCQ;
      if (!Object.values(QuestionType).includes(qType)) {
        throw new Error(`Invalid question type: ${qType}`);
      }

      const aiOptions: string[] = q.options || [];
      const correctAnswers: string[] = q.correctAnswers || [];

      const question = await prisma.question.create({
        data: {
          sectionId: section.id,
          type: qType,
          text: q.questionText || 'Generated Question',
          points: q.marks ?? 1,
          difficulty: difficulty || Difficulty.MEDIUM,
          order: nextOrder++,
          reviewed: false, // requires review
          metadata: {
            isAIGenerated: true,
            explanation: q.explanation || null,
          },
          options: aiOptions.length > 0
            ? {
                create: aiOptions.map((optText: string, idx: number) => ({
                  text: optText,
                  isCorrect: correctAnswers.includes(String(idx)) || correctAnswers.includes(optText),
                  order: idx,
                })),
              }
            : undefined,
        },
        include: { options: true },
      });
      created.push(question);
    }

    return { message: `Generated ${created.length} questions`, questions: created };
  }

  // -------- Bulk Review --------
  async batchReviewQuestions(questionIds: string[], action: 'accept' | 'reject') {
    if (action === 'reject') {
      await prisma.question.deleteMany({
        where: { id: { in: questionIds } },
      });
      return { message: `Rejected ${questionIds.length} questions` };
    } else {
      await prisma.question.updateMany({
        where: { id: { in: questionIds } },
        data: { reviewed: true },
      });
      return { message: `Accepted ${questionIds.length} questions` };
    }
  }

  // backend/src/services/question.service.ts (partial)
  async duplicateQuestion(questionId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true }
    });
    if (!question) throw new Error('Question not found');

    // Build new data – omit metadata if null/undefined
    const newData: any = {
      sectionId: question.sectionId,
      type: question.type,
      text: question.text + ' (copy)',
      points: question.points,
      difficulty: question.difficulty,
      order: question.order + 1,
      reviewed: false,
      options: question.options.length > 0
        ? {
          create: question.options.map(opt => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: opt.order,
          })),
        }
        : undefined,
    };

    // Only include metadata if it exists (not null)
    if (question.metadata) {
      newData.metadata = question.metadata;
    }

    return prisma.question.create({
      data: newData,
      include: { options: true },
    });
  }

  async reorderQuestions(sectionId: string, questionOrder: { id: string; order: number }[]) {
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section) throw new Error('Section not found');

  const ids = questionOrder.map(q => q.id);
  const questions = await prisma.question.findMany({
    where: { id: { in: ids }, sectionId },
  });
  if (questions.length !== ids.length) {
    throw new Error('Some questions do not belong to this section');
  }

  await prisma.$transaction(
    questionOrder.map(({ id, order }) =>
      prisma.question.update({
        where: { id },
        data: { order },
      })
    )
  );
  return { message: 'Questions reordered successfully' };
}

  async moveQuestion(questionId: string, targetSectionId: string, newOrder?: number) {
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) throw new Error('Question not found');

  const targetSection = await prisma.section.findUnique({ where: { id: targetSectionId } });
  if (!targetSection) throw new Error('Target section not found');

  // If no order provided, append at the end
  if (newOrder === undefined) {
    const last = await prisma.question.findFirst({
      where: { sectionId: targetSectionId },
      orderBy: { order: 'desc' },
    });
    newOrder = last ? last.order + 1 : 0;
  }

  return prisma.question.update({
    where: { id: questionId },
    data: {
      sectionId: targetSectionId,
      order: newOrder,
    },
    include: { options: true },});
  }
}