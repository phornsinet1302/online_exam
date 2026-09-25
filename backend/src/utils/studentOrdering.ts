// backend/src/utils/studentOrdering.ts

// Option-based types whose answer choices are safe to reorder. True/False is
// left alone — "True" before "False" is the convention students expect.
const SHUFFLEABLE_OPTION_TYPES = new Set(['MCQ', 'MULTIPLE_SELECT', 'CHECKBOX', 'DROPDOWN']);

// Fisher–Yates; returns a new array.
export function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * The questions of a section in the order one student should see them, with
 * answer choices shuffled where the section asks for it. Called when a
 * student's snapshot is built — that snapshot is stored on the attempt, so the
 * order stays fixed for that student across refreshes and resumes.
 */
export function orderSectionForStudent<Q extends { type: string; options: unknown[] }>(section: {
  randomization: boolean;
  shuffleAnswers: boolean;
  questions: Q[];
}): Q[] {
  const questions = section.randomization ? shuffled(section.questions) : section.questions;
  if (!section.shuffleAnswers) return questions;
  return questions.map((q) =>
    SHUFFLEABLE_OPTION_TYPES.has(q.type) ? { ...q, options: shuffled(q.options) } : q
  );
}
