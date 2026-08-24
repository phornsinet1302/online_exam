"use client";

import { useState } from "react";
import { useParams, useNavigate } from "@/lib/hooks";
import { DashboardLayout, StatusBadge, CopyField, QRPattern, Toggle } from "@/components/dashboard/DashboardShared";
import { Pencil, ChevronRight, Download, Clock } from "lucide-react";
import { MOCK_EXAMS } from "@/lib/mock-data";
import { U, I, INK, CAMEL } from "@/lib/tokens";

export function ExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const exam = MOCK_EXAMS.find(e=>e.id===id)||MOCK_EXAMS[0];
  const [tab, setTab] = useState("overview");
  const [privacy, setPrivacy] = useState("public");
  const [proctoring, setProctoring] = useState(true);
  const [shuffleQ, setShuffleQ] = useState(true);

  const magicLink = `https://exam.ai/join/${exam.code.toLowerCase()}`;

  const tabs = ["overview","sharing","settings","preview"];

  return (
    <DashboardLayout active="exams" title={exam.title} subtitle={`${exam.subject} · ${exam.date}`}
      actions={<>
        <StatusBadge status={exam.status}/>
        <button onClick={()=>navigate(`/dashboard/exams/${exam.id}/edit`)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Pencil size={13}/>Edit</button>
      </>}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-5" style={{ fontFamily:I }}>
        <button onClick={()=>navigate("/dashboard/exams")} className="hover:text-gray-700">My Exams</button>
        <ChevronRight size={13}/><span className="text-gray-600 truncate max-w-xs">{exam.title}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 w-fit mb-5">
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`text-xs font-semibold px-4 py-2 rounded-lg capitalize transition-all ${tab===t?"text-white shadow-sm":"text-gray-500 hover:text-gray-700"}`}
            style={{ background:tab===t?INK:undefined, fontFamily:U }}>{t}</button>
        ))}
      </div>

      {/* Overview tab */}
      {tab==="overview"&&(
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[{l:"Questions",v:String(exam.questions)},{l:"Duration",v:`${exam.duration} min`},{l:"Students",v:String(exam.students||0)},{l:"Avg Score",v:exam.students?"74%":"—"},{l:"Pass Rate",v:exam.students?"78%":"—"},{l:"Attempts",v:"1 max"}].map(({l,v})=>(
                <div key={l} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-xl font-black" style={{ fontFamily:U, color:INK }}>{v}</p>
                  <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p>
                </div>
              ))}
            </div>
            {exam.students>0&&(
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Student Results</h3></div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-50">{["Student","Submitted","Score","Grade"].map(h=><th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[{n:"Alice Mills",t:"10:42 AM",s:88,g:"A"},{n:"Sara Jones",t:"10:58 AM",s:71,g:"B"},{n:"Tom Reed",t:"11:02 AM",s:45,g:"F"},{n:"Mike Park",t:"11:08 AM",s:83,g:"A"}].map(({n,t,s,g})=>(
                      <tr key={n} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-800" style={{ fontFamily:U }}>{n}</td>
                        <td className="px-6 py-3 text-xs text-gray-500" style={{ fontFamily:I }}>{t}</td>
                        <td className="px-6 py-3 text-sm font-bold" style={{ fontFamily:U, color:s>=50?"#16a34a":"#ef4444" }}>{s}%</td>
                        <td className="px-6 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${g==="F"?"bg-red-50 text-red-600":"bg-green-50 text-green-700"}`} style={{ fontFamily:U }}>{g}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-black mb-4" style={{ fontFamily:U, color:INK }}>Exam Code</h3>
            <div className="bg-gray-50 rounded-xl p-4 text-center mb-4 border border-gray-200">
              <p className="text-2xl font-black tracking-widest" style={{ fontFamily:U, color:INK }}>{exam.code}</p>
            </div>
            <p className="text-xs text-gray-400 text-center mb-4" style={{ fontFamily:I }}>Share this code with students to let them join</p>
            <button onClick={()=>setTab("sharing")} className="w-full text-xs font-semibold py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all" style={{ fontFamily:U }}>View all sharing options</button>
          </div>
        </div>
      )}

      {/* Sharing tab */}
      {tab==="sharing"&&(
        <div className="max-w-lg space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <CopyField label="Magic Link" value={magicLink}/>
            <CopyField label="Exam Code" value={exam.code}/>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3" style={{ fontFamily:U }}>QR Code</p>
              <div className="flex items-start gap-5">
                <QRPattern/>
                <div>
                  <p className="text-sm text-gray-600 mb-3" style={{ fontFamily:I }}>Students can scan this code to join the exam instantly from their phone.</p>
                  <button className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}><Download size={13}/>Download PNG</button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-black mb-4" style={{ fontFamily:U, color:INK }}>Share via</h3>
            <div className="flex flex-wrap gap-2">
              {["Email","Google Classroom","Microsoft Teams","Slack","Copy all details"].map(s=>(
                <button key={s} className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all" style={{ fontFamily:U }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings tab */}
      {tab==="settings"&&(
        <div className="max-w-lg">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-1">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Exam Settings</h3>
            {[{l:"Enable live proctoring",d:"Face detection and tab monitoring",on:proctoring,set:setProctoring},{l:"Randomize questions",d:"Different order for each student",on:shuffleQ,set:setShuffleQ}].map(({l,d,on,set})=>(
              <div key={l} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                <div><p className="text-sm font-semibold text-gray-700" style={{ fontFamily:U }}>{l}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{d}</p></div>
                <Toggle on={on} onChange={()=>set((s: boolean)=>!s)}/>
              </div>
            ))}
            <div className="pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily:U }}>Privacy</p>
              <div className="flex gap-2">
                {["public","private","password"].map(p=>(
                  <button key={p} onClick={()=>setPrivacy(p)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border capitalize transition-all ${privacy===p?"text-white border-transparent":"border-gray-200 text-gray-500"}`} style={{ background:privacy===p?INK:undefined, fontFamily:U }}>{p}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="text-sm font-bold text-white px-6 py-2.5 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}>Save settings</button>
          </div>
        </div>
      )}

      {/* Preview tab */}
      {tab==="preview"&&(
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Student exam bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ background:"#f9fafb" }}>
              <div><p className="text-xs text-gray-400 mb-0.5" style={{ fontFamily:I }}>Student view · Read-only preview</p><h3 className="text-sm font-bold" style={{ fontFamily:U, color:INK }}>{exam.title}</h3></div>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ fontFamily:U, color:INK }}><Clock size={14} style={{ color:CAMEL }}/>{exam.duration}:00</div>
            </div>
            <div className="p-6 space-y-6">
              {[
                { n:1, type:"MCQ", q:"What is the derivative of f(x) = sin(x)?", opts:["cos(x)","−cos(x)","sin(x)","−sin(x)"] },
                { n:2, type:"Short answer", q:"Explain the chain rule in your own words." },
                { n:3, type:"True / False", q:"The second derivative test can determine whether a critical point is a local maximum or minimum.", opts:["True","False"] },
              ].map(({ n, type, q, opts })=>(
                <div key={n} className="border border-gray-100 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background:`${CAMEL}18`, color:CAMEL, fontFamily:U }}>Q{n}</span>
                    <span className="text-xs text-gray-400" style={{ fontFamily:I }}>{type}</span>
                  </div>
                  <p className="text-sm text-gray-800 mb-4 font-medium" style={{ fontFamily:I }}>{q}</p>
                  {opts?(
                    <div className="space-y-2">
                      {opts.map(o=><div key={o} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm text-gray-700" style={{ fontFamily:I }}><div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0"/>{o}</div>)}
                    </div>
                  ):(
                    <textarea rows={3} placeholder="Type your answer here…" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 focus:outline-none resize-none" style={{ fontFamily:I }}/>
                  )}
                </div>
              ))}
              <div className="flex justify-end gap-3">
                <button className="text-sm text-gray-400 px-4 py-2.5" style={{ fontFamily:I }}>Previous</button>
                <button className="text-sm font-bold text-white px-6 py-2.5 rounded-xl" style={{ background:INK, fontFamily:U }}>Next →</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
