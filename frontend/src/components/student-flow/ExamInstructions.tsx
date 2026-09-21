"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/hooks";
import { useSearchParams } from "next/navigation";
import { MOCK_EXAMS } from "@/lib/mock-data";
import { Clock, FileText, CheckCircle2, EyeOff, Check, ArrowRight, Loader2 } from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";
import { joinByCode, registerStudent } from "@/lib/api/session";
import { Logo } from "@/components/Logo";

const S  = "#059669";
const SL = "#ecfdf5";
const SM = "#6ee7b7";

function StudentHeader() {
  return (
    <header className="flex items-center px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <Logo height={44} href="/" />
      </div>
    </header>
  );
}

function SVGInstructions() {
  return (
    <svg viewBox="0 0 360 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="280" cy="60"  r="70" fill={SL} opacity="0.6"/>
      <circle cx="60"  cy="320" r="50" fill="#fef9ef" opacity="0.8"/>
      <rect x="100" y="80" width="160" height="200" rx="16" fill="white" stroke="#e5e7eb" strokeWidth="2"/>
      <rect x="140" y="68" width="80"  height="24"  rx="12" fill={INK}/>
      <circle cx="180" cy="68" r="6" fill="white"/>
      {[110,130,150,170,190,210,230].map((y,i)=>(
        <rect key={y} x="118" y={y} width={i%3===0?124:100} height="8" rx="4" fill={i===0?S:i===1?CAMEL:"#e5e7eb"}/>
      ))}
      <circle cx="240" cy="110" r="22" fill={S}/>
      <path d="M230 110 l7 7 14-14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="80" cy="175" r="20" fill="#f5d0a9"/>
      <path d="M55 240 Q80 210 105 240" fill="#c8a97e" stroke="none"/>
      <rect x="60" y="238" width="40" height="60" rx="8" fill={S}/>
      <line x1="60" y1="248" x2="40"  y2="300" stroke={S} strokeWidth="10" strokeLinecap="round"/>
      <line x1="100" y1="248" x2="118" y2="295" stroke={S} strokeWidth="10" strokeLinecap="round"/>
      <line x1="70" y1="298" x2="66"  y2="340" stroke={CAMEL} strokeWidth="10" strokeLinecap="round"/>
      <line x1="90" y1="298" x2="94"  y2="340" stroke={CAMEL} strokeWidth="10" strokeLinecap="round"/>
      <rect x="114" y="258" width="8" height="36" rx="3" fill="#fef3c7" transform="rotate(-20 118 276)"/>
      <polygon points="110,294 118,294 114,305" fill="#fcd34d"/>
      <ellipse cx="300" cy="340" rx="18" ry="28" fill="#bbf7d0" transform="rotate(-15 300 340)"/>
      <ellipse cx="315" cy="335" rx="15" ry="24" fill={S} opacity="0.7" transform="rotate(10 315 335)"/>
      <rect x="305" y="355" width="6" height="30" rx="3" fill="#6b7280"/>
      {[[310,80],[330,130],[290,200]].map(([cx,cy],i)=>(
        <text key={i} x={cx} y={cy} textAnchor="middle" fontSize="14" fill={CAMEL} opacity="0.7">★</text>
      ))}
      <circle cx="45"  cy="100" r="5" fill={SM} opacity="0.8"/>
      <circle cx="320" cy="270" r="4" fill={CAMEL} opacity="0.6"/>
      <circle cx="155" cy="370" r="6" fill={SL}/>
    </svg>
  );
}

