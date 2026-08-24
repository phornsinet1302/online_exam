"use client";

import { Fragment, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { Download } from "lucide-react";
import { U, I, INK, CAMEL } from "@/lib/tokens";

const SECURITY_LOGS = [
  { id:1,  ts:"2026-07-13 09:44:27", student:"Sara Jones",  exam:"Biology Mid-term",  event:"Tab switch",          severity:"warn",     action:"Flagged",        resolved:false },
  { id:2,  ts:"2026-07-13 09:41:03", student:"Mike Park",   exam:"Biology Mid-term",  event:"Face not detected",   severity:"warn",     action:"Flagged",        resolved:false },
  { id:3,  ts:"2026-07-13 09:38:15", student:"Amy Nguyen",  exam:"Biology Mid-term",  event:"Copy-paste attempt",  severity:"critical", action:"Warning sent",   resolved:true  },
  { id:4,  ts:"2026-07-13 09:35:50", student:"Sara Jones",  exam:"Biology Mid-term",  event:"Multiple faces",      severity:"critical", action:"Flagged",        resolved:false },
  { id:5,  ts:"2026-07-10 10:58:11", student:"Tom Reed",    exam:"Calculus Final",    event:"DevTools opened",     severity:"critical", action:"Auto-submitted",  resolved:true  },
  { id:6,  ts:"2026-07-10 10:42:33", student:"Lucy Kim",    exam:"Calculus Final",    event:"Tab switch",          severity:"warn",     action:"Warning sent",   resolved:true  },
  { id:7,  ts:"2026-07-10 10:39:05", student:"James Wang",  exam:"Calculus Final",    event:"Fullscreen exited",   severity:"warn",     action:"Warning sent",   resolved:true  },
  { id:8,  ts:"2026-07-08 11:14:22", student:"Ryan Kim",    exam:"Physics Quiz",      event:"Copy-paste attempt",  severity:"warn",     action:"Warning sent",   resolved:true  },
];

export function SecurityLogs() {
  const [sevFilter, setSevFilter] = useState("all");
  const [examFilter, setExamFilter] = useState("all");
  const [resolvedFilter, setResolvedFilter] = useState("all");
  const [expanded, setExpanded] = useState<number|null>(null);

  const filtered = SECURITY_LOGS.filter(l=>{
    const matchSev  = sevFilter==="all"||l.severity===sevFilter;
    const matchExam = examFilter==="all"||l.exam===examFilter;
    const matchRes  = resolvedFilter==="all"||(resolvedFilter==="resolved"?l.resolved:!l.resolved);
    return matchSev&&matchExam&&matchRes;
  });

  const sevColor: Record<string,string> = { warn:"text-amber-600 bg-amber-50", critical:"text-red-600 bg-red-50", info:"text-blue-600 bg-blue-50" };
  const uniqueExams = [...new Set(SECURITY_LOGS.map(l=>l.exam))];

  const summary = {
    total:SECURITY_LOGS.length,
    critical:SECURITY_LOGS.filter(l=>l.severity==="critical").length,
    unresolved:SECURITY_LOGS.filter(l=>!l.resolved).length,
    autoSubmit:SECURITY_LOGS.filter(l=>l.action==="Auto-submitted").length,
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
          {uniqueExams.map(e=><option key={e} value={e}>{e}</option>)}
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
                  <td className="px-5 py-3.5 text-xs font-mono text-gray-500 whitespace-nowrap">{log.ts}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ background:CAMEL, fontFamily:U }}>{log.student.split(" ").map(w=>w[0]).join("")}</div>
                      <span className="font-semibold text-gray-800 text-xs whitespace-nowrap" style={{ fontFamily:U }}>{log.student}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap" style={{ fontFamily:I }}>{log.exam}</td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-gray-700 whitespace-nowrap" style={{ fontFamily:U }}>{log.event}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${sevColor[log.severity]||"text-gray-500 bg-gray-100"}`} style={{ fontFamily:U }}>{log.severity}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap" style={{ fontFamily:I }}>{log.action}</td>
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
                            {log.event} detected for <strong>{log.student}</strong> during <em>{log.exam}</em> at {log.ts.split(" ")[1]}. System automatically took action: <strong>{log.action}</strong>.
                            {log.severity==="critical"?" This is a high-priority flag requiring manual review.":" This was a warning-level event."}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {!log.resolved&&<button className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600" style={{ fontFamily:U }}>Mark resolved</button>}
                          <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white" style={{ fontFamily:U }}>View session</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {filtered.length===0&&(
              <tr><td colSpan={7} className="px-5 py-20 text-center"><p className="text-sm text-gray-400" style={{ fontFamily:U }}>No logs match your filters</p></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
