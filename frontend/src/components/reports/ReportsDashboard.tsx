"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/hooks";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { Download, FileText, Users, TrendingUp, ShieldAlert, Award, UserCheck, ShieldCheck, FileBarChart, ChevronRight } from "lucide-react";
import { U, I, INK } from "@/lib/tokens";
import { reportsApi, DashboardAnalytics, AntiCheatingSummary } from "@/lib/api/reports";

const REPORT_CARDS = [
  { id:"scores",    label:"Scores Report",           desc:"Per-student scores, grades, and rank across all exams.", icon:Award,        color:"#2563eb", bg:"#eff6ff", path:"/dashboard/reports/scores" },
  { id:"attend",    label:"Attendance Report",        desc:"Who joined, who was absent, and submission rates.",      icon:UserCheck,    color:"#16a34a", bg:"#f0fdf4", path:"/dashboard/reports/attendance" },
  { id:"anticheat", label:"Anti-Cheating Report",     desc:"Flag summary, severity breakdown, resolved events.",    icon:ShieldCheck,  color:"#ef4444", bg:"#fff0f0", path:"/dashboard/reports/anticheat" },
  { id:"qana",      label:"Question Analysis Report", desc:"Item difficulty, discrimination, and common errors.",   icon:FileBarChart, color:"#d97706", bg:"#fffbeb", path:"/dashboard/reports/questions" },
  { id:"exam",      label:"Exam Reports",             desc:"Filter exams by date, subject, and status, then export.", icon:FileText,   color:"#7c3aed", bg:"#f5f3ff", path:"/dashboard/filters" },
];

export function ReportsDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [antiCheat, setAntiCheat] = useState<AntiCheatingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([reportsApi.getAnalytics(), reportsApi.getAntiCheating()])
      .then(([a, ac]) => { setAnalytics(a); setAntiCheat(ac.summary); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { l:"Total Exams",    v: loading ? "…" : String(analytics?.primaryStats.totalExams ?? 0),        icon:FileText,   bg:"#F0EDE8" },
    { l:"Students tested",v: loading ? "…" : String(analytics?.primaryStats.activeStudents ?? 0),    icon:Users,      bg:"#eff6ff" },
    { l:"Avg pass rate",  v: loading ? "…" : `${analytics?.primaryStats.passRate ?? 0}%`,             icon:TrendingUp, bg:"#f0fdf4" },
    { l:"Flags logged",   v: loading ? "…" : String(antiCheat?.totalFlags ?? 0),                      icon:ShieldAlert,bg:"#fff0f0" },
  ];

  return (
    <DashboardLayout active="reports" title="Reports" subtitle="Insights across all your exams"
      actions={<button onClick={()=>navigate("/dashboard/filters")} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export all</button>}>


      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map(({l,v,icon:Icon,bg})=>(
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
