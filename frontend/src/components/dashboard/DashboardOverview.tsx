"use client";

import { useNavigate } from "@/lib/hooks";
import { DashboardLayout, StatusBadge } from "@/components/dashboard/DashboardShared";
import { FileText, Users, CheckCircle2, Award, Plus, Sparkles, Download } from "lucide-react";
import { MOCK_EXAMS } from "@/lib/mock-data";
import { U, I, INK, CAMEL } from "@/lib/tokens";

export function DashboardOverview() {
  const navigate = useNavigate();
  const primaryStats = [
    { label:"Total Exams", value:"48", meta:"+3 this week", icon:FileText, bg:"#F0EDE8" },
    { label:"Active Students", value:"1,240", meta:"+87 active", icon:Users, bg:"#e6f4ff" },
    { label:"Pass Rate", value:"78.4%", meta:"+2.1% trend", icon:CheckCircle2, bg:"#f0fdf4" },
    { label:"Avg Score", value:"74.2", meta:"out of 100", icon:Award, bg:"#fff7ed" },
  ];
  const examStatus = [
    { label:"Ongoing", value:"3", color:"#2563eb" },
    { label:"Upcoming", value:"7", color:CAMEL },
    { label:"Completed", value:"38", color:"#16a34a" },
    { label:"Review", value:"31", color:"#ef4444" },
  ];

  return (
    <DashboardLayout active="overview" title="Overview" subtitle="Monday, 13 July 2026"
      actions={<button onClick={()=>navigate("/dashboard/exams/create")} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity" style={{ background:INK, fontFamily:U }}><Plus size={14}/>New exam</button>}>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xl:flex-1">
            {primaryStats.map(({ label, value, meta, icon:Icon, bg })=>(
              <div key={label} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:bg }}><Icon size={17} style={{ color:INK }}/></div>
                <div className="min-w-0">
                  <p className="text-xl font-black leading-none" style={{ fontFamily:U, color:INK }}>{value}</p>
                  <p className="text-xs font-bold text-gray-500 truncate mt-1" style={{ fontFamily:U }}>{label}</p>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5" style={{ fontFamily:I }}>{meta}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 xl:w-[360px]">
            {examStatus.map(({ label, value, color })=>(
              <div key={label} className="rounded-xl border border-gray-100 px-3 py-3 text-center">
                <p className="text-lg font-black leading-none" style={{ fontFamily:U, color }}>{value}</p>
                <p className="text-[10px] text-gray-400 mt-1" style={{ fontFamily:I }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Recent Exams</h2>
            <button onClick={()=>navigate("/dashboard/exams")} className="text-xs font-semibold hover:underline" style={{ color:CAMEL, fontFamily:U }}>View all</button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-50">{["Exam","Subject","Date","Students","Avg","Status"].map(h=><th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
            <tbody>
              {MOCK_EXAMS.filter(e=>e.status!=="archived").slice(0,5).map(ex=>(
                <tr key={ex.id} onClick={()=>navigate(`/dashboard/exams/${ex.id}`)} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer">
                  <td className="px-6 py-3.5 font-semibold" style={{ fontFamily:U, color:INK }}>{ex.title}</td>
                  <td className="px-6 py-3.5 text-gray-500 text-xs" style={{ fontFamily:I }}>{ex.subject}</td>
                  <td className="px-6 py-3.5 text-gray-500 text-xs" style={{ fontFamily:I }}>{ex.date}</td>
                  <td className="px-6 py-3.5 text-gray-600 text-xs" style={{ fontFamily:I }}>{ex.students||"—"}</td>
                  <td className="px-6 py-3.5 text-xs font-bold" style={{ fontFamily:U, color:ex.students?ex.students>25?"#16a34a":"#d97706":"#9ca3af" }}>{ex.students?"74%":"—"}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={ex.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-black mb-4" style={{ fontFamily:U, color:INK }}>Performance</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3.5"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3.5" strokeDasharray="78.4 21.6" strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-base font-black" style={{ fontFamily:U, color:INK }}>78%</span></div>
              </div>
              <div className="space-y-2">
                {[{l:"Passed",v:"78.4%",c:"#22c55e"},{l:"Failed",v:"21.6%",c:"#ef4444"}].map(r=>(
                  <div key={r.l} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background:r.c }}/><span className="text-xs text-gray-500" style={{ fontFamily:I }}>{r.l}</span><span className="text-xs font-bold ml-auto" style={{ fontFamily:U, color:INK }}>{r.v}</span></div>
                ))}
              </div>
            </div>
            <div className="mt-5 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2" style={{ fontFamily:U }}>Quick Actions</h3>
              {[{label:"Create new exam",icon:Plus,path:"/dashboard/exams/create"},{label:"Use AI in exam builder",icon:Sparkles,path:"/dashboard/exams/create"},{label:"Export reports",icon:Download,path:"/dashboard/filters"}].map(({label,icon:Icon,path})=>(
              <button key={label} onClick={()=>navigate(path)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all text-left" style={{ fontFamily:I }}>
                <Icon size={14} style={{ color:CAMEL }}/>{label}
              </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
