"use client";

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@/lib/hooks";
import { MOCK_EXAMS, SESSION_QS, QTLABELS, QTCOLORS } from "@/lib/mock-data";
import { 
  CheckCircle2, X, Clock, AlertTriangle, Lock, AlertOctagon, 
  Upload, QrCode, RefreshCw, BookMarked, ChevronLeft, ChevronRight, LayoutDashboard, Eye, Activity, Check, GraduationCap 
} from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";

const S  = "#059669";
const SL = "#ecfdf5";
const SM = "#6ee7b7";

interface SQ { id:number; type:string; points:number; text:string; options?:string[]; pairs?:{L:string;R:string}[]; hint?:string; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function AntiCheatModal({ event, count, onClose }:{event:string;count:number;onClose:()=>void}) {
  const severity = count>=3?"block":count>=2?"flag":"warn";
  const colors = {warn:{bg:"#fffbeb",border:"#fde68a",icon:"#f59e0b",btn:"#d97706"},flag:{bg:"#fff7ed",border:"#fed7aa",icon:"#f97316",btn:"#ea580c"},block:{bg:"#fff0f0",border:"#fecaca",icon:"#ef4444",btn:"#dc2626"}};
  const cc = colors[severity];
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center px-4" style={{background:"rgba(0,0,0,0.72)",backdropFilter:"blur(8px)"}}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full" style={{background:cc.btn}}/>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center" style={{background:cc.bg}}>
            <AlertTriangle size={30} style={{color:cc.icon}}/>
          </div>
          <h3 className="text-xl font-black mb-1.5" style={{fontFamily:U,color:INK}}>
            {severity==="warn"?"Warning":severity==="flag"?"Flagged for Review":"Exam Blocked"}
          </h3>
          <p className="text-sm text-gray-500 mb-1" style={{fontFamily:I}}>{event}</p>
          <p className="text-xs text-gray-400 mb-5" style={{fontFamily:I}}>Violation #{count} recorded. {count<3?"Further violations may suspend your exam.":"Your teacher has been alerted."}</p>
          <div className="flex items-start gap-2 px-4 py-3 rounded-2xl mb-6 text-left" style={{background:cc.bg,border:`1px solid ${cc.border}`}}>
            <AlertTriangle size={12} style={{color:cc.icon,flexShrink:0,marginTop:2}}/>
            <span className="text-xs" style={{fontFamily:I,color:cc.btn}}>Your activity is being monitored and your teacher has been notified. Please remain on this page.</span>
          </div>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl text-white font-black text-sm hover:opacity-90" style={{background:INK,fontFamily:U}}>
            I understand — return to exam
          </button>
        </div>
      </div>
    </div>
  );
}

function LockdownOverlay({ onResume }:{onResume:()=>void}) {
  return (
    <div className="fixed inset-0 z-[520] flex items-center justify-center px-4" style={{background:"rgba(13,27,42,0.9)",backdropFilter:"blur(10px)"}}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="h-1.5 w-full" style={{background:S}}/>
        <div className="p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl" style={{background:SL}}>
            <Lock size={30} style={{color:S}}/>
          </div>
          <h3 className="mb-2 text-2xl font-black" style={{fontFamily:U,color:INK}}>Exam screen locked</h3>
          <p className="mb-5 text-sm leading-relaxed text-gray-500" style={{fontFamily:I}}>
            Stay in fullscreen during the exam. Switching tabs, leaving fullscreen, or opening another app will be flagged for your teacher.
          </p>
          <button onClick={onResume}
            className="w-full rounded-2xl py-3.5 text-sm font-black text-white transition-all hover:opacity-90"
            style={{background:S,fontFamily:U}}>
            Return to fullscreen exam
          </button>
        </div>
      </div>
    </div>
  );
}

function ConnectionLostOverlay({onRetry}:{onRetry:()=>void}) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center px-4" style={{background:"rgba(0,0,0,0.86)",backdropFilter:"blur(10px)"}}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-red-500 w-full"/>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-50 mx-auto mb-5 flex items-center justify-center">
            <AlertOctagon size={30} className="text-red-500"/>
          </div>
          <h3 className="text-xl font-black mb-2" style={{fontFamily:U,color:INK}}>Connection Lost</h3>
          <p className="text-sm text-gray-500 mb-4" style={{fontFamily:I}}>Your internet connection was interrupted. Your answers are saved locally — nothing will be lost.</p>
          <div className="flex justify-center gap-1.5 mb-6">
            {[0,1,2].map(i=>(
              <div key={i} className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{animationDelay:`${i*150}ms`}}/>
            ))}
          </div>
          <button onClick={onRetry} className="w-full py-3.5 rounded-2xl text-white font-black text-sm hover:opacity-90 mb-2.5" style={{background:INK,fontFamily:U}}>
            Try reconnecting
          </button>
          <p className="text-xs text-gray-400" style={{fontFamily:I}}>Your exam will auto-submit when connection is restored.</p>
        </div>
      </div>
    </div>
  );
}

