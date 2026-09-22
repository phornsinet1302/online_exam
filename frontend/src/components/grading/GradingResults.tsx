"use client";

import { Fragment, useState, useEffect } from "react";
import { useNavigate } from "@/lib/hooks";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { PenLine, Download, Users, ClipboardCheck, AlertTriangle, Award, TrendingUp, X, Check, RefreshCw, ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { U, I, INK, CAMEL } from "@/lib/tokens";
import { examsApi, AccessibleExam } from "@/lib/api/exams";
import { reportsApi } from "@/lib/api/reports";
import { gradingApi, ExamGrades, GradeExportField, GradeExportFormat } from "@/lib/api/grading";

const EXPORT_FIELDS: { key: GradeExportField; label: string }[] = [
  { key: "name", label: "Student name" },
  { key: "score", label: "Score (%)" },
  { key: "grade", label: "Grade" },
  { key: "breakdown", label: "Per-question breakdown" },
  { key: "time", label: "Time taken" },
  { key: "attempt", label: "Attempt number" },
  { key: "submitted", label: "Submitted at" },
];

const FORMATS: { id: GradeExportFormat; label: string }[] = [
  { id: "csv", label: "CSV" },
  { id: "excel", label: "Excel" },
  { id: "pdf", label: "PDF" },
];

function GradeExportModal({ examId, onClose }: { examId: string; onClose: () => void }) {
  const [format, setFormat] = useState<GradeExportFormat>("csv");
  const [fields, setFields] = useState<GradeExportField[]>(["name", "score", "grade", "breakdown"]);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const toggleField = (f: GradeExportField) => setFields(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);

  const doExport = async () => {
    setExporting(true);
    setError("");
    try {
      await gradingApi.exportGrades(examId, format, fields);
      onClose();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background: "rgba(13,27,42,0.55)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg,${INK},${CAMEL})` }} />
        <div className="p-7">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black" style={{ fontFamily: U, color: INK }}>Export Grades</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><X size={15} /></button>
          </div>
          <div className="mb-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" style={{ fontFamily: U }}>Format</p>
            <div className="flex gap-2">
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => setFormat(f.id)} className={`flex-1 text-xs font-bold py-2.5 rounded-xl border transition-all ${format === f.id ? "text-white border-transparent" : "border-gray-200 text-gray-500 hover:border-gray-300"}`} style={{ background: format === f.id ? INK : undefined, fontFamily: U }}>{f.label}</button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3" style={{ fontFamily: U }}>Include fields</p>
            <div className="space-y-2">
              {EXPORT_FIELDS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => toggleField(key)} className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${fields.includes(key) ? "border-transparent" : "border-gray-300"}`} style={{ background: fields.includes(key) ? INK : undefined }}>
                    {fields.includes(key) && <Check size={10} className="text-white" />}
                  </div>
                  <span className="text-sm text-gray-700" style={{ fontFamily: I }}>{label}</span>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-3" style={{ fontFamily: I }}>Email and grading status are always included.</p>
          </div>
          {error && <p className="text-xs text-red-500 mb-3" style={{ fontFamily: I }}>{error}</p>}
          <button onClick={doExport} disabled={exporting || fields.length === 0} className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-50" style={{ background: INK, fontFamily: U }}>
            {exporting ? <><RefreshCw size={15} className="animate-spin" />Exporting…</> : <><Download size={15} />Export {fields.length} field{fields.length === 1 ? "" : "s"} as .{format === "excel" ? "xlsx" : format}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const gradeColor = (g: string | null) => ({ A: "text-green-600", B: "text-blue-600", C: "text-amber-600", D: "text-amber-600", F: "text-red-600" } as Record<string, string>)[g || ""] || "text-gray-400";
const scoreColor = (s: number) => s >= 80 ? "#16a34a" : s >= 60 ? "#d97706" : "#ef4444";

export function GradingResults() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<AccessibleExam[]>([]);
  const [examId, setExamId] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [viewTab, setViewTab] = useState("students");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [grades, setGrades] = useState<ExamGrades | null>(null);
  const [questionsData, setQuestionsData] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [regrading, setRegrading] = useState<string | null>(null);

  useEffect(() => {
    // Owned + shared exams; an Invigilator has no access to grades, and drafts have no attempts.
    examsApi.getAccessible().then(data => {
      const usable = data.filter(e => e.role !== "INVIGILATOR" && e.status !== "DRAFT");
      setExams(usable);
      if (usable.length > 0) setExamId(usable[0].id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const load = (id: string) => {
    setLoading(true);
    setError("");
    return Promise.all([gradingApi.getExamGrades(id), reportsApi.getQuestions(id).catch(() => null)])
      .then(([g, q]) => { setGrades(g); setQuestionsData(q); })
      .catch(e => { setGrades(null); setError(e instanceof Error && e.message ? e.message : "Failed to load grades."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!examId) return;
    setExpanded(null);
    load(examId);
  }, [examId]);

  const exam = exams.find(e => e.id === examId);
  const isOwner = exam?.role === "OWNER";
  const summary = grades?.summary;

  const regrade = async (attemptId: string) => {
    setRegrading(attemptId);
    try {
      await gradingApi.regradeAttempt(examId, attemptId);
      await load(examId);
    } catch (e) {
      alert(e instanceof Error && e.message ? e.message : "Regrade failed. Please try again.");
    } finally {
      setRegrading(null);
    }
  };

  return (
    <DashboardLayout active="grading" title="Auto-Grading Results" subtitle="Review and export scores"
      actions={<>
        <button onClick={() => navigate(`/dashboard/grading/manual${examId ? `?examId=${examId}` : ""}`)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily: U }}><PenLine size={13} />Manual grade</button>
        <button onClick={() => setShowExport(true)} disabled={!examId || !grades} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-40" style={{ background: INK, fontFamily: U }}><Download size={13} />Export</button>
      </>}>
      {showExport && examId && <GradeExportModal examId={examId} onClose={() => setShowExport(false)} />}

      {/* Exam selector */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: U }}>Exam</label>
          <select value={examId} onChange={e => setExamId(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-gray-400 min-w-[240px]" style={{ fontFamily: I }}>
            {exams.length === 0 && <option value="">No published exams</option>}
            {exams.map(e => <option key={e.id} value={e.id}>{e.title}{e.role !== "OWNER" ? " (shared)" : ""}</option>)}
          </select>
        </div>
      </div>

      {error ? (
        <div className="bg-white rounded-2xl border border-red-100 py-16 flex flex-col items-center gap-3">
          <AlertTriangle size={32} className="text-red-300" />
          <p className="text-sm text-red-500 text-center max-w-xs" style={{ fontFamily: U }}>{error}</p>
          <button onClick={() => load(examId)} className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background: INK, fontFamily: U }}>Try again</button>
        </div>
      ) : loading ? (
        <div className="p-10 flex justify-center"><RefreshCw className="animate-spin text-gray-400" /></div>
      ) : !grades ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-sm text-gray-400" style={{ fontFamily: U }}>Select an exam to see its results.</div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            {[
              { l: "Total Papers", v: summary!.totalAttempts, icon: Users, bg: "#F0EDE8" },
              { l: "Fully graded", v: summary!.graded, icon: ClipboardCheck, bg: "#f0fdf4" },
              { l: "Needs Review", v: summary!.needsReview, icon: AlertTriangle, bg: "#fff0f0" },
              { l: "Average Score", v: `${summary!.average}%`, icon: Award, bg: "#fff7ed" },
              { l: "Pass Rate", v: grades.exam.passingScore != null ? `${summary!.passRate}%` : "—", icon: TrendingUp, bg: "#eff6ff" },
            ].map(({ l, v, icon: Icon, bg }) => (
              <div key={l} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}><Icon size={17} style={{ color: INK }} /></div>
                <div><p className="text-lg font-black leading-none" style={{ fontFamily: U, color: INK }}>{v}</p><p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: I }}>{l}</p></div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 w-fit mb-5">
            {[{ id: "students", label: "Student Results" }, { id: "questions", label: "Question Analysis" }].map(t => (
              <button key={t.id} onClick={() => setViewTab(t.id)} className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${viewTab === t.id ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`} style={{ background: viewTab === t.id ? INK : undefined, fontFamily: U }}>{t.label}</button>
            ))}
          </div>

          {viewTab === "students" && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">{["", "Student", "Score", "Grade", "Status", "Time", "Actions"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: U }}>{h}</th>)}</tr></thead>
                <tbody>
                  {grades.attempts.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500" style={{ fontFamily: I }}>No submitted attempts for this exam yet.</td></tr>}
                  {grades.attempts.map(a => {
                    const open = expanded === a.attemptId;
                    const pending = a.gradingStatus === "needs_review";
                    return (
                      <Fragment key={a.attemptId}>
                        <tr onClick={() => setExpanded(open ? null : a.attemptId)} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors cursor-pointer">
                          <td className="pl-4 pr-1 py-3.5 text-gray-400">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: CAMEL, fontFamily: U }}>{a.studentName.substring(0, 2).toUpperCase()}</div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 whitespace-nowrap" style={{ fontFamily: U }}>{a.studentName}{a.attemptNumber > 1 && <span className="ml-1.5 text-[10px] font-bold text-gray-400">attempt {a.attemptNumber}</span>}</p>
                                {a.studentEmail && a.studentEmail !== a.studentName && <p className="text-[11px] text-gray-400 truncate" style={{ fontFamily: I }}>{a.studentEmail}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(100, a.score)}%`, background: scoreColor(a.score) }} /></div>
                              <span className="text-sm font-black" style={{ fontFamily: U, color: scoreColor(a.score) }}>{a.score}%</span>
                              {pending && <span className="text-[10px] text-gray-400" style={{ fontFamily: I }}>so far</span>}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: I }}>{a.totalScore}/{a.maxScore} pts</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-sm font-black ${gradeColor(a.grade)}`} style={{ fontFamily: U }}>{a.grade ?? "—"}</span>
                            {a.passed !== null && <span className={`ml-2 text-[10px] font-bold ${a.passed ? "text-green-600" : "text-red-500"}`} style={{ fontFamily: U }}>{a.passed ? "PASS" : "FAIL"}</span>}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${pending ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`} style={{ fontFamily: U }}>
                              {pending ? `${a.needsReviewCount} to grade` : "Graded"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap" style={{ fontFamily: I }}>{a.timeTakenMinutes !== null ? `${a.timeTakenMinutes} min` : "—"}</td>
                          <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              {pending && (
                                <button onClick={() => navigate(`/dashboard/grading/manual?examId=${examId}`)} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white hover:opacity-90 whitespace-nowrap" style={{ background: INK, fontFamily: U }}>Grade</button>
                              )}
                              {isOwner && (
                                <button onClick={() => regrade(a.attemptId)} disabled={regrading === a.attemptId} title="Re-run auto-grading against the current answer key"
                                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50 whitespace-nowrap" style={{ fontFamily: U }}>
                                  <RotateCcw size={11} className={regrading === a.attemptId ? "animate-spin" : ""} />Regrade
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {open && (
                          <tr className="bg-gray-50/60 border-b border-gray-100">
                            <td colSpan={7} className="px-5 py-4">
                              <table className="w-full text-xs">
                                <thead><tr className="text-gray-400 uppercase tracking-wider">{["#", "Question", "Student answer", "Correct answer", "Score"].map(h => <th key={h} className="text-left py-1.5 pr-4 font-semibold" style={{ fontFamily: U }}>{h}</th>)}</tr></thead>
                                <tbody>
                                  {a.answers.map(r => {
                                    const full = r.status !== "needs_review" && r.score === r.maxScore;
                                    const zero = r.status !== "needs_review" && (r.score ?? 0) === 0;
                                    return (
                                      <tr key={r.answerId} className="border-t border-gray-100 align-top">
                                        <td className="py-2 pr-4 text-gray-400" style={{ fontFamily: U }}>{r.number}</td>
                                        <td className="py-2 pr-4 max-w-[260px]"><p className="text-gray-700 line-clamp-2" style={{ fontFamily: I }}>{r.text}</p><span className="text-[10px] text-gray-400">{r.type.replace(/_/g, " ")}</span></td>
                                        <td className="py-2 pr-4 max-w-[220px] break-words" style={{ fontFamily: I, color: full ? "#16a34a" : zero ? "#dc2626" : "#374151" }}>{r.studentAnswer || <span className="text-gray-300">No answer</span>}</td>
                                        <td className="py-2 pr-4 max-w-[220px] break-words text-gray-600" style={{ fontFamily: I }}>{r.correctAnswer ?? <span className="text-gray-300">Graded by teacher</span>}{r.feedback && <p className="mt-1 text-[11px] text-blue-600">“{r.feedback}”</p>}</td>
                                        <td className="py-2 whitespace-nowrap font-black" style={{ fontFamily: U, color: r.status === "needs_review" ? "#d97706" : full ? "#16a34a" : zero ? "#dc2626" : "#d97706" }}>
                                          {r.status === "needs_review" ? "Pending" : `${r.score ?? 0}/${r.maxScore}`}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {viewTab === "questions" && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">{["Question", "Avg Score", "Correct Rate", "Difficulty"].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: U }}>{h}</th>)}</tr></thead>
                <tbody>
                  {(!questionsData?.questions || questionsData.questions.length === 0) && <tr><td colSpan={4} className="p-5 text-center text-gray-500">No question data found for this exam.</td></tr>}
                  {questionsData?.questions?.map((q: any) => (
                    <tr key={q.questionId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full w-fit mb-1" style={{ fontFamily: U }}>{q.type}</span>
                          <span className="text-gray-700 font-medium line-clamp-1" style={{ fontFamily: I }}>{q.questionText}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><span className="font-black text-sm" style={{ fontFamily: U, color: scoreColor(q.points ? (q.avgScore / q.points) * 100 : 0) }}>{q.avgScore.toFixed(1)}/{q.points}</span></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2"><div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-green-500" style={{ width: `${q.correctRate}%` }} /></div><span className="text-xs font-semibold text-gray-700" style={{ fontFamily: U }}>{q.correctRate}%</span></div>
                      </td>
                      <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${q.difficulty === "EASY" ? "bg-green-50 text-green-600" : q.difficulty === "MEDIUM" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`} style={{ fontFamily: U }}>{q.difficulty}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
