"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/hooks";
import { submitExam } from "@/lib/api/session";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";
import { Logo } from "@/components/Logo";

const S  = "#059669";
const SL = "#ecfdf5";

function StudentHeader() {
  return (
    <header className="flex items-center px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <Logo height={44} />
      </div>
    </header>
  );
}

export function ReviewSubmit() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number,any>>({});
  const [flagged, setFlagged] = useState<number[]>([]);
  const [attemptId, setAttemptId] = useState<string>("");

  const raw  = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const code = raw?.get("code") ?? "";

  useEffect(() => {
    try {
      setQuestions(JSON.parse(localStorage.getItem("exam_review_q") || "[]"));
      setAnswers(JSON.parse(localStorage.getItem("exam_review_a") || "{}"));
      setFlagged(JSON.parse(localStorage.getItem("exam_review_f") || "[]"));
      setAttemptId(localStorage.getItem("exam_review_attempt") || "");
    } catch (e) {}
  }, []);

  const isAns = (q:any) => {
    const a = answers[q.id];
    if (a===undefined||a===null||a==="") return false;
    if (Array.isArray(a)) return a.length>0;
    if (typeof a==="object") return Object.keys(a).length>0;
    return true;
  };

  const answeredIds  = questions.filter(isAns).map(q=>q.id);
  const unansweredQs = questions.filter(q=>!answeredIds.includes(q.id));
  const flaggedQs    = questions.filter(q=>flagged.includes(q.id));

  const handleFinalSubmit = async () => {
    if (!attemptId) return;
    setSubmitting(true);
    try {
      const response = await submitExam(attemptId, {});
      
      // Save result for success and results pages
      const resultData = {
        ...response,
        title: localStorage.getItem("exam_review_title") || "Exam",
        answeredCount: answeredIds.length,
        totalCount: questions.length,
        date: new Date().toISOString()
      };
      
      localStorage.setItem("student_last_result", JSON.stringify(resultData));
      
      // Append to history
      try {
        const history = JSON.parse(localStorage.getItem("student_exam_history") || "[]");
        history.push(resultData);
        localStorage.setItem("student_exam_history", JSON.stringify(history));
      } catch (e) {}
      
      // Clear review state from local storage once submitted
      localStorage.removeItem("exam_review_q");
      localStorage.removeItem("exam_review_a");
      localStorage.removeItem("exam_review_f");
      localStorage.removeItem("exam_review_attempt");
      localStorage.removeItem("exam_review_title");
      
      navigate("/student/exam/success");
    } catch (error) {
      console.error("Failed to submit exam:", error);
      alert("Failed to submit exam. Please try again or ask your teacher for help.");
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="min-h-screen" style={{background:CREAM}}>
      <StudentHeader/>
      
      {showConfirm&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{background:"rgba(0,0,0,0.62)",backdropFilter:"blur(8px)"}}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 mx-auto mb-5 flex items-center justify-center">
              {submitting ? (
                <Loader2 size={28} className="text-amber-500 animate-spin"/>
              ) : (
                <AlertTriangle size={28} className="text-amber-500"/>
              )}
            </div>
            <h3 className="text-xl font-black mb-2" style={{fontFamily:U,color:INK}}>
              {submitting ? "Submitting..." : "Submit exam?"}
            </h3>
            {!submitting && (
              <p className="text-sm text-gray-500 mb-6" style={{fontFamily:I}}>{unansweredQs.length>0?`You have ${unansweredQs.length} unanswered question(s). `:""}Once submitted, you cannot make changes.</p>
            )}
            
            <div className="space-y-2">
              <button 
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl text-white font-black text-sm hover:opacity-90 disabled:opacity-50" style={{background:S,fontFamily:U}}>
                {submitting ? "Submitting..." : "Yes, submit now"}
              </button>
              <button 
                onClick={()=>setShowConfirm(false)}
                disabled={submitting}
                className="w-full py-3 text-sm font-semibold text-gray-500 border border-gray-200 rounded-2xl hover:bg-gray-50 disabled:opacity-50" style={{fontFamily:U}}>
                Go back and review
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2" style={{fontFamily:U,color:INK}}>Review Your Answers</h1>
          <p className="text-sm text-gray-400" style={{fontFamily:I}}>Check before you submit — you cannot change answers after.</p>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[{v:answeredIds.length,l:"Answered",bg:SL,c:S},{v:unansweredQs.length,l:"Unanswered",bg:"#fff0f0",c:"#ef4444"},{v:flaggedQs.length,l:"Flagged",bg:"#fffbeb",c:"#d97706"}].map(({v,l,bg,c})=>(
            <div key={l} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <p className="text-2xl font-black" style={{fontFamily:U,color:c}}>{v}</p>
              <p className="text-xs text-gray-400 mt-0.5" style={{fontFamily:I}}>{l}</p>
            </div>
          ))}
        </div>
        
        {unansweredQs.length>0&&(
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-wider text-red-400 mb-2.5" style={{fontFamily:U}}>⚠ Unanswered</p>
            {unansweredQs.map(q=>(
              <div key={q.id} className="flex items-center justify-between bg-white rounded-xl border border-red-100 px-4 py-3 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0" style={{background:"#fff0f0",color:"#ef4444",fontFamily:U,display:"inline-flex"}}>Q{q.id}</span>
                  <span className="text-sm text-gray-600 truncate" style={{fontFamily:I}}>{(q.text||"").slice(0,48)}{(q.text||"").length>48?"…":""}</span>
                </div>
                <button onClick={()=>navigate(`/student/exam?code=${code}&q=${q.id-1}`)}
                  className="text-xs font-black px-3 py-1.5 rounded-lg text-white flex-shrink-0 ml-2" style={{background:INK,fontFamily:U}}>
                  Answer
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2.5" style={{fontFamily:U}}>All Questions</p>
          {questions.map(q=>{
            const fl=flagged.includes(q.id);
            const ans=answeredIds.includes(q.id);
            return (
              <div key={q.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 mb-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0"
                    style={{background:ans?`${S}18`:fl?"#fffbeb":"#f3f4f6",color:ans?S:fl?"#d97706":"#9ca3af",fontFamily:U,display:"inline-flex"}}>
                    Q{q.id}
                  </span>
                  <span className="text-sm text-gray-600 truncate" style={{fontFamily:I}}>{(q.text||"").slice(0,52)}{(q.text||"").length>52?"…":""}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {fl&&<span className="text-[10px] text-amber-500" style={{fontFamily:U}}>⚑</span>}
                  <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${ans?"text-emerald-600":"text-gray-400"}`}
                    style={{background:ans?SL:"#f3f4f6"}}>
                    {ans?"✓":"−"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        <button onClick={()=>setShowConfirm(true)}
          className="w-full flex items-center justify-center gap-2 text-white font-black py-4 rounded-2xl text-base hover:opacity-90"
          style={{background:S,fontFamily:U}}>
          Submit Exam <ArrowRight size={18}/>
        </button>
        <p className="text-center text-xs text-gray-400 mt-3" style={{fontFamily:I}}>Once submitted, no further changes can be made.</p>
      </div>
    </div>
  );
}
