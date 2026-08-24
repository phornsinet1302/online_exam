"use client";

import { useNavigate } from "@/lib/hooks";
import { MOCK_HISTORY } from "@/lib/mock-data";
import { Clock, Award, ChevronRight, GraduationCap } from "lucide-react";
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

export function ExamHistory() {
  const navigate = useNavigate();
  const gc = (s:number|null)=>!s?"#d97706":s>=80?S:s>=60?"#d97706":"#ef4444";
  return (
    <div className="min-h-screen" style={{background:CREAM}}>
      <StudentHeader/>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black mb-1" style={{fontFamily:U,color:INK}}>Exam History</h1>
        <p className="text-sm text-gray-400 mb-6" style={{fontFamily:I}}>All exams you have taken</p>
        <div className="space-y-3">
          {MOCK_HISTORY.map(h=>(
            <div key={h.id} onClick={()=>navigate(`/student/history/${h.id}`)}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{background:h.status==="pending"?"#fffbeb":SL}}>
                {h.status==="pending"
                  ?<Clock size={22} className="text-amber-500"/>
                  :<Award size={22} style={{color:S}}/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-800 truncate" style={{fontFamily:U}}>{h.title}</p>
                <p className="text-xs text-gray-400 mt-0.5" style={{fontFamily:I}}>{h.subject} · {h.date} · {h.duration} min</p>
              </div>
              <div className="text-right flex-shrink-0">
                {h.status==="pending"
                  ?<span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full" style={{fontFamily:U}}>Pending</span>
                  :(
                    <>
                      <p className="text-xl font-black" style={{fontFamily:U,color:gc(h.score)}}>{h.score}%</p>
                      <p className="text-xs font-black" style={{fontFamily:U,color:gc(h.score)}}>{h.grade}</p>
                    </>
                  )
                }
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0"/>
            </div>
          ))}
        </div>
        <button onClick={()=>navigate("/student/enter")}
          className="w-full mt-6 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50" style={{fontFamily:U}}>
          Take another exam
        </button>
      </div>
    </div>
  );
}
