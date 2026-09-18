"use client";

import { Fragment, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { Download, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import { U, I, INK, CAMEL } from "@/lib/tokens";
import { violationsApi, ViolationLog, ViolationExamOption } from "@/lib/api/violations";
import { eventLabel, actionLabel } from "@/lib/violationEvents";

function formatTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).replace(",", "");
}

export function SecurityLogs() {
  const [logs, setLogs] = useState<ViolationLog[]>([]);
  const [exams, setExams] = useState<ViolationExamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sevFilter, setSevFilter] = useState("all");
  const [examFilter, setExamFilter] = useState("all");
  const [resolvedFilter, setResolvedFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    violationsApi.list({ pageSize: 500 })
      .then(({ logs, exams }) => { setLogs(logs); setExams(exams); })
      .catch(e => setError(e instanceof Error && e.message ? e.message : "Failed to load security logs. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter(l => {
    const matchSev  = sevFilter === "all" || l.severity === sevFilter;
    const matchExam = examFilter === "all" || l.examId === examFilter;
    const matchRes  = resolvedFilter === "all" || (resolvedFilter === "resolved" ? l.resolved : !l.resolved);
    return matchSev && matchExam && matchRes;
  });

  const sevColor: Record<string,string> = { warn:"text-amber-600 bg-amber-50", critical:"text-red-600 bg-red-50", info:"text-blue-600 bg-blue-50" };

  const summary = {
    total: logs.length,
    critical: logs.filter(l => l.severity === "critical").length,
    unresolved: logs.filter(l => !l.resolved).length,
    autoSubmit: logs.filter(l => l.actionTaken === "auto_submitted").length,
  };

  const resolve = async (id: string) => {
    setResolvingId(id);
    setLogs(p => p.map(l => l.id === id ? { ...l, resolved: true } : l));
    try {
      await violationsApi.resolve(id);
    } catch (e) {
      setLogs(p => p.map(l => l.id === id ? { ...l, resolved: false } : l));
      alert(e instanceof Error && e.message ? e.message : "Failed to mark resolved. Please try again.");
    } finally {
      setResolvingId(null);
    }
  };

  const exportLogs = async () => {
    setExporting(true);
    setExportError("");
    try {
      await violationsApi.exportCsv({
        severity: sevFilter !== "all" ? sevFilter : undefined,
        examId: examFilter !== "all" ? examFilter : undefined,
        resolved: resolvedFilter !== "all" ? resolvedFilter === "resolved" : undefined,
      });
    } catch (e) {
      setExportError(e instanceof Error && e.message ? e.message : "Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout active="logs" title="Security Logs" subtitle="Full audit trail of all proctoring events"
      actions={<button onClick={exportLogs} disabled={exporting} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50" style={{ background:INK, fontFamily:U }}>
        {exporting ? <RefreshCw size={13} className="animate-spin"/> : <Download size={13}/>}
        {exporting ? "Exporting…" : "Export logs"}
      </button>}>

      {exportError && <p className="text-xs text-red-500 mb-3" style={{ fontFamily:I }}>{exportError}</p>}

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { l:"Total Events",    v: loading ? "…" : summary.total,      bg:"#F0EDE8", c:INK },
          { l:"Critical",        v: loading ? "…" : summary.critical,   bg:"#fff0f0", c:"#ef4444" },
          { l:"Unresolved",      v: loading ? "…" : summary.unresolved, bg:"#fffbeb", c:"#d97706" },
          { l:"Auto-submitted",  v: loading ? "…" : summary.autoSubmit, bg:"#f5f3ff", c:"#7c3aed" },
        ].map(({l,v,bg,c})=>(
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-black" style={{ fontFamily:U, color:c }}>{v}</p>
            <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <select value={sevFilter} onChange={e=>setSevFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-white focus:outline-none" style={{ fontFamily:I }}>
          <option value="all">All severity</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <select value={examFilter} onChange={e=>setExamFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-white focus:outline-none" style={{ fontFamily:I }}>
          <option value="all">All exams</option>
          {exams.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <select value={resolvedFilter} onChange={e=>setResolvedFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-white focus:outline-none" style={{ fontFamily:I }}>
          <option value="all">All status</option>
          <option value="resolved">Resolved</option>
          <option value="unresolved">Unresolved</option>
        </select>
        <p className="text-xs text-gray-400 flex items-center" style={{ fontFamily:I }}>{filtered.length} event{filtered.length!==1?"s":""}</p>
      </div>

      {error ? (
        <div className="bg-white rounded-2xl border border-red-100 py-20 flex flex-col items-center gap-3">
          <AlertTriangle size={32} className="text-red-300"/>
          <p className="text-sm text-red-500 text-center max-w-xs" style={{ fontFamily:U }}>{error}</p>
          <button onClick={load} className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background:INK, fontFamily:U }}>Try again</button>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 flex flex-col items-center gap-3">
          <RefreshCw size={24} className="text-gray-300 animate-spin"/>
          <p className="text-sm text-gray-400" style={{ fontFamily:U }}>Loading security logs…</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Timestamp","Student","Exam","Event","Severity","Action Taken","Status"].map(h=>(
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(log=>(
                <Fragment key={log.id}>
                  <tr onClick={()=>setExpanded(expanded===log.id?null:log.id)} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5 text-xs font-mono text-gray-500 whitespace-nowrap">{formatTs(log.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ background:CAMEL, fontFamily:U }}>{log.studentName.split(" ").map(w=>w[0]).join("").toUpperCase().substring(0,2)}</div>
                        <span className="font-semibold text-gray-800 text-xs whitespace-nowrap" style={{ fontFamily:U }}>{log.studentName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap" style={{ fontFamily:I }}>{log.examTitle}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-700 whitespace-nowrap" style={{ fontFamily:U }}>{eventLabel(log.eventType)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${sevColor[log.severity]||"text-gray-500 bg-gray-100"}`} style={{ fontFamily:U }}>{log.severity}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap" style={{ fontFamily:I }}>{actionLabel(log.actionTaken)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${log.resolved?"bg-green-50 text-green-700":"bg-amber-50 text-amber-700"}`} style={{ fontFamily:U }}>{log.resolved?"Resolved":"Open"}</span>
                    </td>
                  </tr>
                  {expanded===log.id&&(
                    <tr key={`${log.id}-exp`} className="bg-gray-50 border-b border-gray-100">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="flex items-start gap-6">
                          <div className="flex-1">
                            <p className="text-xs font-black text-gray-700 mb-2" style={{ fontFamily:U }}>Event Details</p>
                            <p className="text-xs text-gray-600 leading-relaxed" style={{ fontFamily:I }}>
                              {eventLabel(log.eventType)} detected for <strong>{log.studentName}</strong> during <em>{log.examTitle}</em> at {formatTs(log.createdAt)}. System action: <strong>{actionLabel(log.actionTaken)}</strong> ({log.occurrenceCount} occurrence{log.occurrenceCount!==1?"s":""}).
                              {log.severity==="critical"?" This is a high-priority flag requiring manual review.":" This was a lower-priority event."}
                              {log.detail?` Detail: ${log.detail}.`:""}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {!log.resolved&&<button onClick={(e)=>{e.stopPropagation(); resolve(log.id);}} disabled={resolvingId===log.id} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50" style={{ fontFamily:U }}>{resolvingId===log.id?"Resolving…":"Mark resolved"}</button>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {filtered.length===0&&(
                <tr><td colSpan={7} className="px-5 py-20 text-center">
                  <ShieldCheck size={28} className="mx-auto mb-2 text-gray-200"/>
                  <p className="text-sm text-gray-400" style={{ fontFamily:U }}>{logs.length===0?"No proctoring events recorded yet":"No logs match your filters"}</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
