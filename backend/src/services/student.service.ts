// backend/src/services/student.service.ts
import prisma from '../config/database.js';
import { Prisma } from '@prisma/client';
import { supabase } from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const MATH_JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const MATH_SESSION_TTL_MINUTES = 15;

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/exam/state  — recover active exam progress
// ─────────────────────────────────────────────────────────────────────────────
export async function getExamState(attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: true },
  });
  if (!attempt) throw new Error('Attempt not found');

  const exam = attempt.exam;
  const baseDuration = exam.duration ?? 0;
  const extraTime = attempt.extraTimeMinutes ?? 0;
  const totalMinutes = baseDuration + extraTime;
  const deadline =
    attempt.deadline ??
    new Date(attempt.startedAt.getTime() + totalMinutes * 60_000);
  const now = new Date();
  const remainingMs = Math.max(0, deadline.getTime() - now.getTime());

  return {
    attemptId: attempt.id,
    examId: exam.id,
    snapshot: attempt.snapshot,
    autosaveData: attempt.autosaveData ?? {},
    reviewFlags: attempt.reviewFlags ?? [],
    timer: {
      startedAt: attempt.startedAt,
      deadline,
      baseDuration,
      extraTime,
      totalMinutes,
      remainingSeconds: Math.floor(remainingMs / 1000),
      isExpired: remainingMs <= 0,
      showCountdown: exam.showCountdown,
      autoSubmit: exam.autoSubmit,
    },
    isSubmitted: !!attempt.submittedAt,
    submittedAt: attempt.submittedAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST /api/exam/autosave  — cache per-question answers
// ─────────────────────────────────────────────────────────────────────────────
export async function autosaveAnswers(
  attemptId: string,
  answers: Record<string, { answer: unknown }>
) {
  // Enrich each entry with a server-side timestamp
  const savedAt = new Date().toISOString();
  const enriched: Record<string, { answer: unknown; savedAt: string }> = {};
  for (const [questionId, payload] of Object.entries(answers)) {
    enriched[questionId] = { answer: payload.answer, savedAt };
  }

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: { autosaveData: enriched as unknown as Prisma.InputJsonValue },
  });

  return {
    message: 'Answers autosaved successfully.',
    savedAt,
    questionCount: Object.keys(enriched).length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /api/exam/questions/:id/review  — toggle review flag
// ─────────────────────────────────────────────────────────────────────────────
export async function toggleReviewFlag(
  attemptId: string,
  questionId: string
) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: { reviewFlags: true },
  });
  if (!attempt) throw new Error('Attempt not found');

  const current: string[] = attempt.reviewFlags ?? [];
  const isMarked = current.includes(questionId);

  const updated = isMarked
    ? current.filter((id) => id !== questionId)
    : [...current, questionId];

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: { reviewFlags: updated },
  });

  return {
    questionId,
    markedForReview: !isMarked,
    reviewFlags: updated,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. POST /api/exam/math-upload/session  — create QR session token
// ─────────────────────────────────────────────────────────────────────────────
export async function createMathUploadSession(attemptId: string) {
  const expiresAt = new Date(
    Date.now() + MATH_SESSION_TTL_MINUTES * 60_000
  );

  // Sign a JWT that embeds the attemptId and type discriminator
  const token = jwt.sign(
    {
      type: 'math-upload-session',
      attemptId,
      jti: uuidv4(), // unique per token to prevent reuse
    },
    MATH_JWT_SECRET,
    { expiresIn: `${MATH_SESSION_TTL_MINUTES}m` }
  );

  // Persist so we can track usage and revocation
  await prisma.mathUploadSession.create({
    data: { attemptId, token, expiresAt },
  });

  const uploadBaseUrl =
    process.env.FRONTEND_URL || 'http://localhost:3000';
  const uploadUrl = `${uploadBaseUrl}/exam/math-upload?session=${token}`;

  return {
    token,
    uploadUrl, // Encode this as a QR code on the frontend
    expiresAt,
    expiresInMinutes: MATH_SESSION_TTL_MINUTES,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. POST /api/exam/math-upload  — process image/PDF upload from phone
// ─────────────────────────────────────────────────────────────────────────────
export async function processMathUpload(
  sessionToken: string,
  file: Express.Multer.File,
  questionId?: string
) {
  // Verify session token
  let payload: { attemptId: string; type: string; jti: string };
  try {
    payload = jwt.verify(sessionToken, MATH_JWT_SECRET) as typeof payload;
  } catch {
    throw new Error('Invalid or expired upload session token');
  }

  if (payload.type !== 'math-upload-session') {
    throw new Error('Invalid session token type');
  }

  // Fetch and validate session record
  const session = await prisma.mathUploadSession.findUnique({
    where: { token: sessionToken },
  });
  if (!session) throw new Error('Upload session not found');
  if (session.used) throw new Error('This upload session has already been used');
  if (new Date() > session.expiresAt) throw new Error('Upload session has expired');

  const attemptId = session.attemptId;

  // Verify the attempt exists and is still active
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
  });
  if (!attempt) throw new Error('Associated exam attempt not found');
  if (attempt.submittedAt) {
    throw new Error('The exam attempt has already been submitted');
  }

  // Upload file to Supabase Storage
  const fileExt = file.mimetype === 'application/pdf' ? 'pdf'
    : file.mimetype === 'image/png' ? 'png'
    : 'jpg';
  const storagePath = `math-uploads/${attemptId}/${uuidv4()}.${fileExt}`;

  let fileUrl: string;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('math-uploads')
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    // Fallback: store the base64 data URI in the DB if storage is unavailable
    console.warn(
      'Supabase Storage upload failed, falling back to base64:',
      uploadError.message
    );
    fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  } else {
    const { data: urlData } = supabase.storage
      .from('math-uploads')
      .getPublicUrl(uploadData.path);
    fileUrl = urlData.publicUrl;
  }

  // Mark session as used and persist the upload record
  const [, mathUpload] = await prisma.$transaction([
    prisma.mathUploadSession.update({
      where: { id: session.id },
      data: { used: true },
    }),
    prisma.mathUpload.create({
      data: {
        attemptId,
        questionId: questionId ?? null,
        fileUrl,
        fileName: file.originalname,
        mimeType: file.mimetype,
      },
    }),
  ]);

  return {
    message: 'Math upload processed successfully.',
    uploadId: mathUpload.id,
    fileUrl,
    fileName: file.originalname,
    mimeType: file.mimetype,
    attemptId,
    questionId: questionId ?? null,
    uploadedAt: mathUpload.uploadedAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. POST /api/exam/submit  — formal student submission
// ─────────────────────────────────────────────────────────────────────────────
export async function submitExam(attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          sections: {
            include: {
              questions: {
                include: { options: true },
              },
            },
          },
        },
      },
    },
  });
  if (!attempt) throw new Error('Attempt not found');
  if (attempt.submittedAt) {
    throw new Error('This attempt has already been submitted');
  }

  // Check time expiry (respect extra time)
  const exam = attempt.exam;
  if (exam.duration) {
    const baseDuration = exam.duration;
    const extraTime = attempt.extraTimeMinutes ?? 0;
    const deadline =
      attempt.deadline ??
      new Date(attempt.startedAt.getTime() + (baseDuration + extraTime) * 60_000);

    // We allow submission even after deadline (student may have been slow to click submit)
    // The autoSubmit mechanism handles forced submission separately.
    const isLate = new Date() > deadline;

    // Log if late but don't block manual submit
    if (isLate) {
      console.info(`[submit] Attempt ${attemptId} submitted after deadline`);
    }
  }

  // ── Auto-grade objective questions ──────────────────────────────────────
  const autosaveData =
    (attempt.autosaveData as Record<
      string,
      { answer: unknown }
    > | null) ?? {};

  const OBJECTIVE_TYPES = new Set([
    'MCQ',
    'TRUE_FALSE',
    'CHECKBOX',
    'MULTIPLE_SELECT',
    'MATCHING',
    'FILL_IN_BLANK',
  ]);

  let totalScore = 0;
  let maxPossible = 0;
  const gradedAnswers: Array<{
    questionId: string;
    score: number;
    maxScore: number;
    status: 'auto_graded' | 'needs_review';
  }> = [];

  for (const section of exam.sections) {
    for (const question of section.questions) {
      const points = question.points ?? 1;
      maxPossible += points;

      const saved = autosaveData[question.id];
      const isObjective = OBJECTIVE_TYPES.has(question.type);

      if (!isObjective) {
        // Essay / Short Answer — needs manual review
        gradedAnswers.push({
          questionId: question.id,
          score: 0,
          maxScore: points,
          status: 'needs_review',
        });
        continue;
      }

      // Grade objective question
      const correctOptionIds = question.options
        .filter((o) => o.isCorrect)
        .map((o) => o.id);

      let score = 0;

      if (saved?.answer !== undefined) {
        const answer = saved.answer;

        if (question.type === 'MCQ' || question.type === 'TRUE_FALSE') {
          // Single answer — compare string IDs
          if (answer === correctOptionIds[0]) {
            score = points;
          }
        } else if (
          question.type === 'CHECKBOX' ||
          question.type === 'MULTIPLE_SELECT'
        ) {
          // Multi-select — must match exactly
          const selectedIds: string[] = Array.isArray(answer)
            ? (answer as string[])
            : [];
          const correctSet = new Set(correctOptionIds);
          const selectedSet = new Set(selectedIds);
          const allCorrect =
            selectedIds.every((id) => correctSet.has(id)) &&
            correctOptionIds.every((id) => selectedSet.has(id));
          if (allCorrect) {
            score = points;
          }
        } else if (question.type === 'FILL_IN_BLANK') {
          // Case-insensitive text match against first correct option text
          const correctText = question.options.find((o) => o.isCorrect)?.text ?? '';
          if (
            typeof answer === 'string' &&
            answer.trim().toLowerCase() === correctText.trim().toLowerCase()
          ) {
            score = points;
          }
        } else if (question.type === 'MATCHING') {
          // Matching: answer is expected as { [leftId]: rightId }
          // Give partial credit: 1 point per correct pair / total pairs
          if (typeof answer === 'object' && answer !== null) {
            const pairs = answer as Record<string, string>;
            const pairCount = correctOptionIds.length;
            if (pairCount > 0) {
              let correct = 0;
              for (const opt of question.options.filter((o) => o.isCorrect)) {
                // Each correct option's id is the right side; option.order maps to left
                if (pairs[String(opt.order)] === opt.id) correct++;
              }
              score = (correct / pairCount) * points;
            }
          }
        }
      }

      totalScore += score;
      gradedAnswers.push({
        questionId: question.id,
        score,
        maxScore: points,
        status: 'auto_graded',
      });
    }
  }

  const percentageScore =
    maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
  const passed =
    exam.passingScore != null ? percentageScore >= exam.passingScore : null;

  // Determine overall grading status
  const hasUnreviewed = gradedAnswers.some((g) => g.status === 'needs_review');
  const overallGradingStatus = hasUnreviewed ? 'needs_review' : 'auto_graded';

  // ── Persist submission ───────────────────────────────────────────────────
  const updated = await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      submittedAt: new Date(),
      totalScore,
      score: percentageScore,
      gradingStatus: overallGradingStatus as any,
      // answers field stores the final snapshot of answers for replay
      answers: autosaveData as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    message: 'Exam submitted successfully.',
    attemptId: updated.id,
    submittedAt: updated.submittedAt,
    grading: {
      totalScore,
      maxPossible,
      percentageScore: parseFloat(percentageScore.toFixed(2)),
      passed,
      status: overallGradingStatus,
      breakdown: gradedAnswers,
    },
    showResults: exam.showResults,
  };
}
