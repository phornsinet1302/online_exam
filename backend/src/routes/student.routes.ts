// backend/src/routes/student.routes.ts
import { Router } from 'express';
import { validateAttempt } from '../middleware/student.middleware.js';
import { uploadMathFile } from '../middleware/upload.middleware.js';
import {
  getExamState,
  autosaveAnswers,
  toggleReviewFlag,
  createMathUploadSession,
  processMathUpload,
  submitExam,
} from '../controllers/student.controller.js';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// SWAGGER COMPONENT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @openapi
 * components:
 *   schemas:
 *     TimerState:
 *       type: object
 *       properties:
 *         startedAt:
 *           type: string
 *           format: date-time
 *         deadline:
 *           type: string
 *           format: date-time
 *         baseDuration:
 *           type: integer
 *           description: Base exam duration in minutes
 *         extraTime:
 *           type: integer
 *           description: Extra time granted in minutes
 *         totalMinutes:
 *           type: integer
 *         remainingSeconds:
 *           type: integer
 *         isExpired:
 *           type: boolean
 *         showCountdown:
 *           type: boolean
 *         autoSubmit:
 *           type: boolean
 *
 *     ExamStateResponse:
 *       type: object
 *       properties:
 *         attemptId:
 *           type: string
 *         examId:
 *           type: string
 *         snapshot:
 *           type: object
 *           description: Full exam structure snapshot (questions, options, etc.)
 *         autosaveData:
 *           type: object
 *           description: Map of questionId → cached answer payload
 *           additionalProperties:
 *             type: object
 *             properties:
 *               answer:
 *                 description: The student's cached answer (type varies by question)
 *               savedAt:
 *                 type: string
 *                 format: date-time
 *         reviewFlags:
 *           type: array
 *           items:
 *             type: string
 *           description: List of questionIds marked for review
 *         timer:
 *           $ref: '#/components/schemas/TimerState'
 *         isSubmitted:
 *           type: boolean
 *         submittedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *     AutosaveInput:
 *       type: object
 *       required: [attemptId, answers]
 *       properties:
 *         attemptId:
 *           type: string
 *         answers:
 *           type: object
 *           description: Map of questionId → answer payload
 *           additionalProperties:
 *             type: object
 *             required: [answer]
 *             properties:
 *               answer:
 *                 description: >
 *                   The answer value. For MCQ/TRUE_FALSE: optionId (string).
 *                   For CHECKBOX/MULTIPLE_SELECT: array of optionIds.
 *                   For SHORT_ANSWER/ESSAY: string text.
 *                   For MATCHING: object { leftId: rightId }.
 *                   For FILL_IN_BLANK: string text.
 *
 *     ReviewToggleInput:
 *       type: object
 *       required: [attemptId]
 *       properties:
 *         attemptId:
 *           type: string
 *
 *     MathUploadSessionResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Signed JWT session token (embed in QR code)
 *         uploadUrl:
 *           type: string
 *           description: Full URL to open on the student phone for upload
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         expiresInMinutes:
 *           type: integer
 *
 *     MathUploadResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         uploadId:
 *           type: string
 *         fileUrl:
 *           type: string
 *         fileName:
 *           type: string
 *         mimeType:
 *           type: string
 *         attemptId:
 *           type: string
 *         questionId:
 *           type: string
 *           nullable: true
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *
 *     SubmitResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         attemptId:
 *           type: string
 *         submittedAt:
 *           type: string
 *           format: date-time
 *         grading:
 *           type: object
 *           properties:
 *             totalScore:
 *               type: number
 *             maxPossible:
 *               type: number
 *             percentageScore:
 *               type: number
 *             passed:
 *               type: boolean
 *               nullable: true
 *             status:
 *               type: string
 *               enum: [auto_graded, needs_review]
 *             breakdown:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   questionId:
 *                     type: string
 *                   score:
 *                     type: number
 *                   maxScore:
 *                     type: number
 *                   status:
 *                     type: string
 *                     enum: [auto_graded, needs_review]
 *         showResults:
 *           type: boolean
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @openapi
 * /api/exam/state:
 *   get:
 *     tags: [Student Exam]
 *     summary: Recover active exam structural progress for a student
 *     description: >
 *       Returns the full exam snapshot, all autosaved answers, review flags,
 *       and timer status. Use this when the student's connection drops or
 *       the page is refreshed to restore the exam state without data loss.
 *     parameters:
 *       - in: query
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: The active exam attempt ID returned by POST /api/exams/:id/start
 *     responses:
 *       200:
 *         description: Current exam state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamStateResponse'
 *       400:
 *         description: attemptId not provided
 *       404:
 *         description: Attempt not found
 *       409:
 *         description: Attempt already submitted
 */
router.get('/exam/state', validateAttempt, getExamState);

