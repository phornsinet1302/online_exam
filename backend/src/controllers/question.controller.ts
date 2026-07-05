// backend/src/controllers/question.controller.ts
import { Request, Response } from 'express';
import { QuestionService } from '../services/question.service.js';

const questionService = new QuestionService();
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
    const { title, order, randomization, shuffleAnswers } = req.body;
    const section = await questionService.createSection(examId, title, order, randomization, shuffleAnswers);
    res.status(201).json(section);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const reorderSections = async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.examId, "examId");
    const { sections } = req.body; // array of {id, order}
    const result = await questionService.reorderSections(examId, sections);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createQuestion = async (req: Request, res: Response) => {
  try {
    const sectionId = getParam(req.params.sectionId, "sectionId");
    const { type, text, points, options, difficulty, bloomLevel } = req.body;
    const question = await questionService.createQuestion(sectionId, type, text, points, options, difficulty, bloomLevel);
    res.status(201).json(question);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const questionId = getParam(req.params.questionId, "questionId");
    const data = req.body;
    const question = await questionService.updateQuestion(questionId, data);
    res.status(200).json(question);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const questionId = getParam(req.params.questionId, "questionId");
    const result = await questionService.deleteQuestion(questionId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const importQuestions = async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.examId, "examId");
    if (!req.file) throw new Error('No file uploaded');
    const result = await questionService.importQuestions(examId, req.file.buffer, req.file.originalname);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadMaterial = async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.examId, "examId");
    const { materialText } = req.body;
    const fileBuffer = req.file?.buffer;
    const result = await questionService.uploadMaterial(examId, materialText, fileBuffer);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const generateAIQuestions = async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.examId, "examId");
    const { materialId, count, language, bloomLevel, complexity } = req.body;
    const result = await questionService.generateAIQuestions(examId, materialId, count, language, bloomLevel, complexity);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const batchReviewQuestions = async (req: Request, res: Response) => {
  try {
    const { questionIds, action } = req.body; // action: 'accept' | 'reject'
    const result = await questionService.batchReviewQuestions(questionIds, action);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};