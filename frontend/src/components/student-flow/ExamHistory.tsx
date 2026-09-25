"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/hooks";
import { Clock, Award, ChevronRight } from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";
import { Logo } from "@/components/Logo";

const S  = "#059669";
const SL = "#ecfdf5";

function StudentHeader() {
  return (
    <header className="flex items-center px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <Logo height={44} href="/" />
      </div>
    </header>
  );
}

export function ExamHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("student_exam_history");
      if (stored) setHistory(JSON.parse(stored).reverse()); // newest first
    } catch (e) {}
  }, []);

  const gc = (s:number|null)=>!s?"#d97706":s>=80?S:s>=60?"#d97706":"#ef4444";
  
  return (
    <div className="min-h-screen" style={{background:CREAM}}>
      <StudentHeader/>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black mb-1" style={{fontFamily:U,color:INK}}>Exam History</h1>
        <p className="text-sm text-gray-400 mb-6" style={{fontFamily:I}}>All exams you have taken on this device</p>
        
        {history.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 mb-6">
             <p className="text-gray-400" style={{fontFamily:I}}>No exams taken yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((h:any, idx:number)=>(
              <div key={h.attemptId || idx} onClick={() => {
                  localStorage.setItem("student_last_result", JSON.stringify(h));
                  navigate(`/student/results`);
                }}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{background:h.grading?.status==="needs_review"?"#fffbeb":SL}}>
                  {h.grading?.status==="needs_review"
                    ?<Clock size={22} className="text-amber-500"/>
                    :<Award size={22} style={{color:S}}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-800 truncate" style={{fontFamily:U}}>{h.title || "Exam"}</p>
                  <p className="text-xs text-gray-400 mt-0.5" style={{fontFamily:I}}>{new Date(h.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {h.grading?.hidden||h.showResults===false
                    ?<span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full" style={{fontFamily:U}}>Submitted</span>
                    :h.grading?.status==="needs_review"
                    ?<span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full" style={{fontFamily:U}}>Pending</span>
                    :(
                      <>
                        <p className="text-xl font-black" style={{fontFamily:U,color:gc(h.grading?.percentageScore)}}>{h.grading?.percentageScore || 0}%</p>
                      </>
                    )
                  }
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0"/>
              </div>
            ))}
          </div>
        )}
        
        <button onClick={()=>navigate("/student/enter")}
          className="w-full mt-6 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50" style={{fontFamily:U}}>
          Take another exam
        </button>
      </div>
    </div>
  );
}
