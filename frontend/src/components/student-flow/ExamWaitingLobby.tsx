"use client";

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@/lib/hooks";
import { useSearchParams } from "next/navigation";
import { Check, AlertTriangle, Loader2, Users, Wifi, WifiOff } from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";
import { API_URL } from "@/lib/api/client";
import { Logo } from "@/components/Logo";

const S  = "#059669";
const SL = "#ecfdf5";
const SM = "#6ee7b7";
const BLUE   = "#2563EB";

function StudentHeader() {
  return (
    <header className="flex items-center px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <Logo height={44} />
      </div>
    </header>
  );
}

export function ExamWaitingLobby() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const examId = searchParams?.get("examId") || "";
  const code = searchParams?.get("code") || "";
  
  const [exam, setExam] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimers = useRef<number[]>([]);
  
  const [joinedStudents, setJoinedStudents] = useState<any[]>([]);

  // Read myAttemptId synchronously once on mount
  const [myAttemptId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const token = localStorage.getItem("student_token");
      if (!token) return null;
      return JSON.parse(atob(token.split('.')[1])).attemptId as string;
    } catch { return null; }
  });

  useEffect(() => {
    if (!myAttemptId) {
      navigate("/student/enter");
      return;
    }
    if (!examId) return;

    // Open the SSE stream — server sends session_state immediately on connect,
    // so we don't need a separate REST fetch. The SSE data is always authoritative.
    const eventSource = new EventSource(`${API_URL}/session/${examId}/live?attemptId=${myAttemptId}`);
    
    eventSource.addEventListener("session_state", (e) => {
      try {
        const state = JSON.parse(e.data);
        setExam(state);
        const students = state.joinedStudents || [];
        if (Array.isArray(students)) {
          setJoinedStudents(students.map((s: any) => ({ ...s, online: true })));
        }
        
        const myAttempt = students.find((s: any) => s.attemptId === myAttemptId);
        const myIsApproved = myAttempt ? myAttempt.isApproved !== false : true;
        
        if (state.sessionState === "ACTIVE" && myIsApproved) {
          setOpen(true);
        }
      } catch (err) {}
    });

    eventSource.addEventListener("student_joined", (e) => {
      try {
        const payload = JSON.parse(e.data);
        setJoinedStudents(prev => {
          const existing = prev.findIndex(s => s.attemptId === payload.attemptId);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = { ...updated[existing], ...payload, online: true };
            return updated;
          }
          return [...prev, { ...payload, online: true }];
        });
      } catch (err) {}
    });

    eventSource.addEventListener("late_approved", (e) => {
      try {
        const payload = JSON.parse(e.data);
        setJoinedStudents(prev => prev.map(s => s.attemptId === payload.attemptId ? { ...s, isApproved: true } : s));
        if (payload.attemptId === myAttemptId) {
          setOpen(true); // they were approved, start the exam!
        }
      } catch (err) {}
    });

    eventSource.addEventListener("late_rejected", (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.attemptId === myAttemptId) {
          localStorage.removeItem("student_token");
          alert("The teacher denied your entry.");
          navigate("/student/enter");
        } else {
          setJoinedStudents(prev => prev.filter(s => s.attemptId !== payload.attemptId));
        }
      } catch (err) {}
    });

    eventSource.addEventListener("exam_started", () => {
      setOpen(true);
    });

    eventSource.addEventListener("student_kicked", (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (myAttemptId && payload.attemptId === myAttemptId) {
          localStorage.removeItem("student_token");
          alert("You have been removed from the session by the teacher.");
          navigate("/student/enter");
        } else {
          setJoinedStudents(prev => prev.filter(s => s.attemptId !== payload.attemptId));
        }
      } catch (err) {}
    });

    eventSource.addEventListener("student_offline", (e) => {
      try {
        const payload = JSON.parse(e.data);
        // Remove the student — they disconnected and will re-appear when they rejoin
        setJoinedStudents(prev => prev.filter(s => s.attemptId !== payload.attemptId));
      } catch (err) {}
    });

    return () => eventSource.close();
  }, [examId, myAttemptId, navigate]);

  const me = joinedStudents.find(s => s.attemptId === myAttemptId);
  const myIsApproved = me ? me.isApproved !== false : true;

  const beginExamCountdown = () => {
    countdownTimers.current.forEach(timer=>window.clearTimeout(timer));
    countdownTimers.current = [];
    document.documentElement.requestFullscreen?.().catch(()=>{});
    setOpen(true);
    setCountdown(3);
    countdownTimers.current = [
      window.setTimeout(()=>setCountdown(2), 1000),
      window.setTimeout(()=>setCountdown(1), 2000),
      window.setTimeout(()=>navigate(`/student/exam?code=${encodeURIComponent(code)}`), 3000),
    ];
  };

  useEffect(()=>{
    return ()=>countdownTimers.current.forEach(timer=>window.clearTimeout(timer));
  },[]);

  // Automatically start countdown if exam opens and student is approved
  useEffect(() => {
    if (open && countdown === null && myIsApproved) {
      beginExamCountdown();
    }
  }, [open, myIsApproved]);

  if (!exam) {
    return (
      <div className="min-h-screen flex flex-col" style={{background:CREAM}}>
        <StudentHeader/>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      </div>
    );
  }

  if (!myIsApproved) {
    return (
      <div className="min-h-screen flex flex-col" style={{background:CREAM}}>
        <StudentHeader/>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-6 shadow-sm border border-amber-200">
            <Loader2 className="animate-spin text-amber-500" size={32} />
          </div>
          <h1 className="text-2xl font-black text-amber-900 mb-2" style={{fontFamily:U}}>Waiting for Approval</h1>
          <p className="text-sm text-amber-700 max-w-md" style={{fontFamily:I}}>
            The exam has already started. Your teacher must approve your late entry before you can join.
          </p>
        </div>
      </div>
    );
  }

  // Predefined colors for avatars
  const avatarColors = [S, CAMEL, INK, BLUE, "#7c3aed", "#db2777", "#0891b2", "#ea580c"];
  const onlineCount = joinedStudents.filter(s => s.online !== false).length;

  return (
    <div className="min-h-screen" style={{background:CREAM}}>
      <StudentHeader/>

      {countdown !== null && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center px-4" style={{background:"rgba(13,27,42,0.82)",backdropFilter:"blur(10px)"}}>
          <div className="flex flex-col items-center text-center">
            <p className="mb-5 text-sm font-black uppercase tracking-widest" style={{fontFamily:U,color:SM}}>Exam starting</p>
            <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-white/15 text-7xl font-black text-white shadow-2xl" style={{fontFamily:U,background:S}}>
              {countdown > 0 ? countdown : <Check size={64}/>}
            </div>
            <p className="mt-6 text-lg font-black text-white" style={{fontFamily:U}}>Get ready</p>
            <p className="mt-1 text-sm" style={{fontFamily:I,color:SM}}>You will enter the exam automatically.</p>
          </div>
        </div>
      )}

      {open&&(
        <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-3 text-white text-sm font-bold shadow-lg"
          style={{background:S,fontFamily:U}}>
          <span>Your teacher has started the exam. Starting automatically...</span>
          <span className="rounded-xl bg-white px-4 py-1.5 text-sm font-black" style={{color:S}}>Countdown</span>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-10" style={{paddingTop:open?"64px":undefined}}>
        <div className="mb-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider" style={{background:open?SL:"#f3f4f6",color:open?S:"#6b7280",fontFamily:U}}>
                <span className="h-2 w-2 rounded-full" style={{background:open?S:CAMEL}}/>
                {open?"Exam is open":"Waiting for teacher"}
              </span>
              <h1 className="mt-3 text-3xl font-black" style={{fontFamily:U,color:INK}}>Waiting Room</h1>
              <p className="mt-1 text-sm text-gray-500" style={{fontFamily:I}}>
                {open ? "The teacher opened the session. You can enter now." : "Students are joining the room. The exam starts when your teacher opens it."}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-gray-50 p-3 text-center">
              <div className="px-4">
                <p className="text-2xl font-black" style={{fontFamily:U,color:INK}}>{joinedStudents.length}</p>
                <p className="text-[11px] font-bold text-gray-400" style={{fontFamily:I}}>Registered</p>
              </div>
              <div className="px-4">
                <p className="text-2xl font-black" style={{fontFamily:U,color:S}}>{onlineCount}</p>
                <p className="text-[11px] font-bold text-gray-400" style={{fontFamily:I}}>Online</p>
              </div>
              <div className="px-4">
                <p className="text-2xl font-black" style={{fontFamily:U,color:INK}}>{exam.duration}</p>
                <p className="text-[11px] font-bold text-gray-400" style={{fontFamily:I}}>Minutes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-400" style={{fontFamily:U}}>Registered students</p>
              <p className="mt-1 text-sm text-gray-500" style={{fontFamily:I}}>Students who have joined this exam session.</p>
            </div>
            {!open&&(
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700" style={{fontFamily:I}}>
                <AlertTriangle size={13}/>Teacher has not started yet
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {joinedStudents.map((student, index)=>{
              const name = student.studentInfo?.name || "Student";
              const initials = name.split(" ").map((part:string)=>part[0]).join("").slice(0,2).toUpperCase();
              const isCurrent = student.attemptId === myAttemptId;
              const isOnline = student.online !== false;
              const color = isCurrent ? S : avatarColors[index % avatarColors.length];
              const meta = student.studentInfo?.studentId || "Joined";
              return (
                <div key={student.attemptId} className={`flex flex-col items-center rounded-2xl border p-5 text-center transition-all ${isCurrent?"border-emerald-200 bg-emerald-50":"border-gray-100 bg-white"} ${!isOnline && !isCurrent ? "opacity-50" : ""}`}>
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-black text-white shadow-sm ring-4 ring-white" style={{background:color,fontFamily:U}}>
                      {initials}
                    </div>
                    <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white" style={{background:isOnline?S:"#9ca3af"}}/>
                  </div>
                  <p className="mt-3 max-w-full truncate text-sm font-black" style={{fontFamily:U,color:INK}}>{isCurrent ? `${name} (You)` : name}</p>
                  <div className="mt-1 flex items-center gap-1">
                    {isOnline ? <Wifi size={10} style={{color:S}}/> : <WifiOff size={10} className="text-gray-400"/>}
                    <p className="max-w-full truncate text-xs text-gray-400" style={{fontFamily:I}}>{isOnline ? meta : "Offline"}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl p-4" style={{background:open?SL:INK}}>
            {open ? (
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <div className="text-center sm:text-left">
                  <p className="font-black" style={{fontFamily:U,color:S}}>The session is open.</p>
                  <p className="text-xs" style={{fontFamily:I,color:"#065f46"}}>The exam will open automatically after the countdown.</p>
                </div>
                <div className="rounded-2xl px-6 py-3 text-sm font-black" style={{background:S,color:"white",fontFamily:U}}>
                  Starting...
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-center sm:text-left">
                  <p className="font-black text-white" style={{fontFamily:U}}>You are in the room.</p>
                  <p className="text-xs" style={{fontFamily:I,color:SM}}>Keep this page open until your teacher starts the exam.</p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-xs font-black text-white" style={{fontFamily:U}}>
                  <Users size={14}/>
                  <span>{onlineCount} online</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
