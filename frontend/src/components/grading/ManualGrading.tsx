"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/hooks";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { CheckCircle2, Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { MANUAL_QUESTIONS, MOCK_GRADING_RESULTS } from "@/lib/mock-data";
import { U, I, INK, CAMEL } from "@/lib/tokens";

const MANUAL_STUDENTS = MOCK_GRADING_RESULTS.filter(r=>r.status==="review");

export function ManualGrading() {
  const navigate = useNavigate();
  const [studentIdx, setStudentIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [scores, setScores] = useState<Record<string,number>>({});
  const [feedback, setFeedback] = useState<Record<string,string>>({});
  const [saved, setSaved] = useState(false);

  const student = MANUAL_STUDENTS[studentIdx];
  const question = MANUAL_QUESTIONS[qIdx];
  const key = `${studentIdx}-${qIdx}`;

  const setScore = (v:number)=>setScores(p=>({...p,[key]:Math.min(question.maxScore,Math.max(0,v))}));
  const setFb = (v:string)=>setFeedback(p=>({...p,[key]:v}));

  const saveAndNext = ()=>{
    setSaved(true);
    setTimeout(()=>{
      setSaved(false);
      if(qIdx<MANUAL_QUESTIONS.length-1) setQIdx(q=>q+1);
      else if(studentIdx<MANUAL_STUDENTS.length-1){ setQIdx(0); setStudentIdx(s=>s+1); }
    },600);
  };

  const sampleResponse = ["Tom Reed's response to this question:\n\n\"Derivatives are used in many real-world scenarios. One important application is optimization — for example, a company can use derivatives to find the maximum profit or minimum cost by setting the derivative equal to zero and solving for the critical points.\n\nAnother application is in physics, where velocity is the derivative of position with respect to time, and acceleration is the derivative of velocity. Engineers use these concepts when designing vehicles and structures.\n\nIn medicine, derivatives are used to model the rate at which drugs are metabolized in the body. By finding the maximum concentration point (the peak), doctors can time doses appropriately.\n\nIn summary, calculus and derivatives provide a powerful tool for understanding rates of change in a wide variety of fields.\"","Lucy Kim's response:\n\n\"Derivatives help us find where functions are increasing or decreasing. They can be used to find maximum and minimum values. For example in business you can find maximum profit. Also in physics velocity is a derivative of position. These are some applications of derivatives in real life.\""][studentIdx]||"No response submitted.";

  return (
    <DashboardLayout active="grading-manual" title="Manual Grading" subtitle={`${student?.name} · ${qIdx+1} of ${MANUAL_QUESTIONS.length} open questions`}
      actions={<>
        <button onClick={()=>navigate("/dashboard/grading")} className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}>← All results</button>
      </>}>

      <div className="grid lg:grid-cols-[200px_1fr_320px] gap-5 h-[calc(100vh-10rem)]">
        {/* Left: student list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
          <div className="px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500" style={{ fontFamily:U }}>Students</p>
            <p className="text-[11px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{MANUAL_STUDENTS.length} need review</p>
          </div>
          {MANUAL_STUDENTS.map((s,i)=>{
            const done = MANUAL_QUESTIONS.every((_,qi)=>scores[`${i}-${qi}`]!==undefined);
            return (
              <button key={s.name} onClick={()=>{setStudentIdx(i);setQIdx(0);}}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-all ${studentIdx===i?"bg-gray-50":"hover:bg-gray-50/50"}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background:studentIdx===i?INK:CAMEL, fontFamily:U }}>{s.name.split(" ").map(w=>w[0]).join("")}</div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-xs font-semibold truncate ${studentIdx===i?"text-gray-900":"text-gray-600"}`} style={{ fontFamily:U }}>{s.name}</p>
                  <p className="text-[10px] text-gray-400" style={{ fontFamily:I }}>{done?"Complete":"In progress"}</p>
                </div>
                {done&&<CheckCircle2 size={13} className="text-green-500 flex-shrink-0"/>}
              </button>
            );
          })}
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2" style={{ fontFamily:U }}>Questions</p>
            {MANUAL_QUESTIONS.map((q,qi)=>(
              <button key={qi} onClick={()=>setQIdx(qi)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 transition-all ${qIdx===qi?"bg-gray-900 text-white":"text-gray-500 hover:bg-gray-50"}`}>
                <span className="text-[10px] font-black" style={{ fontFamily:U }}>Q{q.id}</span>
                <span className="text-[10px] flex-1 text-left truncate" style={{ fontFamily:I }}>{q.type}</span>
                {scores[`${studentIdx}-${qi}`]!==undefined&&<Check size={10} className="text-green-400"/>}
              </button>
            ))}
          </div>
        </div>

        {/* Center: student response */}
        <div className="flex min-h-0 flex-col gap-4 overflow-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background:`${CAMEL}20`, color:CAMEL, fontFamily:U }}>Q{question.id} · {question.type}</span>
              <span className="text-xs text-gray-400" style={{ fontFamily:I }}>Max score: {question.maxScore} pts</span>
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1 leading-relaxed" style={{ fontFamily:U }}>{question.prompt}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 flex-1 overflow-auto">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background:CAMEL, fontFamily:U }}>{student?.name.split(" ").map(w=>w[0]).join("")}</div>
                <p className="text-sm font-bold text-gray-800" style={{ fontFamily:U }}>{student?.name}</p>
              </div>
              <span className="text-xs text-gray-400" style={{ fontFamily:I }}>Submitted 11:02 AM</span>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line" style={{ fontFamily:I }}>{sampleResponse}</p>
            </div>
          </div>
        </div>

        {/* Right: scoring panel */}
        <div className="sticky top-36 flex h-[calc(100vh-10rem)] min-h-0 flex-col gap-3 overflow-hidden">
          {/* Score input */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3" style={{ fontFamily:U }}>Score</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 relative">
                <input type="number" value={scores[key]??""} onChange={e=>setScore(Number(e.target.value))} min={0} max={question.maxScore}
                  placeholder="—" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-2xl font-black text-center focus:outline-none focus:border-gray-900 transition-colors" style={{ fontFamily:U, color:INK }}/>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-gray-300" style={{ fontFamily:U }}>/ {question.maxScore}</p>
              </div>
            </div>
            {/* Quick score buttons */}
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {[0,25,50,75,100].map(pct=>{
                const v = Math.round(question.maxScore*pct/100);
                return <button key={pct} onClick={()=>setScore(v)} className="py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all" style={{ fontFamily:U }}>{pct}%</button>;
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setScore(0)} className="flex items-center gap-1 flex-1 justify-center py-2 rounded-lg text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors" style={{ fontFamily:U }}><ThumbsDown size={12}/>Fail</button>
              <button onClick={()=>setScore(question.maxScore)} className="flex items-center gap-1 flex-1 justify-center py-2 rounded-lg text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 transition-colors" style={{ fontFamily:U }}><ThumbsUp size={12}/>Full marks</button>
            </div>
          </div>

          {/* Rubric */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2" style={{ fontFamily:U }}>Rubric</p>
            <ul className="space-y-1">
              {question.rubric.map((r,i)=>(
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600" style={{ fontFamily:I }}>
                  <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0 mt-0.5"/>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Feedback */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2" style={{ fontFamily:U }}>Feedback to student</p>
            <textarea value={feedback[key]||""} onChange={e=>setFb(e.target.value)} rows={3} placeholder="Optional: add written feedback the student will see…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none" style={{ fontFamily:I }}/>
          </div>

          {/* Save & navigate */}
          <div className="mt-auto space-y-2 rounded-2xl border border-gray-100 bg-white/95 p-3 shadow-sm">
            <button onClick={saveAndNext} disabled={scores[key]===undefined}
              className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-40 transition-all" style={{ background:INK, fontFamily:U }}>
              {saved?<><CheckCircle2 size={15}/>Saved!</>:"Save & Next →"}
            </button>
            <div className="flex gap-2">
              <button onClick={()=>{ if(qIdx>0)setQIdx(q=>q-1); else if(studentIdx>0){setStudentIdx(s=>s-1);setQIdx(MANUAL_QUESTIONS.length-1);} }} className="flex-1 py-2 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50" style={{ fontFamily:U }}>← Prev</button>
              <button onClick={()=>navigate("/dashboard/grading")} className="flex-1 py-2 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50" style={{ fontFamily:U }}>All results</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
