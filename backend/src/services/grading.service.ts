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
  ];

  if (subjective.includes(key.type)) {
    return { score: 0, status: GradingStatus.needs_review };
  }

  switch (key.type) {
    case QuestionType.MCQ:
    case QuestionType.TRUE_FALSE: {
      // Single correct option – student submits exactly one optionId
      const selected = submitted.selectedOptionIds?.[0];
      const correct = key.correctOptionIds[0];
      const isCorrect = selected !== undefined && selected === correct;
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

    case QuestionType.FILL_IN_BLANK: {
      const studentText = submitted.textAnswer ?? '';
      const expected = key.expectedText ?? '';
      const cs = key.caseSensitive ?? false;
      const isCorrect = cs
        ? studentText.trim() === expected.trim()
        : studentText.trim().toLowerCase() === expected.trim().toLowerCase();
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
   * Fetch all student answers that need manual review for an exam.
   */
  async getPendingReviews(examId: string) {
    return prisma.studentAnswer.findMany({
      where: {
        status: GradingStatus.needs_review,
        attempt: { examId },
      },
      include: {
        attempt: { select: { id: true, studentId: true, submittedAt: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
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
    const allDone = answers.every(
      (a) => a.status === GradingStatus.graded || a.status === GradingStatus.auto_graded
    );

    if (allDone) {
      const total = answers.reduce((sum, a) => sum + (a.score ?? 0), 0);
      await prisma.examAttempt.update({
        where: { id: attemptId },
        data: { totalScore: total, gradingStatus: GradingStatus.graded },
      });
    }
  }
}
