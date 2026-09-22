"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "@/lib/hooks";
import { QTLABELS, QTCOLORS } from "@/lib/mock-data";
import { getExamState, autosaveAnswers, submitExam } from "@/lib/api/session";
import { API_URL } from "@/lib/api/client";
import { useAntiCheat, AntiCheatAction } from "@/lib/useAntiCheat";
import { eventLabel } from "@/lib/violationEvents";
import { Loader2 as Spinner } from "lucide-react";
import { 
  CheckCircle2, X, Clock, AlertTriangle, Lock, AlertOctagon, 
  Upload, QrCode, RefreshCw, BookMarked, ChevronLeft, ChevronRight, LayoutDashboard, Eye, Activity, Check 
} from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";
import { Logo } from "@/components/Logo";

const S  = "#059669";
const SL = "#ecfdf5";
const SM = "#6ee7b7";

interface SQ { id:number; type:string; points:number; text:string; options?:string[]; optionIds?:string[]; pairs?:{L:string;R:string}[]; hint?:string; realId?:string; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BLOCK_SECONDS = 15;

// What the teacher's rule decided — not a local guess. `warned` and `flagged`
// only; blocking and auto-submit have their own screens.
function AntiCheatModal({ notice, onClose }:{notice:AntiCheatAction;onClose:()=>void}) {
  const severity = notice.actionTaken==="flagged"?"flag":"warn";
  const event = eventLabel(notice.eventType);
  const count = notice.occurrenceCount;
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
            {severity==="warn"?"Warning":"Flagged for Review"}
          </h3>
          <p className="text-sm text-gray-500 mb-1" style={{fontFamily:I}}>{event}</p>
          <p className="text-xs text-gray-400 mb-5" style={{fontFamily:I}}>{notice.message} (#{count} recorded)</p>
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

// "Block": the exam screen is locked for a short cooldown. The timer keeps running.
function BlockedOverlay({ event, until, onDone }:{event:string;until:number;onDone:()=>void}) {
  const [left,setLeft] = useState(Math.max(0,Math.ceil((until-Date.now())/1000)));
  useEffect(()=>{
    const t = setInterval(()=>setLeft(Math.max(0,Math.ceil((until-Date.now())/1000))),250);
    return ()=>clearInterval(t);
  },[until]);
  return (
    <div className="fixed inset-0 z-[530] flex items-center justify-center px-4" style={{background:"rgba(127,29,29,0.92)",backdropFilter:"blur(10px)"}}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="h-1.5 w-full bg-red-500"/>
        <div className="p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50"><Lock size={30} className="text-red-500"/></div>
          <h3 className="mb-2 text-2xl font-black" style={{fontFamily:U,color:INK}}>Exam temporarily locked</h3>
          <p className="mb-1 text-sm text-gray-500" style={{fontFamily:I}}>{event}</p>
          <p className="mb-6 text-xs text-gray-400" style={{fontFamily:I}}>Your teacher has been notified. The exam timer keeps running while you wait.</p>
          <button onClick={onDone} disabled={left>0}
            className="w-full rounded-2xl bg-red-600 py-3.5 text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-40" style={{fontFamily:U}}>
            {left>0?`You can continue in ${left}s`:"Return to exam"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CameraRequiredOverlay({ onRetry }:{onRetry:()=>void}) {
  return (
    <div className="fixed inset-0 z-[540] flex items-center justify-center px-4" style={{background:"rgba(13,27,42,0.94)",backdropFilter:"blur(10px)"}}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="h-1.5 w-full" style={{background:S}}/>
        <div className="p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl" style={{background:SL}}><Eye size={30} style={{color:S}}/></div>
          <h3 className="mb-2 text-2xl font-black" style={{fontFamily:U,color:INK}}>Camera required</h3>
          <p className="mb-6 text-sm leading-relaxed text-gray-500" style={{fontFamily:I}}>
            This exam requires your camera. Allow camera access in your browser (and make sure it&apos;s connected), then continue. Nothing is recorded or uploaded — your teacher is only told if the camera stops working.
          </p>
          <button onClick={onRetry} className="w-full rounded-2xl py-3.5 text-sm font-black text-white hover:opacity-90" style={{background:S,fontFamily:U}}>
            Allow camera &amp; continue
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
          <p className="text-xs text-gray-400" style={{fontFamily:I}}>This closes on its own once you&apos;re back online. The exam timer keeps running meanwhile.</p>
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
              <p className="text-center text-[11px] text-gray-400 mb-4" style={{fontFamily:I}}>cheating.me/upload?q={questionId}&amp;session=demo</p>
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

// ─── Component Helpers ────────────────────────────────────────────────────────
function MatchingQuestion({ q, answer, setAnswer, dark, FSC, TEXT, MUTED, BORDER, CARD, S, I, U }: any) {
  const matchAns: Record<string, string> = answer || {};
  const [activePrompt, setActivePrompt] = useState<string | null>(null);

  // All right-side items (shuffled)
  const allRightItems = useMemo(() => {
    const items = (q.pairs || []).map((p: any) => p.R);
    return items.sort(() => Math.random() - 0.5);
  }, [q.pairs]);

  const usedRightItems = Object.values(matchAns);
  const availableRightItems = allRightItems.filter((r: string) => !usedRightItems.includes(r));

  // If no pairs, show a message
  if (!q.pairs || q.pairs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400" style={{ fontFamily: I }}>
        <p>No matching pairs have been defined for this question.</p>
      </div>
    );
  }

  const handlePromptClick = (left: string) => {
    setActivePrompt(left === activePrompt ? null : left);
  };

  const handleAvailableClick = (right: string) => {
    if (activePrompt) {
      setAnswer({ ...matchAns, [activePrompt]: right });
      // Auto-select the next unmatched prompt
      const unmatchedL = (q.pairs || []).map((p: any) => p.L).find((l: string) => l !== activePrompt && !matchAns[l]);
      setActivePrompt(unmatchedL || null);
    }
  };

  const handleRemoveMatch = (left: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newMatch = { ...matchAns };
    delete newMatch[left];
    setAnswer(newMatch);
    if (activePrompt === null) setActivePrompt(left);
  };

  return (
    <div className="space-y-6">
      {/* Two columns: left prompts, right available matches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column – prompts */}
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wider" style={{ color: MUTED, fontFamily: U }}>
            Terms
          </p>
          {(q.pairs || []).map((pair: any, idx: number) => {
            const L = pair.L;
            const matchedR = matchAns[L];
            const isActive = activePrompt === L;

            return (
              <div
                key={`${L}-${idx}`}
                onClick={() => handlePromptClick(L)}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${isActive ? "scale-[1.01]" : ""}`}
                style={{
                  background: isActive ? `${S}14` : CARD,
                  borderColor: isActive ? S : (matchedR ? `${S}66` : BORDER),
                }}
              >
                <span className={`font-semibold ${FSC}`} style={{ fontFamily: I, color: TEXT }}>
                  {L}
                </span>
                {matchedR ? (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
                    style={{ background: S, color: "white" }}
                  >
                    <span style={{ fontFamily: I }}>{matchedR}</span>
                    <button
                      onClick={(e) => handleRemoveMatch(L, e)}
                      className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm" style={{ fontFamily: I, color: MUTED }}>
                    {isActive ? "← Click a match below" : "Click to select"}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Right column – available matches */}
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wider" style={{ color: MUTED, fontFamily: U }}>
            Matches
          </p>
          {availableRightItems.length === 0 ? (
            <div className="p-4 rounded-2xl border-2 border-dashed text-center" style={{ borderColor: BORDER }}>
              <span className="text-sm" style={{ fontFamily: I, color: MUTED }}>
                All matches are paired
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableRightItems.map((R: string, idx: number) => (
                <button
                  key={`${R}-${idx}`}
                  onClick={() => handleAvailableClick(R)}
                  disabled={!activePrompt}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    !activePrompt ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5 shadow-sm"
                  }`}
                  style={{
                    background: CARD,
                    borderColor: activePrompt ? S : BORDER,
                    borderWidth: 2,
                    color: TEXT,
                    fontFamily: I,
                  }}
                >
                  {R}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Help text */}
      {activePrompt && (
        <div className="text-xs text-center" style={{ color: MUTED, fontFamily: I }}>
          Selected: <strong style={{ color: S }}>{activePrompt}</strong> — click a match to pair it.
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function ExamTaking() {
  const navigate = useNavigate();
  const raw  = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const code = raw?.get("code") ?? "";
  const qParam = parseInt(raw?.get("q")??"0")||0;

  // --- Data layer: fetch real exam state from backend ---
  const [examData, setExamData] = useState<any>(null);
  const [examLoading, setExamLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<string>("");
  const [questions, setQuestions] = useState<SQ[]>([]);
  const [exam, setExam] = useState<any>({ title: "Loading...", duration: 0 });

  const [qIdx, setQIdx]           = useState(qParam);
  const [answers, setAnswers]     = useState<Record<number,any>>({});
  const [flagged, setFlagged]     = useState<number[]>([]);
  const [navOpen, setNavOpen]     = useState(false);
  const [secs, setSecs]           = useState(0);
  const [acNotice, setAcNotice]   = useState<AntiCheatAction|null>(null);
  const [block, setBlock]         = useState<{event:string;until:number}|null>(null);
  const [showAccess, setShowAccess] = useState(false);
  const [dark, setDark]           = useState(false);
  const [fs, setFs]               = useState<"sm"|"md"|"lg">("md");
  const [mathUploadQ, setMathUploadQ] = useState<number|null>(null);
  const [mathUploaded, setMathUploaded] = useState<Record<number,boolean>>({});
  const [lockdownBlocked, setLockdownBlocked] = useState(false);
  const acCount = useRef(0);
  const lockdownEventActive = useRef(false);
  const examStateRef = useRef({ qIdx, secs });
  const autosaveTimerRef = useRef<number>(0);

  // Fetch exam state from backend on mount
  useEffect(() => {
    getExamState()
      .then((state) => {
        if (state.timer?.remainingSeconds <= 0) {
          navigate("/student/exam/auto-submit");
          return;
        }

        setExamData(state);
        setAttemptId(state.attemptId);
        setExam(state.snapshot || { title: "Exam", duration: 0 });
        setSecs(state.timer?.remainingSeconds ?? 0);

        // Map snapshot sections/questions to the SQ format
        const snapshot = state.snapshot;
        if (snapshot?.sections) {
          let qIndex = 0;
          const mapped: SQ[] = snapshot.sections.flatMap((section: any) =>
            section.questions.map((q: any) => {
              qIndex++;
              // Map backend question types to component types
              const typeMap: Record<string,string> = {
                MCQ: "mcq", MULTIPLE_SELECT: "checkbox", TRUE_FALSE: "truefalse",
                SHORT_ANSWER: "short", ESSAY: "essay", FILL_IN_BLANK: "fill",
                MATCHING: "matching", CHECKBOX: "checkbox", DROPDOWN: "dropdown",
                FILE_UPLOAD: "file", MATH_FORMULA: "math",
              };
              return {
                id: qIndex,
                realId: q.id, // preserve original ID for API calls
                type: typeMap[q.type] || q.type?.toLowerCase() || "short",
                points: q.points || 1,
                text: q.text || "",
                options: q.options?.map((o: any) => o.text) || undefined,
                optionIds: q.options?.map((o: any) => o.id) || undefined,
                pairs: q.metadata?.pairs || undefined,
                hint: q.metadata?.hint || undefined,
              };
            })
          );
          setQuestions(mapped);
        }

        // Restore autosaved answers if any
        if (state.autosaveData && typeof state.autosaveData === "object") {
          const restored: Record<number, any> = {};
          // autosaveData is keyed by realQuestionId
          // We'll restore after questions are set
          setExamData((prev: any) => ({ ...prev, _restoredAnswers: state.autosaveData }));
        }

        // Restore review flags
        if (state.reviewFlags?.length) {
          // reviewFlags contains real question IDs — will map after questions load
        }

        setExamLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load exam state:", err);
        navigate("/student/enter");
      });
  }, []);

  // Polling fallback to ensure client is synced if SSE fails or auto-submit happens
  useEffect(() => {
    if (!attemptId) return;
    const id = setInterval(async () => {
      try {
        const s = await getExamState();
        if (s.timer?.remainingSeconds !== undefined) setSecs(s.timer.remainingSeconds);
        if (s.submitted) navigate("/student/exam/auto-submit");
      } catch {}
    }, 30_000);
    return () => clearInterval(id);
  }, [attemptId, navigate]);

  // Real-time SSE connection for exam taking
  useEffect(() => {
    if (!attemptId || !examData?.snapshot?.id) return;
    const es = new EventSource(`${API_URL}/session/${examData.snapshot.id}/live?attemptId=${attemptId}`);
    
    es.addEventListener("student_kicked", (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.attemptId === attemptId) {
          alert("You have been removed from the exam.");
          window.location.href = "/student/enter";
        }
      } catch {}
    });

    es.addEventListener("exam_ended", () => {
      alert("The teacher has ended the exam. Submitting your answers...");
      navigate("/student/exam/auto-submit");
    });

    es.addEventListener("session_state", (e) => {
      try {
        const state = JSON.parse(e.data);
        if (state.timer && state.timer.remainingSeconds !== undefined) {
          // Sync timer drift
          setSecs(state.timer.remainingSeconds);
        }
      } catch {}
    });

    return () => es.close();
  }, [attemptId, examData?.snapshot?.id]);

  // Handle instant offline on tab close
  useEffect(() => {
    if (!attemptId) return;
    const handleBeforeUnload = () => {
      navigator.sendBeacon(`${API_URL}/student/leave`, JSON.stringify({ attemptId }));
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [attemptId]);


  const q = questions.length > 0 ? questions[Math.min(qIdx, questions.length-1)] : { id:0, type:"short", points:0, text:"Loading..." } as SQ;

  useEffect(()=>{
    examStateRef.current = { qIdx, secs };
  }, [qIdx, secs]);

  // Timer countdown using server-provided remaining seconds
  useEffect(() => {
    if (secs <= 0 || examLoading) return;
    const t = setInterval(() => {
      setSecs(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [examLoading, secs > 0]);

  // Navigate when timer hits zero
  useEffect(() => {
    if (secs === 0 && !examLoading && attemptId) {
      navigate("/student/exam/auto-submit");
    }
  }, [secs, examLoading, attemptId, navigate]);

  // Auto-save answers every 30 seconds
  useEffect(() => {
    if (!attemptId || examLoading) return;
    autosaveTimerRef.current = window.setInterval(() => {
      const answersToSave: Record<string, { answer: unknown }> = {};
      for (const [qId, ans] of Object.entries(answers)) {
        const question = questions.find(q => q.id === Number(qId));
        if (question && (question as any).realId) {
          answersToSave[(question as any).realId] = { answer: ans };
        }
      }
      if (Object.keys(answersToSave).length > 0) {
        autosaveAnswers(attemptId, answersToSave).catch(() => {});
      }
    }, 30000);
    return () => window.clearInterval(autosaveTimerRef.current);
  }, [attemptId, examLoading, answers, questions]);

  // Save the latest answers first, so if a violation triggers an auto-submit
  // the server grades what the student had actually answered.
  const flushAutosave = async () => {
    if (!attemptId) return;
    const answersToSave: Record<string, { answer: unknown }> = {};
    for (const [qId, ans] of Object.entries(answers)) {
      const question = questions.find(q => q.id === Number(qId));
      if (question && (question as any).realId) answersToSave[(question as any).realId] = { answer: ans };
    }
    if (Object.keys(answersToSave).length > 0) await autosaveAnswers(attemptId, answersToSave).catch(() => {});
  };

  // Detection lives in useAntiCheat; the teacher's rules decide what happens.
  const { offline, mediaBlocked, retryMedia, recheckConnection } = useAntiCheat({
    attemptId,
    active: !!attemptId && !examLoading,
    beforeReport: flushAutosave,
    onDetected: (eventType) => {
      acCount.current++;
      // Leaving the exam screen locks it until the student returns to fullscreen.
      if (eventType==="tab_switch" || eventType==="window_blur" || eventType==="fullscreen_exit") {
        lockdownEventActive.current = true;
        setLockdownBlocked(true);
      }
    },
    onAction: (action) => {
      if (action.actionTaken==="auto_submitted") {
        navigate("/student/exam/auto-submit?reason=violation");
      } else if (action.actionTaken==="blocked") {
        setBlock({ event: eventLabel(action.eventType), until: Date.now() + BLOCK_SECONDS*1000 });
      } else {
        setAcNotice(action); // warned / flagged
      }
    },
  });

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

  const [needsFullscreen, setNeedsFullscreen] = useState(false);
  useEffect(() => {
    const checkFs = () => {
      if (!document.fullscreenElement) setNeedsFullscreen(true);
      else setNeedsFullscreen(false);
    };
    checkFs();
    document.addEventListener("fullscreenchange", checkFs);
    return () => document.removeEventListener("fullscreenchange", checkFs);
  }, []);

  if (needsFullscreen && !lockdownBlocked && !examLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-white text-center" style={{fontFamily:'"Outfit", sans-serif'}}>
        <div className="max-w-md space-y-6">
          <AlertOctagon className="w-24 h-24 mx-auto text-blue-500 animate-bounce" />
          <h1 className="text-3xl font-black tracking-tight">Fullscreen Required</h1>
          <p className="text-gray-300">Your browser prevented automatic fullscreen entry. You must enter fullscreen mode to take this exam.</p>
          <button 
            onClick={() => document.documentElement.requestFullscreen().catch(()=>alert("Please allow fullscreen to continue."))}
            className="w-full py-4 font-bold rounded-xl shadow-lg transition-all text-white hover:opacity-90"
            style={{background: S}}
          >
            Click here to Enter Fullscreen
          </button>
        </div>
      </div>
    );
  }

  const setAnswer = (v:any) => setAnswers(prev=>({...prev,[q.id]:v}));
  const answer = answers[q.id];
  const isFlagged = flagged.includes(q.id);
  const toggleFlag = () => setFlagged(prev=>prev.includes(q.id)?prev.filter(x=>x!==q.id):[...prev,q.id]);
  const goTo = (i:number)=>{ setQIdx(i); setNavOpen(false); };

  const goToReview = async () => {
    // Save state to local storage for the review page
    localStorage.setItem("exam_review_q", JSON.stringify(questions));
    localStorage.setItem("exam_review_a", JSON.stringify(answers));
    localStorage.setItem("exam_review_f", JSON.stringify(flagged));
    localStorage.setItem("exam_review_title", exam.title);
    if (attemptId) {
      localStorage.setItem("exam_review_attempt", attemptId);
      // Autosave right before navigating
      const answersToSave: Record<string, { answer: unknown }> = {};
      for (const [qId, ans] of Object.entries(answers)) {
        const question = questions.find(q => q.id === Number(qId));
        if (question && (question as any).realId) {
          answersToSave[(question as any).realId] = { answer: ans };
        }
      }
      if (Object.keys(answersToSave).length > 0) {
        await autosaveAnswers(attemptId, answersToSave).catch(() => {});
      }
    }
    navigate(`/student/exam/review?code=${code}`);
  };

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
          {q.options!.map((opt,i)=>{
            const optId = q.optionIds![i];
            return (
              <button key={i} onClick={()=>setAnswer(optId)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.01]`}
                style={{background:answer===optId?`${S}14`:CARD,borderColor:answer===optId?S:BORDER}}>
                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{borderColor:answer===optId?S:BORDER,background:answer===optId?S:undefined}}>
                  {answer===optId&&<div className="w-2.5 h-2.5 rounded-full bg-white"/>}
                </div>
                <span className={FSC} style={{fontFamily:I,color:TEXT}}>{opt}</span>
              </button>
            )
          })}
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
        return (
          <MatchingQuestion 
            q={q} 
            answer={answer} 
            setAnswer={setAnswer} 
            dark={dark} 
            FSC={FSC} 
            TEXT={TEXT} 
            MUTED={MUTED} 
            BORDER={BORDER} 
            CARD={CARD} 
            S={S} 
            I={I} 
            U={U} 
          />
        );
      }

      case "checkbox": {
        const cbAns:string[] = answer||[];
        return (
          <div className="space-y-3">
            {q.options!.map((opt,i)=>{
              const optId = q.optionIds![i];
              const checked=cbAns.includes(optId);
              return (
                <button key={i} onClick={()=>setAnswer(checked?cbAns.filter(x=>x!==optId):[...cbAns,optId])}
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
          {/* Answer is the option's id (like MCQ) — that's what grading compares. */}
          {q.options!.map((opt,i)=><option key={i} value={q.optionIds![i]}>{opt}</option>)}
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
      {acNotice&&<AntiCheatModal notice={acNotice} onClose={()=>setAcNotice(null)}/>}
      {block&&<BlockedOverlay event={block.event} until={block.until} onDone={()=>setBlock(null)}/>}
      {offline&&<ConnectionLostOverlay onRetry={recheckConnection}/>}
      {mediaBlocked&&<CameraRequiredOverlay onRetry={retryMedia}/>}
      {mathUploadQ!==null&&<MathUploadFlow questionId={mathUploadQ} onClose={()=>setMathUploadQ(null)} onUploaded={qid=>setMathUploaded(p=>({...p,[qid]:true}))}/>}

      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 lg:px-6 h-14 border-b" style={{background:CARD,borderColor:BORDER}}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Logo height={30} onDark />
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
        <button onClick={goToReview}
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
          <button onClick={goToReview}
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
            <button onClick={goToReview}
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
