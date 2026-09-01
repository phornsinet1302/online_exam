"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@/lib/hooks";
import { DashboardLayout, StatusBadge, CopyField, Toggle } from "@/components/dashboard/DashboardShared";
import { Pencil, ChevronRight, Download, Clock } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { examsApi } from "@/lib/api/exams";
import { U, I, INK, CAMEL } from "@/lib/tokens";

export function ExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      examsApi.getById(id as string).then(setExam).catch(() => setExam(null)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const initialTab = urlParams.get("tab");
      if (initialTab && ["overview", "sharing", "settings", "preview"].includes(initialTab)) {
        setTab(initialTab);
      }
    }
  }, []);
  const [privacy, setPrivacy] = useState("public");
  const [proctoring, setProctoring] = useState(true);
  const [shuffleQ, setShuffleQ] = useState(true);

  const magicLink = exam && typeof window !== "undefined" 
    ? `${window.location.origin}/join/${(exam.uniqueCode || "").toLowerCase()}` 
    : exam ? `http://localhost:3000/join/${(exam.uniqueCode || "").toLowerCase()}` : "";

  const allQuestions = exam?.sections?.flatMap((s: any) => s.questions) || [];
  const scoredAttempts = (exam?.attempts || []).filter((a: any) => a.score !== null);
  const avgScore = scoredAttempts.length > 0 
    ? Math.round(scoredAttempts.reduce((acc: number, a: any) => acc + a.score, 0) / scoredAttempts.length)
    : null;
  const passRate = scoredAttempts.length > 0 
    ? Math.round((scoredAttempts.filter((a: any) => a.score >= (exam.passingScore || 50)).length / scoredAttempts.length) * 100)
    : null;

  const downloadQRCode = () => {
    const canvas = document.getElementById("qrCodeCanvas") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `exam-qr-${exam.uniqueCode || "code"}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const tabs = ["overview","sharing","settings","preview"];

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!exam) return <div className="p-10 text-center">Exam not found</div>;

  return (
    <DashboardLayout active="exams" title={exam.title} subtitle={`${exam.subject || "No Subject"} · ${new Date(exam.createdAt).toLocaleDateString()}`}
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
              {[
                {l:"Questions",v:String(exam.questionsCount || 0)},
                {l:"Duration",v:`${exam.duration || 0} min`},
                {l:"Students",v:String(exam.studentsCount || 0)},
                {l:"Avg Score",v:avgScore !== null ? `${avgScore}%` : "—"},
                {l:"Pass Rate",v:passRate !== null ? `${passRate}%` : "—"},
                {l:"Attempts",v:exam.maxAttempts ? `${exam.maxAttempts} max` : "Unlimited"}
              ].map(({l,v})=>(
                <div key={l} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-xl font-black" style={{ fontFamily:U, color:INK }}>{v}</p>
                  <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p>
                </div>
              ))}
            </div>
            {(exam.studentsCount || 0) > 0 && exam.attempts && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Student Results</h3></div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-50">{["Student","Submitted","Score","Status"].map(h=><th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {exam.attempts.slice(0, 5).map((attempt: any) => {
                      const isPass = attempt.score !== null ? attempt.score >= (exam.passingScore || 50) : false;
                      const hasScore = attempt.score !== null;
                      return (
                        <tr key={attempt.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                          <td className="px-6 py-3 text-sm font-medium text-gray-800" style={{ fontFamily:U }}>{attempt.studentId || "Anonymous"}</td>
                          <td className="px-6 py-3 text-xs text-gray-500" style={{ fontFamily:I }}>{new Date(attempt.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                          <td className="px-6 py-3 text-sm font-bold" style={{ fontFamily:U, color: hasScore ? (isPass ? "#16a34a" : "#ef4444") : "#9ca3af" }}>{hasScore ? `${attempt.score}%` : "—"}</td>
                          <td className="px-6 py-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${!hasScore ? "bg-gray-100 text-gray-600" : (isPass ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600")}`} style={{ fontFamily:U }}>
                              {!hasScore ? "Ongoing" : (isPass ? "PASS" : "FAIL")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-black mb-4" style={{ fontFamily:U, color:INK }}>Exam Code</h3>
            <div className="bg-gray-50 rounded-xl p-4 text-center mb-4 border border-gray-200">
              <p className="text-2xl font-black tracking-widest" style={{ fontFamily:U, color:INK }}>{exam.uniqueCode || "NO-CODE"}</p>
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
            <CopyField label="Exam Code" value={exam.uniqueCode || ""}/>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3" style={{ fontFamily:U }}>QR Code</p>
              <div className="flex items-start gap-5">
                <div className="bg-white p-2 rounded-xl border border-gray-200">
                  <QRCodeCanvas 
                    id="qrCodeCanvas"
                    value={magicLink} 
                    size={100} 
                    level={"H"}
                    includeMargin={true}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-3" style={{ fontFamily:I }}>Students can scan this code to join the exam instantly from their phone.</p>
                  <button onClick={downloadQRCode} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer" style={{ fontFamily:U }}><Download size={13}/>Download PNG</button>
                </div>
              </div>
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
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ fontFamily:U, color:INK }}><Clock size={14} style={{ color:CAMEL }}/>{exam.duration || 0}:00</div>
            </div>
            <div className="p-6 space-y-6">
              {allQuestions.length > 0 ? allQuestions.map((q: any, i: number) => (
                <div key={q.id || i} className="border border-gray-100 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background:`${CAMEL}18`, color:CAMEL, fontFamily:U }}>Q{i + 1}</span>
                    <span className="text-xs text-gray-400" style={{ fontFamily:I }}>{q.type.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-sm text-gray-800 mb-4 font-medium" style={{ fontFamily:I }}>{q.text}</p>
                  {(q.type === 'MCQ' || q.type === 'MULTIPLE_SELECT' || q.type === 'TRUE_FALSE') && q.options ? (
                    <div className="space-y-2">
                      {q.options.map((o: any) => (
                        <div key={o.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm text-gray-700" style={{ fontFamily:I }}>
                          <div className={`w-4 h-4 flex-shrink-0 border-2 border-gray-300 ${q.type === 'MULTIPLE_SELECT' ? 'rounded' : 'rounded-full'}`}/>
                          {o.text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <textarea rows={3} placeholder="Type your answer here…" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 focus:outline-none resize-none" style={{ fontFamily:I }}/>
                  )}
                </div>
              )) : (
                <div className="text-center p-10 text-gray-400 text-sm">No questions added yet.</div>
              )}
              {allQuestions.length > 0 && (
                <div className="flex justify-end gap-3">
                  <button className="text-sm text-gray-400 px-4 py-2.5" style={{ fontFamily:I }}>Previous</button>
                  <button className="text-sm font-bold text-white px-6 py-2.5 rounded-xl" style={{ background:INK, fontFamily:U }}>Next →</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
