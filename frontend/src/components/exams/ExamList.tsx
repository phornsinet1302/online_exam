"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/hooks";
import { DashboardLayout, StatusBadge } from "@/components/dashboard/DashboardShared";
import { Plus, Archive, Search, FileText, Hash, Copy, MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { MOCK_EXAMS } from "@/lib/mock-data";
import { U, I, INK, CAMEL } from "@/lib/tokens";

export function ExamList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string|null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState<string|null>(null);
  const [copiedCode, setCopiedCode] = useState<string|null>(null);

  const exams = MOCK_EXAMS.filter(e=>{
    const matchStatus = statusFilter==="all"||e.status===statusFilter;
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase())||e.subject.toLowerCase().includes(search.toLowerCase());
    return matchStatus&&matchSearch;
  });

  const copyExamCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(()=>{});
    setCopiedCode(code);
    setTimeout(()=>setCopiedCode(null), 1600);
  };

  return (
    <DashboardLayout active="exams" title="My Exams" subtitle={`${MOCK_EXAMS.length} exams total`}
      actions={<button onClick={()=>navigate("/dashboard/exams/create")} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity" style={{ background:INK, fontFamily:U }}><Plus size={14}/>New exam</button>}>

      {/* Archive confirm modal */}
      {archiveConfirm&&(
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background:"rgba(13,27,42,0.5)", backdropFilter:"blur(6px)" }} onClick={()=>setArchiveConfirm(null)}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4"><Archive size={22} className="text-amber-600"/></div>
            <h3 className="text-lg font-black mb-2" style={{ fontFamily:U, color:INK }}>Archive this exam?</h3>
            <p className="text-sm text-gray-500 mb-6" style={{ fontFamily:I }}>The exam will be hidden from students. You can unarchive it at any time.</p>
            <div className="flex gap-3">
              <button onClick={()=>setArchiveConfirm(null)} className="flex-1 text-sm font-semibold py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}>Cancel</button>
              <button onClick={()=>setArchiveConfirm(null)} className="flex-1 text-sm font-bold py-3 rounded-xl text-white bg-amber-500 hover:bg-amber-600 transition-colors" style={{ fontFamily:U }}>Archive</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search exams…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gray-300" style={{ fontFamily:I }}/>
        </div>
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1">
          {["all","published","draft","archived"].map(s=>(
            <button key={s} onClick={()=>setStatusFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-all ${statusFilter===s?"text-white shadow-sm":"text-gray-500 hover:text-gray-700"}`}
              style={{ background:statusFilter===s?INK:undefined, fontFamily:U }}>{s}</button>
          ))}
        </div>
      </div>

      {exams.length===0?(
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-24 text-center">
          <FileText size={32} className="text-gray-200 mb-3"/>
          <p className="text-sm font-semibold text-gray-400" style={{ fontFamily:U }}>No exams found</p>
          <button onClick={()=>navigate("/dashboard/exams/create")} className="mt-4 flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Plus size={14}/>Create your first exam</button>
        </div>
      ):(
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {exams.map(exam=>(
            <div key={exam.id} className="relative bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all overflow-visible">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <StatusBadge status={exam.status}/>
                    <h3 className="text-sm font-black mt-2 mb-1 leading-snug" style={{ fontFamily:U, color:INK }}>{exam.title}</h3>
                    <p className="text-xs text-gray-400" style={{ fontFamily:I }}>{exam.subject} · {exam.date}</p>
                    <button onClick={()=>copyExamCode(exam.code)}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-bold text-gray-600 hover:border-gray-300 hover:bg-white hover:text-gray-900 transition-all"
                      style={{ fontFamily:U }}>
                      <Hash size={12} style={{ color:CAMEL }}/>
                      <span className="font-mono">{exam.code}</span>
                      <Copy size={12}/>
                      {copiedCode===exam.code&&<span className="text-green-600">Copied</span>}
                    </button>
                  </div>
                  <div className="relative flex-shrink-0 ml-2">
                    <button onClick={e=>{e.stopPropagation();setMenuOpen(menuOpen===exam.id?null:exam.id);}} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"><MoreVertical size={15}/></button>
                    {menuOpen===exam.id&&(
                      <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-44 py-1" onClick={e=>e.stopPropagation()}>
                        {[{icon:Eye,label:"Preview",action:()=>navigate(`/dashboard/exams/${exam.id}?tab=preview`)},{icon:Pencil,label:"Edit",action:()=>navigate(`/dashboard/exams/${exam.id}/edit`)},{icon:Hash,label:"Copy code",action:()=>copyExamCode(exam.code)},{icon:Copy,label:"Duplicate",action:()=>{}},{icon:Archive,label:"Archive",action:()=>{setArchiveConfirm(exam.id);setMenuOpen(null);}},{icon:Trash2,label:"Delete",action:()=>{}}].map(({icon:Icon,label,action})=>(
                          <button key={label} onClick={()=>{action();setMenuOpen(null);}} className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-left ${label==="Delete"?"text-red-500":"text-gray-700"}`} style={{ fontFamily:I }}>
                            <Icon size={13}/>{label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-50">
                  {[{l:"Questions",v:exam.questions||"0"},{l:"Duration",v:`${exam.duration}m`},{l:"Students",v:exam.students||"—"}].map(({l,v})=>(
                    <div key={l} className="text-center">
                      <p className="text-sm font-black" style={{ fontFamily:U, color:INK }}>{v}</p>
                      <p className="text-[10px] text-gray-400" style={{ fontFamily:I }}>{l}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-5 pb-4 flex gap-2">
                <button onClick={()=>navigate(`/dashboard/exams/${exam.id}`)} className="flex-1 text-xs font-semibold py-2 rounded-lg text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all" style={{ fontFamily:U }}>View</button>
                <button onClick={()=>navigate(`/dashboard/exams/${exam.id}/edit`)} className="flex-1 text-xs font-semibold py-2 rounded-lg text-white hover:opacity-90 transition-all" style={{ background:INK, fontFamily:U }}>Edit</button>
              </div>
            </div>
          ))}
          {/* Create card */}
          <button onClick={()=>navigate("/dashboard/exams/create")} className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-all flex flex-col items-center justify-center py-12 gap-3 group">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background:"#F0EDE8" }}><Plus size={22} style={{ color:INK }}/></div>
            <div className="text-center"><p className="text-sm font-bold text-gray-600" style={{ fontFamily:U }}>Create new exam</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>AI-assisted in minutes</p></div>
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
