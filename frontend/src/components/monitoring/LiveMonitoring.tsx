"use client";

import { Fragment, useState } from "react";
import { useNavigate } from "@/lib/hooks";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { AlertTriangle, Download } from "lucide-react";
import { MOCK_EXAMS } from "@/lib/mock-data";
import { U, I, INK, CAMEL } from "@/lib/tokens";

const BLUE = "#2563EB";

const LIVE_STUDENTS = [
  { init:"AM", name:"Alice Mills",  q:12, pct:48, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"SJ", name:"Sara Jones",  q:8,  pct:32, status:"flag",  flags:2, elapsed:"23:14" },
  { init:"LK", name:"Lucy Kim",    q:14, pct:56, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"TR", name:"Tom Reed",    q:11, pct:44, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"MP", name:"Mike Park",   q:7,  pct:28, status:"flag",  flags:1, elapsed:"23:14" },
  { init:"OB", name:"Owen Bell",   q:13, pct:52, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"HL", name:"Helen Lee",   q:9,  pct:36, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"JW", name:"James Wang",  q:16, pct:64, status:"done",  flags:0, elapsed:"19:42" },
  { init:"RK", name:"Ryan Kim",    q:12, pct:48, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"EM", name:"Emma Mills",  q:10, pct:40, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"BH", name:"Ben Harris",  q:14, pct:56, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"AN", name:"Amy Nguyen",  q:11, pct:44, status:"flag",  flags:1, elapsed:"23:14" },
];

const LIVE_ALERTS = [
  { time:"09:44:27", student:"Sara Jones",  event:"Tab switch (2.4s)",      severity:"warn",     id:1 },
  { time:"09:41:03", student:"Mike Park",   event:"Face not detected (4s)", severity:"warn",     id:2 },
  { time:"09:38:15", student:"Amy Nguyen",  event:"Copy-paste attempt",     severity:"critical", id:3 },
  { time:"09:35:50", student:"Sara Jones",  event:"Multiple faces detected", severity:"critical", id:4 },
  { time:"09:32:11", student:"All",         event:"Exam started · 12 joined",severity:"info",     id:5 },
];

