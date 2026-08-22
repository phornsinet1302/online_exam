"use client";

import { useState } from "react";
import {
  ChevronDown, ArrowRight, Check, Star, Shield, Zap,
  BarChart3, Eye, Users, FileCheck, Brain, Clock, Hash,
  Twitter, Linkedin, Youtube, Globe, Lock,
  CheckCircle2, GraduationCap, Menu, X, RefreshCw, EyeOff,
} from "lucide-react";
import { U, I, INK, CAMEL, CREAM, BLUE } from "@/lib/tokens";
import { useNavigate } from "@/lib/hooks";

// ─── Enter Code Modal ─────────────────────────────────────────────────────────
export function EnterCodeModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const upper = code.trim().toUpperCase();
    if (!upper) return;
    onClose();
    navigate(`/student/info?code=${encodeURIComponent(upper)}`);
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: "rgba(13,27,42,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-[400px] shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500"><X size={15}/></button>
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: "#F0EDE8" }}><Hash size={22} style={{ color: CAMEL }}/></div>
          <h3 className="text-2xl font-bold mb-1.5" style={{ fontFamily: U, color: INK }}>Enter your exam code</h3>
          <p className="text-sm text-gray-500" style={{ fontFamily: I }}>Your teacher will provide this code before the exam.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. MATH-2024-XZ"
            maxLength={20} autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.18em] text-gray-900 placeholder:text-gray-300 placeholder:text-base placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-gray-400 transition-colors mb-4 bg-gray-50"
            style={{ fontFamily: U }}/>
          <button type="submit" disabled={!code.trim()} className="w-full text-white font-bold py-4 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 mb-3 text-base" style={{ background: INK, fontFamily: U }}>Start exam</button>
        </form>
        <button onClick={onClose} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors" style={{ fontFamily: I }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
