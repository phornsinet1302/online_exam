// backend/src/services/grade-report.service.ts
// Per-attempt grade listing (with each answer next to the correct one) and the
// "Export grades" download — SRS 3.6.
import prisma from '../config/database.js';
import { CollaborationService } from './collaboration.service.js';

const collaborationService = new CollaborationService();

export type GradeExportFormat = 'csv' | 'excel' | 'pdf';
export const GRADE_EXPORT_FIELDS = ['name', 'score', 'grade', 'breakdown', 'time', 'attempt', 'submitted'] as const;
export type GradeExportField = (typeof GRADE_EXPORT_FIELDS)[number];

export function letterGrade(pct: number | null): string | null {
  if (pct === null) return null;
  return pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const CHOICE_TYPES = ['MCQ', 'DROPDOWN', 'CHECKBOX', 'MULTIPLE_SELECT'];

type QuestionRow = {
  id: string; text: string; type: string; points: number; metadata: any;
  options: { id: string; text: string; isCorrect: boolean }[];
};

// Student's answer as readable text
function describeAnswer(q: QuestionRow, a: any): string {
  if (!a) return '';
  const optText = (id: string) => q.options.find(o => o.id === id)?.text ?? id;
  if (CHOICE_TYPES.includes(q.type)) return (a.selectedOptionIds ?? []).map(optText).join(', ');
  if (q.type === 'TRUE_FALSE') return (a.selectedOptionIds ?? []).map(optText).join(', ');
  if (q.type === 'MATCHING') {
    return ((a.matchingPairs as any[]) ?? []).map(p => `${p.leftId} → ${p.rightId}`).join('; ');
  }
  if (q.type === 'FILE_UPLOAD') return a.fileUrl ?? '';
  return a.textAnswer ?? '';
}

// The correct answer as readable text (null when a person has to judge it)
function describeCorrect(q: QuestionRow): string | null {
  const meta = q.metadata ?? {};
  if (CHOICE_TYPES.includes(q.type)) return q.options.filter(o => o.isCorrect).map(o => o.text).join(', ') || null;
  if (q.type === 'TRUE_FALSE') return meta.expectedText ?? q.options.find(o => o.isCorrect)?.text ?? null;
  if (q.type === 'MATCHING') return ((meta.pairs as any[]) ?? []).map(p => `${p.L} → ${p.R}`).join('; ') || null;
  if (q.type === 'FILL_IN_BLANK') return meta.expectedText ?? null;
  return null;
}

export class GradeReportService {
  async getExamGrades(examId: string, requesterId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: { questions: { orderBy: { order: 'asc' }, include: { options: { orderBy: { order: 'asc' } } } } },
        },
      },
    });
    if (!exam) throw new Error('Exam not found');
    await collaborationService.requireAccess(examId, requesterId, 'view_analytics');

    const questions: QuestionRow[] = exam.sections.flatMap(s => s.questions as any[]);
    const qIndex = new Map(questions.map((q, i) => [q.id, i]));

    const attempts = await prisma.examAttempt.findMany({
      where: { examId, submittedAt: { not: null } },
      include: { studentAnswers: true },
      orderBy: { startedAt: 'asc' },
    });

    // Attempt number per student, in the order they were taken
    const seen = new Map<string, number>();
    const rows = attempts.map(at => {
      const key = at.studentId ?? at.id;
      const attemptNumber = (seen.get(key) ?? 0) + 1;
      seen.set(key, attemptNumber);

      const info = (at.answers as any)?.studentInfo ?? (at.snapshot as any)?.studentInfo;
      const answers = [...at.studentAnswers]
        .sort((a, b) => (qIndex.get(a.questionId) ?? 0) - (qIndex.get(b.questionId) ?? 0))
        .map(a => {
          const q = questions.find(x => x.id === a.questionId);
          return {
            answerId: a.id,
            questionId: a.questionId,
            number: (qIndex.get(a.questionId) ?? 0) + 1,
            text: q?.text ?? '',
            type: q?.type ?? '',
            score: a.score,
            maxScore: a.maxScore,
            status: a.status,
            feedback: a.feedback,
            studentAnswer: q ? describeAnswer(q, a) : '',
            correctAnswer: q ? describeCorrect(q) : null,
          };
        });

      const totalScore = answers.reduce((sum, a) => sum + (a.score ?? 0), 0);
      const maxScore = answers.reduce((sum, a) => sum + a.maxScore, 0);
      const needsReview = answers.filter(a => a.status === 'needs_review').length;
      const pending = needsReview > 0;
      const percentage = at.score ?? (maxScore > 0 ? round2((totalScore / maxScore) * 100) : 0);

      return {
        attemptId: at.id,
        attemptNumber,
        studentName: info?.name || at.studentId || 'Unknown',
        studentRoll: info?.studentId || null,
        studentEmail: at.studentId?.startsWith('id:') ? null : at.studentId,
        submittedAt: at.submittedAt,
        timeTakenMinutes: at.submittedAt ? Math.max(0, Math.round((at.submittedAt.getTime() - at.startedAt.getTime()) / 60000)) : null,
        score: percentage,
        totalScore: round2(totalScore),
        maxScore,
        // A letter/verdict on a partial score would mislead — wait for the teacher.
        grade: pending ? null : letterGrade(percentage),
        passed: !pending && exam.passingScore != null ? percentage >= exam.passingScore : null,
        gradingStatus: pending ? 'needs_review' : 'graded',
        needsReviewCount: needsReview,
        autoSubmitted: at.autoSubmitted,
        answers,
      };
    });

    const finished = rows.filter(r => r.gradingStatus === 'graded');
    const scores = finished.map(r => r.score);
    return {
      exam: { id: exam.id, title: exam.title, passingScore: exam.passingScore, questionCount: questions.length },
      summary: {
        totalAttempts: rows.length,
        graded: finished.length,
        needsReview: rows.length - finished.length,
        average: scores.length ? round2(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        highest: scores.length ? Math.max(...scores) : 0,
        lowest: scores.length ? Math.min(...scores) : 0,
        passRate: exam.passingScore != null && finished.length
          ? Math.round((finished.filter(r => r.passed).length / finished.length) * 100)
          : 0,
      },
      // Newest first for the teacher's list
      attempts: rows.reverse(),
    };
  }

  async exportGrades(examId: string, requesterId: string, format: GradeExportFormat, fields: string[]) {
    const data = await this.getExamGrades(examId, requesterId);
    const want = new Set<string>(fields.filter(f => (GRADE_EXPORT_FIELDS as readonly string[]).includes(f)));
    if (want.size === 0) throw new Error('Select at least one field to export.');

    const fmtDate = (d: Date | null) => (d ? new Date(d).toISOString().replace('T', ' ').slice(0, 19) : '');
    const qCols = Array.from({ length: data.exam.questionCount }, (_, i) => `Q${i + 1}`);

    // One flat row per attempt, columns driven by the chosen fields
    const columns: string[] = [];
    if (want.has('name')) columns.push('Student', 'Student ID');
    columns.push('Email');
    if (want.has('attempt')) columns.push('Attempt');
    if (want.has('score')) columns.push('Score (%)', 'Points', 'Max points');
    if (want.has('grade')) columns.push('Grade', 'Result');
    columns.push('Grading status');
    if (want.has('time')) columns.push('Time taken (min)');
    if (want.has('submitted')) columns.push('Submitted at');
    if (want.has('breakdown')) columns.push(...qCols);

    const rows = data.attempts.map(a => {
      const r: Record<string, string | number> = {};
      if (want.has('name')) { r['Student'] = a.studentName; r['Student ID'] = a.studentRoll ?? ''; }
      r['Email'] = a.studentEmail ?? '';
      if (want.has('attempt')) r['Attempt'] = a.attemptNumber;
      if (want.has('score')) { r['Score (%)'] = a.score; r['Points'] = a.totalScore; r['Max points'] = a.maxScore; }
      if (want.has('grade')) { r['Grade'] = a.grade ?? 'Pending'; r['Result'] = a.passed === null ? '' : a.passed ? 'Pass' : 'Fail'; }
      r['Grading status'] = a.gradingStatus === 'graded' ? 'Graded' : `Needs review (${a.needsReviewCount})`;
      if (want.has('time')) r['Time taken (min)'] = a.timeTakenMinutes ?? '';
      if (want.has('submitted')) r['Submitted at'] = fmtDate(a.submittedAt);
      if (want.has('breakdown')) {
        for (const ans of a.answers) r[`Q${ans.number}`] = ans.status === 'needs_review' ? 'pending' : `${ans.score ?? 0}/${ans.maxScore}`;
      }
      return r;
    });

    const slug = data.exam.title.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 40) || 'exam';
    const base = `grades_${slug}_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'csv') {
      const { Parser } = await import('json2csv');
      const csv = new Parser({ fields: columns }).parse(rows);
      // BOM so Excel opens non-English names as UTF-8
      return { data: '﻿' + csv, contentType: 'text/csv; charset=utf-8', filename: `${base}.csv` };
    }

    if (format === 'excel') {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Grades');
      ws.columns = columns.map(c => ({ header: c, key: c, width: Math.max(10, c.length + 2) }));
      rows.forEach(r => ws.addRow(r));
      ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D1B2A' } };
      ws.views = [{ state: 'frozen', ySplit: 1 }];
      const buffer = await wb.xlsx.writeBuffer();
      return {
        data: buffer as unknown as Buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `${base}.xlsx`,
      };
    }

    const PDFDocument = (await import('pdfkit')).default;
    return new Promise<{ data: Buffer; contentType: string; filename: string }>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve({ data: Buffer.concat(chunks), contentType: 'application/pdf', filename: `${base}.pdf` }));
      doc.on('error', reject);

      doc.fontSize(18).font('Helvetica-Bold').text(data.exam.title, { align: 'center' });
      doc.moveDown(0.2).fontSize(10).font('Helvetica').fillColor('#6B7280')
        .text(`Grade report · generated ${new Date().toLocaleString()}`, { align: 'center' }).fillColor('#000000');
      doc.moveDown(0.8);
      const s = data.summary;
      doc.fontSize(10).font('Helvetica-Bold').text(
        `${s.totalAttempts} attempts · ${s.graded} graded · ${s.needsReview} awaiting review · average ${s.average}%` +
        (data.exam.passingScore != null ? ` · pass rate ${s.passRate}%` : '')
      );
      doc.moveDown(0.8);

      for (const a of data.attempts) {
        if (doc.y > 720) doc.addPage();
        const head = [
          want.has('name') ? a.studentName : a.studentEmail,
          want.has('attempt') ? `attempt ${a.attemptNumber}` : '',
        ].filter(Boolean).join(' · ');
        doc.fontSize(11).font('Helvetica-Bold').text(head);

        const bits: string[] = [];
        if (a.studentEmail && want.has('name')) bits.push(a.studentEmail);
        if (want.has('score')) bits.push(`${a.score}% (${a.totalScore}/${a.maxScore} pts)`);
        if (want.has('grade')) bits.push(a.gradingStatus === 'graded' ? `Grade ${a.grade}${a.passed === null ? '' : a.passed ? ' · Pass' : ' · Fail'}` : 'Grade pending');
        if (want.has('time') && a.timeTakenMinutes !== null) bits.push(`${a.timeTakenMinutes} min`);
        if (want.has('submitted')) bits.push(fmtDate(a.submittedAt));
        if (bits.length) doc.fontSize(9).font('Helvetica').text(bits.join('  |  '));
        if (want.has('breakdown')) {
          doc.fontSize(9).font('Helvetica').fillColor('#374151')
            .text(a.answers.map(x => `Q${x.number}: ${x.status === 'needs_review' ? 'pending' : `${x.score ?? 0}/${x.maxScore}`}`).join('   '))
            .fillColor('#000000');
        }
        doc.moveDown(0.6);
      }
      doc.end();
    });
  }
}
