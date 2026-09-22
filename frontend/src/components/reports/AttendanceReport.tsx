"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { Download, X, RefreshCw, AlertTriangle, Users } from "lucide-react";
import { U, I, INK, CAMEL } from "@/lib/tokens";
import { reportsApi, AttendanceSummary, AttendanceExamRow, ReportExportFormat } from "@/lib/api/reports";

function ReportExportModal({ title, onClose, onExport }: { title:string; onClose:()=>void; onExport:(format: ReportExportFormat)=>Promise<void> }) {
  const [fmt, setFmt] = useState<ReportExportFormat>("pdf");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const go = async () => {
    setExporting(true);
    setError("");
    try {
      await onExport(fmt);
      onClose();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };
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
            {([{id:"pdf",label:"PDF"},{id:"excel",label:"Excel"},{id:"csv",label:"CSV"}] as const).map(f=>(
              <button key={f.id} onClick={()=>setFmt(f.id)} className="py-2.5 rounded-xl border text-xs font-bold transition-all" style={{ background:fmt===f.id?INK:undefined, color:fmt===f.id?"white":"#6b7280", borderColor:fmt===f.id?"transparent":"#e5e7eb", fontFamily:U }}>{f.label}</button>
            ))}
          </div>
          {error && <p className="text-xs text-red-500 mb-3" style={{ fontFamily:I }}>{error}</p>}
          <button onClick={go} disabled={exporting} className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-50" style={{ background:INK, fontFamily:U }}>
            {exporting?<><RefreshCw size={14} className="animate-spin"/>Exporting…</>:<><Download size={14}/>Download .{fmt==="excel"?"xlsx":fmt}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AttendanceReport() {
  const [showExport, setShowExport] = useState(false);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [exams, setExams] = useState<AttendanceExamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    reportsApi.getAttendance()
      .then(({ summary, exams }) => { setSummary(summary); setExams(exams); })
      .catch((e) => setError(e instanceof Error && e.message ? e.message : "Failed to load attendance data. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const hasRoster = summary?.totalEnrolled != null;
  const notSubmitted = summary ? summary.totalJoined - summary.totalSubmitted : 0;
  const statCards = hasRoster
    ? [
        { l:"Total enrolled",   v: loading ? "…" : String(summary?.totalEnrolled ?? 0), bg:"#F0EDE8" },
        { l:"Avg attendance",   v: loading ? "…" : `${summary?.avgAttendance ?? 0}%`,    bg:"#f0fdf4" },
        { l:"Total absent",     v: loading ? "…" : String(summary?.totalAbsent ?? 0),    bg:"#fff0f0" },
        { l:"Submission rate",  v: loading ? "…" : `${summary?.submissionRate ?? 0}%`,   bg:"#eff6ff" },
      ]
    : [
        { l:"Total joined",     v: loading ? "…" : String(summary?.totalJoined ?? 0),   bg:"#F0EDE8" },
        { l:"Avg attendance",   v: loading ? "…" : `${summary?.avgAttendance ?? 0}%`,    bg:"#f0fdf4" },
        { l:"Not submitted",    v: loading ? "…" : String(notSubmitted),                 bg:"#fff0f0" },
        { l:"Submission rate",  v: loading ? "…" : `${summary?.submissionRate ?? 0}%`,   bg:"#eff6ff" },
      ];

  return (
    <DashboardLayout active="reports-attend" title="Attendance Report" subtitle="Participation and submission rates by exam"
      actions={<button onClick={()=>setShowExport(true)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export</button>}>
      {showExport&&<ReportExportModal title="Attendance Report" onClose={()=>setShowExport(false)} onExport={(format)=>reportsApi.export("ATTENDANCE", format)}/>}

      <div className="grid grid-cols-4 gap-3 mb-3">
        {statCards.map(({l,v,bg})=>(
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xl font-black" style={{ fontFamily:U, color:INK }}>{v}</p>
            <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-5" style={{ fontFamily:I, minHeight: 16 }}>
        {!loading && !hasRoster && <>Upload an expected-student roster from an exam&apos;s <strong>Roster</strong> tab to see real enrolled / absent counts here.</>}
      </p>

      {error ? (
        <div className="bg-white rounded-2xl border border-red-100 py-16 flex flex-col items-center gap-3">
          <AlertTriangle size={32} className="text-red-300"/>
          <p className="text-sm text-red-500 text-center max-w-xs" style={{ fontFamily:U }}>{error}</p>
          <button onClick={load} className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background:INK, fontFamily:U }}>Try again</button>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3">
          <RefreshCw size={24} className="text-gray-300 animate-spin"/>
          <p className="text-sm text-gray-400" style={{ fontFamily:U }}>Loading attendance…</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3">
          <Users size={32} className="text-gray-200"/>
          <p className="text-sm text-gray-400" style={{ fontFamily:U }}>No exam activity yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">{["Exam","Date","Enrolled","Joined","Absent","Submitted","Late Start","Attendance"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
            <tbody>
              {exams.map(r=>{
                const pct = r.attendanceRate;
                return (
                  <tr key={r.examId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap max-w-[200px] truncate" style={{ fontFamily:U }}>{r.examTitle}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap" style={{ fontFamily:I }}>{formatDate(r.date)}</td>
                    <td className="px-5 py-3.5 text-gray-700" style={{ fontFamily:I }}>{r.enrolled ?? "—"}</td>
                    <td className="px-5 py-3.5 text-green-600 font-semibold" style={{ fontFamily:U }}>{r.joined}</td>
                    <td className="px-5 py-3.5 text-red-500 font-semibold" style={{ fontFamily:U }}>{r.absent ?? "—"}</td>
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
      )}
    </DashboardLayout>
  );
}
