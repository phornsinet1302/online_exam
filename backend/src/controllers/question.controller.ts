// backend/src/controllers/question.controller.ts
import { Request, Response } from 'express';
import { QuestionService } from '../services/question.service.js';
import { IMPORT_TEMPLATE_CSV } from '../utils/fileProcessor.js';

const questionService = new QuestionService();
const getUserId = (req: Request): string => (req as any).user.id;
const statusFromError = (message: string) =>
  message.includes('not found') ? 404
    : message.includes('Access denied') ? 403
      : 400;
const getParam = (
  param: string | string[] | undefined,
  name: string
): string => {
  if (Array.isArray(param)) {
    return param[0];
  }

  if (!param) {
    throw new Error(`Missing route parameter: ${name}`);
  }

  return param;
};
export const createSection = async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.examId, "examId");
    const userId = getUserId(req);
    const { title, order, randomization, shuffleAnswers } = req.body;
    const section = await questionService.createSection(examId, userId, title, order, randomization, shuffleAnswers);
    res.status(201).json(section);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const reorderSections = async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.examId, "examId");
    const userId = getUserId(req);
    const { sections } = req.body; // array of {id, order}
    const result = await questionService.reorderSections(examId, userId, sections);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const createQuestion = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { sectionId, type, text, points, options, difficulty, metadata, title, description, required } = req.body;
    if (!sectionId) throw new Error("Missing sectionId in body");
    const question = await questionService.createQuestion(
      sectionId, userId, type, text, points, options, difficulty,
      metadata, title, description, required
    );
    res.status(201).json(question);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const questionId = getParam(req.params.questionId, "questionId");
    const userId = getUserId(req);
    const data = req.body;
    const question = await questionService.updateQuestion(questionId, userId, data);
    res.status(200).json(question);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const questionId = getParam(req.params.questionId, "questionId");
    const userId = getUserId(req);
    const result = await questionService.deleteQuestion(questionId, userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const importQuestions = async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.examId, "examId");
    const userId = getUserId(req);
    if (!req.file) throw new Error('No file uploaded');
    const sectionId = typeof req.body?.sectionId === 'string' && req.body.sectionId ? req.body.sectionId : undefined;
    const result = await questionService.importQuestions(examId, userId, req.file.buffer, req.file.originalname, sectionId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const downloadImportTemplate = (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="question-import-template.csv"');
  // BOM so Excel opens the file as UTF-8.
  res.send('﻿' + IMPORT_TEMPLATE_CSV);
};

export const uploadMaterial = async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.examId, "examId");
    const userId = getUserId(req);
    const { materialText } = req.body;
    const fileBuffer = req.file?.buffer;
    const result = await questionService.uploadMaterial(examId, userId, materialText, fileBuffer);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const generateAIQuestions = async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.examId, "examId");
    const userId = getUserId(req);
    const { materialId, count, language, complexity } = req.body;
    const result = await questionService.generateAIQuestions(examId, userId, materialId, count, language, complexity);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const batchReviewQuestions = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { questionIds, action } = req.body; // action: 'accept' | 'reject'
    const result = await questionService.batchReviewQuestions(questionIds, userId, action);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

// backend/src/controllers/question.controller.ts

export const duplicateQuestion = async (req: Request, res: Response) => {
  try {
    const questionId = getParam(req.params.questionId, "questionId");
    const userId = getUserId(req);
    const question = await questionService.duplicateQuestion(questionId, userId);
    res.status(201).json(question);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const reorderQuestions = async (req: Request, res: Response) => {
  try {
    const sectionId = getParam(req.params.sectionId, 'sectionId');
    const userId = getUserId(req);
    const { questions } = req.body; // array of { id, order }
    const result = await questionService.reorderQuestions(sectionId, userId, questions);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};

export const moveQuestion = async (req: Request, res: Response) => {
  try {
    const questionId = getParam(req.params.questionId, 'questionId');
    const userId = getUserId(req);
    const { targetSectionId, newOrder } = req.body;
    const result = await questionService.moveQuestion(questionId, userId, targetSectionId, newOrder);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(statusFromError(error.message)).json({ message: error.message });
  }
};