"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown, ArrowRight, Check, Star, Shield, Zap,
  BarChart3, Eye, Users, FileCheck, Brain, Clock, Hash,
  Twitter, Linkedin, Youtube, Globe, Lock,
  CheckCircle2, GraduationCap, Menu, X, RefreshCw, EyeOff,
} from "lucide-react";
import { U, I, INK, CAMEL, CREAM, BLUE } from "@/lib/tokens";
import { useNavigate } from "@/lib/hooks";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/components/providers/AuthProvider";

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
  const [successMsg, setSuccessMsg] = useState("");
  const { login: loginContext } = useAuth();

  const handleGoogle = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jfebblgfihkhuaewxnjs.supabase.co";
    window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${window.location.origin}/auth/callback`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      if (mode === "login") {
        const data = await authApi.login({ email: cleanEmail, password });
        loginContext(data.access_token, data.user);
        onClose();
        navigate("/dashboard");
      } else {
        await authApi.register({ email: cleanEmail, password, name, role: "teacher" });
        setSuccessMsg("Registration successful! Please check your email to verify your account before signing in.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
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
          <button type="button" onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:bg-gray-50 rounded-xl py-3 text-sm font-semibold text-gray-700 transition-all mb-4" style={{ fontFamily: U }}>
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
            {successMsg && <p className="text-xs font-semibold text-green-600" style={{ fontFamily: I }}>{successMsg}</p>}
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
const NAV_LINKS = [{ label: "How it works", dropdown: true, id: "how-it-works" }, { label: "Pricing", dropdown: false }, { label: "Customers", dropdown: true }, { label: "Resources", dropdown: true }];

export function LandingNavbar({ onEnterCode, onSignIn, onSignUp }: { onEnterCode: () => void; onSignIn: () => void; onSignUp: () => void }) {
  const [open, setOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [activeNav, setActiveNav] = useState<string | null>(null);

  // Highlights "How it works" in camel while its section is scrolled into view
  // (the only nav item with a real matching section on this page).
  useEffect(() => {
    const section = document.getElementById("how-it-works");
    if (!section || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setActiveNav("How it works");
    }, { threshold: 0.35 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const handleNavClick = (label: string, id?: string) => {
    setActiveNav(label);
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center gap-8">
        <a href="#" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: INK }}><GraduationCap size={16} className="text-white"/></div>
          <span className="text-[17px] font-black tracking-tight" style={{ fontFamily: U, color: INK }}>exam<span style={{ color: CAMEL }}>·ai</span></span>
        </a>
        <div className="hidden lg:flex items-center gap-6 flex-1">
          {NAV_LINKS.map(({ label, dropdown, id }) => (
            <button key={label} onClick={() => handleNavClick(label, id)} className="flex items-center gap-1 text-sm font-medium transition-colors hover:!text-[#C8A97E]" style={{ fontFamily: I, color: activeNav === label ? CAMEL : "#4B5563" }}>
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
          {NAV_LINKS.map(({ label, id }) => (
            <button key={label} onClick={() => { setOpen(false); handleNavClick(label, id); }} className="text-left text-sm font-medium py-3 border-b border-gray-50 transition-colors" style={{ fontFamily: I, color: activeNav === label ? CAMEL : "#4B5563" }}>{label}</button>
          ))}
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
const HERO_NAV_ITEMS = ["Dashboard", "Live Exams", "Question Bank", "Analytics", "Students", "Settings"];
// Delays below are spread across ~5s total (was ~2.2s) so the whole reveal
// reads as a deliberate, unhurried sequence rather than a quick flash.
const HERO_NAV_DELAYS = ["0.4s", "0.65s", "0.9s", "1.15s", "1.4s", "1.65s"];

const HERO_STATS = [
  { label: "Active", target: 28, suffix: "", color: "text-green-600", bg: "bg-green-50" },
  { label: "Flagged", target: 2, suffix: "", color: "text-red-600", bg: "bg-red-50" },
  { label: "Submitted", target: 4, suffix: "", color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Avg Score", target: 76, suffix: "%", color: "text-gray-700", bg: "bg-gray-100" },
];
const HERO_STAT_DELAYS = ["1.70s", "1.95s", "2.20s", "2.45s"];
const HERO_STAT_DELAYS_MS = [1700, 1950, 2200, 2450];

const HERO_ROW1 = [
  { init: "AM", status: "ok", q: "Q12" },
  { init: "SJ", status: "flag", q: "Q8" },
  { init: "LK", status: "ok", q: "Q14" },
  { init: "TR", status: "ok", q: "Q11" },
  { init: "MP", status: "flag", q: "Q7" },
];
const HERO_ROW2 = [
  { init: "OB", status: "ok", q: "Q13" },
  { init: "HL", status: "ok", q: "Q9" },
  { init: "JW", status: "done", q: "Done" },
  { init: "RK", status: "ok", q: "Q12" },
  { init: "EM", status: "ok", q: "Q10" },
];
const HERO_AVATAR_DELAYS = ["2.70s", "2.86s", "3.02s", "3.18s", "3.34s", "3.50s", "3.66s", "3.82s", "3.98s", "4.14s"];

// Track repeats each row's card set 6x total (1 "real" + 5 duplicates) so the
// loop stays seamless even when the hero column renders very wide — matches
// the 6-way split baked into the hero-scroll-* keyframes in theme.css.
const HERO_MARQUEE_REPEAT_DUPES = [0, 1, 2, 3, 4];

const HERO_SUBJECTS = [
  { subject: "Mathematics Final", year: "12" },
  { subject: "Physics Midterm", year: "11" },
  { subject: "Chemistry Final", year: "12" },
  { subject: "English Literature", year: "10" },
  { subject: "Biology Final", year: "12" },
  { subject: "Computer Science", year: "11" },
];

type CountMode = "idle" | "animate" | "instant";

function useCountUp(target: number, delayMs: number, mode: CountMode) {
  const [value, setValue] = useState(mode === "instant" ? target : 0);
  useEffect(() => {
    if (mode === "instant") { setValue(target); return; }
    if (mode === "idle") { setValue(0); return; } // reset, ready to replay next time it's in view
    setValue(0);
    let raf = 0;
    const t = setTimeout(() => {
      const start = performance.now();
      const duration = 700;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(target * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delayMs);
    return () => { clearTimeout(t); if (raf) cancelAnimationFrame(raf); };
  }, [mode, target, delayMs]);
  return value;
}

function HeroStatCard({ label, value, suffix, color, bg, className, style }: { label: string; value: number; suffix: string; color: string; bg: string; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`${bg} rounded-xl p-3 flex-shrink-0 w-[112px] ${className || ""}`} style={style}>
      <p className={`text-lg font-black leading-none ${color}`} style={{ fontFamily: U }}>{value}{suffix}</p>
      <p className="text-[10px] text-gray-500 mt-1" style={{ fontFamily: I }}>{label}</p>
    </div>
  );
}

function HeroAvatarCard({ init, status, q, className, style }: { init: string; status: string; q: string; className?: string; style?: React.CSSProperties }) {
  const flagged = status === "flag";
  const done = status === "done";
  return (
    <div className={`relative rounded-xl p-2 flex flex-col items-center gap-1 border flex-shrink-0 w-[82px] ${flagged ? "bg-red-50 border-red-200" : done ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"} ${className || ""}`} style={style}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: flagged ? "#ef4444" : done ? BLUE : INK, fontFamily: U }}>{init}</div>
      <span className={`text-[9px] font-medium ${flagged ? "text-red-600" : done ? "text-blue-600" : "text-gray-500"}`} style={{ fontFamily: I }}>{q}</span>
      {flagged && <div className="hero-badge-pulse absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center"><span className="text-white text-[7px] font-bold">!</span></div>}
    </div>
  );
}

