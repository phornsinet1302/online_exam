// backend/src/controllers/ai.controller.ts
import { Request, Response } from 'express';
import { AIGenerationService } from '../services/ai/generation.service.js';
import prisma from '../config/database.js';
import { QuestionType, Difficulty } from '@prisma/client';

const aiService = new AIGenerationService();

export const uploadAndGenerate = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const {
      examId,
      sectionId,
      subject,
      topic,
      difficulty,
      numQuestions,
      questionType = 'MIXED',
      language,
    } = req.body;

    if (!examId || !sectionId || !subject || !difficulty || !numQuestions) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { exam: true },
    });
    if (!section) return res.status(404).json({ error: 'Section not found' });
    if (section.examId !== examId) return res.status(400).json({ error: 'Section does not belong to this exam' });

    // ALLOW 'MIXED' to pass validation
    if (questionType !== 'MIXED' && !Object.values(QuestionType).includes(questionType as QuestionType)) {
      return res.status(400).json({ error: `Invalid question type: ${questionType}` });
    }

    // 1. Extract text
    const text = await aiService.extractTextFromPDF(req.file.buffer);
    if (text.length < 100) {
      return res.status(400).json({ error: 'Extracted text too short. Is the PDF text-based?' });
    }

    // 2. Generate questions
    const generatedQuestions = await aiService.generateQuestions({
      materialText: text,
      subject,
      topic,
      difficulty,
      numQuestions: parseInt(numQuestions, 10),
      questionType: questionType as QuestionType | 'MIXED',
      language: language || 'English',
    });

    // 3. Determine starting order
    const lastQuestion = await prisma.question.findFirst({
      where: { sectionId },
      orderBy: { order: 'desc' },
    });
    let nextOrder = lastQuestion ? lastQuestion.order + 1 : 0;

    // 4. Save to database seamlessly
    const savedQuestions = [];
    for (const q of generatedQuestions) {
      const aiOptions = q.options || [];
      const correctAnswers: string[] = q.correctAnswers || []; // Fallback for older interface compatibility

      const created = await prisma.question.create({
        data: {
          sectionId,
          type: (q.type as QuestionType), // Trust AI to output MCQ, TRUE_FALSE etc. based on prompt
          text: q.questionText,
          points: q.marks ?? 1,
          difficulty: (q.difficulty?.toUpperCase() as Difficulty) || (difficulty?.toUpperCase() as Difficulty) || undefined,
          order: nextOrder++,
          reviewed: false, 
          metadata: {
            isAIGenerated: true,
            explanation: q.explanation || null,
            subject,
            topic: topic || null,
          },
          options: aiOptions.length > 0
            ? {
                create: aiOptions.map((opt: any, idx: number) => {
                  // NEW CLEAN FORMAT: AI returned {text: "Paris", isCorrect: true}
                  if (typeof opt === 'object' && opt !== null && 'text' in opt) {
                    return {
                      text: String(opt.text),
                      isCorrect: opt.isCorrect === true || String(opt.isCorrect).toLowerCase() === 'true',
                      order: opt.order ?? idx,
                    };
                  }
                  // OLD FORMAT FALLBACK: AI returned string array ["Paris", "London"]
                  return {
                    text: String(opt),
                    isCorrect: correctAnswers.includes(String(idx)) || correctAnswers.includes(String(opt)),
                    order: idx,
                  };
                }),
              }
            : undefined,
        },
        include: { options: true },
      });
      savedQuestions.push(created);
    }

    res.status(201).json({
      message: 'Questions generated and saved as drafts',
      count: savedQuestions.length,
      questions: savedQuestions,
    });
  } catch (error) {
    console.error('Generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};
// Batch review endpoint — approve (mark reviewed) or reject (delete)
export const batchReview = async (req: Request, res: Response) => {
  try {
    const { questionIds, action } = req.body;
    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: 'Invalid questionIds' });
    }

    if (action === 'approve') {
      await prisma.question.updateMany({
        where: { id: { in: questionIds } },
        data: { reviewed: true },
      });
    } else if (action === 'reject') {
      // Delete options first (cascade should handle this, but being explicit)
      await prisma.question.deleteMany({
        where: { id: { in: questionIds } },
      });
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
    }

    res.json({ message: `Questions ${action}d successfully`, count: questionIds.length });
  } catch (error) {
    console.error('Batch review error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};