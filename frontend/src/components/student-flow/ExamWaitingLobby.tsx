"use client";

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@/lib/hooks";
import { MOCK_EXAMS, StudentSearchParams, getSearchValue } from "@/lib/mock-data";
import { GraduationCap, Check, AlertTriangle, Zap } from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";

const S  = "#059669";
const SL = "#ecfdf5";
const SM = "#6ee7b7";
const BLUE   = "#2563EB";

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

export function ExamWaitingLobby({ searchParams }: { searchParams?: StudentSearchParams } = {}) {
  const navigate = useNavigate();
  const code = getSearchValue(searchParams, "code");
  const studentName = getSearchValue(searchParams, "name") || "You";
  const studentId = getSearchValue(searchParams, "studentId");
  const studentEmail = getSearchValue(searchParams, "email");
  const exam = MOCK_EXAMS.find(e=>e.code.toUpperCase()===code.toUpperCase()) ?? MOCK_EXAMS[0];
  const instructionParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    const paramValue = Array.isArray(value) ? value[0] : value;
    if (paramValue) instructionParams.set(key, paramValue);
  }
  if (!instructionParams.get("code")) instructionParams.set("code", code || exam.code);

  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimers = useRef<number[]>([]);
  
  const joinedStudents = [
    { name:studentName, meta:studentId || studentEmail || "Ready", current:true, color:S },
    { name:"Sreynich Kao", meta:"Joined 2 min ago", color:CAMEL },
    { name:"Dara Sok", meta:"Camera ready", color:INK },
    { name:"Malis Chan", meta:"Joined", color:BLUE },
    { name:"Rithy Chea", meta:"Ready", color:"#7c3aed" },
    { name:"Nita Kim", meta:"Joined", color:"#db2777" },
    { name:"Vireak Long", meta:"Ready", color:"#0891b2" },
    { name:"Sophea Mey", meta:"Joined", color:"#ea580c" },
  ];

  const beginExamCountdown = () => {
    countdownTimers.current.forEach(timer=>window.clearTimeout(timer));
    countdownTimers.current = [];
    document.documentElement.requestFullscreen?.().catch(()=>{});
    setOpen(true);
    setCountdown(3);
    countdownTimers.current = [
      window.setTimeout(()=>setCountdown(2), 1000),
      window.setTimeout(()=>setCountdown(1), 2000),
      window.setTimeout(()=>navigate(`/student/exam?code=${encodeURIComponent(code || exam.code)}`), 3000),
    ];
  };

  useEffect(()=>{
    return ()=>countdownTimers.current.forEach(timer=>window.clearTimeout(timer));
  },[]);

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
              <h1 className="mt-3 text-3xl font-black" style={{fontFamily:U,color:INK}}>{exam.title}</h1>
              <p className="mt-1 text-sm text-gray-500" style={{fontFamily:I}}>
                {open ? "The teacher opened the session. You can enter now." : "Students are joining the room. The exam starts when your teacher opens it."}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-gray-50 p-3 text-center">
              <div className="px-4">
                <p className="text-2xl font-black" style={{fontFamily:U,color:INK}}>{joinedStudents.length}</p>
                <p className="text-[11px] font-bold text-gray-400" style={{fontFamily:I}}>Joined</p>
              </div>
              <div className="px-4">
                <p className="text-2xl font-black" style={{fontFamily:U,color:INK}}>{exam.duration}</p>
                <p className="text-[11px] font-bold text-gray-400" style={{fontFamily:I}}>Minutes</p>
              </div>
              <div className="px-4">
                <p className="text-2xl font-black" style={{fontFamily:U,color:INK}}>{exam.questions || 12}</p>
                <p className="text-[11px] font-bold text-gray-400" style={{fontFamily:I}}>Questions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-400" style={{fontFamily:U}}>Joined students</p>
              <p className="mt-1 text-sm text-gray-500" style={{fontFamily:I}}>People currently waiting in this exam session.</p>
            </div>
            {!open&&(
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700" style={{fontFamily:I}}>
                <AlertTriangle size={13}/>Teacher has not started yet
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {joinedStudents.map((student, index)=>{
              const initials = student.name.split(" ").map(part=>part[0]).join("").slice(0,2).toUpperCase();
              return (
                <div key={`${student.name}-${index}`} className={`flex flex-col items-center rounded-2xl border p-5 text-center transition-all ${student.current?"border-emerald-200 bg-emerald-50":"border-gray-100 bg-white"}`}>
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-black text-white shadow-sm ring-4 ring-white" style={{background:student.color,fontFamily:U}}>
                      {initials}
                    </div>
                    <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white" style={{background:open?S:CAMEL}}/>
                  </div>
                  <p className="mt-3 max-w-full truncate text-sm font-black" style={{fontFamily:U,color:INK}}>{student.current ? `${student.name} (You)` : student.name}</p>
                  <p className="mt-1 max-w-full truncate text-xs text-gray-400" style={{fontFamily:I}}>{student.meta}</p>
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
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button onClick={beginExamCountdown}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-xs font-black text-white transition-all hover:bg-white/10"
                    style={{fontFamily:U}}>
                    <Zap size={14}/>[Demo] Start
                  </button>
                  <button onClick={()=>navigate(`/student/instructions?${instructionParams.toString()}`)}
                    className="rounded-2xl px-5 py-3 text-xs font-black transition-all hover:bg-white/10"
                    style={{fontFamily:U,color:SM}}>
                    Back to instructions
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