function HeroMockup() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [wrapRef, inView] = useInViewToggle<HTMLDivElement>({ threshold: 0.3 });
  const [phase2, setPhase2] = useState(false);
  const [activeNav, setActiveNav] = useState(1);
  const [subjectIndex, setSubjectIndex] = useState(0);
  const [subjectSwapping, setSubjectSwapping] = useState(false);
  const [remaining, setRemaining] = useState(41 * 60 + 18);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Scrolling out resets everything so the full ~5s reveal replays cleanly
  // the next time the hero scrolls back into view.
  useEffect(() => {
    if (inView) return;
    setPhase2(false);
    setActiveNav(1);
    setSubjectIndex(0);
    setSubjectSwapping(false);
    setRemaining(41 * 60 + 18);
  }, [inView]);

  useEffect(() => {
    if (reducedMotion || !inView) return;
    const t = setTimeout(() => setPhase2(true), 5000);
    return () => clearTimeout(t);
  }, [reducedMotion, inView]);

  useEffect(() => {
    if (reducedMotion || !inView) return;
    const iv = setInterval(() => setActiveNav(i => (i + 1) % HERO_NAV_ITEMS.length), 1500);
    return () => clearInterval(iv);
  }, [reducedMotion, inView]);

  useEffect(() => {
    if (reducedMotion || !inView) return;
    const iv = setInterval(() => {
      setSubjectSwapping(true);
      setTimeout(() => {
        setSubjectIndex(i => {
          if (HERO_SUBJECTS.length <= 1) return i;
          let next = i;
          while (next === i) next = Math.floor(Math.random() * HERO_SUBJECTS.length);
          return next;
        });
        setSubjectSwapping(false);
      }, 300);
    }, 2000);
    return () => clearInterval(iv);
  }, [reducedMotion, inView]);

  useEffect(() => {
    if (!phase2 || reducedMotion || !inView) return;
    const iv = setInterval(() => setRemaining(r => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [phase2, reducedMotion, inView]);

  const countMode: CountMode = reducedMotion ? "instant" : inView ? "animate" : "idle";
  const statValues = [
    useCountUp(HERO_STATS[0].target, HERO_STAT_DELAYS_MS[0], countMode),
    useCountUp(HERO_STATS[1].target, HERO_STAT_DELAYS_MS[1], countMode),
    useCountUp(HERO_STATS[2].target, HERO_STAT_DELAYS_MS[2], countMode),
    useCountUp(HERO_STATS[3].target, HERO_STAT_DELAYS_MS[3], countMode),
  ];

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const timerText = `${mm}:${ss < 10 ? "0" : ""}${ss}`;
  const currentSubject = HERO_SUBJECTS[subjectIndex];

  return (
    <div ref={wrapRef} className={`hero-mockup relative w-full ${inView ? "hero-in-view" : ""}`}>
      <div className={`hero-window bg-white rounded-2xl shadow-2xl shadow-gray-300/50 overflow-hidden border border-gray-200/80 ${phase2 ? "hero-phase2" : ""}`}>
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
            {HERO_NAV_ITEMS.map((item, i) => (
              <div key={item} className={`hero-nav-item flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${i === activeNav ? "bg-white/15 text-white font-semibold" : "text-gray-400"}`} style={{ fontFamily: I, animationDelay: HERO_NAV_DELAYS[i] }}>
                <div className={`hero-nav-bullet w-1.5 h-1.5 rounded-full ${i === activeNav ? "hero-nav-bullet-on" : ""}`} style={{ background: CAMEL }}/>
                {item}
              </div>
            ))}
          </div>
          <div className="flex-1 p-5 overflow-hidden bg-gray-50">
            <div className="hero-fade-up flex items-center justify-between mb-5" style={{ animationDelay: "1.4s" }}>
              <div>
                <p className="text-xs text-gray-500 mb-0.5" style={{ fontFamily: I }}>Live Monitoring</p>
                <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: U }}>
                  <span className={`hero-subject ${subjectSwapping ? "hero-subject-swap" : ""}`}>{currentSubject.subject}</span>
                  {" · Year "}
                  <span className={`hero-subject ${subjectSwapping ? "hero-subject-swap" : ""}`}>{currentSubject.year}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/><span className="text-xs font-semibold text-green-700" style={{ fontFamily: U }}>Live</span></div>
                <div className="bg-white border border-gray-200 rounded-full px-3 py-1.5 flex items-center gap-1.5"><Clock size={11} className="text-gray-500"/><span className="text-xs font-semibold text-gray-700" style={{ fontFamily: U }}>{timerText}</span></div>
              </div>
            </div>

            <div className="hero-marquee-viewport mb-5">
              <div className="hero-marquee-track hero-marquee-stats gap-3">
                {HERO_MARQUEE_REPEAT_DUPES.map(n => HERO_STATS.map(s => <HeroStatCard key={`dup${n}-${s.label}`} {...s} value={s.target} />))}
                {HERO_STATS.map((s, i) => <HeroStatCard key={s.label} {...s} value={statValues[i]} className="hero-fade-up" style={{ animationDelay: HERO_STAT_DELAYS[i] }} />)}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="hero-marquee-viewport">
                <div className="hero-marquee-track hero-marquee-row1 gap-2">
                  {HERO_ROW1.map((a, i) => <HeroAvatarCard key={a.init} {...a} className="hero-pop-in" style={{ animationDelay: HERO_AVATAR_DELAYS[i] }} />)}
                  {HERO_MARQUEE_REPEAT_DUPES.map(n => HERO_ROW1.map(a => <HeroAvatarCard key={`dup${n}-${a.init}`} {...a} />))}
                </div>
              </div>
              <div className="hero-marquee-viewport">
                <div className="hero-marquee-track hero-marquee-row2 gap-2">
                  {HERO_MARQUEE_REPEAT_DUPES.map(n => HERO_ROW2.map(a => <HeroAvatarCard key={`dup${n}-${a.init}`} {...a} />))}
                  {HERO_ROW2.map((a, i) => <HeroAvatarCard key={a.init} {...a} className="hero-pop-in" style={{ animationDelay: HERO_AVATAR_DELAYS[i + 5] }} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-toast-bl absolute -bottom-5 -left-6 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3" style={{ minWidth: 180, animationDelay: "4.5s" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#f0fdf4" }}><CheckCircle2 size={18} className="text-green-600"/></div>
        <div><p className="text-xs font-bold text-gray-900" style={{ fontFamily: U }}>Auto-graded</p><p className="text-[11px] text-gray-500" style={{ fontFamily: I }}>28 papers in 0.8s</p></div>
      </div>
      <div className="hero-toast-tr absolute -top-5 -right-6 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3" style={{ minWidth: 175, animationDelay: "4.3s" }}>
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
          <path className="hero-bg-layer-a" d="M640 0 L1440 0 L1440 680 Q1100 520 800 560 Q600 580 500 480 Q380 360 440 200 Q480 80 640 0Z" fill={CAMEL} opacity="0.18"/>
          <path className="hero-bg-layer-b" d="M740 0 L1440 0 L1440 560 Q1160 440 920 490 Q720 530 660 400 Q600 270 680 120 Q710 40 740 0Z" fill={CAMEL} opacity="0.13"/>
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
        <div className="hidden lg:block relative pt-8 pb-8 min-w-0"><HeroMockup/></div>
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

function useInViewToggle<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px", ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, inView] as const;
}

function FeatureCard({ icon: Icon, title, desc, tag, delay }: { icon: typeof Brain; title: string; desc: string; tag: string; delay: number }) {
  const [ref, inView] = useInViewToggle<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`feature-card bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/80 cursor-default group ${inView ? "in-view" : ""}`}
      style={{ ["--reveal-delay" as string]: `${delay}s` } as React.CSSProperties}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="feature-icon w-10 h-10 rounded-xl flex items-center justify-center"><Icon size={19}/></div>
        <span className="feature-tag text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ fontFamily: I }}>{tag}</span>
      </div>
      <h3 className="text-[15px] font-bold mb-2" style={{ fontFamily: U, color: INK }}>{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed" style={{ fontFamily: I }}>{desc}</p>
    </div>
  );
}

