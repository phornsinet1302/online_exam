"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/hooks";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { Download, X, RefreshCw } from "lucide-react";
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

const ANTICHEAT_SUMMARY = [
  { exam:"Calculus Final Exam",  date:"Jul 10", students:34, flags:3, critical:1, autoSubmit:1, resolved:3 },
  { exam:"Biology Mid-term",     date:"Jul 13", students:28, flags:4, critical:2, autoSubmit:0, resolved:1 },
  { exam:"Physics Quiz",         date:"Jul 8",  students:22, flags:1, critical:0, autoSubmit:0, resolved:1 },
  { exam:"History Essay",        date:"Jun 20", students:19, flags:0, critical:0, autoSubmit:0, resolved:0 },
];

const ANTICHEAT_EVENTS = [
  { type:"Tab switch",          count:4, pct:50 },
  { type:"Face not detected",   count:2, pct:25 },
  { type:"Copy-paste attempt",  count:1, pct:12.5 },
  { type:"Multiple faces",      count:1, pct:12.5 },
];

export function AntiCheatReport() {
  const navigate = useNavigate();
  const [showExport, setShowExport] = useState(false);

  return (
    <DashboardLayout active="reports-cheat" title="Anti-Cheating Report" subtitle="Flag summary across all proctored exams"
      actions={<>
        <button onClick={()=>navigate("/dashboard/monitoring/logs")} className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}>Full logs →</button>
        <button onClick={()=>setShowExport(true)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export</button>
      </>}>
      {showExport&&<ReportExportModal title="Anti-Cheating Report" onClose={()=>setShowExport(false)}/>}

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[{l:"Total flags",v:"8",bg:"#fff0f0",c:"#ef4444"},{l:"Critical",v:"3",bg:"#fdf4ff",c:"#7c3aed"},{l:"Auto-submitted",v:"1",bg:"#fff7ed",c:"#d97706"},{l:"Resolved",v:"5",bg:"#f0fdf4",c:"#16a34a"}].map(({l,v,bg,c})=>(
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-black" style={{ fontFamily:U, color:c }}>{v}</p>
            <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5 mb-5">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100"><p className="text-sm font-black" style={{ fontFamily:U, color:INK }}>By exam</p></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">{["Exam","Date","Students","Total flags","Critical","Auto-submit","Resolved"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
            <tbody>
              {ANTICHEAT_SUMMARY.map(r=>(
                <tr key={r.exam} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                  <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap" style={{ fontFamily:U }}>{r.exam}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap" style={{ fontFamily:I }}>{r.date}</td>
                  <td className="px-5 py-3.5 text-gray-600" style={{ fontFamily:I }}>{r.students}</td>
                  <td className="px-5 py-3.5"><span className={`font-black text-sm ${r.flags>0?"text-red-500":"text-gray-300"}`} style={{ fontFamily:U }}>{r.flags}</span></td>
                  <td className="px-5 py-3.5"><span className={`font-black text-sm ${r.critical>0?"text-purple-600":"text-gray-300"}`} style={{ fontFamily:U }}>{r.critical}</span></td>
                  <td className="px-5 py-3.5"><span className={`font-black text-sm ${r.autoSubmit>0?"text-amber-600":"text-gray-300"}`} style={{ fontFamily:U }}>{r.autoSubmit}</span></td>
                  <td className="px-5 py-3.5"><span className="text-green-600 font-semibold text-sm" style={{ fontFamily:U }}>{r.resolved}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Event types</p>
          <div className="space-y-3">
            {ANTICHEAT_EVENTS.map(e=>(
              <div key={e.type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700" style={{ fontFamily:U }}>{e.type}</span>
                  <span className="text-xs font-black" style={{ fontFamily:U, color:INK }}>{e.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width:`${e.pct}%`, background:CAMEL }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