export function AuthModal({ mode, onClose, onSwitch }: { mode: "login" | "register"; onClose: () => void; onSwitch: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    const isTeacherDemo = email.trim().toLowerCase() === "teacher@gmail.com" && password === "123";
    if (mode === "login" && !isTeacherDemo) {
      setTimeout(() => { setLoading(false); setAuthError("Use teacher@gmail.com and password 123 to sign in."); }, 500);
      return;
    }
    setTimeout(() => { setLoading(false); onClose(); navigate("/dashboard"); }, 900);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" style={{ background: "rgba(13,27,42,0.65)", backdropFilter: "blur(10px)" }} onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-[420px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: INK }}><GraduationCap size={15} className="text-white"/></div>
              <span className="text-base font-black" style={{ fontFamily: U, color: INK }}>exam<span style={{ color: CAMEL }}>·ai</span></span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"><X size={15}/></button>
          </div>
          <h2 className="text-2xl font-black mb-1" style={{ fontFamily: U, color: INK }}>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: I }}>{mode === "login" ? "Sign in to access your teacher dashboard." : "Start your 30-day free trial today."}</p>
          <button type="button" className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:bg-gray-50 rounded-xl py-3 text-sm font-semibold text-gray-700 transition-all mb-4" style={{ fontFamily: U }}>
            <svg width="17" height="17" viewBox="0 0 48 48" fill="none"><path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" fill="#FFC107"/><path d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" fill="#FF3D00"/><path d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C9.7 35.6 16.3 44 24 44z" fill="#4CAF50"/><path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.1-2.2 3.9-4 5.2l6.2 5.2C37.2 38.6 44 33.3 44 24c0-1.2-.1-2.3-.4-3.5z" fill="#1976D2"/></svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-4"><div className="flex-1 h-px bg-gray-200"/><span className="text-xs text-gray-400" style={{ fontFamily: I }}>or</span><div className="flex-1 h-px bg-gray-200"/></div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === "register" && <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors" style={{ fontFamily: I }}/>}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Work email" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors" style={{ fontFamily: I }}/>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors" style={{ fontFamily: I }}/>
              <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
            </div>
            {authError && <p className="text-xs font-semibold text-red-500" style={{ fontFamily: I }}>{authError}</p>}
            {mode === "login" && <div className="flex justify-end -mt-1"><button type="button" className="text-xs font-semibold hover:underline" style={{ color: CAMEL, fontFamily: U }}>Forgot password?</button></div>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] mt-1 disabled:opacity-60" style={{ background: INK, fontFamily: U }}>
              {loading ? <RefreshCw size={15} className="animate-spin"/> : mode === "login" ? "Sign in to dashboard" : "Create free account"}
            </button>
          </form>
          <p className="text-center text-xs text-gray-500 mt-5" style={{ fontFamily: I }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={onSwitch} className="font-semibold hover:underline" style={{ color: CAMEL }}>{mode === "login" ? "Sign up free" : "Sign in"}</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Landing Navbar ───────────────────────────────────────────────────────────
export function LandingNavbar({ onEnterCode, onSignIn, onSignUp }: { onEnterCode: () => void; onSignIn: () => void; onSignUp: () => void }) {
  const [open, setOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const navLinks = [{ label: "How it works", dropdown: true }, { label: "Pricing", dropdown: false }, { label: "Customers", dropdown: true }, { label: "Resources", dropdown: true }];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center gap-8">
        <a href="#" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: INK }}><GraduationCap size={16} className="text-white"/></div>
          <span className="text-[17px] font-black tracking-tight" style={{ fontFamily: U, color: INK }}>exam<span style={{ color: CAMEL }}>·ai</span></span>
        </a>
        <div className="hidden lg:flex items-center gap-6 flex-1">
          {navLinks.map(({ label, dropdown }) => (
            <button key={label} className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors" style={{ fontFamily: I }}>
              {label}{dropdown && <ChevronDown size={13} className="opacity-50"/>}
            </button>
          ))}
        </div>
        <div className="hidden lg:flex items-center border border-gray-200 rounded-full overflow-hidden bg-gray-50 flex-shrink-0">
          <input value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && onEnterCode()} placeholder="Student exam key" maxLength={14}
            className="bg-transparent text-sm pl-4 pr-2 py-2.5 w-40 focus:outline-none text-gray-700 placeholder:text-gray-400" style={{ fontFamily: I }}/>
          <button onClick={onEnterCode} className="flex items-center gap-1.5 text-white text-xs font-semibold px-4 py-2.5 transition-all hover:opacity-90 rounded-full m-0.5" style={{ background: CAMEL, fontFamily: U }}>
            <ArrowRight size={13}/>Enter
          </button>
        </div>
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <button onClick={onSignIn} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2" style={{ fontFamily: I }}>Sign in</button>
          <button onClick={onSignUp} className="text-sm font-semibold text-white px-5 py-2.5 rounded-full transition-all hover:opacity-90 shadow-md" style={{ background: INK, fontFamily: U }}>Sign up free</button>
        </div>
        <button className="lg:hidden ml-auto p-2 text-gray-600" onClick={() => setOpen(!open)}>{open ? <X size={20}/> : <Menu size={20}/>}</button>
      </div>
      {open && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-6 pb-5 flex flex-col gap-2">
          {navLinks.map(({ label }) => <a key={label} href="#" className="text-sm font-medium text-gray-600 py-3 border-b border-gray-50" style={{ fontFamily: I }}>{label}</a>)}
          <div className="flex gap-3 mt-3">
            <button onClick={onEnterCode} className="flex-1 flex items-center justify-center gap-1.5 text-white text-sm font-semibold py-3 rounded-full" style={{ background: CAMEL, fontFamily: U }}><Hash size={14}/>Enter Code</button>
            <button onClick={onSignUp} className="flex-1 text-white text-sm font-semibold py-3 rounded-full" style={{ background: INK, fontFamily: U }}>Sign up free</button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero Mockup ──────────────────────────────────────────────────────────────
function HeroMockup() {
  return (
    <div className="relative w-full">
      <div className="bg-white rounded-2xl shadow-2xl shadow-gray-300/50 overflow-hidden border border-gray-200/80">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400/80"/><div className="w-3 h-3 rounded-full bg-amber-400/80"/><div className="w-3 h-3 rounded-full bg-green-400/80"/></div>
          <div className="flex-1 mx-3 bg-white rounded-md px-3 py-1 border border-gray-200"><span className="text-xs text-gray-400" style={{ fontFamily: I }}>exam.ai/live/mathematics-final</span></div>
          <div className="w-2 h-2 rounded-full bg-green-400"/>
        </div>
        <div className="flex h-[340px]">
          <div className="w-44 bg-gray-900 flex flex-col p-4 gap-1 flex-shrink-0">
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center"><GraduationCap size={11} className="text-white"/></div>
              <span className="text-white text-xs font-bold" style={{ fontFamily: U }}>exam·ai</span>
            </div>
            {["Dashboard","Live Exams","Question Bank","Analytics","Students","Settings"].map((item,i) => (
              <div key={item} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${i===1?"bg-white/15 text-white font-semibold":"text-gray-400"}`} style={{ fontFamily: I }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: i===1?CAMEL:"transparent", border: i!==1?"1px solid #4B5563":"none"}}/>
                {item}
              </div>
            ))}
          </div>
          <div className="flex-1 p-5 overflow-hidden bg-gray-50">
            <div className="flex items-center justify-between mb-5">
              <div><p className="text-xs text-gray-500 mb-0.5" style={{ fontFamily: I }}>Live Monitoring</p><h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: U }}>Mathematics Final · Year 12</h3></div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/><span className="text-xs font-semibold text-green-700" style={{ fontFamily: U }}>Live</span></div>
                <div className="bg-white border border-gray-200 rounded-full px-3 py-1.5 flex items-center gap-1.5"><Clock size={11} className="text-gray-500"/><span className="text-xs font-semibold text-gray-700" style={{ fontFamily: U }}>41:18</span></div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[{label:"Active",val:"28",color:"text-green-600",bg:"bg-green-50"},{label:"Flagged",val:"2",color:"text-red-600",bg:"bg-red-50"},{label:"Submitted",val:"4",color:"text-blue-600",bg:"bg-blue-50"},{label:"Avg Score",val:"76%",color:"text-gray-700",bg:"bg-gray-100"}].map(({label,val,color,bg}) => (
                <div key={label} className={`${bg} rounded-xl p-3`}><p className={`text-lg font-black leading-none ${color}`} style={{ fontFamily: U }}>{val}</p><p className="text-[10px] text-gray-500 mt-1" style={{ fontFamily: I }}>{label}</p></div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[{init:"AM",status:"ok",q:"Q12"},{init:"SJ",status:"flag",q:"Q8"},{init:"LK",status:"ok",q:"Q14"},{init:"TR",status:"ok",q:"Q11"},{init:"MP",status:"flag",q:"Q7"},{init:"OB",status:"ok",q:"Q13"},{init:"HL",status:"ok",q:"Q9"},{init:"JW",status:"done",q:"Done"},{init:"RK",status:"ok",q:"Q12"},{init:"EM",status:"ok",q:"Q10"}].map(({init,status,q}) => (
                <div key={init} className={`relative rounded-xl p-2 flex flex-col items-center gap-1 border ${status==="flag"?"bg-red-50 border-red-200":status==="done"?"bg-blue-50 border-blue-200":"bg-white border-gray-200"}`}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: status==="flag"?"#ef4444":status==="done"?BLUE:INK, fontFamily: U }}>{init}</div>
                  <span className={`text-[9px] font-medium ${status==="flag"?"text-red-600":status==="done"?"text-blue-600":"text-gray-500"}`} style={{ fontFamily: I }}>{q}</span>
                  {status==="flag" && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center"><span className="text-white text-[7px] font-bold">!</span></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-6 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3" style={{ minWidth: 180 }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#f0fdf4" }}><CheckCircle2 size={18} className="text-green-600"/></div>
        <div><p className="text-xs font-bold text-gray-900" style={{ fontFamily: U }}>Auto-graded</p><p className="text-[11px] text-gray-500" style={{ fontFamily: I }}>28 papers in 0.8s</p></div>
      </div>
      <div className="absolute -top-5 -right-6 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3" style={{ minWidth: 175 }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#fff7ed" }}><Shield size={18} style={{ color: CAMEL }}/></div>
        <div><p className="text-xs font-bold text-gray-900" style={{ fontFamily: U }}>2 flags raised</p><p className="text-[11px] text-gray-500" style={{ fontFamily: I }}>Proctor notified</p></div>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ onEnterCode, onSignUp }: { onEnterCode: () => void; onSignUp: () => void }) {
  return (
    <section className="relative pt-[68px] overflow-hidden min-h-screen flex items-center" style={{ background: CREAM }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" fill="none">
          <path d="M640 0 L1440 0 L1440 680 Q1100 520 800 560 Q600 580 500 480 Q380 360 440 200 Q480 80 640 0Z" fill={CAMEL} opacity="0.18"/>
          <path d="M740 0 L1440 0 L1440 560 Q1160 440 920 490 Q720 530 660 400 Q600 270 680 120 Q710 40 740 0Z" fill={CAMEL} opacity="0.13"/>
        </svg>
      </div>
      <div className="relative max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-[1fr_1.15fr] gap-16 items-center py-20">
        <div>
          <div className="inline-flex items-center gap-2 mb-8 text-xs font-semibold rounded-full px-4 py-2 border" style={{ color: CAMEL, borderColor: `${CAMEL}50`, background: `${CAMEL}12`, fontFamily: I }}><Zap size={12}/>AI-powered · GDPR compliant · No install needed</div>
          <h1 style={{ fontFamily: U, color: INK }} className="leading-[1.05] mb-6">
            <span className="block text-3xl lg:text-4xl font-light tracking-tight opacity-70">Simply powerful</span>
            <span className="block text-5xl lg:text-7xl font-black tracking-tight">Online Exams</span>
          </h1>
          <p className="text-base text-gray-500 leading-relaxed mb-9 max-w-[460px]" style={{ fontFamily: I }}>Easy to get started and intuitive to use. Our platform equips you with all the power and functionality you need to create secure exams for your students, your way.</p>
          <div className="flex flex-wrap gap-3 mb-5">
            <button onClick={onSignUp} className="flex items-center gap-2 text-white font-bold px-7 py-3.5 rounded-full transition-all hover:opacity-90 active:scale-[0.98] shadow-lg text-sm" style={{ background: INK, fontFamily: U, boxShadow: `0 8px 24px ${INK}30` }}>Sign up for your free trial</button>
            <button onClick={onEnterCode} className="flex items-center gap-2 font-semibold px-7 py-3.5 rounded-full border transition-all hover:bg-gray-50 text-sm" style={{ color: INK, borderColor: "#D1CBC0", fontFamily: U }}><Hash size={15} style={{ color: CAMEL }}/>Enter exam code</button>
          </div>
          <p className="text-xs text-gray-400 mb-8" style={{ fontFamily: I }}>30-day free trial. No credit card required.</p>
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2"><div className="flex gap-0.5">{Array(5).fill(0).map((_,i) => <Star key={i} size={12} className="fill-amber-400 text-amber-400"/>)}</div><span className="text-xs font-semibold text-gray-700" style={{ fontFamily: U }}>4.8</span><span className="text-xs text-gray-400" style={{ fontFamily: I }}>Capterra</span></div>
            <div className="w-px h-4 bg-gray-200"/>
            <div className="flex items-center gap-1.5"><Shield size={14} style={{ color: CAMEL }}/><span className="text-xs font-semibold text-gray-700" style={{ fontFamily: U }}>GDPR</span></div>
            <div className="w-px h-4 bg-gray-200"/>
            <div className="flex items-center gap-1.5"><Lock size={14} className="text-gray-600"/><span className="text-xs font-semibold text-gray-700" style={{ fontFamily: U }}>SOC 2 Type II</span></div>
            <div className="w-px h-4 bg-gray-200"/>
            <div className="flex items-center gap-1.5"><Globe size={14} className="text-gray-600"/><span className="text-xs font-semibold text-gray-700" style={{ fontFamily: U }}>500+ institutions</span></div>
          </div>
        </div>
        <div className="hidden lg:block relative pt-8 pb-8"><HeroMockup/></div>
      </div>
    </section>
  );
}

function TrustBar() {
  const orgs = ["MIT","Stanford","Oxford","Deloitte","Nairobi Univ.","TU Berlin","UNSW","Coursera"];
  return (
    <section className="py-10 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-xs text-center text-gray-400 mb-6 uppercase tracking-widest font-medium" style={{ fontFamily: I }}>Trusted by leading institutions worldwide</p>
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
          {orgs.map(org => <span key={org} className="text-sm font-bold text-gray-300 hover:text-gray-500 transition-colors cursor-default" style={{ fontFamily: U }}>{org}</span>)}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Brain,     title: "AI Question Generation", desc: "Paste a topic or syllabus — get a fully balanced question paper in seconds. MCQ, short answer, essay. Any subject.", tag: "Saves 6+ hrs" },
    { icon: Eye,       title: "Live Proctoring",         desc: "Face detection, tab-switch detection, and behavioural analysis run silently. Students are never disrupted.",          tag: "99.9% detection" },
    { icon: FileCheck, title: "Instant Auto-Grading",    desc: "Objective answers graded in milliseconds. AI scores essays against your rubric with written, explainable feedback.", tag: "< 1 second" },
    { icon: BarChart3, title: "Analytics & Reports",     desc: "Class-wide trends, per-student breakdowns, and question-level difficulty scores — delivered the moment the exam ends.", tag: "Live data" },
    { icon: Shield,    title: "Session Replay",          desc: "Rewind any exam session frame by frame. Review every flag with full timeline context for fair, auditable appeals.",    tag: "Full audit trail" },
    { icon: Users,     title: "Team Collaboration",      desc: "Build shared question banks, co-author papers, and review results with your entire department in one workspace.",      tag: "Unlimited seats" },
  ];
  return (
    <section className="py-28" style={{ background: CREAM }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-16 items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: CAMEL, fontFamily: I }}>What's included</p>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-6" style={{ fontFamily: U, color: INK }}>Everything in one place.</h2>
            <p className="text-gray-500 leading-relaxed mb-8 text-sm" style={{ fontFamily: I }}>No patchwork of tools. No manual handoffs. One coherent platform that takes you from blank paper to final grade report.</p>
            <button className="flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-full transition-all hover:opacity-90" style={{ background: INK, fontFamily: U }}>See all features <ArrowRight size={15}/></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map(({ icon: Icon, title, desc, tag }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/80 transition-all duration-300 cursor-default group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#F0EDE8" }}><Icon size={19} style={{ color: INK }}/></div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${CAMEL}18`, color: CAMEL, fontFamily: I }}>{tag}</span>
                </div>
                <h3 className="text-[15px] font-bold mb-2" style={{ fontFamily: U, color: INK }}>{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed" style={{ fontFamily: I }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ onEnterCode }: { onEnterCode: () => void }) {
  const steps = [
    { n: "01", title: "Set up your exam",     desc: "Choose subject, duration, and question types. Paste your syllabus or topic list." },
    { n: "02", title: "AI builds the paper",  desc: "Receive a balanced, reviewed question set calibrated to your chosen difficulty." },
    { n: "03", title: "Students sit securely",desc: "A locked-down browser session with live proctoring and real-time alerts." },
    { n: "04", title: "Results, instantly",   desc: "Scores, feedback, and analytics reports ready the moment time runs out." },
  ];
  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-20">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: CAMEL, fontFamily: I }}>The process</p>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight" style={{ fontFamily: U, color: INK }}>Four steps.<br/><span className="font-light opacity-60">That's really it.</span></h2>
        </div>
        <div className="relative">
          <div className="absolute top-7 left-8 right-8 h-px hidden lg:block" style={{ background: `linear-gradient(90deg, transparent, ${CAMEL}60, ${CAMEL}60, transparent)` }}/>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black mb-6 relative z-10" style={{ background: n==="01"?INK:"#F0EDE8", color: n==="01"?"white":INK, fontFamily: U }}>{n}</div>
                <h3 className="text-base font-bold mb-2" style={{ fontFamily: U, color: INK }}>{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: I }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 justify-center mt-16">
          <button className="flex items-center gap-2 text-white font-bold px-7 py-3.5 rounded-full text-sm hover:opacity-90 transition-opacity" style={{ background: INK, fontFamily: U }}>Start for free <ArrowRight size={16}/></button>
          <button onClick={onEnterCode} className="flex items-center gap-2 font-semibold px-7 py-3.5 rounded-full border text-sm hover:bg-gray-50 transition-colors" style={{ color: INK, borderColor: "#D1CBC0", fontFamily: U }}><Hash size={15} style={{ color: CAMEL }}/>Enter exam code</button>
        </div>
      </div>
    </section>
  );
}

function Security() {
  const checks = ["Face & identity verification on entry","Tab switch and window focus detection","Behavioural anomaly scoring (AI)","Random encrypted screenshot capture","Browser lockdown — no extensions, no copy-paste","Proctor live alert dashboard","Full session replay with timestamped flags","End-to-end encrypted question delivery"];
  return (
    <section className="py-28 overflow-hidden" style={{ background: INK }}>
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: CAMEL, fontFamily: I }}>Security</p>
          <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6" style={{ fontFamily: U }}>Exam integrity you can<br/><span style={{ color: CAMEL }}>actually prove.</span></h2>
          <p className="text-gray-400 leading-relaxed mb-10 text-sm max-w-md" style={{ fontFamily: I }}>Eight independent security layers monitor every session. Every flag is logged with full context — so appeals are fair and fast, not guesswork.</p>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {checks.map(c => (
              <div key={c} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${CAMEL}25` }}><Check size={10} style={{ color: CAMEL }}/></div>
                <span className="text-xs text-gray-400 leading-relaxed" style={{ fontFamily: I }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="bg-gray-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/><span className="text-sm font-semibold text-white" style={{ fontFamily: U }}>Proctoring: Mathematics Final</span></div>
              <div className="flex items-center gap-2"><span className="text-xs font-mono text-gray-400">34 / 34 connected</span><div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ fontFamily: U }}>2 Alerts</div></div>
            </div>
            <div className="grid grid-cols-4 gap-2 p-4">
              {Array.from({length:8}).map((_,i) => {
                const flagged = i===2||i===5;
                const names = ["A. Mills","S. Jones","L. Kim","T. Reed","M. Park","O. Bell","H. Lee","J. Wang"];
                return (
                  <div key={i} className={`relative rounded-xl aspect-[4/3] flex flex-col items-center justify-center border ${flagged?"border-red-500/60 bg-red-950/30":"border-white/10 bg-black/40"}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mb-1" style={{ background: flagged?"#ef4444":"#374151", fontFamily: U }}>{names[i].split(" ").map(w=>w[0]).join("")}</div>
                    <span className="text-[9px] text-gray-500" style={{ fontFamily: I }}>{names[i]}</span>
                    {flagged && <div className="absolute inset-0 rounded-xl border-2 border-red-500/50 pointer-events-none"/>}
                  </div>
                );
              })}
            </div>
            <div className="px-5 pb-4 space-y-2">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3" style={{ fontFamily: U }}>Recent activity</p>
              {[{t:"09:41:03",msg:"S. Jones — tab switched (2s)",type:"warn"},{t:"09:44:27",msg:"O. Bell — face not detected (4s)",type:"warn"},{t:"09:46:00",msg:"All others — no anomalies",type:"ok"}].map(({t,msg,type}) => (
                <div key={t} className="flex items-center gap-3 py-1.5 border-t border-white/5">
                  <span className="text-[10px] text-gray-600 font-mono flex-shrink-0">{t}</span>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${type==="warn"?"bg-red-500":"bg-green-500"}`}/>
                  <span className={`text-[11px] font-medium ${type==="warn"?"text-red-400":"text-green-400"}`} style={{ fontFamily: I }}>{msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    { text: "The AI question generation alone changed everything. I used to spend an entire Sunday building a paper. Now it's done before my coffee gets cold.", name: "Dr. Sarah Chen", role: "Professor of Mathematics, MIT", rating: 5, photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&auto=format&q=80" },
    { text: "Our students trust the process now. The proctoring is completely invisible to them — but iron-clad on our end. Appeals dropped by 80%.", name: "James Willis", role: "Head of Assessment, Oxford", rating: 5, photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format&q=80" },
    { text: "We run 50+ certification exams monthly across three time zones. This platform handles every detail without anyone on our team lifting a finger.", name: "Amara Diallo", role: "Head of Learning, Deloitte", rating: 5, photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&auto=format&q=80" },
  ];
  return (
    <section className="py-28" style={{ background: CREAM }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-16 items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: CAMEL, fontFamily: I }}>What educators say</p>
            <h2 className="text-4xl lg:text-5xl font-black leading-tight" style={{ fontFamily: U, color: INK }}>They switched.<br/><span className="font-light opacity-60">They didn't go back.</span></h2>
            <div className="flex items-center gap-3 mt-10">
              <div className="flex -space-x-3">{reviews.map(r => <img key={r.name} src={r.photo} alt={r.name} className="w-10 h-10 rounded-full border-2 border-white object-cover"/>)}</div>
              <div><div className="flex gap-0.5 mb-0.5">{Array(5).fill(0).map((_,i) => <Star key={i} size={12} className="fill-amber-400 text-amber-400"/>)}</div><p className="text-xs text-gray-500" style={{ fontFamily: I }}><span className="font-semibold text-gray-700">2,400+</span> educators</p></div>
            </div>
          </div>
          <div className="space-y-4">
            {reviews.map(({ text, name, role, rating, photo }) => (
              <div key={name} className="bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
                <div className="flex gap-0.5 mb-4">{Array(rating).fill(0).map((_,i) => <Star key={i} size={13} className="fill-amber-400 text-amber-400"/>)}</div>
                <p className="text-sm text-gray-700 leading-relaxed mb-5" style={{ fontFamily: I }}>"{text}"</p>
                <div className="flex items-center gap-3">
                  <img src={photo} alt={name} className="w-10 h-10 rounded-full object-cover border border-gray-100"/>
                  <div><p className="text-sm font-bold text-gray-900" style={{ fontFamily: U }}>{name}</p><p className="text-xs text-gray-400" style={{ fontFamily: I }}>{role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA({ onEnterCode, onSignUp }: { onEnterCode: () => void; onSignUp: () => void }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden px-10 py-20 text-center" style={{ background: INK }}>
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: CAMEL, transform: "translate(30%, -30%)" }}/>
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: CAMEL, transform: "translate(-30%, 30%)" }}/>
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: CAMEL, fontFamily: I }}>No credit card · Free forever plan · Ready in 10 minutes</p>
            <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight mb-5" style={{ fontFamily: U }}>Start running better<br/>exams today.</h2>
            <p className="text-gray-400 mb-10 max-w-md mx-auto text-sm leading-relaxed" style={{ fontFamily: I }}>Join 500+ institutions already on the platform. Your first exam takes under 10 minutes to create.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={onSignUp} className="inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-full text-sm transition-all hover:opacity-90" style={{ background: CAMEL, color: "white", fontFamily: U }}>Sign up for free <ArrowRight size={16}/></button>
              <button onClick={onEnterCode} className="inline-flex items-center justify-center gap-2 font-semibold px-8 py-4 rounded-full border text-sm transition-all hover:bg-white/10" style={{ color: "white", borderColor: "rgba(255,255,255,0.2)", fontFamily: U }}><Hash size={15}/>Enter exam code</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = { Product: ["Features","Pricing","Security","Integrations","Changelog"], Solutions: ["K–12 Schools","Universities","Corporate Training","Certification Bodies"], Resources: ["Documentation","Blog","Case Studies","API Reference"], Company: ["About us","Careers","Press","Contact"] };
  return (
    <footer className="border-t border-gray-100 bg-white pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-10 mb-14">
          <div>
            <div className="flex items-center gap-2 mb-5"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: INK }}><GraduationCap size={15} className="text-white"/></div><span className="text-lg font-black" style={{ fontFamily: U, color: INK }}>exam<span style={{ color: CAMEL }}>·ai</span></span></div>
            <p className="text-xs text-gray-400 leading-relaxed mb-6 max-w-[220px]" style={{ fontFamily: I }}>AI-powered online examination for modern educators. Secure, simple, and fast.</p>
            <div className="flex gap-2">{[Twitter,Linkedin,Youtube].map((Icon,i) => <button key={i} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all"><Icon size={13}/></button>)}</div>
          </div>
          {Object.entries(cols).map(([cat,items]) => (
            <div key={cat}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5" style={{ fontFamily: U }}>{cat}</p>
              <ul className="space-y-3">{items.map(item => <li key={item}><a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors" style={{ fontFamily: I }}>{item}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400" style={{ fontFamily: I }}>© 2026 exam·ai. All rights reserved.</p>
          <div className="flex items-center gap-5">{["Privacy","Terms","GDPR","Security"].map(item => <a key={item} href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors" style={{ fontFamily: I }}>{item}</a>)}</div>
        </div>
      </div>
    </footer>
  );
}

// ─── Landing Page (assembles all sections) ────────────────────────────────────
export function LandingPage() {
  const [showCode, setShowCode] = useState(false);
  const [authMode, setAuthMode] = useState<null | "login" | "register">(null);
  return (
    <div className="min-h-screen" style={{ background: CREAM }}>
      {showCode && <EnterCodeModal onClose={() => setShowCode(false)}/>}
      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSwitch={() => setAuthMode(m => m === "login" ? "register" : "login")}/>}
      <LandingNavbar onEnterCode={() => setShowCode(true)} onSignIn={() => setAuthMode("login")} onSignUp={() => setAuthMode("register")}/>
      <Hero onEnterCode={() => setShowCode(true)} onSignUp={() => setAuthMode("register")}/>
      <TrustBar/>
      <Features/>
      <HowItWorks onEnterCode={() => setShowCode(true)}/>
      <Security/>
      <Testimonials/>
      <CTA onEnterCode={() => setShowCode(true)} onSignUp={() => setAuthMode("register")}/>
      <Footer/>
    </div>
  );
}
