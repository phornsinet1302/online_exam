"use client";

import { useNavigate } from "@/lib/hooks";
import { GraduationCap, X, Clock, FileCheck, CalendarDays, Ban, ArrowRight, AlertTriangle } from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";

type ReasonKey = "wrong"|"expired"|"ended"|"notstarted"|"attempts";

export function ExamInvalid() {
  const navigate = useNavigate();
  const raw    = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const reason = raw?.get("reason") ?? "wrong";

  const CONFIG: Record<ReasonKey, { icon: React.ReactNode; title: string; body: string; hint: string }> = {
    wrong: {
      icon: <X size={32} className="text-red-500"/>,
      title: "Code not recognised",
      body:  "The exam code you entered doesn't match any active exam. Double-check for typos — codes are case-insensitive.",
      hint:  "Try a different code or contact your teacher.",
    },
    expired: {
      icon: <Clock size={32} className="text-amber-500"/>,
      title: "Link has expired",
      body:  "This magic link or QR code is no longer valid. Links expire after 7 days or when the exam closes.",
      hint:  "Ask your teacher to resend the exam link.",
    },
    ended: {
      icon: <FileCheck size={32} className="text-gray-400"/>,
      title: "Exam has ended",
      body:  "This exam is no longer accepting submissions. The session closed before you could join.",
      hint:  "Contact your teacher if you believe this is an error.",
    },
    notstarted: {
      icon: <CalendarDays size={32} className="text-blue-400"/>,
      title: "Exam hasn't started yet",
      body:  "You're too early! This exam isn't open yet. Your teacher will send you the link when it opens.",
      hint:  "Check the exam schedule and try again later.",
    },
    attempts: {
      icon: <Ban size={32} className="text-purple-500"/>,
      title: "No attempts remaining",
      body:  "You've used all allowed attempts for this exam. No further submissions are accepted.",
      hint:  "Contact your teacher if you think this is a mistake.",
    },
  };

  const cfg = CONFIG[(reason as ReasonKey)] ?? CONFIG.wrong;

  return (
    <div className="min-h-screen flex flex-col" style={{ background:CREAM }}>
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:INK }}><GraduationCap size={15} className="text-white"/></div>
          <span className="text-base font-black" style={{ fontFamily:U, color:INK }}>exam<span style={{ color:CAMEL }}>·ai</span></span>
        </div>
        <span className="text-xs text-gray-400 font-medium" style={{ fontFamily:I }}>Student portal</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="h-1 w-full" style={{ background:`linear-gradient(90deg,#ef4444,${CAMEL})` }}/>
            <div className="p-10 flex flex-col items-center text-center">

              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ background:
                reason==="wrong"?"#fff0f0":reason==="expired"?"#fffbeb":reason==="ended"?"#f9fafb":reason==="notstarted"?"#eff6ff":"#faf5ff"
              }}>
                {cfg.icon}
              </div>

              <h1 className="text-2xl font-black mb-3" style={{ fontFamily:U, color:INK }}>{cfg.title}</h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-2" style={{ fontFamily:I }}>{cfg.body}</p>
              <p className="text-xs text-gray-400 mb-8" style={{ fontFamily:I }}>{cfg.hint}</p>

              <div className="w-full space-y-3">
                <button onClick={()=>navigate("/student/enter")}
                  className="w-full flex items-center justify-center gap-2 text-white font-black py-3.5 rounded-2xl text-sm hover:opacity-90" style={{ background:INK, fontFamily:U }}>
                  <ArrowRight size={15}/>Try a different code
                </button>
                <button onClick={()=>navigate("/")}
                  className="w-full py-3 text-sm font-semibold text-gray-500 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors" style={{ fontFamily:U }}>
                  Back to home
                </button>
              </div>

              {reason==="ended" && (
                <div className="mt-6 w-full flex items-start gap-2.5 px-4 py-3.5 rounded-2xl bg-amber-50 border border-amber-100 text-left">
                  <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-amber-700 leading-relaxed" style={{ fontFamily:I }}>
                    If your teacher enabled <strong>late entry</strong>, they can re-open access from the exam settings. Ask them to extend the window.
                  </p>
                </div>
              )}
              {reason==="expired" && (
                <div className="mt-6 w-full flex items-start gap-2.5 px-4 py-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-left">
                  <Clock size={13} className="text-blue-500 flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-blue-700 leading-relaxed" style={{ fontFamily:I }}>
                    QR codes and magic links expire based on the teacher's settings (usually 24–72 hrs). The <strong>exam code</strong> itself remains valid until the session ends — try entering it manually above.
                  </p>
                </div>
              )}

              <p className="mt-8 text-[10px] text-gray-300 font-mono">err:{reason} · {new Date().toISOString().slice(0,16)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
