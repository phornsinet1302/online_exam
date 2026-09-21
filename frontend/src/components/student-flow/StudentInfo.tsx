"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/hooks";
import { useSearchParams } from "next/navigation";
import { GraduationCap, CheckCircle2, Hash, ArrowRight, Loader2, LogIn, UserX, Lock } from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";
import { joinByCode, validateAttempt } from "@/lib/api/session";

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

export function StudentInfo() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const code = searchParams?.get("code") || "";
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studentId, setStudentId] = useState("");
  const [examPassword, setExamPassword] = useState("");

  // When a valid token is found for this exam, show a "welcome back" screen
  // instead of silently redirecting — the student may want to switch accounts.
  const [returningAs, setReturningAs] = useState<{ name: string; email: string; attemptId: string; examId: string } | null>(null);

  useEffect(() => {
    if (!code) {
      navigate("/student/enter");
      return;
    }
    
    const existingToken = localStorage.getItem("student_token");

    joinByCode(code)
      .then(async (data) => {
        setExam(data);
        
        // If we have an existing token, validate it against the backend
        if (existingToken) {
          try {
            const payload = JSON.parse(atob(existingToken.split('.')[1]));
            if (payload.examId === data.examId) {
              const validation = await validateAttempt(payload.attemptId, data.examId);
              if (validation.valid) {
                // Don't auto-redirect — show a "welcome back" confirmation screen
                // so the student can confirm this is the right account or switch
                setReturningAs({
                  name: payload.name || "",
                  email: payload.studentId || "", // studentId in JWT is the email
                  attemptId: payload.attemptId,
                  examId: data.examId,
                });
                setLoading(false);
                return;
              }
              // Attempt was invalidated — clear the stale token
              localStorage.removeItem("student_token");
            }
          } catch (e) {
            // Token parse failed — clear it
            localStorage.removeItem("student_token");
          }
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "Failed to load exam details");
        setLoading(false);
      });
  }, [code, navigate]);

  const handleContinueAsReturning = () => {
    if (!returningAs) return;
    const waitingParams = new URLSearchParams();
    waitingParams.set("examId", returningAs.examId);
    waitingParams.set("code", code);
    navigate(`/student/waiting?${waitingParams.toString()}`);
  };

  const handleSwitchAccount = () => {
    // Clear the saved token — send them back to the normal sign-in form
    localStorage.removeItem("student_token");
    setReturningAs(null);
    // Also clear any leftover pending data
    localStorage.removeItem("pending_student_id");
    localStorage.removeItem("pending_exam_code");
    localStorage.removeItem("pending_exam_id");
  };

  const handleGoogle = () => {
    if (!studentId.trim()) {
      alert("Please enter your Student ID first");
      return;
    }
    if (exam.requiresPassword && !examPassword) {
      alert("Please enter the exam password first");
      return;
    }
    // Kept in sessionStorage (not localStorage) so the password doesn't
    // outlive this tab; the auth-callback page reads and clears it.
    if (exam.requiresPassword) sessionStorage.setItem('pending_exam_password', examPassword);
    localStorage.setItem('pending_student_id', studentId.trim());
    localStorage.setItem('pending_exam_code', code || "");
    localStorage.setItem('pending_exam_id', exam.examId);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jfebblgfihkhuaewxnjs.supabase.co";
    window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${window.location.origin}/student/auth-callback`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background:CREAM }}>
        <StudentHeader/>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background:CREAM }}>
        <StudentHeader/>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-xl font-black mb-4 text-red-500" style={{fontFamily:U}}>{error || "Exam not found"}</p>
          <button onClick={()=>navigate("/student/enter")} className="px-6 py-3 rounded-2xl font-black text-white" style={{background:INK,fontFamily:U}}>
            Try another code
          </button>
        </div>
      </div>
    );
  }

  // ── Returning student screen ────────────────────────────────────────────────
  if (returningAs) {
    const emailDisplay = returningAs.email;
    const initials = emailDisplay.slice(0, 2).toUpperCase();

    return (
      <div className="min-h-screen flex flex-col" style={{ background: CREAM }}>
        <StudentHeader/>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            {/* Exam info pill */}
            <div className="mb-4 rounded-2xl border border-gray-200 bg-white px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${CAMEL}20` }}>
                <CheckCircle2 size={16} style={{ color: CAMEL }}/>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider" style={{ fontFamily: U }}>Joining</p>
                <p className="text-sm font-black truncate" style={{ fontFamily: U, color: INK }}>{exam.title}</p>
              </div>
              <span className="ml-auto font-mono text-xs font-black px-2 py-1 rounded-lg" style={{ background: `${INK}10`, color: INK }}>{code}</span>
            </div>

            {/* Welcome back card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg,${S},${CAMEL})` }}/>
              <div className="p-8 text-center">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-2xl font-black text-white shadow-lg"
                  style={{ background: INK, fontFamily: U }}>
                  {initials}
                </div>

                <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ fontFamily: U, color: S }}>Welcome back</p>
                <h1 className="text-2xl font-black mb-1" style={{ fontFamily: U, color: INK }}>
                  Returning to exam
                </h1>
                <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: I }}>
                  You previously joined as:
                </p>
                <p className="text-sm font-black mb-6" style={{ fontFamily: U, color: INK }}>
                  {emailDisplay}
                </p>

                {/* Continue button */}
                <button
                  onClick={handleContinueAsReturning}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black text-white hover:opacity-90 transition-all mb-3"
                  style={{ background: S, fontFamily: U }}>
                  <LogIn size={16}/>
                  Continue to Waiting Room
                </button>

                {/* Switch account */}
                <button
                  onClick={handleSwitchAccount}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
                  style={{ fontFamily: U }}>
                  <UserX size={15}/>
                  Not you? Use a different account
                </button>

                <p className="text-xs text-gray-400 mt-4 leading-relaxed" style={{ fontFamily: I }}>
                  Switching accounts will clear your saved session. You will need to sign in again with Google.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── New student sign-in form ────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background:CREAM }}>
      <StudentHeader/>
      <div className="mx-auto flex min-h-[calc(100vh-65px)] max-w-5xl items-center px-4 py-10">
        <div className="grid w-full gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
          <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background:SL }}>
              <CheckCircle2 size={26} style={{ color:S }}/>
            </div>
            <p className="mb-2 text-xs font-black uppercase tracking-wider" style={{ fontFamily:U, color:S }}>Code accepted</p>
            <h1 className="mb-3 text-2xl font-black" style={{ fontFamily:U, color:INK }}>Tell us who is joining</h1>
            <p className="text-sm leading-relaxed text-gray-500" style={{ fontFamily:I }}>
              Enter your student details before reviewing the exam instructions.
            </p>

            <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-1 text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily:U }}>Exam code</p>
              <p className="font-mono text-lg font-black tracking-wider" style={{ color:INK }}>{code}</p>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="text-sm font-black" style={{ fontFamily:U, color:INK }}>{exam.title}</p>
                <p className="mt-1 text-xs text-gray-500" style={{ fontFamily:I }}>{exam.subject} · {exam.duration} min · {exam.totalQuestions || 12} questions</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-xl font-black" style={{ fontFamily:U, color:INK }}>Student information</h2>
              <p className="mt-1 text-sm text-gray-500" style={{ fontFamily:I }}>Verify your identity to enter the exam.</p>
            </div>

            <div className="space-y-4 mb-6">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily:U }}>Student ID</span>
                <div className="relative">
                  <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input
                    type="text"
                    value={studentId}
                    onChange={e => setStudentId(e.target.value)}
                    placeholder="e.g. STU-1029"
                    required
                    autoComplete="off"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-11 py-4 text-sm text-gray-900 transition-colors placeholder:text-gray-300 focus:border-gray-900 focus:outline-none"
                    style={{ fontFamily:I }}
                  />
                </div>
              </label>
              {exam.requiresPassword && (
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily:U }}>Exam password</span>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input
                      type="password"
                      value={examPassword}
                      onChange={e => setExamPassword(e.target.value)}
                      placeholder="Ask your teacher for the password"
                      autoComplete="off"
                      className="w-full rounded-2xl border border-gray-200 bg-white px-11 py-4 text-sm text-gray-900 transition-colors placeholder:text-gray-300 focus:border-gray-900 focus:outline-none"
                      style={{ fontFamily:I }}
                    />
                  </div>
                </label>
              )}
            </div>
            
            <button type="button" onClick={handleGoogle} disabled={!studentId.trim() || (exam.requiresPassword && !examPassword)} className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:bg-gray-50 rounded-xl py-3 text-sm font-semibold text-gray-700 transition-all mb-4 disabled:opacity-50" style={{ fontFamily: U }}>
              <svg width="17" height="17" viewBox="0 0 48 48" fill="none"><path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" fill="#FFC107"/><path d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" fill="#FF3D00"/><path d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C9.7 35.6 16.3 44 24 44z" fill="#4CAF50"/><path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.1-2.2 3.9-4 5.2l6.2 5.2C37.2 38.6 44 33.3 44 24c0-1.2-.1-2.3-.4-3.5z" fill="#1976D2"/></svg>
              Continue with Google
            </button>

            <div className="mt-2 flex flex-col sm:flex-row">
              <button type="button" onClick={()=>navigate("/student/enter")}
                className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 text-sm font-black text-gray-500 transition-colors hover:bg-gray-50"
                style={{ fontFamily:U }}>
                Change code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
