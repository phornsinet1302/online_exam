// src/validators/ai.validator.ts
import { z } from 'zod';

// Reuse the same bloom level enum as before
const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] as const;

export const aiGenerateSchema = z.object({
  materialId: z.string().cuid(),          // if you use CUIDs; adjust if needed
  count: z.number().int().min(1).max(50), // generate at least 1, up to 50
  language: z.string().min(1).default('English'),
  bloomLevel: z.enum(bloomLevels).optional(),
  complexity: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
  // You might also allow `difficulty` as 1-5, but you can map later
});

// For params: examId
export const examIdParamSchema = z.object({
  examId: z.string().cuid(),
});