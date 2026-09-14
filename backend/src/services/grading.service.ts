// src/services/grading.service.ts
import prisma from '../config/database.js';
import { GradingStatus, QuestionType } from '@prisma/client';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/** Shape of one question stored in the attempt's gradingKey */
interface GradingKeyQuestion {
  questionId: string;
  type: QuestionType;
  points: number;
  /** IDs of correct options (for MCQ, MULTIPLE_SELECT, TRUE_FALSE, CHECKBOX) */
  correctOptionIds: string[];
  /** For FILL_IN_BLANK: expected text */
  expectedText?: string;
  /** For FILL_IN_BLANK: whether comparison is case-sensitive */
  caseSensitive?: boolean;
  /** For MATCHING: [{leftId, rightId}] correct pairs */
  correctPairs?: { leftId: string; rightId: string }[];
}

/** Shape of one answer submitted by the student */
export interface SubmittedAnswer {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  matchingPairs?: { leftId: string; rightId: string }[];
  fileUrl?: string;
}

/** Result of grading a single answer */
interface GradeResult {
  score: number;
  status: GradingStatus;
}

// ─────────────────────────────────────────────
// Auto-grading logic (no AI)
// ─────────────────────────────────────────────

function gradeAnswer(key: GradingKeyQuestion, submitted: SubmittedAnswer): GradeResult {
  const subjective: QuestionType[] = [
    QuestionType.SHORT_ANSWER,
    QuestionType.ESSAY,
    QuestionType.MATH_FORMULA,
    QuestionType.FILE_UPLOAD,
    QuestionType.FILL_IN_BLANK,
  ];

  if (subjective.includes(key.type)) {
    return { score: 0, status: GradingStatus.needs_review };
  }

  switch (key.type) {
    case QuestionType.MCQ: {
      // Single correct option – student submits exactly one optionId
      const selected = submitted.selectedOptionIds?.[0];
      const correct = key.correctOptionIds[0];
      const isCorrect = selected !== undefined && selected === correct;
      return { score: isCorrect ? key.points : 0, status: GradingStatus.auto_graded };
    }

    case QuestionType.TRUE_FALSE: {
      const rawSelected = submitted.selectedOptionIds?.[0];
      // Fallback chain: metadata.expectedText → first correct option → boolean heuristics
      let expected: string | undefined = key.expectedText;
      if (!expected && key.correctOptionIds?.length === 1) {
        expected = key.correctOptionIds[0];
      }

      const normalize = (v: any) =>
        String(v ?? '').trim().toLowerCase() === 'true' ? 'true'
        : String(v ?? '').trim().toLowerCase() === 'false' ? 'false'
        : String(v ?? '').trim().toLowerCase();

      if (rawSelected === undefined || expected === undefined) {
        return { score: 0, status: GradingStatus.auto_graded };
      }

      const isCorrect = normalize(rawSelected) === normalize(expected);
      return { score: isCorrect ? key.points : 0, status: GradingStatus.auto_graded };
    }

    case QuestionType.MULTIPLE_SELECT:
    case QuestionType.CHECKBOX: {
      // All-or-nothing: student must select exactly the correct set
      const selected = new Set(submitted.selectedOptionIds ?? []);
      const correct = new Set(key.correctOptionIds);
      const isCorrect =
        selected.size === correct.size && [...correct].every((id) => selected.has(id));
      return { score: isCorrect ? key.points : 0, status: GradingStatus.auto_graded };
    }

    case QuestionType.MATCHING: {
      // Each submitted pair must exactly match a correct pair
      const studentPairs = submitted.matchingPairs ?? [];
      const correctPairs = key.correctPairs ?? [];
      const allCorrect = correctPairs.every((cp) =>
        studentPairs.some((sp) => sp.leftId === cp.leftId && sp.rightId === cp.rightId)
      );
      const isCorrect = allCorrect && studentPairs.length === correctPairs.length;
      return { score: isCorrect ? key.points : 0, status: GradingStatus.auto_graded };
    }

    default:
      return { score: 0, status: GradingStatus.needs_review };
  }
}

// ─────────────────────────────────────────────
// Public service methods
// ─────────────────────────────────────────────

