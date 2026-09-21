// src/services/grading.service.ts
import prisma from '../config/database.js';
import { GradingStatus, QuestionType } from '@prisma/client';
import { CollaborationService } from './collaboration.service.js';

const collaborationService = new CollaborationService();

// Grading is owner-only per SRS 3.10 — neither Collaborator nor Invigilator
// have `manage_grades`, so this doubles as an ownership check.
async function requireGradingAccess(examId: string, requesterId: string) {
  await collaborationService.requireAccess(examId, requesterId, 'manage_grades');
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/** Shape of one question stored in the attempt's gradingKey */
interface GradingKeyQuestion {
  questionId: string;
  type: QuestionType;
  points: number;
  /** IDs of correct options (for MCQ, DROPDOWN, MULTIPLE_SELECT, TRUE_FALSE, CHECKBOX) */
  correctOptionIds: string[];
  /** Text of the correct options — TRUE_FALSE students answer "True"/"False", not an option id */
  correctOptionTexts?: string[];
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
// Answer key
// ─────────────────────────────────────────────

/**
 * Builds the answer key from the exam's *current* questions. Grading and
 * regrading use this rather than the copy frozen on the attempt at
 * registration — otherwise fixing a wrong answer key and hitting "regrade"
 * would keep grading against the old, wrong key.
 */
export async function buildGradingKey(examId: string): Promise<GradingKeyQuestion[]> {
  const sections = await prisma.section.findMany({
    where: { examId },
    orderBy: { order: 'asc' },
    include: { questions: { orderBy: { order: 'asc' }, include: { options: { orderBy: { order: 'asc' } } } } },
  });
  return sections.flatMap((section) =>
    section.questions.map((q) => {
      const meta = (q.metadata ?? {}) as Record<string, any>;
      const correct = q.options.filter((o) => o.isCorrect);
      return {
        questionId: q.id,
        type: q.type,
        points: q.points,
        correctOptionIds: correct.map((o) => o.id),
        correctOptionTexts: correct.map((o) => o.text),
        expectedText: meta.expectedText as string | undefined,
        caseSensitive: meta.caseSensitive as boolean | undefined,
        correctPairs: meta.correctPairs as { leftId: string; rightId: string }[] | undefined,
      } as GradingKeyQuestion;
    })
  );
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
    case QuestionType.FILL_IN_BLANK: {
      // Auto-grade only when the teacher supplied an expected answer;
      // otherwise there's nothing to compare against, so leave it for review.
      // Several accepted answers can be given separated by "|".
      const accepted = (key.expectedText ?? '')
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      if (accepted.length === 0) return { score: 0, status: GradingStatus.needs_review };

      const norm = (s: string) => (key.caseSensitive ? s.trim() : s.trim().toLowerCase());
      const given = norm(submitted.textAnswer ?? '');
      const isCorrect = accepted.some((a) => norm(a) === given);
      return { score: isCorrect ? key.points : 0, status: GradingStatus.auto_graded };
    }

    case QuestionType.DROPDOWN:
    case QuestionType.MCQ: {
      // Single correct option – student submits exactly one optionId
      const selected = submitted.selectedOptionIds?.[0];
      const correct = key.correctOptionIds[0];
      const isCorrect = selected !== undefined && selected === correct;
      return { score: isCorrect ? key.points : 0, status: GradingStatus.auto_graded };
    }

    case QuestionType.TRUE_FALSE: {
      // The student UI saves the literal "True"/"False"; other clients may send
      // an option id. Questions from the editor / file import carry
      // metadata.expectedText, while AI-generated and API-created ones only
      // have options — so fall back to the correct option's text (comparing
      // against its *id*, as this used to, could never match "True"/"False").
      const rawSelected = submitted.selectedOptionIds?.[0];
      if (rawSelected === undefined) return { score: 0, status: GradingStatus.auto_graded };

      if (key.correctOptionIds?.includes(rawSelected)) {
        return { score: key.points, status: GradingStatus.auto_graded };
      }

      const expected = key.expectedText ?? key.correctOptionTexts?.[0];
      if (expected === undefined) return { score: 0, status: GradingStatus.auto_graded };

      const normalize = (v: unknown) => String(v ?? '').trim().toLowerCase();
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
          if (question.type === 'MCQ' || question.type === 'TRUE_FALSE' || question.type === 'DROPDOWN') {
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

    const questionInfo = new Map(
      attempt.exam.sections.flatMap(sec => sec.questions.map(q => [q.id, { text: q.text, type: q.type, order: q.order }] as const))
    );
    const gradedAnswers = updated.studentAnswers.map(a => ({
      questionId: a.questionId,
      text: questionInfo.get(a.questionId)?.text ?? '',
      type: questionInfo.get(a.questionId)?.type ?? null,
      score: a.score ?? 0,
      maxScore: a.maxScore,
      status: a.status
    }));

    // Auto-graded portion: sum of scores we currently have (both auto_graded and any graded)
    const scoredSoFar = gradedAnswers.reduce((sum, a) => sum + a.score, 0);

    const percentageScore = maxPossible > 0
      ? parseFloat(((scoredSoFar / maxPossible) * 100).toFixed(2))
      : 0;

    // No pass/fail verdict while essays/short answers are still awaiting a
    // teacher: the score so far only covers the auto-graded part, so
    // "failed" could be wrong once the rest is marked.
    const passed = attempt.exam.passingScore != null && updated.gradingStatus !== 'needs_review'
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

    // Grade against the exam's current answer key; the copy frozen on the
    // attempt is only a fallback for an exam whose questions are gone.
    let gradingKey = await buildGradingKey(attempt.examId);
    if (gradingKey.length === 0) gradingKey = (attempt.gradingKey ?? []) as unknown as GradingKeyQuestion[];
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

    // Percentage score, consistent with _finalizeAttemptIfComplete() (used
    // after manual grading) and submitAndGradeFromAutosave() — both of those
    // already normalize to 0–100 via `score`, so this path needs to as well
    // rather than leaving `score` unset and only populating raw-point
    // `totalScore`. Left null while manual grading is still pending, same as
    // totalScore, since the true total isn't known yet.
    const maxPossible = gradingKey.reduce((sum, k) => sum + k.points, 0);
    const percentageScore = hasPending
      ? null
      : maxPossible > 0
        ? parseFloat(((autoTotal / maxPossible) * 100).toFixed(2))
        : 0;

    // The registrant's name/roll number lives in `answers.studentInfo` until
    // now — submission below overwrites `answers` with the raw answer list,
    // which would otherwise erase it. Carry it over into `snapshot` (never
    // touched again after creation) so reports can still show a real name.
    const studentInfo = (attempt.answers as any)?.studentInfo;

    // 4. Update attempt
    const updated = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: new Date(),
        totalScore: hasPending ? null : autoTotal, // null until all manual grades are in
        score: percentageScore,
        gradingStatus: overallStatus,
        answers: submittedAnswers as any, // keep legacy field populated
        ...(studentInfo ? { snapshot: { ...(attempt.snapshot as any), studentInfo } } : {}),
      },
      include: { studentAnswers: true },
    });

    return updated;
  }

  /**
   * Fetch student answers for an exam, optionally filtered by status.
   */
  async getReviews(examId: string, requesterId: string, filterAll: boolean = false) {
    await requireGradingAccess(examId, requesterId);

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
    const answer = await prisma.studentAnswer.findUnique({
      where: { id: answerId },
      include: { attempt: { select: { examId: true } } },
    });
    if (!answer) throw new Error('Answer not found');
    await requireGradingAccess(answer.attempt.examId, gradedBy);
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
    // Resolve every affected exam up front and check access before writing
    // anything — grades could in principle span more than one exam per batch.
    const answerIds = grades.map(g => g.answerId);
    const answers = await prisma.studentAnswer.findMany({
      where: { id: { in: answerIds } },
      select: { id: true, attempt: { select: { examId: true } } },
    });
    const examIdByAnswerId = new Map(answers.map(a => [a.id, a.attempt.examId]));
    const examIds = [...new Set(answers.map(a => a.attempt.examId))];
    await Promise.all(examIds.map(examId => requireGradingAccess(examId, gradedBy)));

    const results = [];
    const attemptIds = new Set<string>();

    for (const grade of grades) {
      if (!examIdByAnswerId.has(grade.answerId)) continue;
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
  async regradeAttempt(attemptId: string, requesterId: string) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { studentAnswers: true },
    });
    if (!attempt) throw new Error('Attempt not found');
    await requireGradingAccess(attempt.examId, requesterId);

    // Rebuilt from the exam's current questions — that's the whole point of a
    // regrade ("after answer key changes"); the key frozen on the attempt at
    // registration would just reproduce the old result.
    const gradingKey = await buildGradingKey(attempt.examId);
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
        // maxScore too: the question's points may have changed since submission
        data: { score: status === GradingStatus.auto_graded ? score : null, status, maxScore: key.points },
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
