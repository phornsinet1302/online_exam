"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/hooks";
import { Clock, GraduationCap } from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";

const S  = "#059669";
const SL = "#ecfdf5";

function StudentHeader() {
  return (
    <header className="flex items-center px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:INK}}>
          <GraduationCap size={15} className="text-white"/>
        </div>
        <span className="text-base font-black" style={{fontFamily:U,color:INK}}>exam<span style={{color:CAMEL}}>·ai</span></span>
      </div>
    </header>
  );
}

export function InstantResults() {
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("student_last_result");
      if (stored) setResult(JSON.parse(stored));
    } catch (e) {}
  }, []);

  // "Show results after submission" was off for this exam — the server sends
  // no score at all, so say so instead of showing a misleading 0%.
  if (result?.grading?.hidden || result?.showResults === false) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{background:CREAM}}>
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-black mb-2" style={{fontFamily:U,color:INK}}>Results not released</h1>
          <p className="text-sm text-gray-500 mb-6" style={{fontFamily:I}}>
            Your teacher chose not to show scores right after submission{result?.title ? ` for ${result.title}` : ""}. Your answers were submitted and will be graded.
          </p>
          <button onClick={()=>navigate("/student/history")} className="px-6 py-3 rounded-2xl text-white font-black text-sm hover:opacity-90" style={{background:INK,fontFamily:U}}>
            Back to history
          </button>
        </div>
      </div>
    );
  }

  if (!result || !result.grading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:CREAM}}>
        <div className="text-center">
          <h1 className="text-2xl font-black mb-2" style={{fontFamily:U,color:INK}}>No results found</h1>
          <p className="text-sm text-gray-500 mb-6" style={{fontFamily:I}}>Please complete an exam first.</p>
          <button onClick={()=>navigate("/student/enter")} className="px-6 py-3 rounded-2xl text-white font-black text-sm hover:opacity-90" style={{background:INK,fontFamily:U}}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const { grading, title, date } = result;
  const pct       = grading.percentageScore || 0;
  const earned    = grading.totalScore || 0;
  const maxAuto   = grading.maxPossible || 0;
  const grade     = pct>=90?"A":pct>=80?"B":pct>=70?"C":pct>=60?"D":"F";
  const gc        = pct>=80?S:pct>=60?"#d97706":"#ef4444";

  const breakdown = grading.breakdown || [];
  const correctCount = breakdown.filter((r:any) => r.status !== "needs_review" && r.score === r.maxScore).length;
  const pendingCount = breakdown.filter((r:any) => r.status === "needs_review").length;
  const wrongCount = breakdown.length - correctCount - pendingCount;

  return (
    <div className="min-h-screen" style={{background:CREAM}}>
      <StudentHeader/>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-1" style={{fontFamily:U,color:INK}}>Your Results</h1>
          <p className="text-sm text-gray-400" style={{fontFamily:I}}>{title || "Exam"} · {new Date(date || new Date()).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-6 text-center">
          <div className="relative w-36 h-36 mx-auto mb-4">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="10"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke={gc} strokeWidth="10"
                strokeDasharray={`${2*Math.PI*50}`}
                strokeDashoffset={`${2*Math.PI*50*(1-pct/100)}`}
                strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black" style={{fontFamily:U,color:gc}}>{pct}%</span>
              <span className="text-xs text-gray-400" style={{fontFamily:I}}>score</span>
            </div>
          </div>
          {grading.passed!==null&&grading.passed!==undefined&&(
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{fontFamily:U,color:grading.passed?S:"#ef4444"}}>{grading.passed?"Passed":"Not passed"}</p>
          )}
          <p className="text-5xl font-black mb-1" style={{fontFamily:U,color:gc}}>{pendingCount>0?"—":grade}</p>
          <p className="text-sm text-gray-400 mb-4" style={{fontFamily:I}}>{earned} / {maxAuto} points{pendingCount>0?" so far":""}</p>
          {pendingCount>0&&(
            <div className="inline-flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2" style={{fontFamily:I}}>
              <Clock size={12}/>{pendingCount} open-answer questions pending manual review
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {l:"Correct",  v:correctCount, c:S,         bg:SL},
            {l:"Wrong",    v:wrongCount,   c:"#ef4444", bg:"#fff0f0"},
            {l:"Pending",  v:pendingCount, c:"#d97706", bg:"#fffbeb"},
          ].map(({l,v,c,bg})=>(
            <div key={l} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <p className="text-2xl font-black" style={{fontFamily:U,color:c}}>{v}</p>
              <p className="text-xs text-gray-400" style={{fontFamily:I}}>{l}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-black" style={{fontFamily:U,color:INK}}>Question Breakdown</p>
          </div>
          {breakdown.map((r:any, i:number)=>(
            <div key={r.questionId || i} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0">
              <span className="w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0"
                style={{
                  background: r.status === "needs_review" ? "#fffbeb" : (r.score === r.maxScore ? SL : "#fff0f0"),
                  color: r.status === "needs_review" ? "#d97706" : (r.score === r.maxScore ? S : "#ef4444"),
                  fontFamily:U,display:"inline-flex"
                }}>
                Q{i+1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate" style={{fontFamily:U}}>{r.text || `Question ${i+1}`}</p>
              </div>
              <span className={`text-xs font-black px-2.5 py-1 rounded-full whitespace-nowrap ${r.status === "needs_review" ? "bg-amber-50 text-amber-600" : (r.score === r.maxScore ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500")}`} style={{fontFamily:U}}>
                {r.status==="needs_review"?"Pending":`${r.score}/${r.maxScore}`}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={()=>navigate("/student/history")} className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50" style={{fontFamily:U}}>
            View history
          </button>
          <button onClick={()=>navigate("/student/enter")} className="flex-1 py-3.5 rounded-2xl text-white font-black text-sm hover:opacity-90" style={{background:INK,fontFamily:U}}>
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
