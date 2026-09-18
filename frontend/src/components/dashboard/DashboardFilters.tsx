"use client";

import { useEffect, useState } from "react";
import { DashboardLayout, StatusBadge } from "@/components/dashboard/DashboardShared";
import { Download, Check, RotateCcw, Filter, AlertTriangle, RefreshCw } from "lucide-react";
import { examsApi, Exam } from "@/lib/api/exams";
import { reportsApi, ReportExportFormat } from "@/lib/api/reports";
import { U, I, INK, CAMEL } from "@/lib/tokens";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DashboardFilters() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [status, setStatus]     = useState("all");
  const [applied, setApplied]   = useState(false);
  const [exportingFmt, setExportingFmt] = useState<ReportExportFormat | null>(null);
  const [exportError, setExportError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    examsApi.getAll()
      .then(setExams)
      .catch(e => setError(e instanceof Error && e.message ? e.message : "Failed to load your exams. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const allSubjects = Array.from(new Set(exams.map(e => e.subject).filter((s): s is string => !!s))).sort();
  const toggleSub = (s: string) => setSubjects(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const filtered = exams.filter(e => {
    if (subjects.length > 0 && (!e.subject || !subjects.includes(e.subject))) return false;
    if (status !== "all" && e.status.toLowerCase() !== status) return false;
    if (dateFrom || dateTo) {
      if (!e.startDate) return false;
      const d = e.startDate.slice(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
    }
    return true;
  });

  const reset = () => { setDateFrom(""); setDateTo(""); setSubjects([]); setStatus("all"); setApplied(false); };

  const doExport = async (format: ReportExportFormat) => {
    setExportingFmt(format);
    setExportError("");
    try {
      await reportsApi.export("EXAM", format, undefined, {
        status,
        subjects,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
    } catch (e) {
      setExportError(e instanceof Error && e.message ? e.message : "Export failed. Please try again.");
    } finally {
      setExportingFmt(null);
    }
  };

  return (
    <DashboardLayout active="filters" title="Reports" subtitle="Filter and export your exam data">
      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Filters</h3>
              <button onClick={reset} className="text-xs font-semibold flex items-center gap-1" style={{ color:CAMEL, fontFamily:U }}><RotateCcw size={11}/>Reset</button>
            </div>
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Date Range</p>
              {([["From",dateFrom,setDateFrom],["To",dateTo,setDateTo]] as const).map(([label,val,set])=>(
                <div key={label} className="mb-2">
                  <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily:I }}>{label}</label>
                  <input type="date" value={val} onChange={e=>set(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
                </div>
              ))}
            </div>
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Subject</p>
              {allSubjects.length === 0 ? (
                <p className="text-xs text-gray-400" style={{ fontFamily:I }}>No subjects yet</p>
              ) : (
                <div className="space-y-2">
                  {allSubjects.map(s=>(
                    <label key={s} className="flex items-center gap-2.5 cursor-pointer">
                      <div onClick={()=>toggleSub(s)} className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${subjects.includes(s)?"border-transparent":"border-gray-300"}`} style={{ background:subjects.includes(s)?INK:undefined }}>
                        {subjects.includes(s)&&<Check size={10} className="text-white"/>}
                      </div>
                      <span className="text-sm text-gray-600" style={{ fontFamily:I }}>{s}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Status</p>
              <div className="flex flex-wrap gap-2">
                {["all","published","draft","archived"].map(s=>(
                  <button key={s} onClick={()=>setStatus(s)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize transition-all ${status===s?"text-white border-transparent":"border-gray-200 text-gray-500"}`} style={{ background:status===s?INK:undefined, fontFamily:U }}>{s}</button>
                ))}
              </div>
            </div>
            <button onClick={()=>setApplied(true)} className="w-full text-white font-bold py-3 rounded-xl text-sm hover:opacity-90" style={{ background:INK, fontFamily:U }}>Apply Filters</button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-black mb-4" style={{ fontFamily:U, color:INK }}>Export</h3>
            {([["csv","Export as CSV"],["pdf","Export as PDF"],["excel","Export as Excel"]] as const).map(([fmt,label])=>(
              <button key={fmt} onClick={()=>doExport(fmt)} disabled={exportingFmt!==null || filtered.length===0}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40" style={{ fontFamily:I }}>
                {exportingFmt===fmt ? <RefreshCw size={14} className="animate-spin" style={{ color:CAMEL }}/> : <Download size={14} style={{ color:CAMEL }}/>}
                {exportingFmt===fmt ? "Exporting…" : label}
              </button>
            ))}
            {exportError && <p className="text-xs text-red-500 mt-2 px-1" style={{ fontFamily:I }}>{exportError}</p>}
            {filtered.length===0 && !loading && <p className="text-xs text-gray-400 mt-2 px-1" style={{ fontFamily:I }}>No results to export</p>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div><h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Results</h3><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{filtered.length} exam{filtered.length!==1?"s":""} {applied?"· filters applied":""}</p></div>
          </div>
          {error ? (
            <div className="flex flex-col items-center py-24 gap-3">
              <AlertTriangle size={32} className="text-red-300"/>
              <p className="text-sm text-red-500 text-center max-w-xs" style={{ fontFamily:U }}>{error}</p>
              <button onClick={load} className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background:INK, fontFamily:U }}>Try again</button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center py-24 gap-3">
              <RefreshCw size={24} className="text-gray-300 animate-spin"/>
              <p className="text-sm text-gray-400" style={{ fontFamily:U }}>Loading exams…</p>
            </div>
          ) : filtered.length===0 ? (
            <div className="flex flex-col items-center py-24"><Filter size={32} className="text-gray-200 mb-3"/><p className="text-sm font-semibold text-gray-400" style={{ fontFamily:U }}>No results</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-50">{["Exam Name","Subject","Date","Students","Status"].map(h=><th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(ex=>(
                  <tr key={ex.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold" style={{ fontFamily:U, color:INK }}>{ex.title}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs" style={{ fontFamily:I }}>{ex.subject || "—"}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs" style={{ fontFamily:I }}>{formatDate(ex.startDate)}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs" style={{ fontFamily:I }}>{ex.studentsCount ?? "—"}</td>
                    <td className="px-6 py-4"><StatusBadge status={ex.status.toLowerCase()}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
