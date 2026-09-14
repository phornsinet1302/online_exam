"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@/lib/hooks";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { PenLine, Download, Users, ClipboardCheck, AlertTriangle, Award, TrendingUp, X, Check, RefreshCw } from "lucide-react";
import { U, I, INK, CAMEL } from "@/lib/tokens";
import { examsApi, Exam } from "@/lib/api/exams";
import { reportsApi } from "@/lib/api/reports";
import { gradingApi } from "@/lib/api/grading";

const GRADE_EXPORT_FIELDS = ["Student name","Score (%)","Grade","Per-question breakdown","Time taken","Attempt number","Submitted at"];

function GradeExportModal({ onClose }: { onClose:()=>void }) {
  const [format, setFormat] = useState("csv");
  const [fields, setFields] = useState<string[]>(GRADE_EXPORT_FIELDS.slice(0,4));
  const toggleField = (f:string)=>setFields(p=>p.includes(f)?p.filter(x=>x!==f):[...p,f]);
  const [exporting, setExporting] = useState(false);
  const doExport = ()=>{ setExporting(true); setTimeout(()=>{ setExporting(false); onClose(); },1000); };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background:"rgba(13,27,42,0.55)", backdropFilter:"blur(8px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="h-1 w-full" style={{ background:`linear-gradient(90deg,${INK},${CAMEL})` }}/>
        <div className="p-7">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black" style={{ fontFamily:U, color:INK }}>Export Grades</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><X size={15}/></button>
          </div>
          <div className="mb-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" style={{ fontFamily:U }}>Format</p>
            <div className="flex gap-2">
              {[{id:"csv",label:"CSV"},{id:"xlsx",label:"Excel"},{id:"pdf",label:"PDF"},{id:"sheets",label:"Google Sheets"}].map(f=>(
                <button key={f.id} onClick={()=>setFormat(f.id)} className={`flex-1 text-xs font-bold py-2.5 rounded-xl border transition-all ${format===f.id?"text-white border-transparent":"border-gray-200 text-gray-500 hover:border-gray-300"}`} style={{ background:format===f.id?INK:undefined, fontFamily:U }}>{f.label}</button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3" style={{ fontFamily:U }}>Include fields</p>
            <div className="space-y-2">
              {GRADE_EXPORT_FIELDS.map(f=>(
                <label key={f} className="flex items-center gap-3 cursor-pointer">
                  <div onClick={()=>toggleField(f)} className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${fields.includes(f)?"border-transparent":"border-gray-300"}`} style={{ background:fields.includes(f)?INK:undefined }}>
                    {fields.includes(f)&&<Check size={10} className="text-white"/>}
                  </div>
                  <span className="text-sm text-gray-700" style={{ fontFamily:I }}>{f}</span>
                </label>
              ))}
            </div>
          </div>
          <button onClick={doExport} disabled={exporting||fields.length===0} className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-50" style={{ background:INK, fontFamily:U }}>
            {exporting?<><RefreshCw size={15} className="animate-spin"/>Exporting…</>:<><Download size={15}/>Export {fields.length} fields as .{format}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export function GradingResults() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [viewTab, setViewTab] = useState("students");
  const [loading, setLoading] = useState(true);

  const [scoresData, setScoresData] = useState<any>(null);
  const [questionsData, setQuestionsData] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    examsApi.getAll().then(data => {
      const published = data.filter(e => e.status !== "draft");
      setExams(published);
      if (published.length > 0) {
        setExamId(published[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    Promise.all([
      reportsApi.getScores(examId),
      reportsApi.getQuestions(examId),
      gradingApi.getPendingReviews(examId)
    ]).then(([scores, questions, pending]) => {
      setScoresData(scores);
      setQuestionsData(questions);
      setPendingCount(pending.length);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [examId]);

  const exam = exams.find(e => e.id === examId);

  const getLetterGrade = (score: number, maxScore: number = 100) => {
    const pct = (score / maxScore) * 100;
    if (pct >= 90) return "A";
    if (pct >= 80) return "B";
    if (pct >= 70) return "C";
    if (pct >= 60) return "D";
    return "F";
  };
  
  const gradeColor = (g:string)=>({ A:"text-green-600", B:"text-blue-600", C:"text-amber-600", D:"text-amber-600", F:"text-red-600" }[g]||"text-gray-600");
  const scoreColor = (s:number)=>s>=80?"#16a34a":s>=60?"#d97706":"#ef4444";

  return (
    <DashboardLayout active="grading" title="Auto-Grading Results" subtitle="Review and export scores"
      actions={<>
        <button onClick={()=>navigate("/dashboard/grading/manual")} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}><PenLine size={13}/>Manual grade</button>
        <button onClick={()=>setShowExport(true)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export</button>
      </>}>
      {showExport&&<GradeExportModal onClose={()=>setShowExport(false)}/>}

      {/* Exam selector */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>Exam</label>
          <select value={examId} onChange={e=>setExamId(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-gray-400 min-w-[240px]" style={{ fontFamily:I }}>
            {exams.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-10 flex justify-center"><RefreshCw className="animate-spin text-gray-400" /></div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            {[
              { l:"Total Papers",  v:scoresData?.summary?.totalAttempts || 0,   icon:Users,        bg:"#F0EDE8" },
              { l:"Auto-graded",   v:Math.max(0, (scoresData?.summary?.totalAttempts || 0) - pendingCount),   icon:ClipboardCheck,bg:"#f0fdf4" },
              { l:"Needs Review",  v:pendingCount,    icon:AlertTriangle, bg:"#fff0f0" },
              { l:"Average Score", v:`${scoresData?.summary?.classAverage || 0}%`,icon:Award,         bg:"#fff7ed" },
              { l:"Pass Rate",     v:`${scoresData?.summary?.passRate || 0}%`,  icon:TrendingUp,    bg:"#eff6ff" },
            ].map(({l,v,icon:Icon,bg})=>(
              <div key={l} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:bg }}><Icon size={17} style={{ color:INK }}/></div>
                <div><p className="text-lg font-black leading-none" style={{ fontFamily:U, color:INK }}>{v}</p><p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p></div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 w-fit mb-5">
            {[{id:"students",label:"Student Results"},{id:"questions",label:"Question Analysis"}].map(t=>(
              <button key={t.id} onClick={()=>setViewTab(t.id)} className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${viewTab===t.id?"text-white shadow-sm":"text-gray-500 hover:text-gray-700"}`} style={{ background:viewTab===t.id?INK:undefined, fontFamily:U }}>{t.label}</button>
            ))}
          </div>

          {viewTab==="students"&&(
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">{["Student","Score","Grade","Status","Actions"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
                <tbody>
                  {scoresData?.students?.length === 0 && <tr><td colSpan={5} className="p-5 text-center text-gray-500">No attempts found for this exam.</td></tr>}
                  {scoresData?.students?.map((r: any)=>(
                    <tr key={r.studentId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background:CAMEL, fontFamily:U }}>{r.studentId.substring(0, 2).toUpperCase()}</div>
                          <span className="font-semibold text-gray-800 whitespace-nowrap" style={{ fontFamily:U }}>{r.studentId}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width:`${Math.min(100, r.averageScore)}%`, background:scoreColor(r.averageScore) }}/></div>
                          <span className="text-sm font-black" style={{ fontFamily:U, color:scoreColor(r.averageScore) }}>{r.averageScore}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><span className={`text-sm font-black ${gradeColor(getLetterGrade(r.averageScore))}`} style={{ fontFamily:U }}>{getLetterGrade(r.averageScore)}</span></td>
                      <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700`} style={{ fontFamily:U }}>Submitted</span></td>
                      <td className="px-5 py-3.5">
                        <button onClick={()=>navigate("/dashboard/grading/manual")} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap" style={{ fontFamily:U }}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewTab==="questions"&&(
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">{["Topic","Avg Score","Correct Rate","Difficulty"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
                <tbody>
                  {questionsData?.questions?.length === 0 && <tr><td colSpan={5} className="p-5 text-center text-gray-500">No question data found for this exam.</td></tr>}
                  {questionsData?.questions?.map((q: any, i: number)=>(
                    <tr key={q.questionId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full w-fit mb-1" style={{ fontFamily:U }}>{q.type}</span>
                          <span className="text-gray-700 font-medium line-clamp-1" style={{ fontFamily:I }} dangerouslySetInnerHTML={{ __html: q.questionText }}></span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><span className="font-black text-sm" style={{ fontFamily:U, color:scoreColor((q.avgScore / q.points) * 100) }}>{q.avgScore.toFixed(1)}/{q.points}</span></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2"><div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-green-500" style={{ width:`${q.correctRate}%` }}/></div><span className="text-xs font-semibold text-gray-700" style={{ fontFamily:U }}>{q.correctRate}%</span></div>
                      </td>
                      <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${q.difficulty==='EASY'?"bg-green-50 text-green-600":q.difficulty==='MEDIUM'?"bg-amber-50 text-amber-600":"bg-red-50 text-red-600"}`} style={{ fontFamily:U }}>{q.difficulty}</span></td>
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
