"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { Download, X, RefreshCw, AlertTriangle, Check, FileBarChart } from "lucide-react";
import { U, I, INK, CAMEL } from "@/lib/tokens";
import { reportsApi, QuestionAnalyticsItem, ReportExportFormat } from "@/lib/api/reports";

function ReportExportModal({ title, onClose, onExport }: { title:string; onClose:()=>void; onExport:(format: ReportExportFormat)=>Promise<void> }) {
  const [fmt, setFmt] = useState<ReportExportFormat>("pdf");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const go = async () => {
    setExporting(true);
    setError("");
    try {
      await onExport(fmt);
      onClose();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background:"rgba(13,27,42,0.55)", backdropFilter:"blur(8px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="h-1 w-full" style={{ background:`linear-gradient(90deg,${INK},${CAMEL})` }}/>
        <div className="p-7">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-black" style={{ fontFamily:U, color:INK }}>Export: {title}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><X size={15}/></button>
          </div>
          <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Format</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {([{id:"pdf",label:"PDF"},{id:"excel",label:"Excel"},{id:"csv",label:"CSV"}] as const).map(f=>(
              <button key={f.id} onClick={()=>setFmt(f.id)} className="py-2.5 rounded-xl border text-xs font-bold transition-all" style={{ background:fmt===f.id?INK:undefined, color:fmt===f.id?"white":"#6b7280", borderColor:fmt===f.id?"transparent":"#e5e7eb", fontFamily:U }}>{f.label}</button>
            ))}
          </div>
          {error && <p className="text-xs text-red-500 mb-3" style={{ fontFamily:I }}>{error}</p>}
          <button onClick={go} disabled={exporting} className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-50" style={{ background:INK, fontFamily:U }}>
            {exporting?<><RefreshCw size={14} className="animate-spin"/>Exporting…</>:<><Download size={14}/>Download .{fmt==="excel"?"xlsx":fmt}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const TYPE_LABELS: Record<string, string> = {
  MCQ: "MCQ",
  TRUE_FALSE: "T/F",
  MULTIPLE_SELECT: "Multi-Select",
  CHECKBOX: "Checkbox",
  DROPDOWN: "Dropdown",
  SHORT_ANSWER: "Short",
  ESSAY: "Essay",
  FILL_IN_BLANK: "Fill Blank",
  MATCHING: "Matching",
  FILE_UPLOAD: "File",
  MATH_FORMULA: "Math",
};

const DIFFICULTY_STYLE: Record<string, string> = {
  EASY: "bg-green-50 text-green-600",
  MEDIUM: "bg-amber-50 text-amber-600",
  HARD: "bg-red-50 text-red-600",
  MIXED: "bg-gray-100 text-gray-500",
};

export function QuestionAnalysisReport() {
  const [showExport, setShowExport] = useState(false);
  const [examFilter, setExamFilter] = useState("all");
  const [flagOnly, setFlagOnly] = useState(false);
  const [questions, setQuestions] = useState<QuestionAnalyticsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    reportsApi.getQuestions()
      .then(({ questions }) => setQuestions(questions))
      .catch((e) => setError(e instanceof Error && e.message ? e.message : "Failed to load question analysis. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = questions.filter(q=>{
    const mExam = examFilter==="all"||q.examTitle===examFilter;
    const mFlag = !flagOnly||q.flagged;
    return mExam&&mFlag;
  });

  const uniqueExams = [...new Set(questions.map(q=>q.examTitle))];
  const discColor = (d:number|null)=>d==null?"text-gray-300":d>=0.70?"text-amber-600":d>=0.40?"text-green-600":"text-gray-400";
  const scoreColor = (pct:number)=>pct>=80?"#16a34a":pct>=60?"#d97706":"#ef4444";

  return (
    <DashboardLayout active="reports-qana" title="Question Analysis" subtitle="Item difficulty and discrimination index by exam"
      actions={<button onClick={()=>setShowExport(true)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export</button>}>
      {showExport&&<ReportExportModal title="Question Analysis" onClose={()=>setShowExport(false)} onExport={(format)=>reportsApi.export("QUESTION_ANALYSIS", format)}/>}

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3.5 mb-5 flex flex-wrap gap-4">
        <div><p className="text-xs font-black text-blue-800" style={{ fontFamily:U }}>Pass rate</p><p className="text-[11px] text-blue-600" style={{ fontFamily:I }}>% of students who scored &gt; 50% on this item</p></div>
        <div><p className="text-xs font-black text-blue-800" style={{ fontFamily:U }}>Discrimination index</p><p className="text-[11px] text-blue-600" style={{ fontFamily:I }}>How well the question separates strong from weak students (0–1). &gt;0.7 = may be too tricky.</p></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={examFilter} onChange={e=>setExamFilter(e.target.value)} disabled={loading} className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-white focus:outline-none disabled:opacity-50" style={{ fontFamily:I }}>
          <option value="all">All exams</option>
          {uniqueExams.map(e=><option key={e} value={e}>{e}</option>)}
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <div onClick={()=>setFlagOnly(f=>!f)} className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${flagOnly?"border-transparent":"border-gray-300"}`} style={{ background:flagOnly?INK:undefined }}>
            {flagOnly&&<Check size={10} className="text-white"/>}
          </div>
          <span className="text-xs text-gray-600" style={{ fontFamily:I }}>Flagged items only ({questions.filter(q=>q.flagged).length})</span>
        </label>
        <p className="text-xs text-gray-400 ml-auto" style={{ fontFamily:I }}>{filtered.length} items</p>
      </div>

      {error ? (
        <div className="bg-white rounded-2xl border border-red-100 py-16 flex flex-col items-center gap-3">
          <AlertTriangle size={32} className="text-red-300"/>
          <p className="text-sm text-red-500 text-center max-w-xs" style={{ fontFamily:U }}>{error}</p>
          <button onClick={load} className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background:INK, fontFamily:U }}>Try again</button>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3">
          <RefreshCw size={24} className="text-gray-300 animate-spin"/>
          <p className="text-sm text-gray-400" style={{ fontFamily:U }}>Loading question analysis…</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3">
          <FileBarChart size={32} className="text-gray-200"/>
          <p className="text-sm text-gray-400" style={{ fontFamily:U }}>No submitted exams yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">{["Exam","Q#","Question","Type","Avg Score","Pass Rate","Disc. Index","Difficulty","Flag"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(q=>(
                <tr key={q.questionId} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors ${q.flagged?"bg-amber-50/30":""}`}>
                  <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap" style={{ fontFamily:I }}>{q.examTitle}</td>
                  <td className="px-5 py-3.5"><span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background:"#F0EDE8", color:INK, fontFamily:U, display:"inline-flex" }}>Q{q.order}</span></td>
                  <td className="px-5 py-3.5 text-gray-700 font-medium max-w-[240px] truncate" style={{ fontFamily:I }} title={q.questionText}>{q.questionText}</td>
                  <td className="px-5 py-3.5"><span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap" style={{ fontFamily:U }}>{TYPE_LABELS[q.type] || q.type}</span></td>
                  <td className="px-5 py-3.5 font-black text-sm whitespace-nowrap" style={{ fontFamily:U, color:scoreColor(q.correctRate) }}>{q.avgScore}/{q.points}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2"><div className="h-1.5 w-14 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-green-500" style={{ width:`${q.correctRate}%` }}/></div><span className="text-xs font-semibold" style={{ fontFamily:U }}>{q.correctRate}%</span></div>
                  </td>
                  <td className="px-5 py-3.5"><span className={`text-xs font-black ${discColor(q.discriminationIndex)}`} style={{ fontFamily:U }}>{q.discriminationIndex != null ? q.discriminationIndex.toFixed(2) : "—"}</span></td>
                  <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${DIFFICULTY_STYLE[q.difficulty] || DIFFICULTY_STYLE.MIXED}`} style={{ fontFamily:U }}>{q.difficulty.charAt(0) + q.difficulty.slice(1).toLowerCase()}</span></td>
                  <td className="px-5 py-3.5">{q.flagged&&<AlertTriangle size={14} className="text-amber-500"/>}</td>
                </tr>
              ))}
              {filtered.length===0&&<tr><td colSpan={9} className="px-5 py-16 text-center text-sm text-gray-400" style={{ fontFamily:U }}>No items match filters</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
