"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { Download, X, RefreshCw, AlertTriangle, Check } from "lucide-react";
import { U, I, INK, CAMEL } from "@/lib/tokens";

function ReportExportModal({ title, onClose }: { title:string; onClose:()=>void }) {
  const [fmt, setFmt] = useState("pdf");
  const [exporting, setExporting] = useState(false);
  const go = ()=>{ setExporting(true); setTimeout(()=>{ setExporting(false); onClose(); },900); };
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
            {[{id:"pdf",label:"PDF"},{id:"xlsx",label:"Excel"},{id:"csv",label:"CSV"}].map(f=>(
              <button key={f.id} onClick={()=>setFmt(f.id)} className="py-2.5 rounded-xl border text-xs font-bold transition-all" style={{ background:fmt===f.id?INK:undefined, color:fmt===f.id?"white":"#6b7280", borderColor:fmt===f.id?"transparent":"#e5e7eb", fontFamily:U }}>{f.label}</button>
            ))}
          </div>
          <button onClick={go} disabled={exporting} className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-50" style={{ background:INK, fontFamily:U }}>
            {exporting?<><RefreshCw size={14} className="animate-spin"/>Exporting…</>:<><Download size={14}/>Download .{fmt}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const Q_ANALYSIS = [
  { exam:"Calculus Final",  q:1,  topic:"Chain Rule",             type:"MCQ",   avg:7.8, pass:88, disc:0.62, flag:false },
  { exam:"Calculus Final",  q:2,  topic:"Integration basics",     type:"MCQ",   avg:8.2, pass:91, disc:0.54, flag:false },
  { exam:"Calculus Final",  q:3,  topic:"Fundamental theorem",    type:"Short", avg:6.5, pass:72, disc:0.71, flag:false },
  { exam:"Calculus Final",  q:6,  topic:"Applications (Essay)",   type:"Essay", avg:6.1, pass:68, disc:0.55, flag:true  },
  { exam:"Biology Mid-term",q:1,  topic:"Cell structure",         type:"MCQ",   avg:7.2, pass:80, disc:0.48, flag:false },
  { exam:"Biology Mid-term",q:3,  topic:"Mitosis vs Meiosis",     type:"MCQ",   avg:5.8, pass:60, disc:0.77, flag:true  },
  { exam:"Biology Mid-term",q:5,  topic:"Enzyme kinetics",        type:"Short", avg:6.9, pass:74, disc:0.60, flag:false },
  { exam:"Physics Quiz",    q:2,  topic:"Newton's laws",          type:"MCQ",   avg:8.5, pass:92, disc:0.42, flag:false },
  { exam:"Physics Quiz",    q:4,  topic:"Wave interference",      type:"MCQ",   avg:5.4, pass:55, disc:0.81, flag:true  },
];

export function QuestionAnalysisReport() {
  const [showExport, setShowExport] = useState(false);
  const [examFilter, setExamFilter] = useState("all");
  const [flagOnly, setFlagOnly] = useState(false);

  const filtered = Q_ANALYSIS.filter(q=>{
    const mExam = examFilter==="all"||q.exam===examFilter;
    const mFlag = !flagOnly||q.flag;
    return mExam&&mFlag;
  });

  const uniqueExams = [...new Set(Q_ANALYSIS.map(q=>q.exam))];
  const discColor = (d:number)=>d>=0.70?"text-amber-600":d>=0.40?"text-green-600":"text-gray-400";
  const diffLabel = (avg:number)=>avg>=8?"Easy":avg>=6?"Medium":"Hard";
  const diffStyle = (avg:number)=>avg>=8?"bg-green-50 text-green-600":avg>=6?"bg-amber-50 text-amber-600":"bg-red-50 text-red-600";

  return (
    <DashboardLayout active="reports-qana" title="Question Analysis" subtitle="Item difficulty and discrimination index by exam"
      actions={<button onClick={()=>setShowExport(true)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export</button>}>
      {showExport&&<ReportExportModal title="Question Analysis" onClose={()=>setShowExport(false)}/>}

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3.5 mb-5 flex flex-wrap gap-4">
        <div><p className="text-xs font-black text-blue-800" style={{ fontFamily:U }}>Pass rate</p><p className="text-[11px] text-blue-600" style={{ fontFamily:I }}>% of students who scored &gt; 50% on this item</p></div>
        <div><p className="text-xs font-black text-blue-800" style={{ fontFamily:U }}>Discrimination index</p><p className="text-[11px] text-blue-600" style={{ fontFamily:I }}>How well the question separates strong from weak students (0–1). &gt;0.7 = may be too tricky.</p></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={examFilter} onChange={e=>setExamFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-white focus:outline-none" style={{ fontFamily:I }}>
          <option value="all">All exams</option>
          {uniqueExams.map(e=><option key={e} value={e}>{e}</option>)}
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <div onClick={()=>setFlagOnly(f=>!f)} className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${flagOnly?"border-transparent":"border-gray-300"}`} style={{ background:flagOnly?INK:undefined }}>
            {flagOnly&&<Check size={10} className="text-white"/>}
          </div>
          <span className="text-xs text-gray-600" style={{ fontFamily:I }}>Flagged items only ({Q_ANALYSIS.filter(q=>q.flag).length})</span>
        </label>
        <p className="text-xs text-gray-400 ml-auto" style={{ fontFamily:I }}>{filtered.length} items</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">{["Exam","Q#","Topic","Type","Avg Score","Pass Rate","Disc. Index","Difficulty","Flag"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((q,i)=>(
              <tr key={i} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors ${q.flag?"bg-amber-50/30":""}`}>
                <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap" style={{ fontFamily:I }}>{q.exam}</td>
                <td className="px-5 py-3.5"><span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background:"#F0EDE8", color:INK, fontFamily:U, display:"inline-flex" }}>Q{q.q}</span></td>
                <td className="px-5 py-3.5 text-gray-700 font-medium whitespace-nowrap" style={{ fontFamily:I }}>{q.topic}</td>
                <td className="px-5 py-3.5"><span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full" style={{ fontFamily:U }}>{q.type}</span></td>
                <td className="px-5 py-3.5 font-black text-sm" style={{ fontFamily:U, color:q.avg>=8?"#16a34a":q.avg>=6?"#d97706":"#ef4444" }}>{q.avg}/10</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2"><div className="h-1.5 w-14 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-green-500" style={{ width:`${q.pass}%` }}/></div><span className="text-xs font-semibold" style={{ fontFamily:U }}>{q.pass}%</span></div>
                </td>
                <td className="px-5 py-3.5"><span className={`text-xs font-black ${discColor(q.disc)}`} style={{ fontFamily:U }}>{q.disc.toFixed(2)}</span></td>
                <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${diffStyle(q.avg)}`} style={{ fontFamily:U }}>{diffLabel(q.avg)}</span></td>
                <td className="px-5 py-3.5">{q.flag&&<AlertTriangle size={14} className="text-amber-500"/>}</td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={9} className="px-5 py-16 text-center text-sm text-gray-400" style={{ fontFamily:U }}>No items match filters</td></tr>}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
