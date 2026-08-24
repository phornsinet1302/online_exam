"use client";

import { useState } from "react";
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

const ATTEND_DATA = [
  { exam:"Calculus Final Exam",      date:"Jul 10",  enrolled:36, joined:34, absent:2,  submitted:32, lateStart:3  },
  { exam:"Biology Mid-term",         date:"Jul 13",  enrolled:30, joined:28, absent:2,  submitted:28, lateStart:1  },
  { exam:"English Comprehension",    date:"Jul 15",  enrolled:30, joined:0,  absent:30, submitted:0,  lateStart:0  },
  { exam:"Physics Quiz",             date:"Jul 8",   enrolled:24, joined:22, absent:2,  submitted:22, lateStart:2  },
  { exam:"History Essay Assessment", date:"Jun 20",  enrolled:22, joined:19, absent:3,  submitted:19, lateStart:0  },
];

export function AttendanceReport() {
  const [showExport, setShowExport] = useState(false);
  return (
    <DashboardLayout active="reports-attend" title="Attendance Report" subtitle="Participation and submission rates by exam"
      actions={<button onClick={()=>setShowExport(true)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export</button>}>
      {showExport&&<ReportExportModal title="Attendance Report" onClose={()=>setShowExport(false)}/>}

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[{l:"Total enrolled",v:"142",bg:"#F0EDE8"},{l:"Avg attendance",v:"82%",bg:"#f0fdf4"},{l:"Total absent",v:"39",bg:"#fff0f0"},{l:"Submission rate",v:"89%",bg:"#eff6ff"}].map(({l,v,bg})=>(
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xl font-black" style={{ fontFamily:U, color:INK }}>{v}</p>
            <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">{["Exam","Date","Enrolled","Joined","Absent","Submitted","Late Start","Attendance"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
          <tbody>
            {ATTEND_DATA.map(r=>{
              const pct = r.enrolled>0?Math.round(r.joined/r.enrolled*100):0;
              return (
                <tr key={r.exam} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap max-w-[200px] truncate" style={{ fontFamily:U }}>{r.exam}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap" style={{ fontFamily:I }}>{r.date}</td>
                  <td className="px-5 py-3.5 text-gray-700" style={{ fontFamily:I }}>{r.enrolled}</td>
                  <td className="px-5 py-3.5 text-green-600 font-semibold" style={{ fontFamily:U }}>{r.joined}</td>
                  <td className="px-5 py-3.5 text-red-500 font-semibold" style={{ fontFamily:U }}>{r.absent}</td>
                  <td className="px-5 py-3.5 text-gray-700" style={{ fontFamily:I }}>{r.submitted}</td>
                  <td className="px-5 py-3.5 text-gray-700" style={{ fontFamily:I }}>{r.lateStart}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width:`${pct}%`, background:pct>=80?"#22c55e":pct>=60?"#f59e0b":"#ef4444" }}/></div>
                      <span className="text-xs font-black" style={{ fontFamily:U, color:pct>=80?"#16a34a":pct>=60?"#d97706":"#ef4444" }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
