"use client";

import { Fragment, useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { Download } from "lucide-react";
import { U, I, INK, CAMEL } from "@/lib/tokens";
import { monitoringApi } from "@/lib/api/monitoring";
import { examsApi, Exam } from "@/lib/api/exams";
import { toast } from "sonner";

export function SecurityLogs() {
  const [sevFilter, setSevFilter] = useState("all");
  const [examFilter, setExamFilter] = useState("all");
  const [resolvedFilter, setResolvedFilter] = useState("all");
  const [expanded, setExpanded] = useState<number|null>(null);

  const [logs, setLogs] = useState<any[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examsApi.getAll().then(setExams).catch(console.error);
  }, []);

  useEffect(() => {
    fetchLogs(true);
    const interval = setInterval(() => {
      fetchLogs(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [sevFilter, examFilter, resolvedFilter]);

  const fetchLogs = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await monitoringApi.getAllViolations({
        severity: sevFilter !== "all" ? sevFilter : undefined,
        resolved: resolvedFilter !== "all" ? (resolvedFilter === "resolved" ? "true" : "false") : undefined,
        examId: examFilter !== "all" ? examFilter : undefined,
        pageSize: 1000, // Fetch more to make client-side summary accurate
      });
      setLogs(res.logs || []);
    } catch (err: any) {
      if (showLoading) toast.error("Failed to load logs: " + err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await monitoringApi.resolveViolation(id);
      toast.success("Violation marked as resolved");
      setLogs(logs.map(l => l.id === id ? { ...l, resolved: true } : l));
    } catch (err: any) {
      toast.error("Failed to resolve: " + err.message);
    }
  };

  const filtered = logs; // Already filtered by backend

  const sevColor: Record<string,string> = { warn:"text-amber-600 bg-amber-50", critical:"text-red-600 bg-red-50", info:"text-blue-600 bg-blue-50" };

  const summary = {
    total: logs.length,
    critical: logs.filter((l: any)=>l.severity==="critical").length,
    unresolved: logs.filter((l: any)=>!l.resolved).length,
    autoSubmit: logs.filter((l: any)=>l.actionTaken==="auto_submitted").length,
  };

  return (
    <DashboardLayout active="logs" title="Security Logs" subtitle="Full audit trail of all proctoring events"
      actions={<button className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export logs</button>}>

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[{l:"Total Events",v:summary.total,bg:"#F0EDE8",c:INK},{l:"Critical",v:summary.critical,bg:"#fff0f0",c:"#ef4444"},{l:"Unresolved",v:summary.unresolved,bg:"#fffbeb",c:"#d97706"},{l:"Auto-submitted",v:summary.autoSubmit,bg:"#f5f3ff",c:"#7c3aed"}].map(({l,v,bg,c})=>(
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-black" style={{ fontFamily:U, color:c }}>{v}</p>
            <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <select value={sevFilter} onChange={e=>setSevFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-white focus:outline-none" style={{ fontFamily:I }}>
          <option value="all">All severity</option>
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
                  <td className="px-5 py-3.5 text-xs font-mono text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ background:CAMEL, fontFamily:U }}>{log.studentName?.split(" ").map((w: string)=>w[0]).join("").substring(0, 2) || "?"}</div>
                      <span className="font-semibold text-gray-800 text-xs whitespace-nowrap" style={{ fontFamily:U }}>{log.studentName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap" style={{ fontFamily:I }}>{log.examTitle}</td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-gray-700 whitespace-nowrap" style={{ fontFamily:U }}>{log.eventType}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${sevColor[log.severity]||"text-gray-500 bg-gray-100"}`} style={{ fontFamily:U }}>{log.severity}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap" style={{ fontFamily:I }}>{log.actionTaken || "None"}</td>
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
                            {log.eventType} detected for <strong>{log.studentName}</strong> during <em>{log.examTitle}</em> at {new Date(log.createdAt).toLocaleTimeString()}. System automatically took action: <strong>{log.actionTaken || "None"}</strong>.
                            {log.detail && <span className="block mt-1 text-gray-500">Details: {log.detail}</span>}
                            {log.severity==="critical"?" This is a high-priority flag requiring manual review.":" This was a warning-level event."}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {!log.resolved&&<button onClick={() => handleResolve(log.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600" style={{ fontFamily:U }}>Mark resolved</button>}
                          <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white" style={{ fontFamily:U }}>View session</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!loading && filtered.length===0&&(
              <tr><td colSpan={7} className="px-5 py-20 text-center"><p className="text-sm text-gray-400" style={{ fontFamily:U }}>No logs match your filters</p></td></tr>
            )}
            {loading && (
              <tr><td colSpan={7} className="px-5 py-20 text-center"><p className="text-sm text-gray-400" style={{ fontFamily:U }}>Loading logs...</p></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