const FEATURE_ITEMS = [
  { icon: Brain,     title: "AI Question Generation", desc: "Paste a topic or syllabus — get a fully balanced question paper in seconds. MCQ, short answer, essay. Any subject.", tag: "Saves 6+ hrs" },
  { icon: Eye,       title: "Live Proctoring",         desc: "Face detection, tab-switch detection, and behavioural analysis run silently. Students are never disrupted.",          tag: "99.9% detection" },
  { icon: FileCheck, title: "Instant Auto-Grading",    desc: "Objective answers graded in milliseconds. AI scores essays against your rubric with written, explainable feedback.", tag: "< 1 second" },
  { icon: BarChart3, title: "Analytics & Reports",     desc: "Class-wide trends, per-student breakdowns, and question-level difficulty scores — delivered the moment the exam ends.", tag: "Live data" },
  { icon: Shield,    title: "Session Replay",          desc: "Rewind any exam session frame by frame. Review every flag with full timeline context for fair, auditable appeals.",    tag: "Full audit trail" },
  { icon: Users,     title: "Team Collaboration",      desc: "Build shared question banks, co-author papers, and review results with your entire department in one workspace.",      tag: "Unlimited seats" },
];

function SplitLetters({ text }: { text: string }) {
  const words = text.split(" ");
  let pos = 0;
  return (
    <>
      {words.map((word, wi) => {
        const start = pos;
        pos += word.length + 1; // +1 accounts for the space that follows
        return (
          <span className="word" key={wi}>
            {word.split("").map((ch, i) => (
              <span key={i} className="letter" style={{ ["--li" as string]: start + i } as React.CSSProperties}>{ch}</span>
            ))}
            {wi < words.length - 1 ? " " : null}
          </span>
        );
      })}
    </>
  );
}

