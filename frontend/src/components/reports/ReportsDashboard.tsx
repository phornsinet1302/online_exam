"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/hooks";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { Download, X, RefreshCw, FileText, Users, TrendingUp, ShieldAlert, Award, UserCheck, ShieldCheck, FileBarChart, ChevronRight } from "lucide-react";
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

const REPORT_CARDS = [
  { id:"scores",    label:"Scores Report",           desc:"Per-student scores, grades, and rank across all exams.", icon:Award,        color:"#2563eb", bg:"#eff6ff", path:"/dashboard/reports/scores" },
  { id:"attend",    label:"Attendance Report",        desc:"Who joined, who was absent, and submission rates.",      icon:UserCheck,    color:"#16a34a", bg:"#f0fdf4", path:"/dashboard/reports/attendance" },
  { id:"anticheat", label:"Anti-Cheating Report",     desc:"Flag summary, severity breakdown, resolved events.",    icon:ShieldCheck,  color:"#ef4444", bg:"#fff0f0", path:"/dashboard/reports/anticheat" },
  { id:"qana",      label:"Question Analysis Report", desc:"Item difficulty, discrimination, and common errors.",   icon:FileBarChart, color:"#d97706", bg:"#fffbeb", path:"/dashboard/reports/questions" },
];

export function ReportsDashboard() {
  const navigate = useNavigate();
  const [showExport, setShowExport] = useState(false);

  return (
    <DashboardLayout active="reports" title="Reports" subtitle="Insights across all your exams"
      actions={<button onClick={()=>setShowExport(true)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export all</button>}>
      {showExport&&<ReportExportModal title="All Reports" onClose={()=>setShowExport(false)}/>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { l:"Total Exams",    v:"6",    icon:FileText,   bg:"#F0EDE8" },
          { l:"Students tested",v:"103",  icon:Users,      bg:"#eff6ff" },
          { l:"Avg pass rate",  v:"79%",  icon:TrendingUp, bg:"#f0fdf4" },
          { l:"Flags logged",   v:"8",    icon:ShieldAlert,bg:"#fff0f0" },
        ].map(({l,v,icon:Icon,bg})=>(
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:bg }}><Icon size={17} style={{ color:INK }}/></div>
            <div><p className="text-xl font-black leading-none" style={{ fontFamily:U, color:INK }}>{v}</p><p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p></div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {REPORT_CARDS.map(r=>{
          const Icon = r.icon;
          return (
            <div key={r.id} onClick={()=>navigate(r.path)}
              className="bg-white rounded-2xl border border-gray-100 p-6 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:r.bg }}>
                  <Icon size={20} style={{ color:r.color }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-800 mb-1" style={{ fontFamily:U }}>{r.label}</p>
                  <p className="text-xs text-gray-500 leading-relaxed" style={{ fontFamily:I }}>{r.desc}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5"/>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
