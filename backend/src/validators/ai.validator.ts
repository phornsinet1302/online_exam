// src/validators/ai.validator.ts
import { z } from 'zod';

export const aiGenerateSchema = z.object({
  materialId: z.string().cuid(),          // if you use CUIDs; adjust if needed
  count: z.number().int().min(1).max(50), // generate at least 1, up to 50
  language: z.string().min(1).default('English'),
  complexity: z.enum(['Easy', 'Medium', 'Hard', 'Mixed']).default('Medium'),
  // You might also allow `difficulty` as 1-5, but you can map later
});

// For params: examId
export const examIdParamSchema = z.object({
  examId: z.string().cuid(),
});