function Features() {
  const [textRef, textInView] = useInViewToggle<HTMLDivElement>({ threshold: 0.2 });
  return (
    <section className="py-28" style={{ background: CREAM }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-16 items-start">
          <div ref={textRef} className={`feature-text-col lg:sticky lg:top-28 ${textInView ? "in-view" : ""}`}>
            <p className="feature-text-item text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: CAMEL, fontFamily: I, ["--reveal-delay" as string]: "0s" } as React.CSSProperties}>What's included</p>
            <h2 className="feature-heading text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-6" style={{ fontFamily: U, color: INK }}><SplitLetters text="Everything in one place."/></h2>
            <p className="feature-text-item text-gray-500 leading-relaxed mb-8 text-sm" style={{ fontFamily: I, ["--reveal-delay" as string]: "0.16s" } as React.CSSProperties}>No patchwork of tools. No manual handoffs. One coherent platform that takes you from blank paper to final grade report.</p>
            <button className="feature-text-item flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-full transition-all hover:opacity-90" style={{ background: INK, fontFamily: U, ["--reveal-delay" as string]: "0.24s" } as React.CSSProperties}>See all features <ArrowRight size={15}/></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURE_ITEMS.map((item, i) => <FeatureCard key={item.title} {...item} delay={i * 0.08} />)}
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
  const stepDelays = ["0s", "1.2s", "2.4s", "3.6s"];
  const [headRef, headInView] = useInViewToggle<HTMLDivElement>({ threshold: 0.4 });
  const [railRef, railInView] = useInViewToggle<HTMLDivElement>({ threshold: 0.3 });
  const [ctaRef, ctaInView] = useInViewToggle<HTMLDivElement>({ threshold: 0.4 });

  const handleCtaClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    btn.classList.remove("pressed");
    void btn.offsetWidth; // restart the animation if clicked again quickly
    btn.classList.add("pressed");
  };
  const clearPressed = (e: React.AnimationEvent<HTMLButtonElement>) => e.currentTarget.classList.remove("pressed");

  return (
    <section id="how-it-works" className="py-28 bg-white scroll-mt-[68px]">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={headRef} className={`steps-head text-center max-w-xl mx-auto mb-20 ${headInView ? "in-view" : ""}`}>
          <p className="steps-head-item text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: CAMEL, fontFamily: I }}>The process</p>
          <h2 className="steps-head-item text-4xl lg:text-5xl font-black leading-tight" style={{ fontFamily: U, color: INK }}>Four steps.<br/><span className="font-light opacity-60">That's really it.</span></h2>
        </div>
        <div ref={railRef} className={`relative steps-rail ${railInView ? "in-view" : ""}`}>
          <div className="steps-rail-track absolute top-7 left-8 right-8 h-px hidden lg:block" style={{ background: `${CAMEL}30` }}/>
          <div className="steps-rail-fill absolute top-7 left-8 h-px hidden lg:block" style={{ background: CAMEL }}/>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ n, title, desc }, i) => (
              <div key={n} className="steps-card relative" style={{ ["--reveal-delay" as string]: stepDelays[i] } as React.CSSProperties}>
                <div className="steps-marker w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black mb-6 relative z-10" style={{ fontFamily: U }}>{n}</div>
                <h3 className="text-base font-bold mb-2" style={{ fontFamily: U, color: INK }}>{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: I }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div ref={ctaRef} className={`steps-cta-row flex flex-wrap gap-3 justify-center mt-16 ${ctaInView ? "in-view" : ""}`}>
          <button onClick={handleCtaClick} onAnimationEnd={clearPressed} className="steps-cta flex items-center gap-2 text-white font-bold px-7 py-3.5 rounded-full text-sm hover:opacity-90" style={{ background: INK, fontFamily: U, ["--bd" as string]: "0s" } as React.CSSProperties}>Start for free <ArrowRight size={16}/></button>
          <button onClick={(e) => { onEnterCode(); handleCtaClick(e); }} onAnimationEnd={clearPressed} className="steps-cta flex items-center gap-2 font-semibold px-7 py-3.5 rounded-full border text-sm hover:bg-gray-50" style={{ color: INK, borderColor: "#D1CBC0", fontFamily: U, ["--bd" as string]: "0.1s" } as React.CSSProperties}><Hash size={15} style={{ color: CAMEL }}/>Enter exam code</button>
        </div>
      </div>
    </section>
  );
}

