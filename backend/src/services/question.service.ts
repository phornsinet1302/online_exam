// backend/src/services/question.service.ts
import prisma from '../config/database.js';
import { ExamStatus, QuestionType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { processFileImport } from '../utils/fileProcessor.js';
import { generateAIQuestions } from '../utils/aiGenerator.js';

// This interface should match what processFileImport returns
// We'll make all fields optional except the required ones.
interface ParsedQuestion {
  type: string;                // will be mapped to QuestionType
  text: string;
  points?: number;
  difficulty?: number;
  bloomLevel?: string;
  order?: number;
  options?: { text: string; isCorrect: boolean }[];
}

export class QuestionService {
  // -------- Section Management --------
  async createSection(examId: string, title: string, order?: number, randomization = false, shuffleAnswers = false) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.status !== 'DRAFT') throw new Error('Cannot modify a published or archived exam');

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
    if (exam.status !== 'DRAFT') throw new Error('Cannot modify a published or archived exam');

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
    difficulty?: number,
    bloomLevel?: string
  ) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { exam: true },
    });
    if (!section) throw new Error('Section not found');
    if (section.exam.status !== 'DRAFT') throw new Error('Cannot modify a published or archived exam');

    const lastQuestion = await prisma.question.findFirst({
      where: { sectionId },
      orderBy: { order: 'desc' },
    });
    const order = lastQuestion ? lastQuestion.order + 1 : 0;

    // Ensure type is a valid QuestionType
    if (!Object.values(QuestionType).includes(type as QuestionType)) {
      throw new Error(`Invalid question type: ${type}`);
    }

    return prisma.question.create({
      data: {
        sectionId,
        type: type as QuestionType,
        text,
        points,
        difficulty,
        bloomLevel,
        order,
        options: options
          ? {
              create: options.map((opt, idx) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
                order: opt.order ?? idx,
              })),
            }
          : undefined,
      },
      include: { options: true },
    });
  }

  async updateQuestion(questionId: string, data: any) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { section: { include: { exam: true } } },
    });
    if (!question) throw new Error('Question not found');
    if (question.section.exam.status !== 'DRAFT') throw new Error('Cannot modify a published or archived exam');

    const { options, ...questionData } = data;
    // If updating type, validate
    if (questionData.type && !Object.values(QuestionType).includes(questionData.type as QuestionType)) {
      throw new Error(`Invalid question type: ${questionData.type}`);
    }

    return prisma.question.update({
      where: { id: questionId },
      data: questionData,
      include: { options: true },
    });
  }

  async deleteQuestion(questionId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { section: { include: { exam: true } } },
    });
    if (!question) throw new Error('Question not found');
    if (question.section.exam.status !== 'DRAFT') throw new Error('Cannot modify a published or archived exam');

    await prisma.question.delete({ where: { id: questionId } });
    return { message: 'Question deleted successfully' };
  }

  // -------- Import Questions from File --------
  async importQuestions(examId: string, fileBuffer: Buffer, fileName: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.status !== 'DRAFT') throw new Error('Cannot modify a published or archived exam');

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
          difficulty: q.difficulty,
          bloomLevel: q.bloomLevel,
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
    const material = await prisma.material.create({
      data: {
        examId,
        content: materialText,
        fileUrl: fileBuffer ? 'uploaded-file-url' : null, // Prisma allows null
      },
    });
    return { materialId: material.id };
  }

  async generateAIQuestions(
    examId: string,
    materialId: string,
    count: number,
    language: string,
    bloomLevel: string,
    complexity: string
  ) {
    const material = await prisma.material.findUnique({ where: { id: materialId, examId } });
    if (!material) throw new Error('Material not found for this exam');

    // This returns an array of objects matching ParsedQuestion (but without id)
    const generated: ParsedQuestion[] = await generateAIQuestions({
      material: material.content ?? '',
      count,
      language,
      bloomLevel,
      complexity,
    });

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('Exam not found');
    if (exam.status !== 'DRAFT') throw new Error('Cannot modify a published or archived exam');

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

    const created = [];
    for (const q of generated) {
      if (!Object.values(QuestionType).includes(q.type as QuestionType)) {
        throw new Error(`Invalid question type: ${q.type}`);
      }

      const question = await prisma.question.create({
        data: {
          sectionId: section.id,
          type: q.type as QuestionType,
          text: q.text,
          points: q.points ?? 1,
          difficulty: q.difficulty,
          bloomLevel: q.bloomLevel,
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
}