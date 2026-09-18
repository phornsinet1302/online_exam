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

    // Aggregate by student. Attempts arrive ordered by submittedAt desc, so
    // the first attempt seen for a given student is their most recent one —
    // that's what seeds the display name and "latest score" below.
    const studentMap = new Map<string, any>();
    for (const attempt of attempts) {
      const key = attempt.studentId || 'anonymous';
      const score = attempt.score ?? attempt.totalScore ?? 0;
      if (!studentMap.has(key)) {
        // Registration details are stashed in the (legacy-named) `answers`
        // JSON field at registration time — see registerStudent() in
        // session.service.ts. `attempt.studentId` itself is their email.
        // submitAndGrade() overwrites `answers` with the final answer list,
        // relocating studentInfo into `snapshot` first — so it can be in
        // either place depending on how the attempt was finalized.
        const studentInfo = (attempt.answers as any)?.studentInfo ?? (attempt.snapshot as any)?.studentInfo;
        studentMap.set(key, {
          studentId: studentInfo?.studentId || null,
          name: studentInfo?.name || key,
          email: attempt.studentId,
          latestScore: Math.round(score * 100) / 100,
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
        enrolledStudents: { select: { email: true } },
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

      // Enrolled/absent only make sense once a roster has been uploaded for
      // this exam — otherwise there's no ground truth for "who was expected".
      const enrolledCount = exam.enrolledStudents.length;
      let enrolled: number | null = null;
      let absent: number | null = null;
      if (enrolledCount > 0) {
        const joinedEmails = new Set(
          exam.attempts.map(a => a.studentId?.toLowerCase()).filter((e): e is string => !!e)
        );
        const attendedFromRoster = exam.enrolledStudents.filter(s => joinedEmails.has(s.email.toLowerCase())).length;
        enrolled = enrolledCount;
        absent = enrolledCount - attendedFromRoster;
      }

      return {
        examId: exam.id,
        examTitle: exam.title,
        subject: exam.subject,
        date: exam.startDate,
        enrolled,
        joined,
        absent,
        submitted,
        notSubmitted: joined - submitted,
        autoSubmitted,
        lateStart,
        attendanceRate: joined > 0 ? Math.round(submitted / joined * 100) : 0,
      };
    });

    const totalJoined = examReports.reduce((s, r) => s + r.joined, 0);
    const totalSubmitted = examReports.reduce((s, r) => s + r.submitted, 0);
    const withRoster = examReports.filter(r => r.enrolled !== null);
    const totalEnrolled = withRoster.length > 0 ? withRoster.reduce((s, r) => s + (r.enrolled ?? 0), 0) : null;
    const totalAbsent = withRoster.length > 0 ? withRoster.reduce((s, r) => s + (r.absent ?? 0), 0) : null;

    return {
      summary: {
        totalExams: exams.length,
        totalJoined,
        totalSubmitted,
        avgAttendance: totalJoined > 0 ? Math.round(totalSubmitted / totalJoined * 100) : 0,
        submissionRate: totalJoined > 0 ? Math.round(totalSubmitted / totalJoined * 100) : 0,
        totalEnrolled,
        totalAbsent,
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
            violations: { select: { eventType: true, severity: true, actionTaken: true, resolved: true } },
          },
        },
      },
    });

    const examReports = exams.map(exam => {
      const violations = exam.attempts.flatMap(a => a.violations);
      const flagged = violations.filter(v => v.actionTaken === 'flagged');
      const critical = violations.filter(v => v.severity === 'critical');
      const resolved = violations.filter(v => v.resolved);

      const eventCounts = new Map<string, number>();
      for (const v of violations) {
        eventCounts.set(v.eventType, (eventCounts.get(v.eventType) ?? 0) + 1);
      }

      return {
        examId: exam.id,
        examTitle: exam.title,
        date: exam.startDate,
        students: exam.attempts.length,
        autoSubmitted: exam.attempts.filter(a => a.autoSubmitted).length,
        totalFlags: flagged.length,
        criticalFlags: critical.length,
        resolvedFlags: resolved.length,
        events: Array.from(eventCounts.entries()).map(([type, count]) => ({ type, count })),
      };
    });

    return {
      summary: {
        totalExams: exams.length,
        totalFlags: examReports.reduce((s, r) => s + r.totalFlags, 0),
        criticalFlags: examReports.reduce((s, r) => s + r.criticalFlags, 0),
        autoSubmitted: examReports.reduce((s, r) => s + r.autoSubmitted, 0),
        resolved: examReports.reduce((s, r) => s + r.resolvedFlags, 0),
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
      // Overall exam score per attempt — needed to split respondents into
      // stronger/weaker halves for the discrimination index below. Only
      // attempts that are fully graded (score set, not still pending manual
      // review) have a meaningful overall score.
      const overallScoreByAttempt = new Map(
        exam.attempts.filter(a => a.score != null).map(a => [a.id, a.score as number])
      );

      for (const section of exam.sections) {
        for (const question of section.questions) {
          const answers = exam.attempts.flatMap(a =>
            a.studentAnswers.filter(sa => sa.questionId === question.id)
          );

          // Only answers that have actually been scored (auto or manually
          // graded) count toward rate/average — one still `needs_review`
          // isn't yet a pass or a fail.
          const scored = answers.filter(a => a.status === 'auto_graded' || a.status === 'graded');
          const totalAnswered = answers.length;
          // "Correct" = scored at least half of the question's points — see
          // the Pass rate definition shown in the UI. Applies the same way
          // to auto-graded (MCQ/etc.) and manually-graded (essay/short
          // answer) items alike, unlike a status-based check which would
          // always read 0% for anything a teacher had to grade by hand.
          const passCount = scored.filter(a => a.score != null && a.score >= a.maxScore * 0.5).length;
          const avgScore = scored.length > 0
            ? Math.round(scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length * 100) / 100
            : 0;
          const correctRate = scored.length > 0 ? Math.round(passCount / scored.length * 100) : 0;

          // Discrimination index: median-split the respondents by their
          // OVERALL exam score, then compare pass rate on this one item
          // between the stronger and weaker half. Needs a handful of graded
          // respondents with a known overall score to mean anything.
          const withOverall = scored
            .map(a => ({ pass: a.score != null && a.score >= a.maxScore * 0.5, overall: overallScoreByAttempt.get(a.attemptId) }))
            .filter((a): a is { pass: boolean; overall: number } => a.overall != null);
          let discriminationIndex: number | null = null;
          if (withOverall.length >= 4) {
            const sorted = [...withOverall].sort((a, b) => b.overall - a.overall);
            const half = Math.floor(sorted.length / 2);
            const upper = sorted.slice(0, half);
            const lower = sorted.slice(sorted.length - half);
            const upperPassRate = upper.filter(a => a.pass).length / upper.length;
            const lowerPassRate = lower.filter(a => a.pass).length / lower.length;
            discriminationIndex = Math.round((upperPassRate - lowerPassRate) * 100) / 100;
          }

          questionAnalytics.push({
            questionId: question.id,
            examId: exam.id,
            examTitle: exam.title,
            order: question.order,
            questionText: question.text,
            type: question.type,
            difficulty: question.difficulty,
            points: question.points,
            totalAnswered,
            correctAnswers: passCount,
            incorrectAnswers: scored.length - passCount,
            correctRate,
            avgScore,
            discriminationIndex,
            // Matches the ">0.7 = may be too tricky" guidance shown in the UI.
            flagged: discriminationIndex != null && discriminationIndex > 0.7,
          });
        }
      }
    }

    const byCorrectRateAsc = [...questionAnalytics].sort((a, b) => a.correctRate - b.correctRate);
    const byCorrectRateDesc = [...questionAnalytics].sort((a, b) => b.correctRate - a.correctRate);

    return {
      summary: {
        totalQuestions: questionAnalytics.length,
        avgCorrectRate: questionAnalytics.length > 0
          ? Math.round(questionAnalytics.reduce((s, q) => s + q.correctRate, 0) / questionAnalytics.length)
          : 0,
        flaggedCount: questionAnalytics.filter(q => q.flagged).length,
        hardestQuestion: byCorrectRateAsc[0] ?? null,
        easiestQuestion: byCorrectRateDesc[0] ?? null,
      },
      // Kept in exam/section/question authoring order (NOT the sort above).
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
  // EXAM LIST (Reports → Export tab, filtered directory of exams)
  // ═══════════════════════════════════════════════════════════════════════════
  async getExamListReport(
    ownerId: string,
    filters: { status?: string; subjects?: string[]; dateFrom?: Date; dateTo?: Date } = {}
  ) {
    const where: any = { ownerId };
    if (filters.status && filters.status !== 'all') where.status = filters.status.toUpperCase();
    if (filters.subjects && filters.subjects.length > 0) where.subject = { in: filters.subjects };
    if (filters.dateFrom || filters.dateTo) {
      where.startDate = {};
      if (filters.dateFrom) where.startDate.gte = filters.dateFrom;
      if (filters.dateTo) where.startDate.lte = filters.dateTo;
    }

    const exams = await prisma.exam.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { attempts: true } } },
    });

    const rows = exams.map(e => ({
      examId: e.id,
      title: e.title,
      subject: e.subject,
      date: e.startDate,
      students: e._count.attempts,
      status: e.status,
    }));

    return {
      summary: { totalExams: rows.length },
      exams: rows,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT (CSV / PDF / Excel)
  // ═══════════════════════════════════════════════════════════════════════════
  async exportReport(
    type: ReportType,
    format: ExportFormat,
    ownerId: string,
    examId?: string,
    examListFilters?: { status?: string; subjects?: string[]; dateFrom?: Date; dateTo?: Date }
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
      case 'EXAM':
        reportData = await this.getExamListReport(ownerId, examListFilters);
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
          Student: s.name,
          Email: s.email,
          'Average Score': s.averageScore,
          'Highest Score': s.highestScore,
          'Lowest Score': s.lowestScore,
          'Exams Attempted': s.examsAttempted,
          Passed: s.passed,
          Failed: s.failed,
        }));
        fields = ['Rank', 'Student', 'Email', 'Average Score', 'Highest Score', 'Lowest Score', 'Exams Attempted', 'Passed', 'Failed'];
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
      case 'EXAM':
        rows = data.exams.map((e: any) => ({
          Exam: e.title,
          Subject: e.subject || '',
          Date: e.date ? new Date(e.date).toLocaleDateString() : '',
          Students: e.students,
          Status: e.status,
        }));
        fields = ['Exam', 'Subject', 'Date', 'Students', 'Status'];
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
    const ExcelJS = (await import('exceljs')).default;
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
          { header: 'Student', key: 'name', width: 25 },
          { header: 'Email', key: 'email', width: 30 },
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
      case 'EXAM':
        rows = data.exams || [];
        dataSheet.columns = [
          { header: 'Exam', key: 'title', width: 30 },
          { header: 'Subject', key: 'subject', width: 18 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Students', key: 'students', width: 12 },
          { header: 'Status', key: 'status', width: 12 },
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
              .text(`#${s.rank} ${s.name}`);
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
        case 'EXAM':
          items = data.exams || [];
          items.forEach((e: any) => {
            if (doc.y > 700) doc.addPage();
            doc.fontSize(10).font('Helvetica-Bold').text(e.title);
            doc.fontSize(9).font('Helvetica')
              .text(`  Subject: ${e.subject || '—'} | Date: ${e.date ? new Date(e.date).toLocaleDateString() : '—'} | Students: ${e.students} | Status: ${e.status}`);
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