const SECURITY_CHECKS = ["Face & identity verification on entry","Tab switch and window focus detection","Behavioural anomaly scoring (AI)","Random encrypted screenshot capture","Browser lockdown — no extensions, no copy-paste","Proctor live alert dashboard","Full session replay with timestamped flags","End-to-end encrypted question delivery"];
const SECURITY_NAMES = ["A. Mills","S. Jones","L. Kim","T. Reed","M. Park","O. Bell","H. Lee","J. Wang"];
// Snake scan order: row 1 (idx 0-3) sweeps right-to-left, row 2 (idx 4-7) sweeps left-to-right,
// so the two directions chain into one continuous wave across the grid.
const SECURITY_SCAN_ORDER = [3, 2, 1, 0, 4, 5, 6, 7];

// Ties each line's reveal directly to scroll position (not a timer) — scrolling
// slowly drops the lines in one by one, scrolling back up retracts them in order.
function useSecurityReveal() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const revealRefs = useRef<(HTMLElement | null)[]>([]);
  const galaxyRef = useRef<HTMLDivElement | null>(null);
  const setRevealRef = (i: number) => (el: HTMLElement | null) => { revealRefs.current[i] = el; };

  useEffect(() => {
    const REVEAL_START = 0.88; // progress 0 when section top is 88% down the viewport
    const REVEAL_END = 0.28;   // progress 1 when section top is 28% down the viewport
    let ticking = false;

    function update() {
      ticking = false;
      const el = sectionRef.current;
      if (!el) return;
      const vh = window.innerHeight;
      const rectTop = el.getBoundingClientRect().top;
      const raw = (REVEAL_START * vh - rectTop) / ((REVEAL_START - REVEAL_END) * vh);
      const progress = Math.max(0, Math.min(1, raw));
      const n = revealRefs.current.length;
      revealRefs.current.forEach((node, i) => {
        if (!node) return;
        const threshold = (i + 1) / (n + 1);
        node.classList.toggle("security-shown", progress >= threshold);
      });
      galaxyRef.current?.classList.toggle("security-galaxy-on", progress > 0.03);
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);

  return { sectionRef, setRevealRef, galaxyRef };
}

function SecurityGalaxy({ galaxyRef }: { galaxyRef: React.RefObject<HTMLDivElement | null> }) {
  const [stars, setStars] = useState<{ left: number; top: number; size: number; delay: number; duration: number }[]>([]);
  useEffect(() => {
    setStars(Array.from({ length: 26 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
    })));
  }, []);
  return (
    <div ref={galaxyRef} className="security-galaxy" aria-hidden="true">
      <div className="security-nebula security-nebula-a"/>
      <div className="security-nebula security-nebula-b"/>
      {stars.map((s, i) => (
        <div key={i} className="security-star" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s` }}/>
      ))}
    </div>
  );
}

function Security() {
  const { sectionRef, setRevealRef, galaxyRef } = useSecurityReveal();
  return (
    <section ref={sectionRef as React.RefObject<HTMLElement>} className="py-28 overflow-hidden" style={{ background: INK }}>
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <SecurityGalaxy galaxyRef={galaxyRef}/>
          <div className="relative z-10">
            <p ref={setRevealRef(0)} className="security-reveal text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: CAMEL, fontFamily: I }}>Security</p>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6" style={{ fontFamily: U }}>
              <span ref={setRevealRef(1)} className="security-reveal-heading">Exam integrity you can</span>
              <span ref={setRevealRef(2)} className="security-reveal-heading" style={{ color: CAMEL }}>actually prove.</span>
            </h2>
            <p ref={setRevealRef(3)} className="security-reveal-desc text-gray-400 leading-relaxed mb-10 text-sm max-w-md" style={{ fontFamily: I }}>Eight independent security layers monitor every session. Every flag is logged with full context — so appeals are fair and fast, not guesswork.</p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {SECURITY_CHECKS.map((c, i) => (
                <div key={c} ref={setRevealRef(4 + i)} className="security-reveal-check flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${CAMEL}25` }}><Check size={10} style={{ color: CAMEL }}/></div>
                  <span className="text-xs text-gray-400 leading-relaxed" style={{ fontFamily: I }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="bg-gray-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/><span className="text-sm font-semibold text-white" style={{ fontFamily: U }}>Proctoring: Mathematics Final</span></div>
              <div className="flex items-center gap-2"><span className="text-xs font-mono text-gray-400">34 / 34 connected</span><div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ fontFamily: U }}>2 Alerts</div></div>
            </div>
            <div className="grid grid-cols-4 gap-2 p-4">
              {SECURITY_NAMES.map((name, i) => (
                <div key={name} className="security-proc-card relative overflow-hidden rounded-xl aspect-[4/3] flex flex-col items-center justify-center border border-white/10 bg-black/40" data-row={i < 4 ? 1 : 2} style={{ ["--i" as string]: SECURITY_SCAN_ORDER[i] } as React.CSSProperties}>
                  <div className="security-proc-circle w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mb-1" style={{ fontFamily: U }}>{name.split(" ").map(w=>w[0]).join("")}</div>
                  <span className="text-[9px] text-gray-500" style={{ fontFamily: I }}>{name}</span>
                </div>
              ))}
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
  const [textRef, textInView] = useInViewToggle<HTMLDivElement>({ threshold: 0.3 });
  const [cardsRef, cardsInView] = useInViewToggle<HTMLDivElement>({ threshold: 0.2 });
  return (
    <section className="py-28" style={{ background: CREAM }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-16 items-start">
          <div ref={textRef} className={`testi-text ${textInView ? "in-view" : ""}`}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: CAMEL, fontFamily: I }}>What educators say</p>
            <h2 className="text-4xl lg:text-5xl font-black leading-tight" style={{ fontFamily: U, color: INK }}>They switched.<br/><span className="font-light opacity-60">They didn't go back.</span></h2>
            <div className="flex items-center gap-3 mt-10">
              <div className="flex -space-x-3">{reviews.map(r => <img key={r.name} src={r.photo} alt={r.name} className="w-10 h-10 rounded-full border-2 border-white object-cover"/>)}</div>
              <div><div className="flex gap-0.5 mb-0.5">{Array(5).fill(0).map((_,i) => <Star key={i} size={12} className="fill-amber-400 text-amber-400"/>)}</div><p className="text-xs text-gray-500" style={{ fontFamily: I }}><span className="font-semibold text-gray-700">2,400+</span> educators</p></div>
            </div>
          </div>
          <div ref={cardsRef} className={`testi-cards space-y-4 ${cardsInView ? "in-view" : ""}`}>
            {reviews.map(({ text, name, role, rating, photo }, i) => (
              <div key={name} className="testi-card bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-200 hover:shadow-md" style={{ ["--reveal-delay" as string]: `${i * 0.35}s` } as React.CSSProperties}>
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

function CtaHighlightReel() {
  const smRef = useRef<HTMLElement | null>(null);
  const mdRef = useRef<HTMLElement | null>(null);
  const lgRef = useRef<HTMLElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const LOOP_H = 600; // must match the cta-star-drift translateY distance in theme.css
    const cardWidth = Math.round(wrapRef.current?.getBoundingClientRect().width || 900);

    function starLayer(count: number, blur: number) {
      const coords: [number, number][] = [];
      for (let i = 0; i < count; i++) coords.push([Math.floor(Math.random() * cardWidth), Math.floor(Math.random() * LOOP_H)]);
      // the duplicate set reuses the SAME coordinates offset by +LOOP_H, so the seam lines up exactly
      const top = coords.map(([x, y]) => `${x}px ${y}px ${blur}px #fff`);
      const bottom = coords.map(([x, y]) => `${x}px ${y + LOOP_H}px ${blur}px #fff`);
      return top.concat(bottom).join(", ");
    }

    if (smRef.current) smRef.current.style.boxShadow = starLayer(70, 0);
    if (mdRef.current) mdRef.current.style.boxShadow = starLayer(35, 0);
    if (lgRef.current) lgRef.current.style.boxShadow = starLayer(16, 1);
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="cta-stars cta-stars-sm"><i ref={smRef}/></div>
      <div className="cta-stars cta-stars-md"><i ref={mdRef}/></div>
      <div className="cta-stars cta-stars-lg"><i ref={lgRef}/></div>

      <div className="cta-reel">
        {/* Scene 1: exam paper appears */}
        <div className="cta-scene cta-scene-1">
          <svg viewBox="0 0 230 230" fill="none">
            <rect x="65" y="35" width="100" height="130" rx="10" stroke="#C8A97E" strokeWidth="3"/>
            <line x1="82" y1="65" x2="148" y2="65" stroke="#C8A97E" strokeWidth="3" strokeLinecap="round"/>
            <line x1="82" y1="85" x2="148" y2="85" stroke="#C8A97E" strokeWidth="3" strokeLinecap="round"/>
            <line x1="82" y1="105" x2="130" y2="105" stroke="#C8A97E" strokeWidth="3" strokeLinecap="round"/>
            <circle className="cta-pop" cx="152" cy="128" r="20" fill="#C8A97E"/>
            <path className="cta-pop" d="M143 128l6 6 12-12" stroke="#0D1B2A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>

        {/* Scene 2: timer counts down */}
        <div className="cta-scene cta-scene-2">
          <svg viewBox="0 0 230 230" fill="none">
            <circle cx="115" cy="115" r="62" stroke="#C8A97E" strokeWidth="3" opacity=".35"/>
            <circle className="cta-ring" cx="115" cy="115" r="62" stroke="#C8A97E" strokeWidth="3" strokeLinecap="round" strokeDasharray="120 400"/>
            <line x1="115" y1="115" x2="115" y2="78" stroke="#C8A97E" strokeWidth="4" strokeLinecap="round"/>
            <line x1="115" y1="115" x2="140" y2="115" stroke="#C8A97E" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="115" cy="115" r="5" fill="#C8A97E"/>
          </svg>
        </div>

        {/* Scene 3: secure proctored session */}
        <div className="cta-scene cta-scene-3">
          <svg viewBox="0 0 230 230" fill="none">
            <path d="M115 40l55 20v45c0 40-25 68-55 85-30-17-55-45-55-85V60z" stroke="#C8A97E" strokeWidth="3"/>
            <clipPath id="ctaShieldClip"><path d="M115 40l55 20v45c0 40-25 68-55 85-30-17-55-45-55-85V60z"/></clipPath>
            <g clipPath="url(#ctaShieldClip)">
              <rect className="cta-scan" x="55" y="60" width="120" height="10" fill="#C8A97E" opacity=".8"/>
            </g>
            <path d="M96 118l14 14 26-26" stroke="#C8A97E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Scene 4: results land instantly */}
        <div className="cta-scene cta-scene-4">
          <svg viewBox="0 0 230 230" fill="none">
            <rect x="55" y="55" width="120" height="120" rx="16" stroke="#C8A97E" strokeWidth="3"/>
            <text className="cta-pop" x="115" y="122" textAnchor="middle" fontFamily="Urbanist, sans-serif" fontWeight="900" fontSize="40" fill="#C8A97E">98%</text>
            <line x1="72" y1="150" x2="158" y2="150" stroke="#C8A97E" strokeWidth="3" strokeLinecap="round" opacity=".5"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

function CTA({ onEnterCode, onSignUp }: { onEnterCode: () => void; onSignUp: () => void }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden px-10 py-20 text-center" style={{ background: INK }}>
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: CAMEL, transform: "translate(30%, -30%)" }}/>
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: CAMEL, transform: "translate(-30%, 30%)" }}/>
          <CtaHighlightReel/>
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
