"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { Download, X, RefreshCw, AlertTriangle, Users } from "lucide-react";
import { U, I, INK, CAMEL } from "@/lib/tokens";
import { reportsApi, ScoresSummary, ScoreStudent, ReportExportFormat } from "@/lib/api/reports";

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

// Display-only banding off the average score — not tied to any exam's own
// passing score, which is what the Status column reflects instead.
function gradeOf(avg: number) {
  return avg >= 85 ? "A" : avg >= 70 ? "B" : avg >= 60 ? "C" : "F";
}

export function ScoresReport() {
  const [showExport, setShowExport] = useState(false);
  const [sort, setSort] = useState<"rank"|"score"|"name">("rank");
  const [summary, setSummary] = useState<ScoresSummary | null>(null);
  const [students, setStudents] = useState<ScoreStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    reportsApi.getScores()
      .then(({ summary, students }) => { setSummary(summary); setStudents(students); })
      .catch((e) => setError(e instanceof Error && e.message ? e.message : "Failed to load scores. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const sorted = [...students].sort((a,b)=>sort==="name"?a.name.localeCompare(b.name):sort==="score"?b.latestScore-a.latestScore:a.rank-b.rank);
  const scoreColor = (s:number)=>s>=80?"#16a34a":s>=60?"#d97706":"#ef4444";
  const topScorer = students.find(s => s.rank === 1);

  return (
    <DashboardLayout active="reports-scores" title="Scores Report" subtitle="Per-student grades and ranking"
      actions={<>
        <button onClick={()=>setShowExport(true)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export</button>
      </>}>
      {showExport&&<ReportExportModal title="Scores Report" onClose={()=>setShowExport(false)} onExport={(format)=>reportsApi.export("SCORES", format)}/>}

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { l:"Class average", v: loading ? "…" : `${summary?.classAverage ?? 0}%`, c:"#2563eb" },
          { l:"Pass rate",     v: loading ? "…" : `${summary?.passRate ?? 0}%`,     c:"#16a34a" },
          { l:"Top scorer",    v: loading ? "…" : topScorer ? `${topScorer.name} · ${topScorer.highestScore}%` : "—", c:INK },
        ].map(({l,v,c})=>(
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-lg font-black truncate" style={{ fontFamily:U, color:c }}>{v}</p>
            <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-400" style={{ fontFamily:I }}>Sort by:</span>
        {(["rank","score","name"] as const).map(s=>(
          <button key={s} onClick={()=>setSort(s)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all capitalize" style={{ background:sort===s?INK:undefined, color:sort===s?"white":"#6b7280", borderColor:sort===s?"transparent":"#e5e7eb", fontFamily:U }}>{s}</button>
        ))}
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
          <p className="text-sm text-gray-400" style={{ fontFamily:U }}>Loading scores…</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3">
          <Users size={32} className="text-gray-200"/>
          <p className="text-sm text-gray-400" style={{ fontFamily:U }}>No submitted exams yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">{["Rank","Student","Latest Score","Grade","Exams Taken","Session Avg","Highest","Status"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
            <tbody>
              {sorted.map(s=>{
                const grade = gradeOf(s.averageScore);
                const pass = s.passed > s.failed;
                return (
                  <tr key={s.email} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors">
                    <td className="px-5 py-3.5"><span className="w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center" style={{ background:s.rank<=3?"#fffbeb":s.rank<=6?"#f9fafb":"#fafafa", color:s.rank<=3?CAMEL:INK, fontFamily:U, display:"inline-flex" }}>#{s.rank}</span></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background:CAMEL, fontFamily:U }}>{s.name.split(" ").map(w=>w[0]).join("").toUpperCase().substring(0,2)}</div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 whitespace-nowrap" style={{ fontFamily:U }}>{s.name}</p>
                          {s.name !== s.email && <p className="text-[11px] text-gray-400 truncate" style={{ fontFamily:I }}>{s.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2"><div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width:`${s.latestScore}%`, background:scoreColor(s.latestScore) }}/></div><span className="font-black text-sm" style={{ fontFamily:U, color:scoreColor(s.latestScore) }}>{s.latestScore}%</span></div>
                    </td>
                    <td className="px-5 py-3.5"><span className={`font-black text-sm ${grade==="A"?"text-green-600":grade==="B"?"text-blue-600":grade==="C"?"text-amber-600":"text-red-600"}`} style={{ fontFamily:U }}>{grade}</span></td>
                    <td className="px-5 py-3.5 text-sm text-gray-600" style={{ fontFamily:I }}>{s.examsAttempted}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600" style={{ fontFamily:I }}>{s.averageScore}%</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600" style={{ fontFamily:I }}>{s.highestScore}%</td>
                    <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${pass?"bg-green-50 text-green-700":"bg-red-50 text-red-600"}`} style={{ fontFamily:U }}>{pass?"Pass":"Fail"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
