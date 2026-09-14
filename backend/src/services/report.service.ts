// backend/src/services/report.service.ts
import prisma from '../config/database.js';
import { ExportFormat, ReportType } from '@prisma/client';

export class ReportService {
  // ═══════════════════════════════════════════════════════════════════════════
  // SCORES REPORT (SRS 3.11)
  // ═══════════════════════════════════════════════════════════════════════════
  async getScoresReport(ownerId: string, examId?: string) {
    const where: any = {};
    if (examId) {
      // Verify access
      const exam = await prisma.exam.findUnique({ where: { id: examId } });
      if (!exam) throw new Error('Exam not found');
      where.examId = examId;
    } else {
      // All exams owned by this teacher
      const exams = await prisma.exam.findMany({
        where: { ownerId },
        select: { id: true },
      });
      where.examId = { in: exams.map(e => e.id) };
    }

    const attempts = await prisma.examAttempt.findMany({
      where: { ...where, submittedAt: { not: null } },
      include: {
        exam: { select: { title: true, subject: true, passingScore: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Aggregate by student
    const studentMap = new Map<string, any>();
    for (const attempt of attempts) {
      const key = attempt.studentId || 'anonymous';
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          studentId: key,
          examsAttempted: 0,
          totalScore: 0,
          scores: [],
          highestScore: 0,
          lowestScore: 100,
          passed: 0,
          failed: 0,
        });
      }
      const student = studentMap.get(key)!;
      const score = attempt.score ?? attempt.totalScore ?? 0;
      student.examsAttempted++;
      student.totalScore += score;
      student.scores.push({
        examId: attempt.examId,
        examTitle: attempt.exam.title,
        score,
        submittedAt: attempt.submittedAt,
        passed: attempt.exam.passingScore ? score >= attempt.exam.passingScore : null,
      });
      student.highestScore = Math.max(student.highestScore, score);
      student.lowestScore = Math.min(student.lowestScore, score);
      if (attempt.exam.passingScore && score >= attempt.exam.passingScore) student.passed++;
      else student.failed++;
    }

    const students = Array.from(studentMap.values()).map(s => ({
      ...s,
      averageScore: s.examsAttempted > 0 ? Math.round((s.totalScore / s.examsAttempted) * 100) / 100 : 0,
    }));

    // Sort by average score descending and assign ranks
    students.sort((a, b) => b.averageScore - a.averageScore);
    students.forEach((s, i) => { s.rank = i + 1; });

    const totalStudents = students.length;
    const classAverage = totalStudents > 0
      ? Math.round(students.reduce((sum, s) => sum + s.averageScore, 0) / totalStudents * 100) / 100
      : 0;
    const passRate = totalStudents > 0
      ? Math.round(students.filter(s => s.passed > s.failed).length / totalStudents * 100)
      : 0;

    return {
      summary: {
        totalStudents,
        totalAttempts: attempts.length,
        classAverage,
        passRate,
        highestScore: students[0]?.highestScore ?? 0,
        lowestScore: students[students.length - 1]?.lowestScore ?? 0,
      },
      students,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ATTENDANCE REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  async getAttendanceReport(ownerId: string, examId?: string) {
    const examWhere: any = { ownerId };
    if (examId) examWhere.id = examId;

    const exams = await prisma.exam.findMany({
      where: examWhere,
      include: {
        attempts: {
          select: {
            studentId: true,
            startedAt: true,
            submittedAt: true,
            autoSubmitted: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    const examReports = exams.map(exam => {
      const joined = exam.attempts.length;
      const submitted = exam.attempts.filter(a => a.submittedAt).length;
      const autoSubmitted = exam.attempts.filter(a => a.autoSubmitted).length;
      // Late start: students who started after exam start + allowance
      let lateStart = 0;
      if (exam.startDate) {
        const allowanceMs = (exam.lateAllowanceMinutes || 0) * 60 * 1000;
        const cutoff = new Date(exam.startDate.getTime() + allowanceMs);
        lateStart = exam.attempts.filter(a => a.startedAt > cutoff).length;
      }

      return {
        examId: exam.id,
        examTitle: exam.title,
        subject: exam.subject,
        date: exam.startDate,
        joined,
        submitted,
        notSubmitted: joined - submitted,
        autoSubmitted,
        lateStart,
        attendanceRate: joined > 0 ? Math.round(submitted / joined * 100) : 0,
      };
    });

    const totalJoined = examReports.reduce((s, r) => s + r.joined, 0);
    const totalSubmitted = examReports.reduce((s, r) => s + r.submitted, 0);

    return {
      summary: {
        totalExams: exams.length,
        totalJoined,
        totalSubmitted,
        avgAttendance: totalJoined > 0 ? Math.round(totalSubmitted / totalJoined * 100) : 0,
        submissionRate: totalJoined > 0 ? Math.round(totalSubmitted / totalJoined * 100) : 0,
      },
      exams: examReports,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANTI-CHEATING REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  async getAntiCheatingReport(ownerId: string, examId?: string) {
    const examWhere: any = { ownerId };
    if (examId) examWhere.id = examId;

    const exams = await prisma.exam.findMany({
      where: examWhere,
      include: {
        attempts: {
          select: {
            id: true,
            studentId: true,
            autoSubmitted: true,
          },
        },
      },
    });

    // Since anti-cheating logs are not yet stored in DB, return structure
    // ready for future integration
    const examReports = exams.map(exam => ({
      examId: exam.id,
      examTitle: exam.title,
      date: exam.startDate,
      students: exam.attempts.length,
      autoSubmitted: exam.attempts.filter(a => a.autoSubmitted).length,
      // Placeholder for future anti-cheating log integration
      totalFlags: 0,
      criticalFlags: 0,
      resolvedFlags: 0,
      events: [] as Array<{ type: string; count: number }>,
    }));

    return {
      summary: {
        totalExams: exams.length,
        totalFlags: 0,
        criticalFlags: 0,
        autoSubmitted: examReports.reduce((s, r) => s + r.autoSubmitted, 0),
        resolved: 0,
      },
      exams: examReports,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUESTION ANALYSIS REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  async getQuestionAnalysis(ownerId: string, examId?: string) {
    const examWhere: any = { ownerId };
    if (examId) examWhere.id = examId;

    const exams = await prisma.exam.findMany({
      where: examWhere,
      include: {
        sections: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
        attempts: {
          where: { submittedAt: { not: null } },
          include: {
            studentAnswers: true,
          },
        },
      },
    });

    const questionAnalytics: any[] = [];

    for (const exam of exams) {
      for (const section of exam.sections) {
        for (const question of section.questions) {
          const answers = exam.attempts.flatMap(a =>
            a.studentAnswers.filter(sa => sa.questionId === question.id)
          );

          const totalAnswered = answers.length;
          const correctAnswers = answers.filter(a => a.status === 'auto_graded' && (a.score ?? 0) > 0).length;
          const avgScore = totalAnswered > 0
            ? Math.round(answers.reduce((s, a) => s + (a.score ?? 0), 0) / totalAnswered * 100) / 100
            : 0;

          questionAnalytics.push({
            questionId: question.id,
            examId: exam.id,
            examTitle: exam.title,
            questionText: question.text,
            type: question.type,
            difficulty: question.difficulty,
            points: question.points,
            totalAnswered,
            correctAnswers,
            incorrectAnswers: totalAnswered - correctAnswers,
            correctRate: totalAnswered > 0 ? Math.round(correctAnswers / totalAnswered * 100) : 0,
            avgScore,
            // Discrimination index placeholder
            discriminationIndex: totalAnswered > 0
              ? Math.round((correctAnswers / totalAnswered) * 100) / 100
              : null,
          });
        }
      }
    }

    return {
      summary: {
        totalQuestions: questionAnalytics.length,
        avgCorrectRate: questionAnalytics.length > 0
          ? Math.round(questionAnalytics.reduce((s, q) => s + q.correctRate, 0) / questionAnalytics.length)
          : 0,
        hardestQuestion: questionAnalytics.sort((a, b) => a.correctRate - b.correctRate)[0] ?? null,
        easiestQuestion: questionAnalytics.sort((a, b) => b.correctRate - a.correctRate)[0] ?? null,
      },
      questions: questionAnalytics,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXAM ANALYTICS (combined overview)
  // ═══════════════════════════════════════════════════════════════════════════
  async getExamAnalytics(ownerId: string) {
    const exams = await prisma.exam.findMany({
      where: { ownerId },
      include: {
        attempts: {
          select: { score: true, totalScore: true, submittedAt: true, startedAt: true, studentId: true },
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalExams = exams.length;
    const activeStudentsSet = new Set<string>();
    let totalPassed = 0;
    let totalScoredAttempts = 0;
    let totalScoresSum = 0;

    const examStatus = {
      ongoing: 0,
      upcoming: 0,
      completed: 0,
      review: 0,
    };

    const subjectMap = new Map<string, { totalScore: number; attempts: number; passed: number }>();
    const monthMap = new Map<string, { totalScore: number; attempts: number; passed: number; started: number }>();

    const recentExams = [];

    for (const exam of exams) {
      // 1. Status counts
      if (exam.status === 'PUBLISHED') {
        if (exam.startDate && exam.startDate > new Date()) examStatus.upcoming++;
        else examStatus.ongoing++;
      } else if (exam.status === 'ARCHIVED') {
        examStatus.completed++;
      } else {
        examStatus.review++;
      }

      // 2. Recent exams mapping (take first 5 since ordered by createdAt desc)
      if (recentExams.length < 5 && exam.status !== 'ARCHIVED') {
        let passedInExam = 0;
        let scoredInExam = 0;
        let scoreSumInExam = 0;

        exam.attempts.forEach(a => {
          if (a.submittedAt) {
            const score = a.score ?? a.totalScore ?? 0;
            scoreSumInExam += score;
            scoredInExam++;
            if (exam.passingScore && score >= exam.passingScore) passedInExam++;
          }
        });

        recentExams.push({
          id: exam.id,
          title: exam.title,
          subject: exam.subject || 'General',
          date: exam.startDate ? exam.startDate.toLocaleDateString() : 'N/A',
          students: exam.attempts.length,
          avgScore: scoredInExam > 0 ? Math.round(scoreSumInExam / scoredInExam) : 0,
          passRate: scoredInExam > 0 ? Math.round((passedInExam / scoredInExam) * 100) : 0,
          status: exam.status.toLowerCase(),
        });
      }

      // 3. Aggregate data for primary stats, charts
      const subject = exam.subject || 'General';
      if (!subjectMap.has(subject)) subjectMap.set(subject, { totalScore: 0, attempts: 0, passed: 0 });
      const subjData = subjectMap.get(subject)!;

      for (const attempt of exam.attempts) {
        if (attempt.studentId) activeStudentsSet.add(attempt.studentId);

        const startMonth = attempt.startedAt.toLocaleString('default', { month: 'short' });
        if (!monthMap.has(startMonth)) monthMap.set(startMonth, { totalScore: 0, attempts: 0, passed: 0, started: 0 });
        const mData = monthMap.get(startMonth)!;

        mData.started++;

        if (attempt.submittedAt) {
          const score = attempt.score ?? attempt.totalScore ?? 0;
          totalScoresSum += score;
          totalScoredAttempts++;
          subjData.totalScore += score;
          subjData.attempts++;
          mData.totalScore += score;
          mData.attempts++;

          if (exam.passingScore && score >= exam.passingScore) {
            totalPassed++;
            subjData.passed++;
            mData.passed++;
          }
        }
      }
    }

    const avgScore = totalScoredAttempts > 0 ? Math.round((totalScoresSum / totalScoredAttempts) * 100) / 100 : 0;
    const passRate = totalScoredAttempts > 0 ? Math.round((totalPassed / totalScoredAttempts) * 100) : 0;

    // Build chart data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      let mIdx = currentMonthIdx - i;
      if (mIdx < 0) mIdx += 12;
      last6Months.push(months[mIdx]);
    }

    const scoreTrend = last6Months.map(m => {
      const d = monthMap.get(m) || { totalScore: 0, attempts: 0, passed: 0, started: 0 };
      return {
        month: m,
        avg: d.attempts > 0 ? Math.round(d.totalScore / d.attempts) : 0,
        pass: d.attempts > 0 ? Math.round((d.passed / d.attempts) * 100) : 0,
      };
    });

    const participationTrend = last6Months.map(m => {
      const d = monthMap.get(m) || { started: 0, attempts: 0 };
      return {
        month: m,
        rate: d.started,
      };
    });

    const subjectPerformance = Array.from(subjectMap.entries()).map(([subject, d]) => ({
      subject,
      avg: d.attempts > 0 ? Math.round(d.totalScore / d.attempts) : 0,
      pass: d.attempts > 0 ? Math.round((d.passed / d.attempts) * 100) : 0,
    })).sort((a, b) => b.avg - a.avg).slice(0, 5);

    const passFailDistribution = [
      { name: 'Passed', value: passRate },
      { name: 'Failed', value: totalScoredAttempts > 0 ? 100 - passRate : 0 },
    ];

    // Difficulty Analysis via question analysis reuse
    const qaReport = await this.getQuestionAnalysis(ownerId);
    const diffData = [
      { level: 'Easy', pass: 0, fail: 0, _total: 0, _correct: 0 },
      { level: 'Medium', pass: 0, fail: 0, _total: 0, _correct: 0 },
      { level: 'Hard', pass: 0, fail: 0, _total: 0, _correct: 0 },
    ];
    for (const q of qaReport.questions) {
      const diff = diffData.find(d => d.level.toUpperCase() === q.difficulty);
      if (diff) {
        diff._total += q.totalAnswered;
        diff._correct += q.correctAnswers;
      }
    }
    const difficultyAnalysis = diffData.map(d => {
      const pass = d._total > 0 ? Math.round((d._correct / d._total) * 100) : 0;
      return { level: d.level, pass, fail: d._total > 0 ? 100 - pass : 0 };
    });

    return {
      primaryStats: {
        totalExams,
        activeStudents: activeStudentsSet.size,
        passRate,
        avgScore,
      },
      examStatus,
      recentExams,
      chartData: {
        scoreTrend,
        subjectPerformance,
        passFailDistribution,
        participationTrend,
        difficultyAnalysis,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT (CSV / PDF / Excel)
  // ═══════════════════════════════════════════════════════════════════════════
  async exportReport(
    type: ReportType,
    format: ExportFormat,
    ownerId: string,
    examId?: string
  ): Promise<{ data: any; contentType: string; filename: string }> {
    // Fetch report data based on type
    let reportData: any;
    switch (type) {
      case 'SCORES':
        reportData = await this.getScoresReport(ownerId, examId);
        break;
      case 'ATTENDANCE':
        reportData = await this.getAttendanceReport(ownerId, examId);
        break;
      case 'ANTI_CHEATING':
        reportData = await this.getAntiCheatingReport(ownerId, examId);
        break;
      case 'QUESTION_ANALYSIS':
        reportData = await this.getQuestionAnalysis(ownerId, examId);
        break;
      default:
        reportData = await this.getExamAnalytics(ownerId);
    }

    // Record the export in the database
    await prisma.report.create({
      data: {
        examId: examId || null,
        type,
        format,
        status: 'COMPLETED',
        createdBy: ownerId,
        metadata: { generatedAt: new Date().toISOString() },
      },
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const baseFilename = `${type.toLowerCase()}_report_${timestamp}`;

    switch (format) {
      case 'CSV':
        return this.generateCSV(reportData, type, baseFilename);
      case 'EXCEL':
        return this.generateExcel(reportData, type, baseFilename);
      case 'PDF':
        return this.generatePDF(reportData, type, baseFilename);
      default:
        throw new Error('Unsupported export format');
    }
  }

  // ── CSV generation ─────────────────────────────────────────────────────
  private async generateCSV(
    data: any,
    type: ReportType,
    filename: string
  ): Promise<{ data: string; contentType: string; filename: string }> {
    const { Parser } = await import('json2csv');

    let rows: any[];
    let fields: string[];

    switch (type) {
      case 'SCORES':
        rows = data.students.map((s: any) => ({
          Rank: s.rank,
          Student: s.studentId,
          'Average Score': s.averageScore,
          'Highest Score': s.highestScore,
          'Lowest Score': s.lowestScore,
          'Exams Attempted': s.examsAttempted,
          Passed: s.passed,
          Failed: s.failed,
        }));
        fields = ['Rank', 'Student', 'Average Score', 'Highest Score', 'Lowest Score', 'Exams Attempted', 'Passed', 'Failed'];
        break;
      case 'ATTENDANCE':
        rows = data.exams.map((e: any) => ({
          Exam: e.examTitle,
          Subject: e.subject || '',
          Date: e.date ? new Date(e.date).toLocaleDateString() : '',
          Joined: e.joined,
          Submitted: e.submitted,
          'Not Submitted': e.notSubmitted,
          'Auto Submitted': e.autoSubmitted,
          'Late Start': e.lateStart,
          'Attendance Rate': `${e.attendanceRate}%`,
        }));
        fields = ['Exam', 'Subject', 'Date', 'Joined', 'Submitted', 'Not Submitted', 'Auto Submitted', 'Late Start', 'Attendance Rate'];
        break;
      case 'QUESTION_ANALYSIS':
        rows = data.questions.map((q: any) => ({
          Exam: q.examTitle,
          Question: q.questionText,
          Type: q.type,
          Difficulty: q.difficulty,
          Points: q.points,
          'Total Answered': q.totalAnswered,
          'Correct Answers': q.correctAnswers,
          'Correct Rate': `${q.correctRate}%`,
          'Avg Score': q.avgScore,
        }));
        fields = ['Exam', 'Question', 'Type', 'Difficulty', 'Points', 'Total Answered', 'Correct Answers', 'Correct Rate', 'Avg Score'];
        break;
      default:
        rows = [data.summary || data];
        fields = Object.keys(rows[0] || {});
    }

    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    return {
      data: csv,
      contentType: 'text/csv',
      filename: `${filename}.csv`,
    };
  }

  // ── Excel generation ───────────────────────────────────────────────────
  private async generateExcel(
    data: any,
    type: ReportType,
    filename: string
  ): Promise<{ data: Buffer; contentType: string; filename: string }> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    const summary = data.summary || {};
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];
    for (const [key, value] of Object.entries(summary)) {
      if (typeof value !== 'object') {
        summarySheet.addRow({ metric: key, value: String(value) });
      }
    }

    // Style summary header
    summarySheet.getRow(1).font = { bold: true, size: 12 };
    summarySheet.getRow(1).fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D1B2A' },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Data sheet
    const dataSheet = workbook.addWorksheet('Data');
    let rows: any[];

    switch (type) {
      case 'SCORES':
        rows = data.students || [];
        dataSheet.columns = [
          { header: 'Rank', key: 'rank', width: 10 },
          { header: 'Student', key: 'studentId', width: 25 },
          { header: 'Average Score', key: 'averageScore', width: 15 },
          { header: 'Highest Score', key: 'highestScore', width: 15 },
          { header: 'Exams Attempted', key: 'examsAttempted', width: 18 },
          { header: 'Passed', key: 'passed', width: 10 },
          { header: 'Failed', key: 'failed', width: 10 },
        ];
        break;
      case 'ATTENDANCE':
        rows = data.exams || [];
        dataSheet.columns = [
          { header: 'Exam', key: 'examTitle', width: 30 },
          { header: 'Subject', key: 'subject', width: 15 },
          { header: 'Joined', key: 'joined', width: 10 },
          { header: 'Submitted', key: 'submitted', width: 12 },
          { header: 'Late Start', key: 'lateStart', width: 12 },
          { header: 'Attendance Rate', key: 'attendanceRate', width: 18 },
        ];
        break;
      case 'QUESTION_ANALYSIS':
        rows = data.questions || [];
        dataSheet.columns = [
          { header: 'Exam', key: 'examTitle', width: 25 },
          { header: 'Question', key: 'questionText', width: 40 },
          { header: 'Type', key: 'type', width: 15 },
          { header: 'Difficulty', key: 'difficulty', width: 12 },
          { header: 'Correct Rate', key: 'correctRate', width: 15 },
          { header: 'Avg Score', key: 'avgScore', width: 12 },
        ];
        break;
      default:
        rows = data.exams || [data];
        dataSheet.columns = Object.keys(rows[0] || {}).map(key => ({
          header: key, key, width: 20,
        }));
    }

    for (const row of rows) {
      dataSheet.addRow(row);
    }

    // Style data header
    dataSheet.getRow(1).font = { bold: true, size: 11 };
    dataSheet.getRow(1).fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0EDE8' },
    };

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      data: buffer as unknown as Buffer,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `${filename}.xlsx`,
    };
  }

  // ── PDF generation ─────────────────────────────────────────────────────
  private async generatePDF(
    data: any,
    type: ReportType,
    filename: string
  ): Promise<{ data: Buffer; contentType: string; filename: string }> {
    const PDFDocument = (await import('pdfkit')).default;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        resolve({
          data: Buffer.concat(chunks),
          contentType: 'application/pdf',
          filename: `${filename}.pdf`,
        });
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('Online Exam Platform', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica-Bold').text(
        `${type.replace(/_/g, ' ')} Report`, { align: 'center' }
      );
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica')
        .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1.5);

      // Divider
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#C8A97E');
      doc.moveDown(1);

      // Summary
      const summary = data.summary || {};
      doc.fontSize(12).font('Helvetica-Bold').text('Summary');
      doc.moveDown(0.5);
      for (const [key, value] of Object.entries(summary)) {
        if (typeof value !== 'object') {
          doc.fontSize(10).font('Helvetica')
            .text(`${key.replace(/([A-Z])/g, ' $1').trim()}: `, { continued: true })
            .font('Helvetica-Bold').text(String(value));
        }
      }
      doc.moveDown(1);

      // Data section
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E5E7EB');
      doc.moveDown(1);
      doc.fontSize(12).font('Helvetica-Bold').text('Details');
      doc.moveDown(0.5);

      let items: any[];
      switch (type) {
        case 'SCORES':
          items = data.students || [];
          items.forEach((s: any, i: number) => {
            if (doc.y > 700) doc.addPage();
            doc.fontSize(10).font('Helvetica-Bold')
              .text(`#${s.rank} ${s.studentId}`);
            doc.fontSize(9).font('Helvetica')
              .text(`  Avg: ${s.averageScore}% | Highest: ${s.highestScore}% | Exams: ${s.examsAttempted} | Pass: ${s.passed} Fail: ${s.failed}`);
            doc.moveDown(0.3);
          });
          break;
        case 'ATTENDANCE':
          items = data.exams || [];
          items.forEach((e: any) => {
            if (doc.y > 700) doc.addPage();
            doc.fontSize(10).font('Helvetica-Bold').text(e.examTitle);
            doc.fontSize(9).font('Helvetica')
              .text(`  Joined: ${e.joined} | Submitted: ${e.submitted} | Late: ${e.lateStart} | Rate: ${e.attendanceRate}%`);
            doc.moveDown(0.3);
          });
          break;
        case 'QUESTION_ANALYSIS':
          items = data.questions || [];
          items.forEach((q: any) => {
            if (doc.y > 700) doc.addPage();
            doc.fontSize(10).font('Helvetica-Bold').text(q.questionText.substring(0, 80));
            doc.fontSize(9).font('Helvetica')
              .text(`  Type: ${q.type} | Difficulty: ${q.difficulty} | Correct: ${q.correctRate}% | Avg Score: ${q.avgScore}`);
            doc.moveDown(0.3);
          });
          break;
        default:
          doc.fontSize(10).font('Helvetica').text(JSON.stringify(data, null, 2));
      }

      // Footer
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#C8A97E');
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica').fillColor('#9CA3AF')
        .text('© Online Exam Platform — Kirirom Institute of Technology', { align: 'center' });

      doc.end();
    });
  }
}