export function ExamInstructions() {
  const navigate  = useNavigate();
  const searchParams = useSearchParams();
  const code = searchParams?.get("code") || "";
  const studentName = searchParams?.get("name") || "";
  const studentId = searchParams?.get("studentId") || "";
  const studentEmail = searchParams?.get("email") || "";
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!code) {
      navigate("/student/enter");
      return;
    }
    joinByCode(code)
      .then(data => {
        setExam(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "Failed to load exam details");
        setLoading(false);
      });
  }, [code, navigate]);
  
  const handleReady = async () => {
    if (!exam) return;
    setRegistering(true);
    try {
      const res = await registerStudent(exam.examId, studentName, studentId, studentEmail);
      localStorage.setItem("student_token", res.token);
      
      const waitingParams = new URLSearchParams();
      waitingParams.set("examId", exam.examId);
      waitingParams.set("code", code);
      navigate(`/student/waiting?${waitingParams.toString()}`);
    } catch (err: any) {
      alert(err.message || "Failed to join exam");
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{background:CREAM}}>
        <StudentHeader/>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex flex-col" style={{background:CREAM}}>
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

  const chips = [
    {icon:Clock,    label:`${exam.duration} minutes`},
    {icon:FileText, label:`${exam.totalQuestions || 12} questions`},
    {icon:CheckCircle2, label:"70% to pass"},
    {icon:EyeOff,   label:"Proctored"},
  ];

  const rules = [
    "Do not switch tabs or open other applications during the exam.",
    "Ensure a stable internet connection before starting.",
    "All answers are auto-saved every 30 seconds.",
    "You may flag questions to revisit before submitting.",
    "Once submitted, answers cannot be changed.",
    "Mathematical workings may be uploaded as a photo via QR code.",
  ];

  return (
    <div className="min-h-screen" style={{background:CREAM}}>
      <StudentHeader/>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col items-center gap-6">
            <div className="w-full max-w-[340px] aspect-square">
              <SVGInstructions/>
            </div>
            <div className="w-full max-w-[340px] bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{fontFamily:U}}>Quick info</p>
              <div className="grid grid-cols-2 gap-3">
                {chips.map(({icon:Icon,label})=>(
                  <div key={label} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{background:SL}}>
                    <Icon size={14} style={{color:S,flexShrink:0}}/>
                    <span className="text-xs font-semibold" style={{fontFamily:U,color:S}}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1.5 w-full" style={{background:`linear-gradient(90deg,${S},${SM})`}}/>
            <div className="p-8">
              <div className="mb-6">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full" style={{background:SL,color:S,fontFamily:U}}>
                  {exam.subject}
                </span>
                <h1 className="text-2xl font-black mt-3 mb-1" style={{fontFamily:U,color:INK}}>{exam.title}</h1>
                <p className="text-sm text-gray-400" style={{fontFamily:I}}>Exam code: <span className="font-semibold text-gray-600">{code}</span></p>
                {(studentName || studentId || studentEmail) && (
                  <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400" style={{fontFamily:U}}>Student</p>
                    <p className="mt-1 text-sm font-black" style={{fontFamily:U,color:INK}}>{studentName || "Student"}</p>
                    <p className="mt-0.5 text-xs text-gray-500" style={{fontFamily:I}}>
                      {[studentId, studentEmail].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{fontFamily:U}}>Instructions</p>
                <div className="space-y-2.5">
                  {rules.map((rule,i)=>(
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5" style={{background:INK,color:"white",fontFamily:U}}>{i+1}</span>
                      <p className="text-sm text-gray-600 leading-relaxed" style={{fontFamily:I}}>{rule}</p>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer mb-6 border-2 transition-all"
                style={{background:agreed?SL:undefined,borderColor:agreed?S:"#e5e7eb"}}>
                <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                  style={{background:agreed?S:undefined,borderColor:agreed?S:"#d1d5db"}}>
                  {agreed&&<Check size={11} className="text-white"/>}
                </div>
                <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} className="hidden"/>
                <p className="text-xs text-gray-600 leading-relaxed" style={{fontFamily:I}}>
                  I have read and understood the instructions. I agree to the <span style={{color:S}}>exam rules and academic integrity policy</span>.
                </p>
              </label>

              <button
                disabled={!agreed || registering}
                onClick={handleReady}
                className="w-full flex items-center justify-center gap-2 text-white font-black py-4 rounded-2xl text-base transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{background:S,fontFamily:U}}>
                {registering ? <Loader2 size={18} className="animate-spin" /> : <>Ready — Join Waiting Room <ArrowRight size={18}/></>}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3" style={{fontFamily:I}}>You will enter the exam once your teacher opens the session.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
