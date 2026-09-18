"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/hooks";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { Download, X, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import { U, I, INK, CAMEL } from "@/lib/tokens";
import { reportsApi, AntiCheatingSummary, AntiCheatExamRow, ReportExportFormat } from "@/lib/api/reports";
import { eventLabel } from "@/lib/violationEvents";

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

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AntiCheatReport() {
  const navigate = useNavigate();
  const [showExport, setShowExport] = useState(false);
  const [summary, setSummary] = useState<AntiCheatingSummary | null>(null);
  const [exams, setExams] = useState<AntiCheatExamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    reportsApi.getAntiCheating()
      .then(({ summary, exams }) => { setSummary(summary); setExams(exams); })
      .catch((e) => setError(e instanceof Error && e.message ? e.message : "Failed to load anti-cheating data. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const eventCounts = new Map<string, number>();
  for (const exam of exams) {
    for (const e of exam.events) {
      eventCounts.set(e.type, (eventCounts.get(e.type) ?? 0) + e.count);
    }
  }
  const events = Array.from(eventCounts.entries()).sort((a, b) => b[1] - a[1]);
  const maxEventCount = events[0]?.[1] ?? 0;

  const statCards = [
    { l:"Total flags",      v: loading ? "…" : String(summary?.totalFlags ?? 0),      bg:"#fff0f0", c:"#ef4444" },
    { l:"Critical",         v: loading ? "…" : String(summary?.criticalFlags ?? 0),   bg:"#fdf4ff", c:"#7c3aed" },
    { l:"Auto-submitted",   v: loading ? "…" : String(summary?.autoSubmitted ?? 0),   bg:"#fff7ed", c:"#d97706" },
    { l:"Resolved",         v: loading ? "…" : String(summary?.resolved ?? 0),        bg:"#f0fdf4", c:"#16a34a" },
  ];

  return (
    <DashboardLayout active="reports-cheat" title="Anti-Cheating Report" subtitle="Flag summary across all proctored exams"
      actions={<>
        <button onClick={()=>navigate("/dashboard/monitoring/logs")} className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}>Full logs →</button>
        <button onClick={()=>setShowExport(true)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export</button>
      </>}>
      {showExport&&<ReportExportModal title="Anti-Cheating Report" onClose={()=>setShowExport(false)} onExport={(format)=>reportsApi.export("ANTI_CHEATING", format)}/>}

      <div className="grid grid-cols-4 gap-3 mb-6">
        {statCards.map(({l,v,bg,c})=>(
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-black" style={{ fontFamily:U, color:c }}>{v}</p>
            <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p>
          </div>
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
          <p className="text-sm text-gray-400" style={{ fontFamily:U }}>Loading anti-cheating data…</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3">
          <ShieldCheck size={32} className="text-gray-200"/>
          <p className="text-sm text-gray-400" style={{ fontFamily:U }}>No proctored exam activity yet</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_280px] gap-5 mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100"><p className="text-sm font-black" style={{ fontFamily:U, color:INK }}>By exam</p></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">{["Exam","Date","Students","Total flags","Critical","Auto-submit","Resolved"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
              <tbody>
                {exams.map(r=>(
                  <tr key={r.examId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                    <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap" style={{ fontFamily:U }}>{r.examTitle}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap" style={{ fontFamily:I }}>{formatDate(r.date)}</td>
                    <td className="px-5 py-3.5 text-gray-600" style={{ fontFamily:I }}>{r.students}</td>
                    <td className="px-5 py-3.5"><span className={`font-black text-sm ${r.totalFlags>0?"text-red-500":"text-gray-300"}`} style={{ fontFamily:U }}>{r.totalFlags}</span></td>
                    <td className="px-5 py-3.5"><span className={`font-black text-sm ${r.criticalFlags>0?"text-purple-600":"text-gray-300"}`} style={{ fontFamily:U }}>{r.criticalFlags}</span></td>
                    <td className="px-5 py-3.5"><span className={`font-black text-sm ${r.autoSubmitted>0?"text-amber-600":"text-gray-300"}`} style={{ fontFamily:U }}>{r.autoSubmitted}</span></td>
                    <td className="px-5 py-3.5"><span className="text-green-600 font-semibold text-sm" style={{ fontFamily:U }}>{r.resolvedFlags}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Event types</p>
            {events.length === 0 ? (
              <p className="text-xs text-gray-400" style={{ fontFamily:I }}>No violation events recorded</p>
            ) : (
              <div className="space-y-3">
                {events.map(([type, count])=>(
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700" style={{ fontFamily:U }}>{eventLabel(type)}</span>
                      <span className="text-xs font-black" style={{ fontFamily:U, color:INK }}>{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${maxEventCount>0?Math.round(count/maxEventCount*100):0}%`, background:CAMEL }}/>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