function QRPattern() {
  return (
    <svg viewBox="0 0 100 100" width="120" height="120">
      <rect x="10" y="10" width="30" height="30" fill="none" stroke="#0D1B2A" strokeWidth="4"/>
      <rect x="15" y="15" width="20" height="20" fill="#0D1B2A"/>
      <rect x="60" y="10" width="30" height="30" fill="none" stroke="#0D1B2A" strokeWidth="4"/>
      <rect x="65" y="15" width="20" height="20" fill="#0D1B2A"/>
      <rect x="10" y="60" width="30" height="30" fill="none" stroke="#0D1B2A" strokeWidth="4"/>
      <rect x="15" y="65" width="20" height="20" fill="#0D1B2A"/>
      
      <rect x="50" y="50" width="10" height="10" fill="#0D1B2A"/>
      <rect x="70" y="60" width="10" height="10" fill="#0D1B2A"/>
      <rect x="60" y="80" width="10" height="10" fill="#0D1B2A"/>
      <rect x="80" y="70" width="10" height="20" fill="#0D1B2A"/>
    </svg>
  );
}

function MathUploadFlow({questionId,onClose,onUploaded}:{questionId:number;onClose:()=>void;onUploaded:(id:number)=>void}) {
  const [step,setStep] = useState<"qr"|"uploading"|"done">("qr");
  const [preview,setPreview] = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (e:React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setStep("uploading");
    setPreview(URL.createObjectURL(f));
    setTimeout(()=>setStep("done"),1400);
  };
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4" style={{background:"rgba(13,27,42,0.72)",backdropFilter:"blur(8px)"}}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="h-1 w-full" style={{background:`linear-gradient(90deg,${INK},${S})`}}/>
        <div className="p-7">
          <div className="flex items-center justify-between mb-6">
            <p className="text-base font-black" style={{fontFamily:U,color:INK}}>Upload Handwritten Solution</p>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X size={14} className="text-gray-500"/></button>
          </div>
          {step==="qr" && (
            <>
              <p className="text-xs text-gray-500 mb-5" style={{fontFamily:I}}>Scan the QR code with your phone to upload a photo, or choose a file directly below.</p>
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-2xl border-2 border-gray-100"><QRPattern/></div>
              </div>
              <p className="text-center text-[11px] text-gray-400 mb-4" style={{fontFamily:I}}>examai.app/upload?q={questionId}&amp;session=demo</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gray-100"/>
                <span className="text-xs text-gray-400" style={{fontFamily:I}}>or upload here</span>
                <div className="h-px flex-1 bg-gray-100"/>
              </div>
              <button onClick={()=>fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-all" style={{fontFamily:U}}>
                <Upload size={15}/>Choose file
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
            </>
          )}
          {step==="uploading" && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <RefreshCw size={28} className="text-emerald-500 animate-spin"/>
              </div>
              <p className="text-sm font-bold text-gray-700" style={{fontFamily:U}}>Uploading your solution…</p>
            </div>
          )}
          {step==="done" && (
            <div className="flex flex-col items-center gap-3">
              {preview && <img src={preview} alt="Uploaded" className="w-full h-40 object-cover rounded-xl mb-1"/>}
              <CheckCircle2 size={32} style={{color:S}}/>
              <p className="text-base font-black" style={{fontFamily:U,color:INK}}>Uploaded successfully!</p>
              <p className="text-xs text-gray-400 text-center mb-2" style={{fontFamily:I}}>Your handwritten solution has been linked to Question {questionId}.</p>
              <button onClick={()=>{onUploaded(questionId);onClose();}}
                className="w-full py-3.5 rounded-2xl text-white font-black text-sm hover:opacity-90" style={{background:S,fontFamily:U}}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionNavigator({questions,answers,flagged,currentIdx,onGoto,dark}:{
  questions:SQ[];answers:Record<number,any>;flagged:number[];currentIdx:number;onGoto:(i:number)=>void;dark:boolean;
}) {
  const isAns = (q:SQ) => {
    const a = answers[q.id];
    if (a===undefined||a===null||a==="") return false;
    if (Array.isArray(a)) return a.length>0;
    if (typeof a==="object") return Object.keys(a).length>0;
    return true;
  };
  const answered = questions.filter(isAns).length;
  const TEXT   = dark?"#f9fafb":INK;
  const BORDER = dark?"#374151":"#e5e7eb";
  return (
    <div className="flex flex-col gap-4 p-4 rounded-2xl border" style={{background:dark?"#1e2d3d":"white",borderColor:BORDER}}>
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2.5" style={{fontFamily:U}}>Questions</p>
        <div className="grid grid-cols-6 gap-1.5">
          {questions.map((q,i) => {
            const ans = isAns(q);
            const fl  = flagged.includes(q.id);
            const cur = i===currentIdx;
            const bg    = cur?INK:fl?"#fffbeb":ans?`${S}22`:dark?"#374151":"#f3f4f6";
            const color = cur?"white":fl?"#d97706":ans?S:dark?"#9ca3af":"#6b7280";
            return (
              <button key={q.id} onClick={()=>onGoto(i)}
                className="w-9 h-9 rounded-xl text-xs font-black flex items-center justify-center transition-all hover:scale-110"
                style={{background:bg,color,border:`2px solid ${cur?INK:fl?"#fde68a":ans?`${S}44`:"transparent"}`,fontFamily:U}}>
                {fl?"⚑":q.id}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {[{bg:`${S}22`,c:S,l:`${answered} Answered`},{bg:"#fffbeb",c:"#d97706",l:`${flagged.length} Flagged`},{bg:dark?"#374151":"#f3f4f6",c:dark?"#9ca3af":"#9ca3af",l:`${questions.length-answered} Left`}].map(({bg,c,l})=>(
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{background:bg}}/>
            <span className="text-[10px] text-gray-400" style={{fontFamily:I}}>{l}</span>
          </div>
        ))}
      </div>
      <div>
        <div className="h-1.5 rounded-full" style={{background:dark?"#374151":"#f3f4f6"}}>
          <div className="h-full rounded-full transition-all" style={{width:`${(answered/questions.length)*100}%`,background:S}}/>
        </div>
        <p className="text-[10px] text-gray-400 mt-1" style={{fontFamily:I}}>{answered} of {questions.length} answered</p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function ExamTaking() {
  const navigate = useNavigate();
  const raw  = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const code = raw?.get("code") ?? "CALC-2026-XZ";
  const qParam = parseInt(raw?.get("q")??"0")||0;
  const exam = MOCK_EXAMS.find(e=>e.code.toUpperCase()===code.toUpperCase()) ?? {
    ...MOCK_EXAMS[0], title:"Calculus Final Exam", duration:90,
  };

  const [qIdx, setQIdx]           = useState(qParam);
  const [answers, setAnswers]     = useState<Record<number,any>>({});
  const [flagged, setFlagged]     = useState<number[]>([]);
  const [navOpen, setNavOpen]     = useState(false);
  const [secs, setSecs]           = useState(exam.duration*60);
  const [antiCheat, setAntiCheat] = useState<{event:string;count:number}|null>(null);
  const [connLost, setConnLost]   = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const [dark, setDark]           = useState(false);
  const [fs, setFs]               = useState<"sm"|"md"|"lg">("md");
  const [mathUploadQ, setMathUploadQ] = useState<number|null>(null);
  const [mathUploaded, setMathUploaded] = useState<Record<number,boolean>>({});
  const [lockdownBlocked, setLockdownBlocked] = useState(false);
  const acCount = useRef(0);
  const lockdownEventActive = useRef(false);
  const examStateRef = useRef({ qIdx, secs });
  const questions = SESSION_QS as SQ[];
  const q = questions[Math.min(qIdx, questions.length-1)];

  useEffect(()=>{
    examStateRef.current = { qIdx, secs };
  }, [qIdx, secs]);

  useEffect(()=>{
    if (secs<=0) return;
    const t = setInterval(()=>setSecs(s=>{ if(s<=1){clearInterval(t);navigate("/student/exam/auto-submit");return 0;} return s-1; }),1000);
    return ()=>clearInterval(t);
  },[]);

  const recordExamViolation = (event: string, blockExam = false) => {
    acCount.current++;
    setAntiCheat({event,count:acCount.current});
    if (blockExam) {
      lockdownEventActive.current = true;
      setLockdownBlocked(true);
    }
  };

  const recordLockdownIssue = (event: string) => {
    if (!lockdownEventActive.current) recordExamViolation(event, true);
    else setLockdownBlocked(true);
  };

  const resumeFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      lockdownEventActive.current = false;
      setLockdownBlocked(false);
    } catch {
      setLockdownBlocked(true);
    }
  };

  useEffect(()=>{
    const onVisibility=()=>{ if(document.hidden) recordLockdownIssue("Tab switch detected — stay in the locked exam screen."); };
    const onFullscreen=()=>{ if(!document.fullscreenElement) recordLockdownIssue("Fullscreen exited — return to lockdown mode."); };
    const onBlur=()=>recordLockdownIssue("Window focus lost — do not switch apps during the exam.");
    const blockAttempt = (event: Event, message: string) => {
      event.preventDefault();
      event.stopPropagation();
      recordExamViolation(message);
    };
    const onContextMenu=(e:MouseEvent)=>blockAttempt(e, "Right-click blocked during the exam.");
    const onCopy=(e:ClipboardEvent)=>blockAttempt(e, "Copy attempt blocked during the exam.");
    const onCut=(e:ClipboardEvent)=>blockAttempt(e, "Cut attempt blocked during the exam.");
    const onPaste=(e:ClipboardEvent)=>blockAttempt(e, "Paste attempt blocked during the exam.");
    const onSelect=(e:Event)=>blockAttempt(e, "Text selection blocked during the exam.");
    const onDrag=(e:DragEvent)=>blockAttempt(e, "Drag or drop attempt blocked during the exam.");
    const onKeyDown=(e:KeyboardEvent)=>{
      const key = e.key.toLowerCase();
      const meta = e.ctrlKey || e.metaKey;
      const blockedCombo = meta && ["a","c","f","l","n","p","r","s","t","u","v","w","x"].includes(key);
      const blockedDevTools = (meta && e.shiftKey && ["c","i","j"].includes(key)) || key==="f12";
      const blockedNavigation = e.altKey && ["arrowleft","arrowright","tab"].includes(key);
      if (blockedCombo || blockedDevTools || blockedNavigation || key==="printscreen") {
        blockAttempt(e, `Keyboard shortcut blocked: ${e.key}`);
      }
    };

    if (!document.fullscreenElement) setLockdownBlocked(true);
    document.addEventListener("visibilitychange",onVisibility);
    document.addEventListener("fullscreenchange",onFullscreen);
    document.addEventListener("contextmenu",onContextMenu);
    document.addEventListener("copy",onCopy);
    document.addEventListener("cut",onCut);
    document.addEventListener("paste",onPaste);
    document.addEventListener("selectstart",onSelect);
    document.addEventListener("dragstart",onDrag);
    document.addEventListener("drop",onDrag);
    document.addEventListener("keydown",onKeyDown,true);
    window.addEventListener("blur",onBlur);
    return ()=>{
      document.removeEventListener("visibilitychange",onVisibility);
      document.removeEventListener("fullscreenchange",onFullscreen);
      document.removeEventListener("contextmenu",onContextMenu);
      document.removeEventListener("copy",onCopy);
      document.removeEventListener("cut",onCut);
      document.removeEventListener("paste",onPaste);
      document.removeEventListener("selectstart",onSelect);
      document.removeEventListener("dragstart",onDrag);
      document.removeEventListener("drop",onDrag);
      document.removeEventListener("keydown",onKeyDown,true);
      window.removeEventListener("blur",onBlur);
    };
  },[]);

  useEffect(()=>{
    let active = true;
    let timer: number;
    const writeSnapshot = () => {
      if (!active) return;
      const snapshots = JSON.parse(localStorage.getItem("examIntegritySnapshots") || "[]");
      snapshots.push({
        code,
        at:new Date().toISOString(),
        question:examStateRef.current.qIdx + 1,
        secondsLeft:examStateRef.current.secs,
        fullscreen:!!document.fullscreenElement,
        visible:!document.hidden,
        violations:acCount.current,
      });
      localStorage.setItem("examIntegritySnapshots", JSON.stringify(snapshots.slice(-60)));
      timer = window.setTimeout(writeSnapshot, 25000 + Math.floor(Math.random() * 30000));
    };
    timer = window.setTimeout(writeSnapshot, 12000);
    return ()=>{
      active = false;
      window.clearTimeout(timer);
    };
  }, [code]);

  const setAnswer = (v:any) => setAnswers(prev=>({...prev,[q.id]:v}));
  const answer = answers[q.id];
  const isFlagged = flagged.includes(q.id);
  const toggleFlag = () => setFlagged(prev=>prev.includes(q.id)?prev.filter(x=>x!==q.id):[...prev,q.id]);
  const goTo = (i:number)=>{ setQIdx(i); setNavOpen(false); };

  const pad=(n:number)=>String(n).padStart(2,"0");
  const hrs=Math.floor(secs/3600), min=Math.floor((secs%3600)/60), sec=secs%60;
  const timerStr = hrs>0?`${pad(hrs)}:${pad(min)}:${pad(sec)}`:`${pad(min)}:${pad(sec)}`;
  const timerColor = secs<300?"#ef4444":secs<600?"#f97316":S;
  const timerBg   = secs<300?"#fff0f0":secs<600?"#fff7ed":SL;
  const timerBdr  = secs<300?"#fecaca":secs<600?"#fed7aa":`${S}44`;

  const BG     = dark?"#0f172a":CREAM;
  const CARD   = dark?"#1e293b":"white";
  const TEXT   = dark?"#f1f5f9":INK;
  const MUTED  = dark?"#94a3b8":"#6b7280";
  const BORDER = dark?"#334155":"#e5e7eb";
  const FSC    = {sm:"text-sm",md:"text-base",lg:"text-lg"}[fs];
  const FSL    = {sm:"text-base",md:"text-xl",lg:"text-2xl"}[fs];
  const qtc    = QTCOLORS[q.type]??{bg:"#f3f4f6",c:"#6b7280"};

  const renderQ = ()=>{
    const iBase = `w-full rounded-2xl px-4 py-3 border-2 text-base focus:outline-none transition-all ${dark?"bg-slate-700 border-slate-600 text-slate-50 placeholder:text-slate-400 focus:border-emerald-500":"bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-gray-400"}`;

    switch(q.type){
      case "mcq": return (
        <div className="space-y-3">
          {q.options!.map((opt,i)=>(
            <button key={i} onClick={()=>setAnswer(i)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.01]`}
              style={{background:answer===i?`${S}14`:CARD,borderColor:answer===i?S:BORDER}}>
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{borderColor:answer===i?S:BORDER,background:answer===i?S:undefined}}>
                {answer===i&&<div className="w-2.5 h-2.5 rounded-full bg-white"/>}
              </div>
              <span className={FSC} style={{fontFamily:I,color:TEXT}}>{opt}</span>
            </button>
          ))}
        </div>
      );

      case "truefalse": return (
        <div className="flex gap-4">
          {["True","False"].map(v=>(
            <button key={v} onClick={()=>setAnswer(v)}
              className="flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all hover:scale-[1.02]"
              style={{background:answer===v?(v==="True"?`${S}14`:"#fff0f0"):CARD,borderColor:answer===v?(v==="True"?S:"#ef4444"):BORDER}}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:answer===v?(v==="True"?S:"#ef4444"):dark?"#334155":"#f3f4f6"}}>
                {v==="True"?<Check size={22} style={{color:answer===v?"white":MUTED}}/>:<X size={22} style={{color:answer===v?"white":MUTED}}/>}
              </div>
              <span className="font-black text-lg" style={{fontFamily:U,color:answer===v?(v==="True"?S:"#ef4444"):TEXT}}>{v}</span>
            </button>
          ))}
        </div>
      );

      case "short": return (
        <input type="text" value={answer||""} onChange={e=>setAnswer(e.target.value)}
          placeholder="Type your answer here…" className={`${iBase} ${FSC}`} style={{fontFamily:I}}/>
      );

      case "essay": return (
        <div>
          <textarea value={answer||""} onChange={e=>setAnswer(e.target.value)} rows={8}
            placeholder="Write your answer here…"
            className={`${iBase} resize-none leading-relaxed ${FSC}`} style={{fontFamily:I}}/>
          <p className="text-xs mt-1.5 text-right" style={{color:MUTED,fontFamily:I}}>{(answer||"").length} characters</p>
        </div>
      );

      case "fill": return (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border ${dark?"border-slate-600 bg-slate-700":"border-gray-100 bg-gray-50"}`}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:MUTED,fontFamily:U}}>Complete the sentence:</p>
            <p className={`font-semibold leading-loose ${FSC}`} style={{fontFamily:I,color:TEXT}}>
              {q.text.replace("___","______")}
            </p>
          </div>
          <input type="text" value={answer||""} onChange={e=>setAnswer(e.target.value)}
            placeholder="Your answer for the blank…" className={`${iBase} ${FSC}`} style={{fontFamily:I}}/>
          {q.hint&&<p className="text-xs" style={{color:MUTED,fontFamily:I}}>💡 {q.hint}</p>}
        </div>
      );

      case "matching": {
        const matchAns:Record<string,string> = answer||{};
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-1 px-1">
              <p className="text-xs font-black uppercase tracking-wider" style={{color:MUTED,fontFamily:U}}>Function</p>
              <p className="text-xs font-black uppercase tracking-wider" style={{color:MUTED,fontFamily:U}}>Derivative</p>
            </div>
            {q.pairs!.map(pair=>(
              <div key={pair.L} className="grid grid-cols-2 gap-3 items-center">
                <div className={`p-3.5 rounded-xl text-sm font-semibold ${FSC}`} style={{background:dark?"#334155":"#f9fafb",color:TEXT,fontFamily:I}}>{pair.L}</div>
                <select value={matchAns[pair.L]||""} onChange={e=>setAnswer({...matchAns,[pair.L]:e.target.value})}
                  className="p-3.5 rounded-xl border-2 text-sm focus:outline-none cursor-pointer transition-all"
                  style={{background:CARD,borderColor:matchAns[pair.L]?S:BORDER,color:matchAns[pair.L]?TEXT:MUTED,fontFamily:I}}>
                  <option value="">Select…</option>
                  {q.pairs!.map(p=><option key={p.R} value={p.R}>{p.R}</option>)}
                </select>
              </div>
            ))}
          </div>
        );
      }

      case "checkbox": {
        const cbAns:number[] = answer||[];
        return (
          <div className="space-y-3">
            {q.options!.map((opt,i)=>{
              const checked=cbAns.includes(i);
              return (
                <button key={i} onClick={()=>setAnswer(checked?cbAns.filter(x=>x!==i):[...cbAns,i])}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.01] ${FSC}`}
                  style={{background:checked?`${S}14`:CARD,borderColor:checked?S:BORDER}}>
                  <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{background:checked?S:undefined,borderColor:checked?S:BORDER}}>
                    {checked&&<Check size={11} className="text-white"/>}
                  </div>
                  <span style={{fontFamily:I,color:TEXT}}>{opt}</span>
                </button>
              );
            })}
          </div>
        );
      }

      case "dropdown": return (
        <select value={answer||""} onChange={e=>setAnswer(e.target.value)}
          className={`w-full p-4 rounded-2xl border-2 focus:outline-none cursor-pointer transition-all ${FSC}`}
          style={{background:CARD,borderColor:answer?S:BORDER,color:answer?TEXT:MUTED,fontFamily:I}}>
          <option value="">Select your answer…</option>
          {q.options!.map((opt,i)=><option key={i} value={opt}>{opt}</option>)}
        </select>
      );

      case "file":
      case "math": {
        const isFile=q.type==="file";
        const uploaded=mathUploaded[q.id];
        return (
          <div className="space-y-4">
            {!isFile&&(
              <div>
                <input type="text" value={answer||""} onChange={e=>setAnswer(e.target.value)}
                  placeholder="Type your answer (e.g. x³ + x² − x + C)…" className={`${iBase} ${FSC}`} style={{fontFamily:I}}/>
                {q.hint&&<p className="text-xs mt-1.5 ml-1" style={{color:MUTED,fontFamily:I}}>💡 {q.hint}</p>}
              </div>
            )}
            <div className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all ${uploaded?"border-emerald-300":dark?"border-slate-600":"border-gray-200"}`}
              style={{background:uploaded?SL:undefined}}>
              {uploaded?(
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 size={28} style={{color:S}}/>
                  <p className="text-sm font-black" style={{fontFamily:U,color:S}}>Handwritten solution uploaded</p>
                  <button onClick={()=>setMathUploadQ(q.id)} className="text-xs underline" style={{color:MUTED,fontFamily:I}}>Replace</button>
                </div>
              ):(
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:dark?"#334155":"#f3f4f6"}}>
                    <Upload size={20} style={{color:MUTED}}/>
                  </div>
                  <div>
                    <p className="text-sm font-black" style={{fontFamily:U,color:TEXT}}>{isFile?"Upload your file":"Upload handwritten solution"}</p>
                    <p className="text-xs mt-0.5" style={{fontFamily:I,color:MUTED}}>Scan QR with your phone or upload directly</p>
                  </div>
                  <button onClick={()=>setMathUploadQ(q.id)}
                    className="flex items-center gap-2 text-sm font-black px-5 py-2.5 rounded-xl text-white hover:opacity-90"
                    style={{background:S,fontFamily:U}}>
                    <QrCode size={14}/>Upload solution
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      }

      default: return <p className="text-sm text-gray-400" style={{fontFamily:I}}>Question type not supported in demo.</p>;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col select-none"
      style={{background:BG,userSelect:"none",WebkitUserSelect:"none"}}
      onCopy={e=>e.preventDefault()}
      onCut={e=>e.preventDefault()}
      onPaste={e=>e.preventDefault()}
      onContextMenu={e=>e.preventDefault()}
      onDragStart={e=>e.preventDefault()}
    >
      {lockdownBlocked&&<LockdownOverlay onResume={resumeFullscreen}/>}
      {antiCheat&&<AntiCheatModal event={antiCheat.event} count={antiCheat.count} onClose={()=>setAntiCheat(null)}/>}
      {connLost&&<ConnectionLostOverlay onRetry={()=>setConnLost(false)}/>}
      {mathUploadQ!==null&&<MathUploadFlow questionId={mathUploadQ} onClose={()=>setMathUploadQ(null)} onUploaded={qid=>setMathUploaded(p=>({...p,[qid]:true}))}/>}

      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 lg:px-6 h-14 border-b" style={{background:CARD,borderColor:BORDER}}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:INK}}>
            <GraduationCap size={13} className="text-white"/>
          </div>
          <span className="text-sm font-black hidden sm:block truncate max-w-[140px]" style={{fontFamily:U,color:TEXT}}>{exam.title}</span>
        </div>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="flex-1 h-1.5 rounded-full" style={{background:dark?"#334155":"#e5e7eb"}}>
            <div className="h-full rounded-full transition-all" style={{width:`${((qIdx+1)/questions.length)*100}%`,background:S}}/>
          </div>
          <span className="text-xs font-semibold whitespace-nowrap" style={{fontFamily:U,color:MUTED}}>{qIdx+1}/{questions.length}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border flex-shrink-0"
          style={{background:timerBg,borderColor:timerBdr}}>
          <Clock size={12} style={{color:timerColor}}/>
          <span className="text-sm font-black tabular-nums" style={{fontFamily:U,color:timerColor}}>{timerStr}</span>
        </div>
        <div className="relative flex items-center gap-1.5 flex-shrink-0">
          <button onClick={()=>setShowAccess(s=>!s)} title="Accessibility" className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70" style={{background:dark?"#334155":"#f3f4f6"}}>
            <Eye size={14} style={{color:MUTED}}/>
          </button>
          <button onClick={()=>setConnLost(true)} title="[Demo] Simulate connection loss" className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70" style={{background:dark?"#334155":"#f3f4f6"}}>
            <Activity size={14} style={{color:MUTED}}/>
          </button>
          {showAccess&&(
            <div className="absolute top-10 right-0 z-50 rounded-2xl border shadow-xl p-5 w-64" style={{background:CARD,borderColor:BORDER}}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black" style={{fontFamily:U,color:TEXT}}>Accessibility</p>
                <button onClick={()=>setShowAccess(false)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{background:dark?"#334155":"#f3f4f6"}}>
                  <X size={11} style={{color:MUTED}}/>
                </button>
              </div>
              <div className="flex items-center justify-between py-3 border-b" style={{borderColor:BORDER}}>
                <div>
                  <p className="text-xs font-semibold" style={{fontFamily:U,color:TEXT}}>Dark mode</p>
                  <p className="text-[10px] text-gray-400" style={{fontFamily:I}}>Easier on the eyes</p>
                </div>
                <button 
                  onClick={() => setDark(d => !d)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${dark ? "bg-emerald-600" : "bg-gray-300"}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${dark ? "translate-x-4" : ""}`} />
                </button>
              </div>
              <div className="pt-3">
                <p className="text-xs font-semibold mb-2.5" style={{fontFamily:U,color:TEXT}}>Text size</p>
                <div className="flex gap-2">
                  {(["sm","md","lg"] as const).map(size=>(
                    <button key={size} onClick={()=>setFs(size)}
                      className="flex-1 py-2 rounded-xl border text-xs font-black transition-all"
                      style={{background:fs===size?INK:CARD,color:fs===size?"white":MUTED,borderColor:fs===size?"transparent":BORDER,fontFamily:U}}>
                      {size==="sm"?"A−":size==="md"?"A":"A+"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <button onClick={()=>navigate(`/student/exam/review?code=${code}`)}
          className="flex items-center gap-1.5 text-white text-xs font-black px-4 py-2 rounded-xl hover:opacity-90 flex-shrink-0"
          style={{background:S,fontFamily:U}}>
          Submit
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="text-xs font-black px-2.5 py-1.5 rounded-full" style={{background:qtc.bg,color:qtc.c,fontFamily:U}}>{QTLABELS[q.type]||q.type}</span>
              <span className="text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{background:dark?"#334155":"#f3f4f6",color:MUTED,fontFamily:U}}>{q.points} pts</span>
              {isFlagged&&<span className="text-xs font-bold px-2.5 py-1.5 rounded-full bg-amber-50 text-amber-600" style={{fontFamily:U}}>⚑ Flagged</span>}
            </div>
            <p className={`font-bold leading-relaxed mb-6 ${FSL}`} style={{fontFamily:U,color:TEXT}}>{q.text}</p>
            {renderQ()}
          </div>
        </div>
        
        <div className="hidden lg:flex flex-col gap-3 w-64 p-4 border-l overflow-y-auto flex-shrink-0" style={{borderColor:BORDER,background:dark?"#0f172a":undefined}}>
          <QuestionNavigator questions={questions} answers={answers} flagged={flagged} currentIdx={qIdx} onGoto={goTo} dark={dark}/>
          <button onClick={toggleFlag}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all`}
            style={{borderColor:isFlagged?"#fde68a":BORDER,background:isFlagged?"#fffbeb":CARD,color:isFlagged?"#b45309":MUTED,fontFamily:U}}>
            <BookMarked size={13}/>{isFlagged?"Unflag question":"Flag for review"}
          </button>
          <button onClick={()=>navigate(`/student/exam/review?code=${code}`)}
            className="w-full py-2.5 rounded-xl text-white text-xs font-black hover:opacity-90"
            style={{background:S,fontFamily:U}}>
            Review &amp; Submit
          </button>
        </div>
      </div>

      {navOpen&&(
        <div className="fixed inset-0 z-40 flex items-end lg:hidden" style={{background:"rgba(0,0,0,0.5)"}} onClick={()=>setNavOpen(false)}>
          <div className="w-full rounded-t-3xl p-6 pb-8" style={{background:CARD}} onClick={e=>e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-5"/>
            <QuestionNavigator questions={questions} answers={answers} flagged={flagged} currentIdx={qIdx} onGoto={goTo} dark={dark}/>
            <button onClick={()=>navigate(`/student/exam/review?code=${code}`)}
              className="w-full mt-4 py-3.5 rounded-2xl text-white font-black text-sm hover:opacity-90" style={{background:S,fontFamily:U}}>
              Review &amp; Submit
            </button>
          </div>
        </div>
      )}

      <footer className="sticky bottom-0 z-30 flex items-center gap-3 px-4 py-3 border-t" style={{background:CARD,borderColor:BORDER}}>
        <button onClick={()=>setQIdx(i=>Math.max(0,i-1))} disabled={qIdx===0}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all disabled:opacity-30"
          style={{borderColor:BORDER,color:TEXT,background:CARD,fontFamily:U}}>
          <ChevronLeft size={14}/>Prev
        </button>
        <button onClick={()=>setNavOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 text-xs font-black py-2.5 rounded-xl lg:hidden"
          style={{background:dark?"#334155":"#f3f4f6",color:TEXT,fontFamily:U}}>
          <LayoutDashboard size={13}/>Q {qIdx+1} / {questions.length}
        </button>
        <div className="hidden sm:flex flex-1 items-center justify-center gap-2">
          <button onClick={toggleFlag}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all`}
            style={{borderColor:isFlagged?"#fde68a":BORDER,background:isFlagged?"#fffbeb":CARD,color:isFlagged?"#b45309":MUTED,fontFamily:U}}>
            <BookMarked size={13}/>{isFlagged?"Flagged":"Flag"}
          </button>
        </div>
        <button onClick={()=>setQIdx(i=>Math.min(questions.length-1,i+1))} disabled={qIdx===questions.length-1}
          className="flex items-center gap-1.5 text-xs font-black px-4 py-2.5 rounded-xl text-white transition-all disabled:opacity-30"
          style={{background:S,fontFamily:U}}>
          Next<ChevronRight size={14}/>
        </button>
      </footer>
    </div>
  );
}
