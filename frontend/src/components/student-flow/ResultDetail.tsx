"use client";

import { useNavigate, useParams } from "@/lib/hooks";
import { MOCK_HISTORY, SESSION_QS, QTLABELS, QTCOLORS } from "@/lib/mock-data";
import { ChevronLeft, MessageSquare, GraduationCap } from "lucide-react";
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

export function ResultDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const exam = MOCK_HISTORY.find(h=>h.id===id)??MOCK_HISTORY[0];
  const gc = (s:number|null)=>!s?"#d97706":s>=80?S:s>=60?"#d97706":"#ef4444";

  const mockAnswers = SESSION_QS.slice(0,8).map((q,i)=>({
    q,
    given: q.options?q.options[0]:q.type==="truefalse"?"True":"Sample answer provided for demonstration purposes.",
    status:(i%3===0?"wrong":i%5===0?"pending":"correct") as "correct"|"wrong"|"pending",
    pts: i%3===0?0:i%5===0?null:q.points,
    feedback:i===1?"Great work — clear and concise.":i%3===0?"Incorrect. The correct answer is cos(x), not −cos(x).":null,
  }));

  return (
    <div className="min-h-screen" style={{background:CREAM}}>
      <StudentHeader/>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={()=>navigate("/student/history")}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors" style={{fontFamily:U}}>
          <ChevronLeft size={13}/>Back to history
        </button>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black" style={{fontFamily:U,color:INK}}>{exam.title}</h1>
            <p className="text-sm text-gray-400 mt-0.5" style={{fontFamily:I}}>{exam.subject} · {exam.date}</p>
          </div>
          {exam.score&&(
            <div className="text-right">
              <p className="text-3xl font-black" style={{fontFamily:U,color:gc(exam.score)}}>{exam.score}%</p>
              <p className="text-sm font-black" style={{fontFamily:U,color:gc(exam.score)}}>{exam.grade}</p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {mockAnswers.map(({q,given,status,pts,feedback})=>(
            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2 py-1 rounded-lg" style={{background:QTCOLORS[q.type]?.bg??"#f3f4f6",color:QTCOLORS[q.type]?.c??"#6b7280",fontFamily:U}}>Q{q.id}</span>
                  <span className="text-xs text-gray-400" style={{fontFamily:I}}>{QTLABELS[q.type]} · {q.points} pts</span>
                </div>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${status==="correct"?"bg-green-50 text-green-600":status==="wrong"?"bg-red-50 text-red-500":"bg-amber-50 text-amber-600"}`} style={{fontFamily:U}}>
                  {status==="pending"?"Pending review":pts!==null?`${pts}/${q.points}`:"-"}
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm font-semibold text-gray-700 mb-3" style={{fontFamily:U}}>{q.text}</p>
                <div className="bg-gray-50 rounded-xl px-4 py-3 mb-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1" style={{fontFamily:U}}>Your answer</p>
                  <p className="text-sm text-gray-700" style={{fontFamily:I}}>{String(given)}</p>
                </div>
                {feedback&&(
                  <div className={`rounded-xl px-4 py-3 flex items-start gap-2 ${status==="correct"?"bg-green-50":"bg-red-50"}`}>
                    <MessageSquare size={13} className={status==="correct"?"text-green-500":"text-red-400"} style={{flexShrink:0,marginTop:2}}/>
                    <p className="text-xs" style={{fontFamily:I,color:status==="correct"?"#16a34a":"#dc2626"}}>{feedback}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