export function LiveMonitoring() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string|null>(null);
  const [examId, setExamId] = useState("2");

  const flagged  = LIVE_STUDENTS.filter(s=>s.status==="flag");
  const done     = LIVE_STUDENTS.filter(s=>s.status==="done");
  const active   = LIVE_STUDENTS.filter(s=>s.status==="ok");
  const avgProgress = Math.round(LIVE_STUDENTS.reduce((sum,s)=>sum+s.pct,0)/LIVE_STUDENTS.length);
  const sortedStudents = [...LIVE_STUDENTS].sort((a,b)=>b.flags-a.flags || a.pct-b.pct);

  const sevColor: Record<string,string> = { warn:"#d97706", critical:"#ef4444", info:"#3b82f6" };
  const sevBg:    Record<string,string> = { warn:"#fff7ed", critical:"#fff0f0", info:"#eff6ff" };
  const statusText: Record<string,string> = { ok:"In progress", flag:"Needs attention", done:"Submitted" };

  return (
    <DashboardLayout active="monitoring" title="Live Monitor" subtitle="Real-time exam session"
      actions={<>
        <div className="flex items-center gap-2">
          <select value={examId} onChange={e=>setExamId(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-white focus:outline-none" style={{ fontFamily:I }}>
            {MOCK_EXAMS.filter(e=>e.status==="published").map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
          <span className="text-xs font-bold text-green-700" style={{ fontFamily:U }}>Live · 36:46 left</span>
        </div>
      </>}>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily:U }}>Session Health</p>
                <h2 className="mt-1 text-lg font-black" style={{ fontFamily:U, color:INK }}>Biology Mid-term</h2>
                <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{LIVE_STUDENTS.length} students joined · {avgProgress}% average progress</p>
              </div>
              <div className="grid grid-cols-4 gap-2 lg:w-[420px]">
                {[{l:"Active",v:active.length,c:"#16a34a"},{l:"Flagged",v:flagged.length,c:"#ef4444"},{l:"Done",v:done.length,c:BLUE},{l:"Avg",v:`${avgProgress}%`,c:INK}].map(({l,v,c})=>(
                  <div key={l} className="rounded-xl bg-gray-50 px-3 py-3 text-center">
                    <p className="text-xl font-black leading-none" style={{ fontFamily:U, color:c }}>{v}</p>
                    <p className="text-[10px] text-gray-400 mt-1" style={{ fontFamily:I }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Needs Attention</h3>
                <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{flagged.length} students currently flagged</p>
              </div>
              <button onClick={()=>navigate("/dashboard/monitoring/logs")} className="text-xs font-bold hover:underline" style={{ fontFamily:U, color:CAMEL }}>Open logs</button>
            </div>
            <div className="grid gap-0 md:grid-cols-3">
              {flagged.map(s=>(
                <div key={s.init} className="border-b border-gray-50 px-5 py-4 md:border-b-0 md:border-r last:border-r-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center text-white text-xs font-black" style={{ fontFamily:U }}>{s.init}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily:U }}>{s.name}</p>
                      <p className="text-xs text-red-500" style={{ fontFamily:I }}>{s.flags} flag{s.flags!==1?"s":""} · Q{s.q}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 rounded-lg bg-amber-50 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100" style={{ fontFamily:U }}>Warn</button>
                    <button className="flex-1 rounded-lg bg-red-50 py-2 text-xs font-bold text-red-600 hover:bg-red-100" style={{ fontFamily:U }}>Review</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Student Activity</h3>
              <div className="flex items-center gap-2 text-[11px] text-gray-400" style={{ fontFamily:I }}>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"/>Flagged</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background:CAMEL }}/>Working</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background:BLUE }}/>Submitted</span>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {sortedStudents.map(s=>(
                <div key={s.init} role="button" tabIndex={0}
                  onClick={()=>setExpanded(expanded===s.name?null:s.name)}
                  onKeyDown={e=>{ if (e.key==="Enter"||e.key===" ") { e.preventDefault(); setExpanded(expanded===s.name?null:s.name); }}}
                  className={`w-full px-5 py-3.5 text-left transition-colors hover:bg-gray-50 ${expanded===s.name?"bg-gray-50":""}`}>
                  <div className="grid grid-cols-[minmax(180px,1fr)_90px_120px_90px_90px] items-center gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{ background:s.status==="flag"?"#ef4444":s.status==="done"?BLUE:INK, fontFamily:U }}>{s.init}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily:U }}>{s.name}</p>
                        <p className={`text-xs ${s.status==="flag"?"text-red-500":s.status==="done"?"text-blue-500":"text-gray-400"}`} style={{ fontFamily:I }}>{statusText[s.status]}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-500" style={{ fontFamily:U }}>Q{s.q}</p>
                    <div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full" style={{ width:`${s.pct}%`, background:s.status==="flag"?"#ef4444":s.status==="done"?BLUE:CAMEL }}/>
                      </div>
                      <p className="mt-1 text-[10px] text-gray-400" style={{ fontFamily:I }}>{s.pct}% progress</p>
                    </div>
                    <p className="text-xs text-gray-400" style={{ fontFamily:I }}>{s.elapsed}</p>
                    <div className="flex justify-end">
                      {s.flags>0?<span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-600" style={{ fontFamily:U }}>{s.flags} flags</span>:<span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-600" style={{ fontFamily:U }}>Clear</span>}
                    </div>
                  </div>
                  {expanded===s.name&&(
                    <div onClick={e=>e.stopPropagation()} className="mt-3 ml-12 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                      <button className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100" style={{ fontFamily:U }}>Send warning</button>
                      <button className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200" style={{ fontFamily:U }}>Open timeline</button>
                      <button className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100" style={{ fontFamily:U }}>Remove student</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alert feed */}
        <div className="sticky top-36 bg-white rounded-2xl border border-gray-100 overflow-hidden flex max-h-[calc(100vh-10rem)] flex-col">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/><p className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Alert Feed</p></div>
            <span className="text-xs text-gray-400" style={{ fontFamily:I }}>{LIVE_ALERTS.length} events</span>
          </div>
          <div className="overflow-y-auto flex-1">
            {LIVE_ALERTS.map(a=>(
              <div key={a.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background:sevBg[a.severity] }}>
                    <AlertTriangle size={13} style={{ color:sevColor[a.severity] }}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 leading-snug" style={{ fontFamily:U }}>{a.event}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5" style={{ fontFamily:I }}>{a.student}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{a.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 space-y-2">
            <button className="w-full text-xs font-bold py-2.5 rounded-xl text-white hover:opacity-90" style={{ background:"#ef4444", fontFamily:U }}>End exam for all</button>
            <button onClick={()=>navigate("/dashboard/monitoring/logs")} className="w-full text-xs font-semibold py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}>View full logs →</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