export class GradingService {
  /**
   * Helper to map raw autosaveData to SubmittedAnswer[] and run grading.
   * Computes frontend response fields and persists the percentage score.
   */
  async submitAndGradeFromAutosave(attemptId: string) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: { include: { sections: { include: { questions: true } } } } }
    });
    if (!attempt) throw new Error('Attempt not found');
    if (attempt.submittedAt) throw new Error('Attempt already submitted');

    const autosaveData = (attempt.autosaveData as Record<string, { answer: unknown }> | null) ?? {};
    const submittedAnswers: SubmittedAnswer[] = [];
    let maxPossible = 0;

    for (const section of attempt.exam.sections) {
      for (const question of section.questions) {
        maxPossible += question.points ?? 1;
        const saved = autosaveData[question.id];
        const answer = saved?.answer;

        const sub: SubmittedAnswer = { questionId: question.id };

        if (answer !== undefined && answer !== null) {
          if (question.type === 'MCQ' || question.type === 'TRUE_FALSE') {
            sub.selectedOptionIds = [String(answer)];
          } else if (question.type === 'CHECKBOX' || question.type === 'MULTIPLE_SELECT') {
            sub.selectedOptionIds = Array.isArray(answer) ? answer.map(String) : [];
          } else if (question.type === 'MATCHING') {
            if (typeof answer === 'object') {
              sub.matchingPairs = Object.entries(answer as Record<string, string>).map(([left, right]) => ({
                leftId: String(left),
                rightId: String(right)
              }));
            }
          } else if (question.type === 'FILE_UPLOAD') {
            sub.fileUrl = String(answer);
          } else {
            sub.textAnswer = String(answer);
          }
        }
        submittedAnswers.push(sub);
      }
    }

    const updated = await this.submitAndGrade(attemptId, submittedAnswers);

    const gradedAnswers = updated.studentAnswers.map(a => ({
      questionId: a.questionId,
      score: a.score ?? 0,
      maxScore: a.maxScore,
      status: a.status
    }));

    // Auto-graded portion: sum of scores we currently have (both auto_graded and any graded)
    const scoredSoFar = gradedAnswers.reduce((sum, a) => sum + a.score, 0);

    const percentageScore = maxPossible > 0
      ? parseFloat(((scoredSoFar / maxPossible) * 100).toFixed(2))
      : 0;

    const passed = attempt.exam.passingScore != null
      ? percentageScore >= attempt.exam.passingScore
      : null;

    const finalUpdated = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: { score: percentageScore }
    });

    return {
      updated: finalUpdated,
      exam: attempt.exam,
      grading: {
        totalScore: scoredSoFar,
        maxPossible,
        percentageScore,
        passed,
        status: updated.gradingStatus,
        breakdown: gradedAnswers,
      }
    };
  }

  /**
   * Save student answers and run auto-grading on submission.
   * Returns the updated attempt.
   */
  async submitAndGrade(attemptId: string, submittedAnswers: SubmittedAnswer[]) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) throw new Error('Attempt not found');
    if (attempt.submittedAt) throw new Error('Attempt already submitted');

    const gradingKey = (attempt.gradingKey ?? []) as unknown as GradingKeyQuestion[];
    const keyMap = new Map(gradingKey.map((k) => [k.questionId, k]));

    // 1. Create StudentAnswer rows and grade each answer
    let autoTotal = 0;
    let hasPending = false;

    const answerRows = [];
    for (const submitted of submittedAnswers) {
      const key = keyMap.get(submitted.questionId);
      if (!key) continue; // question not in exam, skip

      const { score, status } = gradeAnswer(key, submitted);

      if (status === GradingStatus.auto_graded) {
        autoTotal += score;
      } else {
        hasPending = true;
      }

      answerRows.push({
        attemptId,
        questionId: submitted.questionId,
        selectedOptionIds: submitted.selectedOptionIds ?? [],
        textAnswer: submitted.textAnswer ?? null,
        matchingPairs: submitted.matchingPairs ?? undefined,
        fileUrl: submitted.fileUrl ?? null,
        score: status === GradingStatus.auto_graded ? score : null,
        maxScore: key.points,
        status,
      });
    }

    // 2. Persist answers in one batch
    await prisma.studentAnswer.createMany({ data: answerRows });

    // 3. Determine overall grading status
    const overallStatus = hasPending
      ? GradingStatus.needs_review
      : GradingStatus.auto_graded;

    // 4. Update attempt
    const updated = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: new Date(),
        totalScore: hasPending ? null : autoTotal, // null until all manual grades are in
        gradingStatus: overallStatus,
        answers: submittedAnswers as any, // keep legacy field populated
      },
      include: { studentAnswers: true },
    });

    return updated;
  }

  /**
   * Fetch student answers for an exam, optionally filtered by status.
   */
  async getReviews(examId: string, filterAll: boolean = false) {
    const answers = await prisma.studentAnswer.findMany({
      where: {
        attempt: { examId },
        ...(filterAll ? {} : { status: GradingStatus.needs_review }),
      },
      include: {
        attempt: { select: { id: true, studentId: true, submittedAt: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const questionIds = Array.from(new Set(answers.map((a) => a.questionId)));
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { options: true },
    });
    const qMap = new Map(questions.map((q) => [q.id, q]));

    return answers.map((a) => ({
      ...a,
      question: qMap.get(a.questionId) || null,
    }));
  }

  /**
   * Teacher grades a single student answer.
   */
  async gradeAnswer(answerId: string, score: number, feedback: string | undefined, gradedBy: string) {
    const answer = await prisma.studentAnswer.findUnique({ where: { id: answerId } });
    if (!answer) throw new Error('Answer not found');
    if (score < 0 || score > answer.maxScore) {
      throw new Error(`Score must be between 0 and ${answer.maxScore}`);
    }

    const updated = await prisma.studentAnswer.update({
      where: { id: answerId },
      data: {
        score,
        feedback: feedback ?? null,
        gradedBy,
        gradedAt: new Date(),
        status: GradingStatus.graded,
      },
    });

    // Check if all answers for the attempt are now graded, and finalize total
    await this._finalizeAttemptIfComplete(answer.attemptId);

    return updated;
  }

  /**
   * Teacher grades multiple answers in one request.
   */
  async batchGradeAnswers(
    grades: { answerId: string; score: number; feedback?: string }[],
    gradedBy: string
  ) {
    const results = [];
    const attemptIds = new Set<string>();

    for (const grade of grades) {
      const answer = await prisma.studentAnswer.findUnique({ where: { id: grade.answerId } });
      if (!answer) continue;
      if (grade.score < 0 || grade.score > answer.maxScore) continue;

      const updated = await prisma.studentAnswer.update({
        where: { id: grade.answerId },
        data: {
          score: grade.score,
          feedback: grade.feedback ?? null,
          gradedBy,
          gradedAt: new Date(),
          status: GradingStatus.graded,
        },
      });
      results.push(updated);
      attemptIds.add(answer.attemptId);
    }

    // Finalize any attempts that are now fully graded
    for (const attemptId of attemptIds) {
      await this._finalizeAttemptIfComplete(attemptId);
    }

    return results;
  }

  /**
   * Re-run auto-grading on an attempt (e.g., after a teacher changes correct answers).
   * Only re-grades objective (auto_graded) answers; manual answers are untouched.
   */
  async regradeAttempt(attemptId: string) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { studentAnswers: true },
    });
    if (!attempt) throw new Error('Attempt not found');

    const gradingKey = (attempt.gradingKey ?? []) as unknown as GradingKeyQuestion[];
    const keyMap = new Map(gradingKey.map((k) => [k.questionId, k]));

    let autoTotal = 0;
    for (const answer of attempt.studentAnswers) {
      // Skip answers that were manually graded
      if (answer.status === GradingStatus.graded) {
        autoTotal += answer.score ?? 0;
        continue;
      }

      const key = keyMap.get(answer.questionId);
      if (!key) continue;

      const submitted: SubmittedAnswer = {
        questionId: answer.questionId,
        selectedOptionIds: answer.selectedOptionIds,
        textAnswer: answer.textAnswer ?? undefined,
        matchingPairs: (answer.matchingPairs as any) ?? undefined,
        fileUrl: answer.fileUrl ?? undefined,
      };

      const { score, status } = gradeAnswer(key, submitted);

      await prisma.studentAnswer.update({
        where: { id: answer.id },
        data: { score: status === GradingStatus.auto_graded ? score : null, status },
      });

      if (status === GradingStatus.auto_graded) autoTotal += score;
    }

    await this._finalizeAttemptIfComplete(attemptId);

    return prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { studentAnswers: true },
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * If all StudentAnswer rows for an attempt are graded or auto_graded,
   * compute the total score and mark the attempt as fully graded.
   */
  private async _finalizeAttemptIfComplete(attemptId: string) {
    const answers = await prisma.studentAnswer.findMany({ where: { attemptId } });
    if (answers.length === 0) return;

    const allDone = answers.every(
      (a) => a.status === GradingStatus.graded || a.status === GradingStatus.auto_graded
    );

    const total = answers.reduce((sum, a) => sum + (a.score ?? 0), 0);
    const maxPossible = answers.reduce((sum, a) => sum + (a.maxScore ?? 0), 0);
    const percentage = maxPossible > 0
      ? parseFloat(((total / maxPossible) * 100).toFixed(2))
      : 0;

    await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        score: percentage,
        totalScore: total,
        ...(allDone ? { gradingStatus: GradingStatus.graded } : {}),
      },
    });
  }
}