/**
 * @openapi
 * /api/exam/autosave:
 *   post:
 *     tags: [Student Exam]
 *     summary: Silently cache real-time answers per question to prevent data loss
 *     description: >
 *       Stores the student's current answer state for all answered questions
 *       in the database. Should be called every few seconds by the frontend
 *       (SRS 4.1). The full `answers` map replaces any previously cached state.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AutosaveInput'
 *           example:
 *             attemptId: "clxyz123abc"
 *             answers:
 *               "qst_001": { "answer": "opt_A" }
 *               "qst_002": { "answer": ["opt_B", "opt_C"] }
 *               "qst_003": { "answer": "Paris" }
 *     responses:
 *       200:
 *         description: Answers autosaved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 savedAt:
 *                   type: string
 *                   format: date-time
 *                 questionCount:
 *                   type: integer
 *       400:
 *         description: Validation error or attempt already submitted
 *       409:
 *         description: Attempt already submitted
 */
router.post('/exam/autosave', validateAttempt, autosaveAnswers);

/**
 * @openapi
 * /api/exam/questions/{id}/review:
 *   post:
 *     tags: [Student Exam]
 *     summary: Toggle "Mark for Review" state flag for a specific question
 *     description: >
 *       Toggles the review flag on a question for the active attempt.
 *       If the question is not currently flagged, it gets flagged.
 *       If it is already flagged, it gets unflagged.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The question ID to toggle the review flag on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewToggleInput'
 *           example:
 *             attemptId: "clxyz123abc"
 *     responses:
 *       200:
 *         description: Review flag toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questionId:
 *                   type: string
 *                 markedForReview:
 *                   type: boolean
 *                 reviewFlags:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Validation error
 *       409:
 *         description: Attempt already submitted
 */
router.post('/exam/questions/:id/review', validateAttempt, toggleReviewFlag);

/**
 * @openapi
 * /api/exam/math-upload/session:
 *   post:
 *     tags: [Math Upload]
 *     summary: Create short-lived encrypted token payload linking current attempt to phone upload QR
 *     description: >
 *       Generates a 15-minute signed JWT session token that the frontend should
 *       encode as a QR code. When the student scans this QR code on their phone,
 *       the phone opens the upload URL and can upload handwritten math solutions.
 *       Each token is single-use and expires after 15 minutes (SRS 3.13).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [attemptId]
 *             properties:
 *               attemptId:
 *                 type: string
 *           example:
 *             attemptId: "clxyz123abc"
 *     responses:
 *       201:
 *         description: Math upload session created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MathUploadSessionResponse'
 *       400:
 *         description: Validation error or attempt not found
 *       409:
 *         description: Attempt already submitted
 */
router.post('/exam/math-upload/session', validateAttempt, createMathUploadSession);

/**
 * @openapi
 * /api/exam/math-upload:
 *   post:
 *     tags: [Math Upload]
 *     summary: Process image uploads (JPG/PNG/PDF) of physical work from phone to attempt
 *     description: >
 *       Accepts a handwritten math solution file uploaded from the student's phone.
 *       Requires a valid (unexpired, unused) session token obtained from
 *       POST /api/exam/math-upload/session. The file is stored in Supabase Storage
 *       and linked to the exam attempt. Supported formats: JPG, PNG, PDF (max 5 MB).
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, sessionToken]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The image or PDF file to upload (JPG/PNG/PDF, max 5 MB)
 *               sessionToken:
 *                 type: string
 *                 description: The single-use session token from POST /api/exam/math-upload/session
 *               questionId:
 *                 type: string
 *                 description: Optional — link upload to a specific question
 *     responses:
 *       201:
 *         description: File uploaded and linked to attempt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MathUploadResponse'
 *       400:
 *         description: >
 *           Invalid/expired session token, unsupported file type,
 *           file too large, or no file provided
 */
router.post('/exam/math-upload', uploadMathFile, processMathUpload);

/**
 * @openapi
 * /api/exam/submit:
 *   post:
 *     tags: [Student Exam]
 *     summary: Explicitly process formal student submission verification checklist
 *     description: >
 *       Finalises the exam attempt. This endpoint:
 *       1. Validates the attempt is still active (not previously submitted).
 *       2. Auto-grades all objective questions (MCQ, TRUE_FALSE, CHECKBOX, MATCHING,
 *          FILL_IN_BLANK) using the autosaved answers.
 *       3. Marks essay/short-answer questions as "needs_review" for manual grading.
 *       4. Persists submittedAt, totalScore, percentageScore, and per-question grades.
 *       5. Returns the full grading breakdown (if showResults is enabled on the exam).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [attemptId]
 *             properties:
 *               attemptId:
 *                 type: string
 *           example:
 *             attemptId: "clxyz123abc"
 *     responses:
 *       200:
 *         description: Exam submitted and graded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmitResponse'
 *       400:
 *         description: Validation error or attempt already submitted
 *       409:
 *         description: Attempt already submitted
 */
router.post('/exam/submit', validateAttempt, submitExam);

export default router;
