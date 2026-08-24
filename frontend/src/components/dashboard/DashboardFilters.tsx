"use client";

import { useState } from "react";
import { DashboardLayout, StatusBadge } from "@/components/dashboard/DashboardShared";
import { Download, Check, RotateCcw, Filter } from "lucide-react";
import { MOCK_EXAMS } from "@/lib/mock-data";
import { U, I, INK, CAMEL } from "@/lib/tokens";

export function DashboardFilters() {
  const [dateFrom, setDateFrom] = useState("2026-06-01");
  const [dateTo, setDateTo]     = useState("2026-07-13");
  const [subjects, setSubjects] = useState<string[]>(["Mathematics","Science"]);
  const [status, setStatus]     = useState("all");
  const [applied, setApplied]   = useState(false);
  const allSubjects = ["Mathematics","Science","English","History","Computer Science","Physics","Chemistry"];
  const toggleSub = (s:string)=>setSubjects(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]);
  const filtered = MOCK_EXAMS.filter(e=>(subjects.length===0||subjects.includes(e.subject))&&(status==="all"||e.status===status));
  return (
    <DashboardLayout active="filters" title="Reports" subtitle="Filter and export your exam data">
      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Filters</h3>
              <button onClick={()=>{setSubjects([]);setStatus("all");setApplied(false);}} className="text-xs font-semibold flex items-center gap-1" style={{ color:CAMEL, fontFamily:U }}><RotateCcw size={11}/>Reset</button>
            </div>
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Date Range</p>
              {[["From",dateFrom,setDateFrom],["To",dateTo,setDateTo]].map(([label,val,set])=>(
                <div key={label as string} className="mb-2">
                  <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily:I }}>{label as string}</label>
                  <input type="date" value={val as string} onChange={e=>(set as (v:string)=>void)(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
                </div>
              ))}
            </div>
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Subject</p>
              <div className="space-y-2">
                {allSubjects.map(s=>(
                  <label key={s} className="flex items-center gap-2.5 cursor-pointer">
                    <div onClick={()=>toggleSub(s)} className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${subjects.includes(s)?"border-transparent":"border-gray-300"}`} style={{ background:subjects.includes(s)?INK:undefined }}>
                      {subjects.includes(s)&&<Check size={10} className="text-white"/>}
                    </div>
                    <span className="text-sm text-gray-600" style={{ fontFamily:I }}>{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Status</p>
              <div className="flex flex-wrap gap-2">
                {["all","published","draft","archived"].map(s=>(
                  <button key={s} onClick={()=>setStatus(s)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize transition-all ${status===s?"text-white border-transparent":"border-gray-200 text-gray-500"}`} style={{ background:status===s?INK:undefined, fontFamily:U }}>{s}</button>
                ))}
              </div>
            </div>
            <button onClick={()=>setApplied(true)} className="w-full text-white font-bold py-3 rounded-xl text-sm hover:opacity-90" style={{ background:INK, fontFamily:U }}>Apply Filters</button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-black mb-4" style={{ fontFamily:U, color:INK }}>Export</h3>
            {["Export as CSV","Export as PDF","Export as Excel"].map(label=>(
              <button key={label} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all" style={{ fontFamily:I }}><Download size={14} style={{ color:CAMEL }}/>{label}</button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div><h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Results</h3><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{filtered.length} exam{filtered.length!==1?"s":""} {applied?"· filters applied":""}</p></div>
          </div>
          {filtered.length===0?(
            <div className="flex flex-col items-center py-24"><Filter size={32} className="text-gray-200 mb-3"/><p className="text-sm font-semibold text-gray-400" style={{ fontFamily:U }}>No results</p></div>
          ):(
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-50">{["Exam Name","Subject","Date","Students","Status"].map(h=><th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(ex=>(
                  <tr key={ex.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold" style={{ fontFamily:U, color:INK }}>{ex.title}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs" style={{ fontFamily:I }}>{ex.subject}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs" style={{ fontFamily:I }}>{ex.date}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs" style={{ fontFamily:I }}>{ex.students||"—"}</td>
                    <td className="px-6 py-4"><StatusBadge status={ex.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
