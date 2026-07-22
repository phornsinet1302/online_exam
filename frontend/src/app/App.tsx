"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown, Search, Menu, X, ArrowRight, Check,
  Star, Shield, Zap, BarChart3, Eye, Users, BookOpen,
  Brain, FileCheck, Clock, Hash,
  Twitter, Linkedin, Youtube, Globe, Lock,
  CheckCircle2, GraduationCap,
  LayoutDashboard, TrendingUp, Bell, Settings,
  LogOut, Home, Download, RefreshCw,
  ChevronUp, User, Camera,
  CheckCheck, AlertTriangle,
  Award, Activity,
  EyeOff, CalendarDays, SlidersHorizontal, RotateCcw,
  // New icons
  FileText, Plus, Sparkles, Copy, Link, QrCode,
  MoreVertical, Archive, Pencil, Trash2, Layers,
  AlignLeft, ToggleLeft, Minus, ArrowLeftRight,
  CheckSquare, Upload, FlaskConical, ChevronRight,
  ListChecks, ChevronLeft,
  Filter, BookMarked,
  // Grading & Anti-cheat
  ClipboardCheck, PenLine, Monitor, ShieldAlert,
  ScrollText, MessageSquare, Ban, AlertOctagon,
  ThumbsUp, ThumbsDown,
  // Collaboration & Reports
  UserPlus, UserCheck, Crown, ShieldCheck,
  BarChart2, FileBarChart, UserX,
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const U = "'Urbanist', sans-serif";
const I = "'Inter', sans-serif";
const INK   = "#0D1B2A";
const CAMEL = "#C8A97E";
const CREAM  = "#FAF8F5";
const BLUE   = "#2563EB";

// ─── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_EXAMS = [
  { id:"1", title:"Calculus Final Exam",        subject:"Mathematics", status:"published", students:34, date:"Jul 10, 2026", duration:90,  code:"CALC-2026-XZ", questions:24 },
  { id:"2", title:"Biology Mid-term",           subject:"Science",     status:"published", students:28, date:"Jul 13, 2026", duration:60,  code:"BIO-2026-MT",  questions:18 },
  { id:"3", title:"English Comprehension",      subject:"English",     status:"draft",     students:0,  date:"Jul 15, 2026", duration:45,  code:"ENG-2026-CP",  questions:12 },
  { id:"4", title:"Physics Quiz",               subject:"Science",     status:"published", students:22, date:"Jul 8, 2026",  duration:30,  code:"PHY-2026-QZ",  questions:10 },
  { id:"5", title:"History Essay Assessment",   subject:"History",     status:"archived",  students:19, date:"Jun 20, 2026", duration:120, code:"HIS-2026-ES",  questions:5  },
  { id:"6", title:"Computer Science Practical", subject:"CS",          status:"draft",     students:0,  date:"Jul 20, 2026", duration:90,  code:"CS-2026-PR",   questions:0  },
];

const MOCK_QUESTIONS = [
  { id:"1", type:"mcq",       text:"What is the derivative of sin(x)?",                     subject:"Mathematics", difficulty:"Easy",   tags:["calculus","derivatives"] },
  { id:"2", type:"essay",     text:"Discuss the role of mitochondria in cellular respiration.", subject:"Science",   difficulty:"Hard",   tags:["biology","cell"] },
  { id:"3", type:"truefalse", text:"The speed of light in vacuum is 3×10⁸ m/s.",             subject:"Science",     difficulty:"Easy",   tags:["physics"] },
  { id:"4", type:"short",     text:"Define Newton's First Law of Motion.",                   subject:"Science",     difficulty:"Easy",   tags:["physics","mechanics"] },
  { id:"5", type:"mcq",       text:"Which of the following is a prime number?",              subject:"Mathematics", difficulty:"Easy",   tags:["number theory"] },
  { id:"6", type:"fill",      text:"The process by which plants make food is called ___.",   subject:"Science",     difficulty:"Easy",   tags:["biology"] },
  { id:"7", type:"matching",  text:"Match the following elements to their symbols.",         subject:"Science",     difficulty:"Medium", tags:["chemistry"] },
  { id:"8", type:"essay",     text:"Analyze the causes of World War I.",                     subject:"History",     difficulty:"Hard",   tags:["history","wwi"] },
];

const Q_TYPES = [
  { id:"mcq",       label:"Multiple Choice",  icon:ListChecks,    color:"#eff6ff" },
  { id:"truefalse", label:"True / False",     icon:ToggleLeft,    color:"#f0fdf4" },
  { id:"short",     label:"Short Answer",     icon:AlignLeft,     color:"#fefce8" },
  { id:"essay",     label:"Essay",            icon:FileText,      color:"#fdf4ff" },
  { id:"fill",      label:"Fill in Blank",    icon:Minus,         color:"#fff7ed" },
  { id:"matching",  label:"Matching",         icon:ArrowLeftRight,color:"#eff6ff" },
  { id:"checkbox",  label:"Checkbox",         icon:CheckSquare,   color:"#f0fdf4" },
  { id:"dropdown",  label:"Dropdown",         icon:ChevronDown,   color:"#fefce8" },
  { id:"file",      label:"File Upload",      icon:Upload,        color:"#fdf4ff" },
  { id:"math",      label:"Math / Formula",   icon:FlaskConical,  color:"#fff7ed" },
];

function useNavigate() {
  const router = useRouter();
  return (path: string) => router.push(path as never);
}

function useParams() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "dashboard" && segments[1] === "exams" && segments[2]) {
    return { id: segments[2] };
  }

  if (segments[0] === "student" && segments[1] === "history" && segments[2]) {
    return { id: segments[2] };
  }

  return {};
}

// ═══════════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function EnterCodeModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: "rgba(13,27,42,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-[400px] shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500"><X size={15}/></button>
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background:"#F0EDE8" }}><Hash size={22} style={{ color:CAMEL }}/></div>
          <h3 className="text-2xl font-bold mb-1.5" style={{ fontFamily:U, color:INK }}>Enter your exam code</h3>
          <p className="text-sm text-gray-500" style={{ fontFamily:I }}>Your teacher will provide this code before the exam.</p>
        </div>
        <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="e.g. MATH-2024-XZ"
          maxLength={14} autoFocus
          className="w-full border border-gray-200 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.18em] text-gray-900 placeholder:text-gray-300 placeholder:text-base placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-gray-400 transition-colors mb-4 bg-gray-50"
          style={{ fontFamily:U }}/>
        <button className="w-full text-white font-bold py-4 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] mb-3 text-base" style={{ background:INK, fontFamily:U }}>Start exam</button>
        <button onClick={onClose} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors" style={{ fontFamily:I }}>Cancel</button>
      </div>
    </div>
  );
}

function LandingNavbar({ onEnterCode, onSignIn, onSignUp }: { onEnterCode:()=>void; onSignIn:()=>void; onSignUp:()=>void }) {
  const [open, setOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const navLinks = [{ label:"How it works", dropdown:true },{ label:"Pricing", dropdown:false },{ label:"Customers", dropdown:true },{ label:"Resources", dropdown:true }];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center gap-8">
        <a href="#" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:INK }}><GraduationCap size={16} className="text-white"/></div>
          <span className="text-[17px] font-black tracking-tight" style={{ fontFamily:U, color:INK }}>exam<span style={{ color:CAMEL }}>·ai</span></span>
        </a>
        <div className="hidden lg:flex items-center gap-6 flex-1">
          {navLinks.map(({ label, dropdown })=>(
            <button key={label} className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors" style={{ fontFamily:I }}>
              {label}{dropdown&&<ChevronDown size={13} className="opacity-50"/>}
            </button>
          ))}
        </div>
        <div className="hidden lg:flex items-center border border-gray-200 rounded-full overflow-hidden bg-gray-50 flex-shrink-0">
          <input value={codeInput} onChange={e=>setCodeInput(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&onEnterCode()} placeholder="Student exam key" maxLength={14}
            className="bg-transparent text-sm pl-4 pr-2 py-2.5 w-40 focus:outline-none text-gray-700 placeholder:text-gray-400" style={{ fontFamily:I }}/>
          <button onClick={onEnterCode} className="flex items-center gap-1.5 text-white text-xs font-semibold px-4 py-2.5 transition-all hover:opacity-90 rounded-full m-0.5" style={{ background:CAMEL, fontFamily:U }}>
            <ArrowRight size={13}/>Enter
          </button>
        </div>
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <button onClick={onSignIn} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2" style={{ fontFamily:I }}>Sign in</button>
          <button onClick={onSignUp} className="text-sm font-semibold text-white px-5 py-2.5 rounded-full transition-all hover:opacity-90 shadow-md" style={{ background:INK, fontFamily:U }}>Sign up free</button>
        </div>
        <button className="lg:hidden ml-auto p-2 text-gray-600" onClick={()=>setOpen(!open)}>{open?<X size={20}/>:<Menu size={20}/>}</button>
      </div>
      {open&&(
        <div className="lg:hidden bg-white border-t border-gray-100 px-6 pb-5 flex flex-col gap-2">
          {navLinks.map(({ label })=><a key={label} href="#" className="text-sm font-medium text-gray-600 py-3 border-b border-gray-50" style={{ fontFamily:I }}>{label}</a>)}
          <div className="flex gap-3 mt-3">
            <button onClick={onEnterCode} className="flex-1 flex items-center justify-center gap-1.5 text-white text-sm font-semibold py-3 rounded-full" style={{ background:CAMEL, fontFamily:U }}><Hash size={14}/>Enter Code</button>
            <button onClick={onSignUp} className="flex-1 text-white text-sm font-semibold py-3 rounded-full" style={{ background:INK, fontFamily:U }}>Sign up free</button>
          </div>
        </div>
      )}
    </nav>
  );
}

function HeroMockup() {
  return (
    <div className="relative w-full">
      <div className="bg-white rounded-2xl shadow-2xl shadow-gray-300/50 overflow-hidden border border-gray-200/80">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400/80"/><div className="w-3 h-3 rounded-full bg-amber-400/80"/><div className="w-3 h-3 rounded-full bg-green-400/80"/></div>
          <div className="flex-1 mx-3 bg-white rounded-md px-3 py-1 border border-gray-200"><span className="text-xs text-gray-400" style={{ fontFamily:I }}>exam.ai/live/mathematics-final</span></div>
          <div className="w-2 h-2 rounded-full bg-green-400"/>
        </div>
        <div className="flex h-[340px]">
          <div className="w-44 bg-gray-900 flex flex-col p-4 gap-1 flex-shrink-0">
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center"><GraduationCap size={11} className="text-white"/></div>
              <span className="text-white text-xs font-bold" style={{ fontFamily:U }}>exam·ai</span>
            </div>
            {["Dashboard","Live Exams","Question Bank","Analytics","Students","Settings"].map((item,i)=>(
              <div key={item} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${i===1?"bg-white/15 text-white font-semibold":"text-gray-400"}`} style={{ fontFamily:I }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background:i===1?CAMEL:"transparent", border:i!==1?"1px solid #4B5563":"none"}}/>
                {item}
              </div>
            ))}
          </div>
          <div className="flex-1 p-5 overflow-hidden bg-gray-50">
            <div className="flex items-center justify-between mb-5">
              <div><p className="text-xs text-gray-500 mb-0.5" style={{ fontFamily:I }}>Live Monitoring</p><h3 className="text-sm font-bold text-gray-900" style={{ fontFamily:U }}>Mathematics Final · Year 12</h3></div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/><span className="text-xs font-semibold text-green-700" style={{ fontFamily:U }}>Live</span></div>
                <div className="bg-white border border-gray-200 rounded-full px-3 py-1.5 flex items-center gap-1.5"><Clock size={11} className="text-gray-500"/><span className="text-xs font-semibold text-gray-700" style={{ fontFamily:U }}>41:18</span></div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[{label:"Active",val:"28",color:"text-green-600",bg:"bg-green-50"},{label:"Flagged",val:"2",color:"text-red-600",bg:"bg-red-50"},{label:"Submitted",val:"4",color:"text-blue-600",bg:"bg-blue-50"},{label:"Avg Score",val:"76%",color:"text-gray-700",bg:"bg-gray-100"}].map(({label,val,color,bg})=>(
                <div key={label} className={`${bg} rounded-xl p-3`}><p className={`text-lg font-black leading-none ${color}`} style={{ fontFamily:U }}>{val}</p><p className="text-[10px] text-gray-500 mt-1" style={{ fontFamily:I }}>{label}</p></div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[{init:"AM",status:"ok",q:"Q12"},{init:"SJ",status:"flag",q:"Q8"},{init:"LK",status:"ok",q:"Q14"},{init:"TR",status:"ok",q:"Q11"},{init:"MP",status:"flag",q:"Q7"},{init:"OB",status:"ok",q:"Q13"},{init:"HL",status:"ok",q:"Q9"},{init:"JW",status:"done",q:"Done"},{init:"RK",status:"ok",q:"Q12"},{init:"EM",status:"ok",q:"Q10"}].map(({init,status,q})=>(
                <div key={init} className={`relative rounded-xl p-2 flex flex-col items-center gap-1 border ${status==="flag"?"bg-red-50 border-red-200":status==="done"?"bg-blue-50 border-blue-200":"bg-white border-gray-200"}`}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background:status==="flag"?"#ef4444":status==="done"?BLUE:INK, fontFamily:U }}>{init}</div>
                  <span className={`text-[9px] font-medium ${status==="flag"?"text-red-600":status==="done"?"text-blue-600":"text-gray-500"}`} style={{ fontFamily:I }}>{q}</span>
                  {status==="flag"&&<div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center"><span className="text-white text-[7px] font-bold">!</span></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-6 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3" style={{ minWidth:180 }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"#f0fdf4" }}><CheckCircle2 size={18} className="text-green-600"/></div>
        <div><p className="text-xs font-bold text-gray-900" style={{ fontFamily:U }}>Auto-graded</p><p className="text-[11px] text-gray-500" style={{ fontFamily:I }}>28 papers in 0.8s</p></div>
      </div>
      <div className="absolute -top-5 -right-6 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3" style={{ minWidth:175 }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"#fff7ed" }}><Shield size={18} style={{ color:CAMEL }}/></div>
        <div><p className="text-xs font-bold text-gray-900" style={{ fontFamily:U }}>2 flags raised</p><p className="text-[11px] text-gray-500" style={{ fontFamily:I }}>Proctor notified</p></div>
      </div>
    </div>
  );
}

function Hero({ onEnterCode, onSignUp }: { onEnterCode:()=>void; onSignUp:()=>void }) {
  return (
    <section className="relative pt-[68px] overflow-hidden min-h-screen flex items-center" style={{ background:CREAM }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" fill="none">
          <path d="M640 0 L1440 0 L1440 680 Q1100 520 800 560 Q600 580 500 480 Q380 360 440 200 Q480 80 640 0Z" fill={CAMEL} opacity="0.18"/>
          <path d="M740 0 L1440 0 L1440 560 Q1160 440 920 490 Q720 530 660 400 Q600 270 680 120 Q710 40 740 0Z" fill={CAMEL} opacity="0.13"/>
        </svg>
      </div>
      <div className="relative max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-[1fr_1.15fr] gap-16 items-center py-20">
        <div>
          <div className="inline-flex items-center gap-2 mb-8 text-xs font-semibold rounded-full px-4 py-2 border" style={{ color:CAMEL, borderColor:`${CAMEL}50`, background:`${CAMEL}12`, fontFamily:I }}><Zap size={12}/>AI-powered · GDPR compliant · No install needed</div>
          <h1 style={{ fontFamily:U, color:INK }} className="leading-[1.05] mb-6">
            <span className="block text-3xl lg:text-4xl font-light tracking-tight opacity-70">Simply powerful</span>
            <span className="block text-5xl lg:text-7xl font-black tracking-tight">Online Exams</span>
          </h1>
          <p className="text-base text-gray-500 leading-relaxed mb-9 max-w-[460px]" style={{ fontFamily:I }}>Easy to get started and intuitive to use. Our platform equips you with all the power and functionality you need to create secure exams for your students, your way.</p>
          <div className="flex flex-wrap gap-3 mb-5">
            <button onClick={onSignUp} className="flex items-center gap-2 text-white font-bold px-7 py-3.5 rounded-full transition-all hover:opacity-90 active:scale-[0.98] shadow-lg text-sm" style={{ background:INK, fontFamily:U, boxShadow:`0 8px 24px ${INK}30` }}>Sign up for your free trial</button>
            <button onClick={onEnterCode} className="flex items-center gap-2 font-semibold px-7 py-3.5 rounded-full border transition-all hover:bg-gray-50 text-sm" style={{ color:INK, borderColor:"#D1CBC0", fontFamily:U }}><Hash size={15} style={{ color:CAMEL }}/>Enter exam code</button>
          </div>
          <p className="text-xs text-gray-400 mb-8" style={{ fontFamily:I }}>30-day free trial. No credit card required.</p>
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2"><div className="flex gap-0.5">{Array(5).fill(0).map((_,i)=><Star key={i} size={12} className="fill-amber-400 text-amber-400"/>)}</div><span className="text-xs font-semibold text-gray-700" style={{ fontFamily:U }}>4.8</span><span className="text-xs text-gray-400" style={{ fontFamily:I }}>Capterra</span></div>
            <div className="w-px h-4 bg-gray-200"/>
            <div className="flex items-center gap-1.5"><Shield size={14} style={{ color:CAMEL }}/><span className="text-xs font-semibold text-gray-700" style={{ fontFamily:U }}>GDPR</span></div>
            <div className="w-px h-4 bg-gray-200"/>
            <div className="flex items-center gap-1.5"><Lock size={14} className="text-gray-600"/><span className="text-xs font-semibold text-gray-700" style={{ fontFamily:U }}>SOC 2 Type II</span></div>
            <div className="w-px h-4 bg-gray-200"/>
            <div className="flex items-center gap-1.5"><Globe size={14} className="text-gray-600"/><span className="text-xs font-semibold text-gray-700" style={{ fontFamily:U }}>500+ institutions</span></div>
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
        <p className="text-xs text-center text-gray-400 mb-6 uppercase tracking-widest font-medium" style={{ fontFamily:I }}>Trusted by leading institutions worldwide</p>
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
          {orgs.map(org=><span key={org} className="text-sm font-bold text-gray-300 hover:text-gray-500 transition-colors cursor-default" style={{ fontFamily:U }}>{org}</span>)}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon:Brain,     title:"AI Question Generation",  desc:"Paste a topic or syllabus — get a fully balanced question paper in seconds. MCQ, short answer, essay. Any subject.", tag:"Saves 6+ hrs" },
    { icon:Eye,       title:"Live Proctoring",          desc:"Face detection, tab-switch detection, and behavioural analysis run silently. Students are never disrupted.",          tag:"99.9% detection" },
    { icon:FileCheck, title:"Instant Auto-Grading",     desc:"Objective answers graded in milliseconds. AI scores essays against your rubric with written, explainable feedback.", tag:"< 1 second" },
    { icon:BarChart3, title:"Analytics & Reports",      desc:"Class-wide trends, per-student breakdowns, and question-level difficulty scores — delivered the moment the exam ends.",tag:"Live data" },
    { icon:Shield,    title:"Session Replay",           desc:"Rewind any exam session frame by frame. Review every flag with full timeline context for fair, auditable appeals.",    tag:"Full audit trail" },
    { icon:Users,     title:"Team Collaboration",       desc:"Build shared question banks, co-author papers, and review results with your entire department in one workspace.",      tag:"Unlimited seats" },
  ];
  return (
    <section className="py-28" style={{ background:CREAM }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-16 items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color:CAMEL, fontFamily:I }}>What's included</p>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-6" style={{ fontFamily:U, color:INK }}>Everything in one place.</h2>
            <p className="text-gray-500 leading-relaxed mb-8 text-sm" style={{ fontFamily:I }}>No patchwork of tools. No manual handoffs. One coherent platform that takes you from blank paper to final grade report.</p>
            <button className="flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-full transition-all hover:opacity-90" style={{ background:INK, fontFamily:U }}>See all features <ArrowRight size={15}/></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map(({ icon:Icon, title, desc, tag })=>(
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/80 transition-all duration-300 cursor-default group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"#F0EDE8" }}><Icon size={19} style={{ color:INK }}/></div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background:`${CAMEL}18`, color:CAMEL, fontFamily:I }}>{tag}</span>
                </div>
                <h3 className="text-[15px] font-bold mb-2" style={{ fontFamily:U, color:INK }}>{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed" style={{ fontFamily:I }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ onEnterCode }: { onEnterCode:()=>void }) {
  const steps = [
    { n:"01", title:"Set up your exam",    desc:"Choose subject, duration, and question types. Paste your syllabus or topic list." },
    { n:"02", title:"AI builds the paper", desc:"Receive a balanced, reviewed question set calibrated to your chosen difficulty." },
    { n:"03", title:"Students sit securely",desc:"A locked-down browser session with live proctoring and real-time alerts." },
    { n:"04", title:"Results, instantly",   desc:"Scores, feedback, and analytics reports ready the moment time runs out." },
  ];
  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-20">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color:CAMEL, fontFamily:I }}>The process</p>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight" style={{ fontFamily:U, color:INK }}>Four steps.<br/><span className="font-light opacity-60">That's really it.</span></h2>
        </div>
        <div className="relative">
          <div className="absolute top-7 left-8 right-8 h-px hidden lg:block" style={{ background:`linear-gradient(90deg, transparent, ${CAMEL}60, ${CAMEL}60, transparent)` }}/>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ n, title, desc })=>(
              <div key={n} className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black mb-6 relative z-10" style={{ background:n==="01"?INK:"#F0EDE8", color:n==="01"?"white":INK, fontFamily:U }}>{n}</div>
                <h3 className="text-base font-bold mb-2" style={{ fontFamily:U, color:INK }}>{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily:I }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 justify-center mt-16">
          <button className="flex items-center gap-2 text-white font-bold px-7 py-3.5 rounded-full text-sm hover:opacity-90 transition-opacity" style={{ background:INK, fontFamily:U }}>Start for free <ArrowRight size={16}/></button>
          <button onClick={onEnterCode} className="flex items-center gap-2 font-semibold px-7 py-3.5 rounded-full border text-sm hover:bg-gray-50 transition-colors" style={{ color:INK, borderColor:"#D1CBC0", fontFamily:U }}><Hash size={15} style={{ color:CAMEL }}/>Enter exam code</button>
        </div>
      </div>
    </section>
  );
}

function Security() {
  const checks = ["Face & identity verification on entry","Tab switch and window focus detection","Behavioural anomaly scoring (AI)","Random encrypted screenshot capture","Browser lockdown — no extensions, no copy-paste","Proctor live alert dashboard","Full session replay with timestamped flags","End-to-end encrypted question delivery"];
  return (
    <section className="py-28 overflow-hidden" style={{ background:INK }}>
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color:CAMEL, fontFamily:I }}>Security</p>
          <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6" style={{ fontFamily:U }}>Exam integrity you can<br/><span style={{ color:CAMEL }}>actually prove.</span></h2>
          <p className="text-gray-400 leading-relaxed mb-10 text-sm max-w-md" style={{ fontFamily:I }}>Eight independent security layers monitor every session. Every flag is logged with full context — so appeals are fair and fast, not guesswork.</p>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {checks.map(c=>(
              <div key={c} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background:`${CAMEL}25` }}><Check size={10} style={{ color:CAMEL }}/></div>
                <span className="text-xs text-gray-400 leading-relaxed" style={{ fontFamily:I }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="bg-gray-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/><span className="text-sm font-semibold text-white" style={{ fontFamily:U }}>Proctoring: Mathematics Final</span></div>
              <div className="flex items-center gap-2"><span className="text-xs font-mono text-gray-400">34 / 34 connected</span><div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ fontFamily:U }}>2 Alerts</div></div>
            </div>
            <div className="grid grid-cols-4 gap-2 p-4">
              {Array.from({length:8}).map((_,i)=>{
                const flagged=i===2||i===5;
                const names=["A. Mills","S. Jones","L. Kim","T. Reed","M. Park","O. Bell","H. Lee","J. Wang"];
                return (
                  <div key={i} className={`relative rounded-xl aspect-[4/3] flex flex-col items-center justify-center border ${flagged?"border-red-500/60 bg-red-950/30":"border-white/10 bg-black/40"}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mb-1" style={{ background:flagged?"#ef4444":"#374151", fontFamily:U }}>{names[i].split(" ").map(w=>w[0]).join("")}</div>
                    <span className="text-[9px] text-gray-500" style={{ fontFamily:I }}>{names[i]}</span>
                    {flagged&&<div className="absolute inset-0 rounded-xl border-2 border-red-500/50 pointer-events-none"/>}
                  </div>
                );
              })}
            </div>
            <div className="px-5 pb-4 space-y-2">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3" style={{ fontFamily:U }}>Recent activity</p>
              {[{t:"09:41:03",msg:"S. Jones — tab switched (2s)",type:"warn"},{t:"09:44:27",msg:"O. Bell — face not detected (4s)",type:"warn"},{t:"09:46:00",msg:"All others — no anomalies",type:"ok"}].map(({t,msg,type})=>(
                <div key={t} className="flex items-center gap-3 py-1.5 border-t border-white/5">
                  <span className="text-[10px] text-gray-600 font-mono flex-shrink-0">{t}</span>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${type==="warn"?"bg-red-500":"bg-green-500"}`}/>
                  <span className={`text-[11px] font-medium ${type==="warn"?"text-red-400":"text-green-400"}`} style={{ fontFamily:I }}>{msg}</span>
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
    { text:"The AI question generation alone changed everything. I used to spend an entire Sunday building a paper. Now it's done before my coffee gets cold.", name:"Dr. Sarah Chen", role:"Professor of Mathematics, MIT", rating:5, photo:"https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&auto=format&q=80" },
    { text:"Our students trust the process now. The proctoring is completely invisible to them — but iron-clad on our end. Appeals dropped by 80%.", name:"James Willis", role:"Head of Assessment, Oxford", rating:5, photo:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format&q=80" },
    { text:"We run 50+ certification exams monthly across three time zones. This platform handles every detail without anyone on our team lifting a finger.", name:"Amara Diallo", role:"Head of Learning, Deloitte", rating:5, photo:"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&auto=format&q=80" },
  ];
  return (
    <section className="py-28" style={{ background:CREAM }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-16 items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color:CAMEL, fontFamily:I }}>What educators say</p>
            <h2 className="text-4xl lg:text-5xl font-black leading-tight" style={{ fontFamily:U, color:INK }}>They switched.<br/><span className="font-light opacity-60">They didn't go back.</span></h2>
            <div className="flex items-center gap-3 mt-10">
              <div className="flex -space-x-3">{reviews.map(r=><img key={r.name} src={r.photo} alt={r.name} className="w-10 h-10 rounded-full border-2 border-white object-cover"/>)}</div>
              <div><div className="flex gap-0.5 mb-0.5">{Array(5).fill(0).map((_,i)=><Star key={i} size={12} className="fill-amber-400 text-amber-400"/>)}</div><p className="text-xs text-gray-500" style={{ fontFamily:I }}><span className="font-semibold text-gray-700">2,400+</span> educators</p></div>
            </div>
          </div>
          <div className="space-y-4">
            {reviews.map(({ text, name, role, rating, photo })=>(
              <div key={name} className="bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
                <div className="flex gap-0.5 mb-4">{Array(rating).fill(0).map((_,i)=><Star key={i} size={13} className="fill-amber-400 text-amber-400"/>)}</div>
                <p className="text-sm text-gray-700 leading-relaxed mb-5" style={{ fontFamily:I }}>"{text}"</p>
                <div className="flex items-center gap-3">
                  <img src={photo} alt={name} className="w-10 h-10 rounded-full object-cover border border-gray-100"/>
                  <div><p className="text-sm font-bold text-gray-900" style={{ fontFamily:U }}>{name}</p><p className="text-xs text-gray-400" style={{ fontFamily:I }}>{role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA({ onEnterCode, onSignUp }: { onEnterCode:()=>void; onSignUp:()=>void }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden px-10 py-20 text-center" style={{ background:INK }}>
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background:CAMEL, transform:"translate(30%, -30%)" }}/>
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background:CAMEL, transform:"translate(-30%, 30%)" }}/>
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color:CAMEL, fontFamily:I }}>No credit card · Free forever plan · Ready in 10 minutes</p>
            <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight mb-5" style={{ fontFamily:U }}>Start running better<br/>exams today.</h2>
            <p className="text-gray-400 mb-10 max-w-md mx-auto text-sm leading-relaxed" style={{ fontFamily:I }}>Join 500+ institutions already on the platform. Your first exam takes under 10 minutes to create.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={onSignUp} className="inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-full text-sm transition-all hover:opacity-90" style={{ background:CAMEL, color:"white", fontFamily:U }}>Sign up for free <ArrowRight size={16}/></button>
              <button onClick={onEnterCode} className="inline-flex items-center justify-center gap-2 font-semibold px-8 py-4 rounded-full border text-sm transition-all hover:bg-white/10" style={{ color:"white", borderColor:"rgba(255,255,255,0.2)", fontFamily:U }}><Hash size={15}/>Enter exam code</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = { Product:["Features","Pricing","Security","Integrations","Changelog"], Solutions:["K–12 Schools","Universities","Corporate Training","Certification Bodies"], Resources:["Documentation","Blog","Case Studies","API Reference"], Company:["About us","Careers","Press","Contact"] };
  return (
    <footer className="border-t border-gray-100 bg-white pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-10 mb-14">
          <div>
            <div className="flex items-center gap-2 mb-5"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:INK }}><GraduationCap size={15} className="text-white"/></div><span className="text-lg font-black" style={{ fontFamily:U, color:INK }}>exam<span style={{ color:CAMEL }}>·ai</span></span></div>
            <p className="text-xs text-gray-400 leading-relaxed mb-6 max-w-[220px]" style={{ fontFamily:I }}>AI-powered online examination for modern educators. Secure, simple, and fast.</p>
            <div className="flex gap-2">{[Twitter,Linkedin,Youtube].map((Icon,i)=><button key={i} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all"><Icon size={13}/></button>)}</div>
          </div>
          {Object.entries(cols).map(([cat,items])=>(
            <div key={cat}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5" style={{ fontFamily:U }}>{cat}</p>
              <ul className="space-y-3">{items.map(item=><li key={item}><a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors" style={{ fontFamily:I }}>{item}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400" style={{ fontFamily:I }}>© 2026 exam·ai. All rights reserved.</p>
          <div className="flex items-center gap-5">{["Privacy","Terms","GDPR","Security"].map(item=><a key={item} href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors" style={{ fontFamily:I }}>{item}</a>)}</div>
        </div>
      </div>
    </footer>
  );
}

// ─── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ mode, onClose, onSwitch }: { mode:"login"|"register"; onClose:()=>void; onSwitch:()=>void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const isStudent = email.trim().toLowerCase() === "student@gmail.com";
    setTimeout(()=>{ setLoading(false); onClose(); navigate(isStudent ? "/student/enter" : "/dashboard"); }, 900);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" style={{ background:"rgba(13,27,42,0.65)", backdropFilter:"blur(10px)" }} onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-[420px] shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="h-1 w-full" style={{ background:`linear-gradient(90deg, ${INK}, ${CAMEL})` }}/>
        <div className="p-8">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:INK }}><GraduationCap size={15} className="text-white"/></div>
              <span className="text-base font-black" style={{ fontFamily:U, color:INK }}>exam<span style={{ color:CAMEL }}>·ai</span></span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"><X size={15}/></button>
          </div>
          <h2 className="text-2xl font-black mb-1" style={{ fontFamily:U, color:INK }}>{mode==="login"?"Welcome back":"Create your account"}</h2>
          <p className="text-sm text-gray-500 mb-6" style={{ fontFamily:I }}>{mode==="login"?"Sign in to access your teacher dashboard.":"Start your 30-day free trial today."}</p>
          <button type="button" className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:bg-gray-50 rounded-xl py-3 text-sm font-semibold text-gray-700 transition-all mb-4" style={{ fontFamily:U }}>
            <svg width="17" height="17" viewBox="0 0 48 48" fill="none"><path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" fill="#FFC107"/><path d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" fill="#FF3D00"/><path d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C9.7 35.6 16.3 44 24 44z" fill="#4CAF50"/><path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.1-2.2 3.9-4 5.2l6.2 5.2C37.2 38.6 44 33.3 44 24c0-1.2-.1-2.3-.4-3.5z" fill="#1976D2"/></svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-4"><div className="flex-1 h-px bg-gray-200"/><span className="text-xs text-gray-400" style={{ fontFamily:I }}>or</span><div className="flex-1 h-px bg-gray-200"/></div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode==="register"&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors" style={{ fontFamily:I }}/>}
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Work email" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors" style={{ fontFamily:I }}/>
            <div className="relative">
              <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" required className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors" style={{ fontFamily:I }}/>
              <button type="button" onClick={()=>setShowPw(s=>!s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw?<EyeOff size={15}/>:<Eye size={15}/>}</button>
            </div>
            {mode==="login"&&<div className="flex justify-end -mt-1"><button type="button" className="text-xs font-semibold hover:underline" style={{ color:CAMEL, fontFamily:U }}>Forgot password?</button></div>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] mt-1 disabled:opacity-60" style={{ background:INK, fontFamily:U }}>
              {loading?<RefreshCw size={15} className="animate-spin"/>:mode==="login"?"Sign in to dashboard":"Create free account"}
            </button>
          </form>
          <p className="text-center text-xs text-gray-500 mt-5" style={{ fontFamily:I }}>
            {mode==="login"?"Don't have an account? ":"Already have an account? "}
            <button onClick={onSwitch} className="font-semibold hover:underline" style={{ color:CAMEL }}>{mode==="login"?"Sign up free":"Sign in"}</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD SHELL
// ═══════════════════════════════════════════════════════════════════════════════

const SIDEBAR_W = 240;

const NAV_SECTIONS = [
  { section:"Dashboard", items:[
    { id:"overview",       label:"Overview",       icon:LayoutDashboard, path:"/dashboard" },
    { id:"charts",         label:"Analytics",      icon:TrendingUp,      path:"/dashboard/charts" },
    { id:"filters",        label:"Reports",        icon:SlidersHorizontal,path:"/dashboard/filters" },
  ]},
  { section:"Exams", items:[
    { id:"exams",          label:"My Exams",       icon:FileText,        path:"/dashboard/exams" },
    { id:"exams-create",   label:"Create Exam",    icon:Plus,            path:"/dashboard/exams/create" },
  ]},
  { section:"Questions", items:[
    { id:"questions",      label:"Question Bank",  icon:BookMarked,      path:"/dashboard/questions" },
    { id:"ai",             label:"AI Generator",   icon:Sparkles,        path:"/dashboard/ai" },
  ]},
  { section:"Grading", items:[
    { id:"grading",        label:"Auto-Grade",      icon:ClipboardCheck,  path:"/dashboard/grading" },
    { id:"grading-manual", label:"Manual Grading",  icon:PenLine,         path:"/dashboard/grading/manual" },
  ]},
  { section:"Proctoring", items:[
    { id:"monitoring",     label:"Live Monitor",    icon:Monitor,         path:"/dashboard/monitoring" },
    { id:"rules",          label:"Rules Config",    icon:ShieldAlert,     path:"/dashboard/monitoring/rules" },
    { id:"logs",           label:"Security Logs",   icon:ScrollText,      path:"/dashboard/monitoring/logs" },
  ]},
  { section:"Collaboration", items:[
    { id:"collab-invite",  label:"Invite",          icon:UserPlus,        path:"/dashboard/collaboration" },
    { id:"collab-manage",  label:"Manage Roles",    icon:UserCheck,       path:"/dashboard/collaboration/manage" },
  ]},
  { section:"Reports", items:[
    { id:"reports",        label:"Overview",        icon:BarChart2,       path:"/dashboard/reports" },
    { id:"reports-scores", label:"Scores",          icon:Award,           path:"/dashboard/reports/scores" },
    { id:"reports-attend", label:"Attendance",      icon:UserCheck,       path:"/dashboard/reports/attendance" },
    { id:"reports-cheat",  label:"Anti-Cheat",      icon:ShieldCheck,     path:"/dashboard/reports/anticheat" },
    { id:"reports-qana",   label:"Question Analysis",icon:FileBarChart,   path:"/dashboard/reports/questions" },
  ]},
  { section:"Account", items:[
    { id:"notifications",  label:"Notifications",  icon:Bell,            path:"/dashboard/notifications", badge:4 },
    { id:"settings",       label:"Settings",       icon:Settings,        path:"/dashboard/settings" },
  ]},
];

function DashboardSidebar({ active }: { active:string }) {
  const navigate = useNavigate();
  return (
    <aside className="fixed top-0 left-0 h-screen flex flex-col z-40 select-none"
      style={{ width:SIDEBAR_W, background:INK, borderRight:"1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2.5 px-5 h-16 border-b flex-shrink-0" style={{ borderColor:"rgba(255,255,255,0.07)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:CAMEL }}><GraduationCap size={16} className="text-white"/></div>
        <span className="text-[17px] font-black text-white" style={{ fontFamily:U }}>exam<span style={{ color:CAMEL }}>·ai</span></span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_SECTIONS.map(({ section, items })=>(
          <div key={section}>
            <p className="text-[9px] font-bold uppercase tracking-widest px-3 mb-1.5" style={{ color:"rgba(255,255,255,0.22)", fontFamily:U }}>{section}</p>
            {items.map(({ id, label, icon:Icon, path, badge })=>{
              const isActive = active===id;
              return (
                <button key={id} onClick={()=>navigate(path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${isActive?"text-white":"text-gray-400 hover:text-white hover:bg-white/5"}`}
                  style={{ fontFamily:I, background:isActive?`${CAMEL}22`:undefined }}>
                  <Icon size={16} style={{ color:isActive?CAMEL:undefined }}/>
                  <span className="flex-1 text-left">{label}</span>
                  {badge?<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background:"#ef4444", color:"white", fontFamily:U }}>{badge}</span>:null}
                  {isActive&&<div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background:CAMEL }}/>}
                </button>
              );
            })}
          </div>
        ))}
        <div className="pt-1 border-t" style={{ borderColor:"rgba(255,255,255,0.07)" }}>
          <button onClick={()=>navigate("/")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-white hover:bg-white/5 transition-all" style={{ fontFamily:I }}>
            <Home size={16}/> Back to site
          </button>
        </div>
      </nav>
      <div className="px-4 py-4 border-t" style={{ borderColor:"rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background:CAMEL, fontFamily:U }}>JR</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate" style={{ fontFamily:U }}>Jane Robertson</p>
            <p className="text-xs text-gray-500 truncate" style={{ fontFamily:I }}>Mathematics · Year 9–12</p>
          </div>
          <LogOut size={14} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"/>
        </div>
      </div>
    </aside>
  );
}

function DashboardHeader({ title, subtitle, actions }: { title:string; subtitle?:string; actions?:React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 right-0 z-30 bg-white border-b border-gray-100 flex items-center justify-between px-7 h-16" style={{ left:SIDEBAR_W }}>
      <div>
        <h1 className="text-lg font-black leading-none" style={{ fontFamily:U, color:INK }}>{title}</h1>
        {subtitle&&<p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input placeholder="Search…" className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-300 w-40" style={{ fontFamily:I }}/>
        </div>
        <button onClick={()=>navigate("/dashboard/notifications")} className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 transition-all">
          <Bell size={16}/>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background:"#ef4444" }}>4</span>
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold cursor-pointer" style={{ background:CAMEL, fontFamily:U }}>JR</div>
      </div>
    </header>
  );
}

function DashboardLayout({ children, active, title, subtitle, actions }: { children:React.ReactNode; active:string; title:string; subtitle?:string; actions?:React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background:CREAM }}>
      <DashboardSidebar active={active}/>
      <DashboardHeader title={title} subtitle={subtitle} actions={actions}/>
      <main className="pt-16 min-h-screen" style={{ marginLeft:SIDEBAR_W }}>
        <div className="p-7">{children}</div>
      </main>
    </div>
  );
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon:Icon, iconBg, trend, trendUp }: { label:string; value:string; sub?:string; icon:any; iconBg:string; trend?:string; trendUp?:boolean }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:iconBg }}><Icon size={19} style={{ color:INK }}/></div>
        {trend&&<div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendUp?"bg-green-50 text-green-600":"bg-red-50 text-red-500"}`} style={{ fontFamily:U }}>{trendUp?<ChevronUp size={11}/>:<ChevronDown size={11}/>}{trend}</div>}
      </div>
      <p className="text-2xl font-black leading-none mb-1" style={{ fontFamily:U, color:INK }}>{value}</p>
      <p className="text-xs font-semibold text-gray-500" style={{ fontFamily:I }}>{label}</p>
      {sub&&<p className="text-[11px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{sub}</p>}
    </div>
  );
}

function Toggle({ on, onChange }: { on:boolean; onChange:()=>void }) {
  return (
    <button onClick={onChange} className="relative w-11 h-6 rounded-full transition-all flex-shrink-0" style={{ background:on?INK:"#e5e7eb" }}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${on?"left-6":"left-1"}`}/>
    </button>
  );
}

function StatusBadge({ status }: { status:string }) {
  const map: Record<string,string> = { published:"bg-green-50 text-green-700", draft:"bg-gray-100 text-gray-600", archived:"bg-amber-50 text-amber-700" };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${map[status]||map.draft}`} style={{ fontFamily:U }}>{status}</span>;
}

function CopyField({ label, value }: { label:string; value:string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" style={{ fontFamily:U }}>{label}</p>
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <span className="flex-1 text-sm font-mono text-gray-700 truncate">{value}</span>
        <button onClick={copy} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${copied?"text-green-700 bg-green-50":"text-gray-500 hover:bg-gray-200"}`} style={{ fontFamily:U }}>
          {copied?<><Check size={12}/>Copied!</>:<><Copy size={12}/>Copy</>}
        </button>
      </div>
    </div>
  );
}

function QRPattern() {
  // Fixed QR-code-like pattern (7×7 visual)
  const cells = [1,1,1,0,1,1,1,1,0,1,0,1,0,1,1,1,1,0,0,1,1,0,0,0,0,1,0,0,1,1,1,0,1,1,1,0,1,0,0,0,0,1,1,0,0,1,1,0,1];
  return (
    <div className="inline-block p-3 bg-white rounded-xl border border-gray-200">
      <div className="grid gap-[2px]" style={{ gridTemplateColumns:"repeat(7, 14px)" }}>
        {cells.map((filled,i)=><div key={i} style={{ width:14, height:14, background:filled?INK:"transparent", borderRadius:filled?2:0 }}/>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardOverview() {
  const navigate = useNavigate();
  return (
    <DashboardLayout active="overview" title="Overview" subtitle="Monday, 13 July 2026"
      actions={<button onClick={()=>navigate("/dashboard/exams/create")} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity" style={{ background:INK, fontFamily:U }}><Plus size={14}/>New exam</button>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Total Exams" value="48" trend="+3" trendUp icon={FileText} iconBg="#F0EDE8"/>
        <StatCard label="Active Students" value="1,240" trend="+87" trendUp icon={Users} iconBg="#e6f4ff"/>
        <StatCard label="Pass Rate" value="78.4%" trend="+2.1%" trendUp icon={CheckCircle2} iconBg="#f0fdf4"/>
        <StatCard label="Avg Score" value="74.2" sub="out of 100" icon={Award} iconBg="#fff7ed"/>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        {[{label:"Ongoing",value:"3",icon:Activity,iconBg:"#eff6ff"},{label:"Upcoming",value:"7",icon:CalendarDays,iconBg:`${CAMEL}18`},{label:"Completed",value:"38",icon:CheckCheck,iconBg:"#f0fdf4"},{label:"Highest Score",value:"98",sub:"John Smith",icon:TrendingUp,iconBg:"#f0fdf4"},{label:"Lowest Score",value:"31",sub:"Needs review",icon:AlertTriangle,iconBg:"#fff0f0"}].map(p=><StatCard key={p.label} {...p}/>)}
      </div>
      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Recent Exams</h2>
            <button onClick={()=>navigate("/dashboard/exams")} className="text-xs font-semibold hover:underline" style={{ color:CAMEL, fontFamily:U }}>View all</button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-50">{["Exam","Subject","Date","Students","Avg","Status"].map(h=><th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
            <tbody>
              {MOCK_EXAMS.filter(e=>e.status!=="archived").slice(0,5).map(ex=>(
                <tr key={ex.id} onClick={()=>navigate(`/dashboard/exams/${ex.id}`)} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer">
                  <td className="px-6 py-3.5 font-semibold" style={{ fontFamily:U, color:INK }}>{ex.title}</td>
                  <td className="px-6 py-3.5 text-gray-500 text-xs" style={{ fontFamily:I }}>{ex.subject}</td>
                  <td className="px-6 py-3.5 text-gray-500 text-xs" style={{ fontFamily:I }}>{ex.date}</td>
                  <td className="px-6 py-3.5 text-gray-600 text-xs" style={{ fontFamily:I }}>{ex.students||"—"}</td>
                  <td className="px-6 py-3.5 text-xs font-bold" style={{ fontFamily:U, color:ex.students?ex.students>25?"#16a34a":"#d97706":"#9ca3af" }}>{ex.students?"74%":"—"}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={ex.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-black mb-4" style={{ fontFamily:U, color:INK }}>Pass / Fail</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3.5"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3.5" strokeDasharray="78.4 21.6" strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-base font-black" style={{ fontFamily:U, color:INK }}>78%</span></div>
              </div>
              <div className="space-y-2">
                {[{l:"Passed",v:"78.4%",c:"#22c55e"},{l:"Failed",v:"21.6%",c:"#ef4444"}].map(r=>(
                  <div key={r.l} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background:r.c }}/><span className="text-xs text-gray-500" style={{ fontFamily:I }}>{r.l}</span><span className="text-xs font-bold ml-auto" style={{ fontFamily:U, color:INK }}>{r.v}</span></div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-black mb-3" style={{ fontFamily:U, color:INK }}>Quick Actions</h3>
            {[{label:"Create new exam",icon:Plus,path:"/dashboard/exams/create"},{label:"AI question generator",icon:Sparkles,path:"/dashboard/ai"},{label:"View question bank",icon:BookMarked,path:"/dashboard/questions"},{label:"Export reports",icon:Download,path:"/dashboard/filters"}].map(({label,icon:Icon,path})=>(
              <button key={label} onClick={()=>navigate(path)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all text-left" style={{ fontFamily:I }}>
                <Icon size={14} style={{ color:CAMEL }}/>{label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAM LIST
// ═══════════════════════════════════════════════════════════════════════════════
function ExamList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string|null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState<string|null>(null);

  const exams = MOCK_EXAMS.filter(e=>{
    const matchStatus = statusFilter==="all"||e.status===statusFilter;
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase())||e.subject.toLowerCase().includes(search.toLowerCase());
    return matchStatus&&matchSearch;
  });

  return (
    <DashboardLayout active="exams" title="My Exams" subtitle={`${MOCK_EXAMS.length} exams total`}
      actions={<button onClick={()=>navigate("/dashboard/exams/create")} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity" style={{ background:INK, fontFamily:U }}><Plus size={14}/>New exam</button>}>

      {/* Archive confirm modal */}
      {archiveConfirm&&(
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background:"rgba(13,27,42,0.5)", backdropFilter:"blur(6px)" }} onClick={()=>setArchiveConfirm(null)}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4"><Archive size={22} className="text-amber-600"/></div>
            <h3 className="text-lg font-black mb-2" style={{ fontFamily:U, color:INK }}>Archive this exam?</h3>
            <p className="text-sm text-gray-500 mb-6" style={{ fontFamily:I }}>The exam will be hidden from students. You can unarchive it at any time.</p>
            <div className="flex gap-3">
              <button onClick={()=>setArchiveConfirm(null)} className="flex-1 text-sm font-semibold py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}>Cancel</button>
              <button onClick={()=>setArchiveConfirm(null)} className="flex-1 text-sm font-bold py-3 rounded-xl text-white bg-amber-500 hover:bg-amber-600 transition-colors" style={{ fontFamily:U }}>Archive</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search exams…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gray-300" style={{ fontFamily:I }}/>
        </div>
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1">
          {["all","published","draft","archived"].map(s=>(
            <button key={s} onClick={()=>setStatusFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-all ${statusFilter===s?"text-white shadow-sm":"text-gray-500 hover:text-gray-700"}`}
              style={{ background:statusFilter===s?INK:undefined, fontFamily:U }}>{s}</button>
          ))}
        </div>
      </div>

      {exams.length===0?(
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-24 text-center">
          <FileText size={32} className="text-gray-200 mb-3"/>
          <p className="text-sm font-semibold text-gray-400" style={{ fontFamily:U }}>No exams found</p>
          <button onClick={()=>navigate("/dashboard/exams/create")} className="mt-4 flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Plus size={14}/>Create your first exam</button>
        </div>
      ):(
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {exams.map(exam=>(
            <div key={exam.id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <StatusBadge status={exam.status}/>
                    <h3 className="text-sm font-black mt-2 mb-1 leading-snug" style={{ fontFamily:U, color:INK }}>{exam.title}</h3>
                    <p className="text-xs text-gray-400" style={{ fontFamily:I }}>{exam.subject} · {exam.date}</p>
                  </div>
                  <div className="relative flex-shrink-0 ml-2">
                    <button onClick={e=>{e.stopPropagation();setMenuOpen(menuOpen===exam.id?null:exam.id);}} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"><MoreVertical size={15}/></button>
                    {menuOpen===exam.id&&(
                      <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-40 py-1" onClick={e=>e.stopPropagation()}>
                        {[{icon:Eye,label:"Preview",action:()=>navigate(`/dashboard/exams/${exam.id}?tab=preview`)},{icon:Pencil,label:"Edit",action:()=>navigate(`/dashboard/exams/${exam.id}/edit`)},{icon:Copy,label:"Duplicate",action:()=>{}},{icon:Archive,label:"Archive",action:()=>{setArchiveConfirm(exam.id);setMenuOpen(null);}},{icon:Trash2,label:"Delete",action:()=>{}}].map(({icon:Icon,label,action})=>(
                          <button key={label} onClick={()=>{action();setMenuOpen(null);}} className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-left ${label==="Delete"?"text-red-500":"text-gray-700"}`} style={{ fontFamily:I }}>
                            <Icon size={13}/>{label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-50">
                  {[{l:"Questions",v:exam.questions||"0"},{l:"Duration",v:`${exam.duration}m`},{l:"Students",v:exam.students||"—"}].map(({l,v})=>(
                    <div key={l} className="text-center">
                      <p className="text-sm font-black" style={{ fontFamily:U, color:INK }}>{v}</p>
                      <p className="text-[10px] text-gray-400" style={{ fontFamily:I }}>{l}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-5 pb-4 flex gap-2">
                <button onClick={()=>navigate(`/dashboard/exams/${exam.id}`)} className="flex-1 text-xs font-semibold py-2 rounded-lg text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all" style={{ fontFamily:U }}>View</button>
                <button onClick={()=>navigate(`/dashboard/exams/${exam.id}/edit`)} className="flex-1 text-xs font-semibold py-2 rounded-lg text-white hover:opacity-90 transition-all" style={{ background:INK, fontFamily:U }}>Edit</button>
              </div>
            </div>
          ))}
          {/* Create card */}
          <button onClick={()=>navigate("/dashboard/exams/create")} className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-all flex flex-col items-center justify-center py-12 gap-3 group">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background:"#F0EDE8" }}><Plus size={22} style={{ color:INK }}/></div>
            <div className="text-center"><p className="text-sm font-bold text-gray-600" style={{ fontFamily:U }}>Create new exam</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>AI-assisted in minutes</p></div>
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE / EDIT EXAM
// ═══════════════════════════════════════════════════════════════════════════════
function ExamCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const existing = id ? MOCK_EXAMS.find(e=>e.id===id) : null;
  const isEdit = !!existing;

  const [title, setTitle]       = useState(existing?.title||"");
  const [subject, setSubject]   = useState(existing?.subject||"");
  const [desc, setDesc]         = useState("");
  const [startDate, setStartDate] = useState("2026-07-20");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(String(existing?.duration||60));
  const [timezone, setTimezone] = useState("UTC+0 London");
  const [passingScore, setPassingScore] = useState("50");
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [privacy, setPrivacy]   = useState("public");
  const [randomize, setRandomize] = useState(true);
  const [showResults, setShowResults] = useState(true);
  const [saved, setSaved]       = useState(false);

  const subjects = ["Mathematics","Science","English","History","Computer Science","Physics","Chemistry","Geography"];
  const timezones = ["UTC+0 London","UTC+1 Paris","UTC+2 Cairo","UTC+3 Nairobi","UTC+5:30 Mumbai","UTC+8 Singapore","UTC+10 Sydney","UTC-5 New York","UTC-8 Los Angeles"];

  const handleSave = (status = "draft") => {
    setSaved(true);
    setTimeout(()=>{ setSaved(false); navigate("/dashboard/exams"); }, 800);
  };

  return (
    <DashboardLayout active="exams-create" title={isEdit?"Edit Exam":"Create Exam"} subtitle={isEdit?existing?.title:"Set up your exam in minutes"}>
      <div className="max-w-2xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6" style={{ fontFamily:I }}>
          <button onClick={()=>navigate("/dashboard/exams")} className="hover:text-gray-700 transition-colors">My Exams</button>
          <ChevronRight size={13}/><span className="text-gray-600">{isEdit?"Edit Exam":"New Exam"}</span>
        </div>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Exam Title <span className="text-red-400">*</span></label>
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Year 12 Calculus Final Exam"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors" style={{ fontFamily:I }}/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Subject <span className="text-red-400">*</span></label>
                <select value={subject} onChange={e=>setSubject(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 bg-white appearance-none" style={{ fontFamily:I }}>
                  <option value="">Select a subject</option>
                  {subjects.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Description</label>
                <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="Optional: add instructions or a note for students…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none" style={{ fontFamily:I }}/>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Schedule</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Start Date</label>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Start Time</label>
                <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Duration (minutes)</label>
                <input type="number" value={duration} onChange={e=>setDuration(e.target.value)} min="5" max="480"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Timezone</label>
                <select value={timezone} onChange={e=>setTimezone(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 bg-white" style={{ fontFamily:I }}>
                  {timezones.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Rules & Settings</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Passing Score (%)</label>
                <input type="number" value={passingScore} onChange={e=>setPassingScore(e.target.value)} min="0" max="100"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Max Attempts</label>
                <select value={maxAttempts} onChange={e=>setMaxAttempts(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 bg-white" style={{ fontFamily:I }}>
                  {["1","2","3","Unlimited"].map(v=><option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {[{label:"Randomize question order",desc:"Shuffle questions differently for each student",on:randomize,set:setRandomize},{label:"Show results after submission",desc:"Students see their score immediately",on:showResults,set:setShowResults}].map(({label,desc,on,set})=>(
                <div key={label} className="flex items-center justify-between py-3 border-t border-gray-50">
                  <div><p className="text-sm font-semibold text-gray-700" style={{ fontFamily:U }}>{label}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{desc}</p></div>
                  <Toggle on={on} onChange={()=>set((s: boolean)=>!s)}/>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Access & Privacy</h3>
            <div className="space-y-2">
              {[{id:"public",label:"Public",desc:"Anyone with the link or code can join"},{id:"private",label:"Private",desc:"Only invited students can access"},{id:"password",label:"Password protected",desc:"Students enter a password to access"}].map(opt=>(
                <label key={opt.id} onClick={()=>setPrivacy(opt.id)} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${privacy===opt.id?"border-gray-800":"border-gray-100 hover:border-gray-200"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${privacy===opt.id?"border-gray-800":"border-gray-300"}`}>
                    {privacy===opt.id&&<div className="w-2 h-2 rounded-full" style={{ background:INK }}/>}
                  </div>
                  <div><p className="text-sm font-bold text-gray-800" style={{ fontFamily:U }}>{opt.label}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{opt.desc}</p></div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-2">
            <button onClick={()=>handleSave("published")} className="flex items-center gap-2 text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity" style={{ background:INK, fontFamily:U }}>
              {saved?<><CheckCircle2 size={15}/>Saved!</>:isEdit?"Save changes":"Publish exam"}
            </button>
            <button onClick={()=>handleSave("draft")} className="flex items-center gap-2 font-bold px-6 py-3 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all" style={{ fontFamily:U }}>Save as draft</button>
            <button onClick={()=>navigate("/dashboard/exams")} className="ml-auto text-sm font-medium text-gray-400 hover:text-gray-600 px-4 py-3" style={{ fontFamily:I }}>Cancel</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAM DETAIL (tabs: Overview · Sharing · Settings · Preview)
// ═══════════════════════════════════════════════════════════════════════════════
function ExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const exam = MOCK_EXAMS.find(e=>e.id===id)||MOCK_EXAMS[0];
  const [tab, setTab] = useState("overview");
  const [privacy, setPrivacy] = useState("public");
  const [proctoring, setProctoring] = useState(true);
  const [shuffleQ, setShuffleQ] = useState(true);

  const magicLink = `https://exam.ai/join/${exam.code.toLowerCase()}`;

  const tabs = ["overview","sharing","settings","preview"];

  return (
    <DashboardLayout active="exams" title={exam.title} subtitle={`${exam.subject} · ${exam.date}`}
      actions={<>
        <StatusBadge status={exam.status}/>
        <button onClick={()=>navigate(`/dashboard/exams/${exam.id}/edit`)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Pencil size={13}/>Edit</button>
      </>}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-5" style={{ fontFamily:I }}>
        <button onClick={()=>navigate("/dashboard/exams")} className="hover:text-gray-700">My Exams</button>
        <ChevronRight size={13}/><span className="text-gray-600 truncate max-w-xs">{exam.title}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 w-fit mb-5">
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`text-xs font-semibold px-4 py-2 rounded-lg capitalize transition-all ${tab===t?"text-white shadow-sm":"text-gray-500 hover:text-gray-700"}`}
            style={{ background:tab===t?INK:undefined, fontFamily:U }}>{t}</button>
        ))}
      </div>

      {/* Overview tab */}
      {tab==="overview"&&(
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[{l:"Questions",v:String(exam.questions)},{l:"Duration",v:`${exam.duration} min`},{l:"Students",v:String(exam.students||0)},{l:"Avg Score",v:exam.students?"74%":"—"},{l:"Pass Rate",v:exam.students?"78%":"—"},{l:"Attempts",v:"1 max"}].map(({l,v})=>(
                <div key={l} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-xl font-black" style={{ fontFamily:U, color:INK }}>{v}</p>
                  <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p>
                </div>
              ))}
            </div>
            {exam.students>0&&(
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Student Results</h3></div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-50">{["Student","Submitted","Score","Grade"].map(h=><th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[{n:"Alice Mills",t:"10:42 AM",s:88,g:"A"},{n:"Sara Jones",t:"10:58 AM",s:71,g:"B"},{n:"Tom Reed",t:"11:02 AM",s:45,g:"F"},{n:"Mike Park",t:"11:08 AM",s:83,g:"A"}].map(({n,t,s,g})=>(
                      <tr key={n} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-800" style={{ fontFamily:U }}>{n}</td>
                        <td className="px-6 py-3 text-xs text-gray-500" style={{ fontFamily:I }}>{t}</td>
                        <td className="px-6 py-3 text-sm font-bold" style={{ fontFamily:U, color:s>=50?"#16a34a":"#ef4444" }}>{s}%</td>
                        <td className="px-6 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${g==="F"?"bg-red-50 text-red-600":"bg-green-50 text-green-700"}`} style={{ fontFamily:U }}>{g}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-black mb-4" style={{ fontFamily:U, color:INK }}>Exam Code</h3>
            <div className="bg-gray-50 rounded-xl p-4 text-center mb-4 border border-gray-200">
              <p className="text-2xl font-black tracking-widest" style={{ fontFamily:U, color:INK }}>{exam.code}</p>
            </div>
            <p className="text-xs text-gray-400 text-center mb-4" style={{ fontFamily:I }}>Share this code with students to let them join</p>
            <button onClick={()=>setTab("sharing")} className="w-full text-xs font-semibold py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all" style={{ fontFamily:U }}>View all sharing options</button>
          </div>
        </div>
      )}

      {/* Sharing tab */}
      {tab==="sharing"&&(
        <div className="max-w-lg space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <CopyField label="Magic Link" value={magicLink}/>
            <CopyField label="Exam Code" value={exam.code}/>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3" style={{ fontFamily:U }}>QR Code</p>
              <div className="flex items-start gap-5">
                <QRPattern/>
                <div>
                  <p className="text-sm text-gray-600 mb-3" style={{ fontFamily:I }}>Students can scan this code to join the exam instantly from their phone.</p>
                  <button className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}><Download size={13}/>Download PNG</button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-black mb-4" style={{ fontFamily:U, color:INK }}>Share via</h3>
            <div className="flex flex-wrap gap-2">
              {["Email","Google Classroom","Microsoft Teams","Slack","Copy all details"].map(s=>(
                <button key={s} className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all" style={{ fontFamily:U }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings tab */}
      {tab==="settings"&&(
        <div className="max-w-lg">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-1">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Exam Settings</h3>
            {[{l:"Enable live proctoring",d:"Face detection and tab monitoring",on:proctoring,set:setProctoring},{l:"Randomize questions",d:"Different order for each student",on:shuffleQ,set:setShuffleQ}].map(({l,d,on,set})=>(
              <div key={l} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                <div><p className="text-sm font-semibold text-gray-700" style={{ fontFamily:U }}>{l}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{d}</p></div>
                <Toggle on={on} onChange={()=>set((s: boolean)=>!s)}/>
              </div>
            ))}
            <div className="pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily:U }}>Privacy</p>
              <div className="flex gap-2">
                {["public","private","password"].map(p=>(
                  <button key={p} onClick={()=>setPrivacy(p)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border capitalize transition-all ${privacy===p?"text-white border-transparent":"border-gray-200 text-gray-500"}`} style={{ background:privacy===p?INK:undefined, fontFamily:U }}>{p}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="text-sm font-bold text-white px-6 py-2.5 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}>Save settings</button>
          </div>
        </div>
      )}

      {/* Preview tab */}
      {tab==="preview"&&(
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Student exam bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ background:"#f9fafb" }}>
              <div><p className="text-xs text-gray-400 mb-0.5" style={{ fontFamily:I }}>Student view · Read-only preview</p><h3 className="text-sm font-bold" style={{ fontFamily:U, color:INK }}>{exam.title}</h3></div>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ fontFamily:U, color:INK }}><Clock size={14} style={{ color:CAMEL }}/>{exam.duration}:00</div>
            </div>
            <div className="p-6 space-y-6">
              {[
                { n:1, type:"MCQ", q:"What is the derivative of f(x) = sin(x)?", opts:["cos(x)","−cos(x)","sin(x)","−sin(x)"] },
                { n:2, type:"Short answer", q:"Explain the chain rule in your own words." },
                { n:3, type:"True / False", q:"The second derivative test can determine whether a critical point is a local maximum or minimum.", opts:["True","False"] },
              ].map(({ n, type, q, opts })=>(
                <div key={n} className="border border-gray-100 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background:`${CAMEL}18`, color:CAMEL, fontFamily:U }}>Q{n}</span>
                    <span className="text-xs text-gray-400" style={{ fontFamily:I }}>{type}</span>
                  </div>
                  <p className="text-sm text-gray-800 mb-4 font-medium" style={{ fontFamily:I }}>{q}</p>
                  {opts?(
                    <div className="space-y-2">
                      {opts.map(o=><div key={o} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm text-gray-700" style={{ fontFamily:I }}><div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0"/>{o}</div>)}
                    </div>
                  ):(
                    <textarea rows={3} placeholder="Type your answer here…" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 focus:outline-none resize-none" style={{ fontFamily:I }}/>
                  )}
                </div>
              ))}
              <div className="flex justify-end gap-3">
                <button className="text-sm text-gray-400 px-4 py-2.5" style={{ fontFamily:I }}>Previous</button>
                <button className="text-sm font-bold text-white px-6 py-2.5 rounded-xl" style={{ background:INK, fontFamily:U }}>Next →</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION BANK
// ═══════════════════════════════════════════════════════════════════════════════
function QuestionBank() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [diffFilter, setDiffFilter] = useState("all");

  const filtered = MOCK_QUESTIONS.filter(q=>{
    const matchSearch = q.text.toLowerCase().includes(search.toLowerCase())||q.subject.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter==="all"||q.type===typeFilter;
    const matchDiff = diffFilter==="all"||q.difficulty.toLowerCase()===diffFilter;
    return matchSearch&&matchType&&matchDiff;
  });

  const typeInfo: Record<string,{label:string;color:string}> = {
    mcq:      {label:"MCQ",           color:"bg-blue-50 text-blue-700"},
    essay:    {label:"Essay",         color:"bg-purple-50 text-purple-700"},
    truefalse:{label:"True/False",    color:"bg-green-50 text-green-700"},
    short:    {label:"Short Answer",  color:"bg-amber-50 text-amber-700"},
    fill:     {label:"Fill Blank",    color:"bg-orange-50 text-orange-700"},
    matching: {label:"Matching",      color:"bg-cyan-50 text-cyan-700"},
  };

  const diffColor: Record<string,string> = { Easy:"bg-green-50 text-green-600", Medium:"bg-amber-50 text-amber-600", Hard:"bg-red-50 text-red-600" };

  return (
    <DashboardLayout active="questions" title="Question Bank" subtitle={`${MOCK_QUESTIONS.length} questions`}
      actions={<button onClick={()=>navigate("/dashboard/questions/create")} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Plus size={14}/>New question</button>}>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search questions…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gray-300" style={{ fontFamily:I }}/>
        </div>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none" style={{ fontFamily:I }}>
          <option value="all">All types</option>
          {Q_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select value={diffFilter} onChange={e=>setDiffFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none" style={{ fontFamily:I }}>
          <option value="all">All difficulty</option>
          {["easy","medium","hard"].map(d=><option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
        </select>
      </div>

      {filtered.length===0?(
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-24 text-center">
          <BookMarked size={32} className="text-gray-200 mb-3"/>
          <p className="text-sm font-semibold text-gray-400" style={{ fontFamily:U }}>No questions found</p>
        </div>
      ):(
        <div className="space-y-2">
          {filtered.map(q=>{
            const ti = typeInfo[q.type]||{label:q.type,color:"bg-gray-100 text-gray-600"};
            return (
              <div key={q.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-start gap-4 hover:shadow-sm hover:border-gray-200 transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${ti.color}`} style={{ fontFamily:U }}>{ti.label}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${diffColor[q.difficulty]}`} style={{ fontFamily:U }}>{q.difficulty}</span>
                    <span className="text-[11px] text-gray-400" style={{ fontFamily:I }}>{q.subject}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed" style={{ fontFamily:I }}>{q.text}</p>
                  <div className="flex gap-1.5 mt-2">{q.tags.map(t=><span key={t} className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full" style={{ fontFamily:I }}>#{t}</span>)}</div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"><Eye size={13}/></button>
                  <button onClick={()=>navigate(`/dashboard/questions/create?id=${q.id}`)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"><Pencil size={13}/></button>
                  <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={13}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Import section */}
      <div className="mt-5 bg-white rounded-2xl border border-dashed border-gray-200 p-6 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background:"#F0EDE8" }}><Upload size={22} style={{ color:INK }}/></div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-bold text-gray-800" style={{ fontFamily:U }}>Import questions from a file</p>
          <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>Supports PDF, DOCX, and TXT. We'll parse and add them to your bank.</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}>Browse file</button>
          <button onClick={()=>navigate("/dashboard/ai")} className="text-xs font-semibold px-4 py-2.5 rounded-xl text-white hover:opacity-90" style={{ background:INK, fontFamily:U }}><Sparkles size={12} className="inline mr-1"/>Use AI instead</button>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE / EDIT QUESTION
// ═══════════════════════════════════════════════════════════════════════════════
function QuestionCreate() {
  const navigate = useNavigate();
  const [qType, setQType] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["","","",""]);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [difficulty, setDifficulty] = useState("Medium");
  const [subject, setSubject] = useState("Mathematics");
  const [tags, setTags] = useState("");
  const [wordLimit, setWordLimit] = useState("300");
  const [saved, setSaved] = useState(false);

  const updateOption = (i: number, val: string) => setOptions(prev => { const n=[...prev]; n[i]=val; return n; });

  const save = () => { setSaved(true); setTimeout(()=>{ setSaved(false); navigate("/dashboard/questions"); }, 800); };

  return (
    <DashboardLayout active="questions" title="New Question" subtitle="Build a question for your bank">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6" style={{ fontFamily:I }}>
          <button onClick={()=>navigate("/dashboard/questions")} className="hover:text-gray-700">Question Bank</button>
          <ChevronRight size={13}/><span className="text-gray-600">New Question</span>
        </div>

        {/* Step 1: Type Selector */}
        {!qType&&(
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-black mb-2" style={{ fontFamily:U, color:INK }}>Choose question type</h3>
            <p className="text-xs text-gray-400 mb-5" style={{ fontFamily:I }}>Select the format that best fits your question.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Q_TYPES.map(({ id, label, icon:Icon, color })=>(
                <button key={id} onClick={()=>setQType(id)}
                  className="flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-300 hover:shadow-md transition-all text-center group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background:color }}>
                    <Icon size={19} style={{ color:INK }}/>
                  </div>
                  <span className="text-xs font-semibold text-gray-700" style={{ fontFamily:U }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Question Form */}
        {qType&&(
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  {(() => { const t=Q_TYPES.find(x=>x.id===qType)!; return <><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:t.color }}><t.icon size={18} style={{ color:INK }}/></div><div><p className="text-sm font-black" style={{ fontFamily:U, color:INK }}>{t.label}</p></div></>; })()}
                </div>
                <button onClick={()=>setQType("")} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1" style={{ fontFamily:I }}><ChevronLeft size={12}/>Change type</button>
              </div>

              {/* Question text */}
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Question <span className="text-red-400">*</span></label>
                <textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={3} placeholder="Type your question here…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none" style={{ fontFamily:I }}/>
              </div>

              {/* MCQ options */}
              {(qType==="mcq"||qType==="checkbox")&&(
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block" style={{ fontFamily:U }}>Answer Options</label>
                  <div className="space-y-2">
                    {options.map((opt,i)=>(
                      <div key={i} className="flex items-center gap-3">
                        {qType==="mcq"?(
                          <button onClick={()=>setCorrectIdx(i)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${correctIdx===i?"border-green-500":"border-gray-300"}`}>{correctIdx===i&&<div className="w-2.5 h-2.5 rounded-full bg-green-500"/>}</button>
                        ):(
                          <div className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0"/>
                        )}
                        <input value={opt} onChange={e=>updateOption(i,e.target.value)} placeholder={`Option ${String.fromCharCode(65+i)}`}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
                      </div>
                    ))}
                  </div>
                  {qType==="mcq"&&<p className="text-[11px] text-gray-400 mt-2" style={{ fontFamily:I }}>Click the circle to mark the correct answer.</p>}
                </div>
              )}

              {/* True/False */}
              {qType==="truefalse"&&(
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block" style={{ fontFamily:U }}>Correct Answer</label>
                  <div className="flex gap-3">
                    {["True","False"].map(v=>(
                      <button key={v} onClick={()=>setCorrectIdx(v==="True"?0:1)}
                        className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${(v==="True"?correctIdx===0:correctIdx===1)?"text-white border-transparent":"border-gray-200 text-gray-600"}`}
                        style={{ background:(v==="True"?correctIdx===0:correctIdx===1)?INK:undefined, fontFamily:U }}>{v}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Essay word limit */}
              {qType==="essay"&&(
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Word Limit</label>
                  <input type="number" value={wordLimit} onChange={e=>setWordLimit(e.target.value)} placeholder="e.g. 300"
                    className="w-40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
                </div>
              )}

              {/* Fill blank answer */}
              {qType==="fill"&&(
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Correct Answer(s)</label>
                  <input placeholder="e.g. photosynthesis (comma-separate for multiple)" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
                </div>
              )}

              {/* Matching */}
              {qType==="matching"&&(
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block" style={{ fontFamily:U }}>Pairs</label>
                  {[["",""],["",""],["",""]].map((_,i)=>(
                    <div key={i} className="flex items-center gap-3 mb-2">
                      <input placeholder={`Term ${i+1}`} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
                      <ArrowLeftRight size={14} className="text-gray-300 flex-shrink-0"/>
                      <input placeholder={`Match ${i+1}`} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
                    </div>
                  ))}
                </div>
              )}

              {/* File upload */}
              {qType==="file"&&(
                <div className="mb-4 border border-dashed border-gray-200 rounded-xl p-5 text-center">
                  <Upload size={20} className="text-gray-300 mx-auto mb-2"/>
                  <p className="text-xs text-gray-400" style={{ fontFamily:I }}>Students will upload a file (PDF, DOCX, image, etc.)</p>
                  <div className="flex gap-2 justify-center mt-3">
                    {["PDF","DOCX","JPG","PNG"].map(f=><span key={f} className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded" style={{ fontFamily:U }}>{f}</span>)}
                  </div>
                </div>
              )}

              {/* Math */}
              {qType==="math"&&(
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Expected Answer / Formula</label>
                  <input placeholder="e.g. f'(x) = cos(x) or numeric value 42" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 font-mono" style={{ fontFamily:"monospace" }}/>
                  <p className="text-[11px] text-gray-400 mt-1.5" style={{ fontFamily:I }}>LaTeX notation supported. Students can use an equation editor.</p>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Details</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Subject</label>
                  <select value={subject} onChange={e=>setSubject(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}>
                    {["Mathematics","Science","English","History","CS","Physics","Chemistry"].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Difficulty</label>
                  <div className="flex gap-1.5">
                    {["Easy","Medium","Hard"].map(d=>(
                      <button key={d} onClick={()=>setDifficulty(d)} className={`flex-1 text-xs font-semibold py-2.5 rounded-lg border transition-all ${difficulty===d?"text-white border-transparent":"border-gray-200 text-gray-500"}`} style={{ background:difficulty===d?INK:undefined, fontFamily:U }}>{d}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Tags</label>
                  <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="comma-separated" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={save} className="flex items-center gap-2 text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90" style={{ background:INK, fontFamily:U }}>
                {saved?<><CheckCircle2 size={15}/>Saved!</>:"Save question"}
              </button>
              <button onClick={()=>navigate("/dashboard/questions")} className="text-sm font-medium text-gray-400 hover:text-gray-600 px-4 py-3" style={{ fontFamily:I }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI QUESTION GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════
function AIGenerator() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<string|null>(null);
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("Mixed");
  const [language, setLanguage] = useState("English");
  const [blooms, setBlooms] = useState<string[]>(["Knowledge","Comprehension","Application"]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<any[]|null>(null);
  const [selected, setSelected] = useState<number[]>([]);

  const allBlooms = ["Knowledge","Comprehension","Application","Analysis","Synthesis","Evaluation"];
  const toggleBloom = (b: string) => setBlooms(p=>p.includes(b)?p.filter(x=>x!==b):[...p,b]);
  const toggleSelect = (i: number) => setSelected(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i]);

  const handleGenerate = () => {
    if(!topic&&!file) return;
    setGenerating(true);
    setTimeout(()=>{
      setGenerating(false);
      setGenerated([
        { type:"MCQ",  q:"What is the derivative of f(x) = x³?",          opts:["3x²","x²","3x","2x³"],  correct:0, difficulty:"Easy"   },
        { type:"MCQ",  q:"Which method is used to find the area under a curve?", opts:["Integration","Differentiation","Factoring","Logarithm"], correct:0, difficulty:"Medium" },
        { type:"Short",q:"Explain the fundamental theorem of calculus.",    difficulty:"Medium" },
        { type:"Essay",q:"Discuss the applications of derivatives in real life, including optimization problems.", difficulty:"Hard" },
        { type:"T/F",  q:"The integral of a constant is always zero.",      correct:false, difficulty:"Easy" },
        { type:"MCQ",  q:"If f(x) = e^x, then f'(x) = ?",                 opts:["e^x","xe^x","e^(x-1)","0"], correct:0, difficulty:"Easy" },
        { type:"Short",q:"What is L'Hôpital's rule and when is it applied?", difficulty:"Medium" },
        { type:"MCQ",  q:"What is the chain rule used for?",               opts:["Composite functions","Sums","Products","Constants"], correct:0, difficulty:"Medium" },
        { type:"Essay",q:"Compare and contrast definite and indefinite integrals.", difficulty:"Hard" },
        { type:"T/F",  q:"Every continuous function on a closed interval has a maximum value.", correct:true, difficulty:"Medium" },
      ].slice(0,count));
      setSelected(Array.from({length:count},(_,i)=>i));
    }, 1800);
  };

  const diffColor: Record<string,string> = { Easy:"bg-green-50 text-green-600", Medium:"bg-amber-50 text-amber-600", Hard:"bg-red-50 text-red-600" };

  return (
    <DashboardLayout active="ai" title="AI Generator" subtitle="Generate questions from your materials">
      {!generated?(
        <div className="max-w-2xl space-y-4">
          {/* Upload */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-black mb-2" style={{ fontFamily:U, color:INK }}>Upload material <span className="text-gray-400 font-normal text-xs ml-1">optional</span></h3>
            <p className="text-xs text-gray-400 mb-4" style={{ fontFamily:I }}>Upload lecture notes, a textbook chapter, or a slide deck. The AI will use them as source material.</p>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.ppt,.pptx" className="hidden" onChange={e=>setFile(e.target.files?.[0]?.name||null)}/>
            {file?(
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <FileText size={18} style={{ color:CAMEL }}/>
                <span className="text-sm text-gray-700 flex-1 truncate" style={{ fontFamily:I }}>{file}</span>
                <button onClick={()=>setFile(null)} className="text-gray-400 hover:text-gray-600"><X size={15}/></button>
              </div>
            ):(
              <button onClick={()=>fileRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-xl py-10 flex flex-col items-center gap-3 text-center transition-all hover:bg-gray-50 group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background:"#F0EDE8" }}><Upload size={22} style={{ color:INK }}/></div>
                <div><p className="text-sm font-semibold text-gray-600" style={{ fontFamily:U }}>Drop a file or click to browse</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>PDF, DOCX, PPT, TXT — max 20 MB</p></div>
              </button>
            )}
          </div>

          {/* Topic override */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-black mb-4" style={{ fontFamily:U, color:INK }}>Or describe a topic</h3>
            <textarea value={topic} onChange={e=>setTopic(e.target.value)} rows={3} placeholder="e.g. Differentiation and integration in single-variable calculus — include chain rule, product rule, and definite integrals…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none" style={{ fontFamily:I }}/>
          </div>

          {/* Configure */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Configuration</h3>
            <div className="grid sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Subject</label>
                <select value={subject} onChange={e=>setSubject(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}>
                  {["Mathematics","Science","English","History","CS","Physics","Chemistry"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Language</label>
                <select value={language} onChange={e=>setLanguage(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}>
                  {["English","French","Spanish","Arabic","Swahili","German","Mandarin"].map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block" style={{ fontFamily:U }}>Number of questions: <span style={{ color:INK }}>{count}</span></label>
              <input type="range" min={5} max={50} step={5} value={count} onChange={e=>setCount(+e.target.value)} className="w-full accent-gray-900"/>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1" style={{ fontFamily:I }}><span>5</span><span>25</span><span>50</span></div>
            </div>
            <div className="mb-5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block" style={{ fontFamily:U }}>Difficulty</label>
              <div className="flex gap-2">
                {["Easy","Medium","Hard","Mixed"].map(d=>(
                  <button key={d} onClick={()=>setDifficulty(d)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-all ${difficulty===d?"text-white border-transparent":"border-gray-200 text-gray-500"}`} style={{ background:difficulty===d?INK:undefined, fontFamily:U }}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block" style={{ fontFamily:U }}>{"Bloom's Taxonomy"}</label>
              <div className="flex flex-wrap gap-2">
                {allBlooms.map(b=>(
                  <button key={b} onClick={()=>toggleBloom(b)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${blooms.includes(b)?"text-white border-transparent":"border-gray-200 text-gray-500 hover:border-gray-300"}`}
                    style={{ background:blooms.includes(b)?INK:undefined, fontFamily:U }}>{b}</button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={!topic&&!file||generating}
            className="w-full flex items-center justify-center gap-3 text-white font-bold py-4 rounded-xl text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
            style={{ background:`linear-gradient(135deg, ${INK}, #1e3a5f)`, fontFamily:U }}>
            {generating?<><RefreshCw size={16} className="animate-spin"/>Generating {count} questions…</>:<><Sparkles size={16}/>Generate {count} questions with AI</>}
          </button>
        </div>
      ):(
        /* Review generated questions */
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-black" style={{ fontFamily:U, color:INK }}>{generated.length} questions generated</h2>
              <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>Review, edit, then add selected to your question bank.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setGenerated(null)} className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}>← Regenerate</button>
              <button onClick={()=>navigate("/dashboard/questions")} className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}>
                <CheckCircle2 size={13}/>Add {selected.length} to bank
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <button onClick={()=>setSelected(generated.map((_,i)=>i))} className="text-xs text-gray-500 hover:text-gray-800 underline" style={{ fontFamily:I }}>Select all</button>
            <span className="text-gray-300">·</span>
            <button onClick={()=>setSelected([])} className="text-xs text-gray-500 hover:text-gray-800 underline" style={{ fontFamily:I }}>Deselect all</button>
            <span className="text-xs text-gray-400 ml-auto" style={{ fontFamily:I }}>{selected.length}/{generated.length} selected</span>
          </div>

          <div className="space-y-3">
            {generated.map((q,i)=>(
              <div key={i} onClick={()=>toggleSelect(i)} className={`bg-white rounded-xl border-2 px-5 py-4 cursor-pointer transition-all ${selected.includes(i)?"border-gray-800":"border-gray-100 hover:border-gray-200"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${selected.includes(i)?"border-transparent":"border-gray-300"}`}
                    style={{ background:selected.includes(i)?INK:undefined }}>
                    {selected.includes(i)&&<Check size={11} className="text-white"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full" style={{ fontFamily:U }}>{q.type}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${diffColor[q.difficulty]}`} style={{ fontFamily:U }}>{q.difficulty}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed" style={{ fontFamily:I }}>{q.q}</p>
                    {q.opts&&(
                      <div className="mt-3 grid grid-cols-2 gap-1.5">
                        {q.opts.map((o: string,j: number)=><div key={j} className={`text-xs px-3 py-1.5 rounded-lg ${j===q.correct?"bg-green-50 text-green-700 font-semibold":"text-gray-500 bg-gray-50"}`} style={{ fontFamily:I }}>{String.fromCharCode(65+j)}. {o}</div>)}
                      </div>
                    )}
                  </div>
                  <button onClick={e=>e.stopPropagation()} className="flex-shrink-0 w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"><Pencil size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD CHARTS
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardCharts() {
  const scoreData = [
    { month:"Feb", avg:68, pass:72 },{ month:"Mar", avg:71, pass:75 },{ month:"Apr", avg:69, pass:70 },
    { month:"May", avg:74, pass:78 },{ month:"Jun", avg:76, pass:80 },{ month:"Jul", avg:74, pass:78 },
  ];
  const subjectData = [
    { subject:"Math", avg:77, pass:82 },{ subject:"Science", avg:71, pass:74 },
    { subject:"English", avg:80, pass:88 },{ subject:"History", avg:68, pass:70 },{ subject:"CS", avg:84, pass:91 },
  ];
  const participationData = [
    { month:"Feb", rate:78 },{ month:"Mar", rate:82 },{ month:"Apr", rate:76 },
    { month:"May", rate:88 },{ month:"Jun", rate:91 },{ month:"Jul", rate:87 },
  ];
  const difficultyData = [
    { level:"Easy", pass:95, fail:5 },{ level:"Medium", pass:78, fail:22 },{ level:"Hard", pass:52, fail:48 },
  ];
  const pieData = [{ name:"Passed", value:78.4 },{ name:"Failed", value:21.6 }];
  const PIE_COLORS = ["#22c55e","#ef4444"];
  const tt = { contentStyle:{ border:"1px solid #e5e7eb", borderRadius:12, boxShadow:"0 4px 20px rgba(0,0,0,0.08)", fontFamily:I, fontSize:12 }};

  return (
    <DashboardLayout active="charts" title="Analytics" subtitle="Performance insights across all exams">
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div><h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Score & Pass Rate Trend</h3><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>Last 6 months</p></div>
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}><Download size={12}/>Export</button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={scoreData} margin={{ top:5, right:20, bottom:0, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="month" tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false} domain={[60,100]}/>
              <Tooltip {...tt}/>
              <Legend wrapperStyle={{ fontSize:12, fontFamily:I }}/>
              <Line type="monotone" dataKey="avg" name="Avg Score" stroke={INK} strokeWidth={2.5} dot={{ r:4, fill:INK }}/>
              <Line type="monotone" dataKey="pass" name="Pass Rate %" stroke={CAMEL} strokeWidth={2.5} dot={{ r:4, fill:CAMEL }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-black mb-1" style={{ fontFamily:U, color:INK }}>Subject Comparison</h3>
          <p className="text-xs text-gray-400 mb-4" style={{ fontFamily:I }}>Average score by subject</p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={subjectData} margin={{ top:0, right:10, bottom:0, left:-20 }} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
              <XAxis dataKey="subject" tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false} domain={[60,100]}/>
              <Tooltip {...tt}/>
              <Bar dataKey="avg" name="Avg Score" fill={INK} radius={[6,6,0,0]}/>
              <Bar dataKey="pass" name="Pass %" fill={CAMEL} radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-black mb-1" style={{ fontFamily:U, color:INK }}>Pass / Fail Distribution</h3>
          <p className="text-xs text-gray-400 mb-4" style={{ fontFamily:I }}>Overall across all exams</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={3} dataKey="value">
                  {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                </Pie>
                <Tooltip {...tt} formatter={(v: number)=>`${v}%`}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {pieData.map((d,i)=>(
                <div key={d.name} className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ background:PIE_COLORS[i] }}/>
                  <div><p className="text-xs text-gray-500" style={{ fontFamily:I }}>{d.name}</p><p className="text-lg font-black leading-none" style={{ fontFamily:U, color:INK }}>{d.value}%</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-black mb-1" style={{ fontFamily:U, color:INK }}>Participation Rate</h3>
          <p className="text-xs text-gray-400 mb-4" style={{ fontFamily:I }}>% of enrolled students who submitted</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={participationData} margin={{ top:5, right:10, bottom:0, left:-20 }}>
              <defs><linearGradient id="partGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CAMEL} stopOpacity={0.2}/><stop offset="95%" stopColor={CAMEL} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
              <XAxis dataKey="month" tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false} domain={[60,100]}/>
              <Tooltip {...tt}/>
              <Area type="monotone" dataKey="rate" name="Participation %" stroke={CAMEL} strokeWidth={2.5} fill="url(#partGrad)" dot={{ r:4, fill:CAMEL }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-black mb-1" style={{ fontFamily:U, color:INK }}>Difficulty Analysis</h3>
          <p className="text-xs text-gray-400 mb-4" style={{ fontFamily:I }}>Pass vs fail rate by difficulty</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={difficultyData} margin={{ top:0, right:10, bottom:0, left:-20 }} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
              <XAxis dataKey="level" tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <Tooltip {...tt}/>
              <Legend wrapperStyle={{ fontSize:11, fontFamily:I }}/>
              <Bar dataKey="pass" name="Pass %" fill="#22c55e" radius={[6,6,0,0]} stackId="a"/>
              <Bar dataKey="fail" name="Fail %" fill="#fca5a5" stackId="a"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILTERS
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardFilters() {
  const [dateFrom, setDateFrom] = useState("2026-06-01");
  const [dateTo, setDateTo]     = useState("2026-07-13");
  const [subjects, setSubjects] = useState<string[]>(["Mathematics","Science"]);
  const [status, setStatus]     = useState("all");
  const [applied, setApplied]   = useState(false);
  const allSubjects = ["Mathematics","Science","English","History","Computer Science","Physics","Chemistry"];
  const toggleSub = (s:string)=>setSubjects(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]);
  const filtered = MOCK_EXAMS.filter(e=>(subjects.length===0||subjects.includes(e.subject))&&(status==="all"||e.status===status));
  return (
    <DashboardLayout active="filters" title="Reports" subtitle="Filter and export your exam data">
      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Filters</h3>
              <button onClick={()=>{setSubjects([]);setStatus("all");setApplied(false);}} className="text-xs font-semibold flex items-center gap-1" style={{ color:CAMEL, fontFamily:U }}><RotateCcw size={11}/>Reset</button>
            </div>
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Date Range</p>
              {[["From",dateFrom,setDateFrom],["To",dateTo,setDateTo]].map(([label,val,set])=>(
                <div key={label as string} className="mb-2">
                  <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily:I }}>{label as string}</label>
                  <input type="date" value={val as string} onChange={e=>(set as any)(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
                </div>
              ))}
            </div>
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Subject</p>
              <div className="space-y-2">
                {allSubjects.map(s=>(
                  <label key={s} className="flex items-center gap-2.5 cursor-pointer">
                    <div onClick={()=>toggleSub(s)} className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${subjects.includes(s)?"border-transparent":"border-gray-300"}`} style={{ background:subjects.includes(s)?INK:undefined }}>
                      {subjects.includes(s)&&<Check size={10} className="text-white"/>}
                    </div>
                    <span className="text-sm text-gray-600" style={{ fontFamily:I }}>{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Status</p>
              <div className="flex flex-wrap gap-2">
                {["all","published","draft","archived"].map(s=>(
                  <button key={s} onClick={()=>setStatus(s)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize transition-all ${status===s?"text-white border-transparent":"border-gray-200 text-gray-500"}`} style={{ background:status===s?INK:undefined, fontFamily:U }}>{s}</button>
                ))}
              </div>
            </div>
            <button onClick={()=>setApplied(true)} className="w-full text-white font-bold py-3 rounded-xl text-sm hover:opacity-90" style={{ background:INK, fontFamily:U }}>Apply Filters</button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-black mb-4" style={{ fontFamily:U, color:INK }}>Export</h3>
            {["Export as CSV","Export as PDF","Export as Excel"].map(label=>(
              <button key={label} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all" style={{ fontFamily:I }}><Download size={14} style={{ color:CAMEL }}/>{label}</button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div><h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Results</h3><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{filtered.length} exam{filtered.length!==1?"s":""} {applied?"· filters applied":""}</p></div>
          </div>
          {filtered.length===0?(
            <div className="flex flex-col items-center py-24"><Filter size={32} className="text-gray-200 mb-3"/><p className="text-sm font-semibold text-gray-400" style={{ fontFamily:U }}>No results</p></div>
          ):(
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-50">{["Exam Name","Subject","Date","Students","Status"].map(h=><th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(ex=>(
                  <tr key={ex.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold" style={{ fontFamily:U, color:INK }}>{ex.title}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs" style={{ fontFamily:I }}>{ex.subject}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs" style={{ fontFamily:I }}>{ex.date}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs" style={{ fontFamily:I }}>{ex.students||"—"}</td>
                    <td className="px-6 py-4"><StatusBadge status={ex.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardNotifications() {
  const [filter, setFilter] = useState("all");
  const [notifs, setNotifs] = useState([
    { id:1, type:"exam",   title:"Biology Mid-term is now live",         body:"28 students have joined the session. 0 flags so far.",          time:"2 min ago",  read:false, icon:Activity,       color:"#eff6ff" },
    { id:2, type:"alert",  title:"Flag raised — Sara Jones",             body:"Tab switch detected during Mathematics Final (11:02 AM).",       time:"41 min ago", read:false, icon:AlertTriangle,  color:"#fff0f0" },
    { id:3, type:"grade",  title:"Calculus Final auto-graded",           body:"34 papers scored in 0.8 seconds. Average: 77%.",                 time:"2 hrs ago",  read:false, icon:CheckCheck,     color:"#f0fdf4" },
    { id:4, type:"alert",  title:"Flag raised — Mike Park",              body:"Face not detected for 4 seconds during Physics Quiz.",           time:"3 hrs ago",  read:false, icon:AlertTriangle,  color:"#fff0f0" },
    { id:5, type:"system", title:"New feature: question import",         body:"You can now import questions from DOCX and PDF files.",          time:"Yesterday",  read:true,  icon:Bell,           color:`${CAMEL}15` },
    { id:6, type:"exam",   title:"English Comprehension is scheduled",   body:"Exam starts Jul 15 at 09:00 AM. 41 students enrolled.",          time:"Yesterday",  read:true,  icon:CalendarDays,   color:"#eff6ff" },
    { id:7, type:"grade",  title:"Physics Quiz auto-graded",             body:"22 papers scored. Average: 83%. Highest: 98 (John Smith).",      time:"2 days ago", read:true,  icon:CheckCheck,     color:"#f0fdf4" },
  ]);
  const tabs = ["all","exam","alert","grade","system"];
  const filtered = notifs.filter(n=>filter==="all"||n.type===filter);
  const unread = notifs.filter(n=>!n.read).length;
  return (
    <DashboardLayout active="notifications" title="Notifications" subtitle={unread>0?`${unread} unread`:undefined}>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1">
            {tabs.map(t=>(
              <button key={t} onClick={()=>setFilter(t)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-all ${filter===t?"text-white shadow-sm":"text-gray-500 hover:text-gray-700"}`} style={{ background:filter===t?INK:undefined, fontFamily:U }}>{t}</button>
            ))}
          </div>
          <button onClick={()=>setNotifs(p=>p.map(n=>({...n,read:true})))} className="text-xs font-semibold flex items-center gap-1.5 hover:underline" style={{ color:CAMEL, fontFamily:U }}><CheckCheck size={13}/>Mark all read</button>
        </div>
        <div className="space-y-2">
          {filtered.map(n=>(
            <div key={n.id} onClick={()=>setNotifs(p=>p.map(x=>x.id===n.id?{...x,read:true}:x))} className={`bg-white rounded-2xl border transition-all hover:shadow-md cursor-pointer ${!n.read?"border-blue-100":"border-gray-100"}`}>
              <div className="flex gap-4 p-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:n.color }}><n.icon size={18} style={{ color:INK }}/></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-bold leading-snug ${!n.read?"text-gray-900":"text-gray-600"}`} style={{ fontFamily:U }}>{n.title}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!n.read&&<div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:BLUE }}/>}
                      <button onClick={e=>{e.stopPropagation();setNotifs(p=>p.filter(x=>x.id!==n.id));}} className="text-gray-300 hover:text-red-400 transition-colors p-0.5"><X size={13}/></button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed" style={{ fontFamily:I }}>{n.body}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5" style={{ fontFamily:I }}>{n.time}</p>
                </div>
              </div>
            </div>
          ))}
          {filtered.length===0&&<div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-20"><Bell size={32} className="text-gray-200 mb-3"/><p className="text-sm font-semibold text-gray-400" style={{ fontFamily:U }}>All clear</p></div>}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardSettings() {
  const [tab, setTab]               = useState("profile");
  const [name, setName]             = useState("Jane Robertson");
  const [email, setEmail]           = useState("jane.r@university.edu");
  const [phone, setPhone]           = useState("+1 (555) 012-3456");
  const [institution, setInstitution] = useState("University of Melbourne");
  const [department, setDepartment] = useState("Mathematics");
  const [bio, setBio]               = useState("Year 9–12 Mathematics teacher with 8 years of experience.");
  const [curPw, setCurPw]           = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({ examAlerts:true, flagAlerts:true, gradeReady:true, weeklyReport:false, systemUpdates:true, studentJoins:false });

  const save = () => { setSaved(true); setTimeout(()=>setSaved(false),2500); };
  const tabs = [{ id:"profile",label:"Profile",icon:User },{ id:"password",label:"Password",icon:Lock },{ id:"notifications",label:"Notifications",icon:Bell },{ id:"privacy",label:"Privacy",icon:Shield }];

  return (
    <DashboardLayout active="settings" title="Settings">
      <div className="max-w-2xl">
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6 w-fit">
          {tabs.map(({ id,label,icon:Icon })=>(
            <button key={id} onClick={()=>setTab(id)} className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all ${tab===id?"text-white shadow-sm":"text-gray-500 hover:text-gray-700"}`} style={{ background:tab===id?INK:undefined, fontFamily:U }}><Icon size={14}/>{label}</button>
          ))}
        </div>

        {tab==="profile"&&(
          <div className="bg-white rounded-2xl border border-gray-100 p-7">
            <div className="flex items-center gap-5 mb-8 pb-8 border-b border-gray-100">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black" style={{ background:CAMEL, fontFamily:U }}>JR</div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-gray-500 shadow-sm"><Camera size={13}/></button>
              </div>
              <div><p className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily:U }}>Profile photo</p><p className="text-xs text-gray-400 mb-2" style={{ fontFamily:I }}>JPG, PNG or GIF · Max 5MB</p><button className="text-xs font-semibold hover:underline" style={{ color:CAMEL, fontFamily:U }}>Upload new photo</button></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {[{label:"Full Name",val:name,set:setName,col:2},{label:"Email Address",val:email,set:setEmail},{label:"Phone Number",val:phone,set:setPhone},{label:"Institution",val:institution,set:setInstitution},{label:"Department",val:department,set:setDepartment}].map(({label,val,set,col})=>(
                <div key={label} className={col===2?"sm:col-span-2":""}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>{label}</label>
                  <input value={val} onChange={e=>set(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors" style={{ fontFamily:I }}/>
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Bio</label>
                <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors resize-none" style={{ fontFamily:I }}/>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100">
              <button onClick={save} className="flex items-center gap-2 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90" style={{ background:INK, fontFamily:U }}>{saved?<><CheckCircle2 size={15}/>Saved!</>:"Save changes"}</button>
              <button className="text-sm font-medium text-gray-400 hover:text-gray-600 px-4 py-2.5" style={{ fontFamily:I }}>Cancel</button>
            </div>
          </div>
        )}

        {tab==="password"&&(
          <div className="bg-white rounded-2xl border border-gray-100 p-7">
            <h3 className="text-base font-black mb-2" style={{ fontFamily:U, color:INK }}>Change Password</h3>
            <p className="text-sm text-gray-500 mb-7" style={{ fontFamily:I }}>Choose a strong password you haven't used before.</p>
            <div className="max-w-sm space-y-4">
              {[["Current password",curPw,setCurPw],["New password",newPw,setNewPw],["Confirm new password",confirmPw,setConfirmPw]].map(([label,val,set])=>(
                <div key={label as string}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>{label as string}</label>
                  <div className="relative">
                    <input type={showPw?"text":"password"} value={val as string} onChange={e=>(set as any)(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
                    <button type="button" onClick={()=>setShowPw(s=>!s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">{showPw?<EyeOff size={15}/>:<Eye size={15}/>}</button>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[{l:"8+ characters",ok:newPw.length>=8},{l:"Uppercase",ok:/[A-Z]/.test(newPw)},{l:"Number",ok:/\d/.test(newPw)},{l:"Special char",ok:/[^A-Za-z0-9]/.test(newPw)}].map(({l,ok})=>(
                  <div key={l} className="flex items-center gap-1.5"><div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${ok?"bg-green-500":"bg-gray-200"}`}>{ok&&<Check size={8} className="text-white"/>}</div><span className={`text-xs ${ok?"text-green-600":"text-gray-400"}`} style={{ fontFamily:I }}>{l}</span></div>
                ))}
              </div>
              <button onClick={save} className="flex items-center gap-2 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 mt-2" style={{ background:INK, fontFamily:U }}>{saved?<><CheckCircle2 size={15}/>Updated!</>:"Update password"}</button>
            </div>
          </div>
        )}

        {tab==="notifications"&&(
          <div className="bg-white rounded-2xl border border-gray-100 p-7">
            <h3 className="text-base font-black mb-2" style={{ fontFamily:U, color:INK }}>Notification Preferences</h3>
            <p className="text-sm text-gray-500 mb-7" style={{ fontFamily:I }}>Control what you're notified about.</p>
            {[{key:"examAlerts",l:"Exam start & end alerts",d:"When an exam goes live or time runs out"},{key:"flagAlerts",l:"Proctoring flags",d:"When a student is flagged"},{key:"gradeReady",l:"Grading complete",d:"When auto-grading finishes"},{key:"weeklyReport",l:"Weekly summary",d:"Performance digest every Monday"},{key:"systemUpdates",l:"Platform updates",d:"New features and maintenance"},{key:"studentJoins",l:"Student joins exam",d:"Each time a student enters"}].map(({key,l,d})=>(
              <div key={key} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                <div><p className="text-sm font-semibold text-gray-800" style={{ fontFamily:U }}>{l}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{d}</p></div>
                <Toggle on={(notifPrefs as any)[key]} onChange={()=>setNotifPrefs(p=>({...p,[key]:!(p as any)[key]}))}/>
              </div>
            ))}
            <button onClick={save} className="flex items-center gap-2 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 mt-6" style={{ background:INK, fontFamily:U }}>{saved?<><CheckCircle2 size={15}/>Saved!</>:"Save preferences"}</button>
          </div>
        )}

        {tab==="privacy"&&(
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-7">
              <h3 className="text-base font-black mb-6" style={{ fontFamily:U, color:INK }}>Privacy & Data</h3>
              {[{l:"Share anonymised usage data",d:"Helps improve the platform. No personal data."},{l:"Appear in institution directory",d:"Others at your institution can find you."},{l:"Allow research participation",d:"Occasional academic research surveys."}].map(({l,d},i)=>(
                <div key={i} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                  <div><p className="text-sm font-semibold text-gray-800" style={{ fontFamily:U }}>{l}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{d}</p></div>
                  <Toggle on={i===0} onChange={()=>{}}/>
                </div>
              ))}
            </div>
            <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
              <h3 className="text-sm font-black text-red-700 mb-2" style={{ fontFamily:U }}>Danger Zone</h3>
              <p className="text-xs text-red-500 mb-4" style={{ fontFamily:I }}>These actions are permanent and cannot be undone.</p>
              <div className="flex gap-3">
                <button className="text-xs font-semibold text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors" style={{ fontFamily:U }}>Delete all exam data</button>
                <button className="text-xs font-semibold text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors" style={{ fontFamily:U }}>Close account</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LANDING PAGE WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-GRADING RESULTS
// ═══════════════════════════════════════════════════════════════════════════════
const GRADE_EXPORT_FIELDS = ["Student name","Score (%)","Grade","Per-question breakdown","Time taken","Attempt number","Submitted at"];

function GradeExportModal({ onClose }: { onClose:()=>void }) {
  const [format, setFormat] = useState("csv");
  const [fields, setFields] = useState<string[]>(GRADE_EXPORT_FIELDS.slice(0,4));
  const toggleField = (f:string)=>setFields(p=>p.includes(f)?p.filter(x=>x!==f):[...p,f]);
  const [exporting, setExporting] = useState(false);
  const doExport = ()=>{ setExporting(true); setTimeout(()=>{ setExporting(false); onClose(); },1000); };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background:"rgba(13,27,42,0.55)", backdropFilter:"blur(8px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="h-1 w-full" style={{ background:`linear-gradient(90deg,${INK},${CAMEL})` }}/>
        <div className="p-7">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black" style={{ fontFamily:U, color:INK }}>Export Grades</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><X size={15}/></button>
          </div>
          <div className="mb-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" style={{ fontFamily:U }}>Format</p>
            <div className="flex gap-2">
              {[{id:"csv",label:"CSV"},{id:"xlsx",label:"Excel"},{id:"pdf",label:"PDF"},{id:"sheets",label:"Google Sheets"}].map(f=>(
                <button key={f.id} onClick={()=>setFormat(f.id)} className={`flex-1 text-xs font-bold py-2.5 rounded-xl border transition-all ${format===f.id?"text-white border-transparent":"border-gray-200 text-gray-500 hover:border-gray-300"}`} style={{ background:format===f.id?INK:undefined, fontFamily:U }}>{f.label}</button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3" style={{ fontFamily:U }}>Include fields</p>
            <div className="space-y-2">
              {GRADE_EXPORT_FIELDS.map(f=>(
                <label key={f} className="flex items-center gap-3 cursor-pointer">
                  <div onClick={()=>toggleField(f)} className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${fields.includes(f)?"border-transparent":"border-gray-300"}`} style={{ background:fields.includes(f)?INK:undefined }}>
                    {fields.includes(f)&&<Check size={10} className="text-white"/>}
                  </div>
                  <span className="text-sm text-gray-700" style={{ fontFamily:I }}>{f}</span>
                </label>
              ))}
            </div>
          </div>
          <button onClick={doExport} disabled={exporting||fields.length===0} className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-50" style={{ background:INK, fontFamily:U }}>
            {exporting?<><RefreshCw size={15} className="animate-spin"/>Exporting…</>:<><Download size={15}/>Export {fields.length} fields as .{format}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const MOCK_GRADING_RESULTS = [
  { name:"Alice Mills",   score:88, grade:"A", status:"auto",   q:[9,10,8,10,9,8,10,10,9,5] },
  { name:"Sara Jones",    score:71, grade:"B", status:"auto",   q:[7,8,6,9,7,6,8,7,8,5] },
  { name:"Tom Reed",      score:45, grade:"F", status:"review", q:[5,4,3,8,4,3,4,5,4,5] },
  { name:"Mike Park",     score:83, grade:"A", status:"auto",   q:[8,9,8,10,9,7,9,8,7,8] },
  { name:"Lucy Kim",      score:67, grade:"C", status:"review", q:[6,7,5,9,6,5,7,6,7,9] },
  { name:"James Wang",    score:92, grade:"A", status:"auto",   q:[10,10,9,10,9,9,10,10,8,7] },
];

const MOCK_Q_PERF = [
  { q:1, type:"MCQ",    topic:"Chain Rule",           avg:7.8, pass:88, wrong:"Option C (28%)" },
  { q:2, type:"MCQ",    topic:"Integration basics",   avg:8.2, pass:91, wrong:"Option B (18%)" },
  { q:3, type:"Short",  topic:"Fundamental theorem",  avg:6.5, pass:72, wrong:"—" },
  { q:4, type:"MCQ",    topic:"Limits",               avg:9.2, pass:96, wrong:"Option D (4%)" },
  { q:5, type:"MCQ",    topic:"Product rule",         avg:7.3, pass:82, wrong:"Option A (22%)" },
  { q:6, type:"Essay",  topic:"Applications",         avg:6.1, pass:68, wrong:"—" },
  { q:7, type:"T/F",    topic:"Second derivative",    avg:8.8, pass:92, wrong:"False (12%)" },
  { q:8, type:"MCQ",    topic:"e^x derivative",       avg:8.4, pass:90, wrong:"Option C (14%)" },
  { q:9, type:"Short",  topic:"L'Hôpital's rule",     avg:7.1, pass:78, wrong:"—" },
  { q:10, type:"Essay", topic:"Definite vs indefinite",avg:6.4, pass:70, wrong:"—" },
];

function GradingResults() {
  const navigate = useNavigate();
  const [examId, setExamId] = useState("1");
  const [showExport, setShowExport] = useState(false);
  const [viewTab, setViewTab] = useState("students");
  const exam = MOCK_EXAMS.find(e=>e.id===examId)||MOCK_EXAMS[0];

  const gradeColor = (g:string)=>({ A:"text-green-600", B:"text-blue-600", C:"text-amber-600", F:"text-red-600" }[g]||"text-gray-600");
  const scoreColor = (s:number)=>s>=80?"#16a34a":s>=60?"#d97706":"#ef4444";

  return (
    <DashboardLayout active="grading" title="Auto-Grading Results" subtitle="Review and export scores"
      actions={<>
        <button onClick={()=>navigate("/dashboard/grading/manual")} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}><PenLine size={13}/>Manual grade</button>
        <button onClick={()=>setShowExport(true)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export</button>
      </>}>
      {showExport&&<GradeExportModal onClose={()=>setShowExport(false)}/>}

      {/* Exam selector */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>Exam</label>
          <select value={examId} onChange={e=>setExamId(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-gray-400 min-w-[240px]" style={{ fontFamily:I }}>
            {MOCK_EXAMS.filter(e=>e.status==="published").map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          { l:"Total Papers",  v:"34",   icon:Users,        bg:"#F0EDE8" },
          { l:"Auto-graded",   v:"30",   icon:ClipboardCheck,bg:"#f0fdf4" },
          { l:"Needs Review",  v:"4",    icon:AlertTriangle, bg:"#fff0f0" },
          { l:"Average Score", v:"74.2%",icon:Award,         bg:"#fff7ed" },
          { l:"Pass Rate",     v:"82%",  icon:TrendingUp,    bg:"#eff6ff" },
        ].map(({l,v,icon:Icon,bg})=>(
          <div key={l} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:bg }}><Icon size={17} style={{ color:INK }}/></div>
            <div><p className="text-lg font-black leading-none" style={{ fontFamily:U, color:INK }}>{v}</p><p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 w-fit mb-5">
        {[{id:"students",label:"Student Results"},{id:"questions",label:"Question Analysis"}].map(t=>(
          <button key={t.id} onClick={()=>setViewTab(t.id)} className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${viewTab===t.id?"text-white shadow-sm":"text-gray-500 hover:text-gray-700"}`} style={{ background:viewTab===t.id?INK:undefined, fontFamily:U }}>{t.label}</button>
        ))}
      </div>

      {viewTab==="students"&&(
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">{["Student","Score","Grade","Status","Q1-Q5","Q6-Q10","Actions"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
            <tbody>
              {MOCK_GRADING_RESULTS.map(r=>(
                <tr key={r.name} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background:CAMEL, fontFamily:U }}>{r.name.split(" ").map(w=>w[0]).join("")}</div>
                      <span className="font-semibold text-gray-800 whitespace-nowrap" style={{ fontFamily:U }}>{r.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width:`${r.score}%`, background:scoreColor(r.score) }}/></div>
                      <span className="text-sm font-black" style={{ fontFamily:U, color:scoreColor(r.score) }}>{r.score}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><span className={`text-sm font-black ${gradeColor(r.grade)}`} style={{ fontFamily:U }}>{r.grade}</span></td>
                  <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${r.status==="auto"?"bg-green-50 text-green-700":"bg-amber-50 text-amber-700"}`} style={{ fontFamily:U }}>{r.status==="auto"?"Auto-graded":"Needs review"}</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-0.5">{r.q.slice(0,5).map((s,i)=><div key={i} className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ background:s>=8?"#22c55e":s>=6?"#f59e0b":"#ef4444", fontFamily:U }}>{s}</div>)}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-0.5">{r.q.slice(5).map((s,i)=><div key={i} className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ background:s>=8?"#22c55e":s>=6?"#f59e0b":"#ef4444", fontFamily:U }}>{s}</div>)}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={()=>navigate("/dashboard/grading/manual")} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap" style={{ fontFamily:U }}>
                      {r.status==="review"?"Grade →":"Review"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewTab==="questions"&&(
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">{["#","Type","Topic","Avg Score","Pass Rate","Most Common Wrong","Difficulty"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
            <tbody>
              {MOCK_Q_PERF.map(q=>(
                <tr key={q.q} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors">
                  <td className="px-5 py-3.5"><span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background:"#F0EDE8", color:INK, fontFamily:U, display:"inline-flex" }}>Q{q.q}</span></td>
                  <td className="px-5 py-3.5"><span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full" style={{ fontFamily:U }}>{q.type}</span></td>
                  <td className="px-5 py-3.5 text-gray-700 font-medium whitespace-nowrap" style={{ fontFamily:I }}>{q.topic}</td>
                  <td className="px-5 py-3.5"><span className="font-black text-sm" style={{ fontFamily:U, color:scoreColor(q.avg*10) }}>{q.avg}/10</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2"><div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-green-500" style={{ width:`${q.pass}%` }}/></div><span className="text-xs font-semibold text-gray-700" style={{ fontFamily:U }}>{q.pass}%</span></div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap" style={{ fontFamily:I }}>{q.wrong}</td>
                  <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${q.avg>=8?"bg-green-50 text-green-600":q.avg>=6?"bg-amber-50 text-amber-600":"bg-red-50 text-red-600"}`} style={{ fontFamily:U }}>{q.avg>=8?"Easy":q.avg>=6?"Medium":"Hard"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANUAL GRADING SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
const MANUAL_QUESTIONS = [
  { id:1, type:"Essay",  prompt:"Discuss the applications of derivatives in real life, including optimization problems.", maxScore:20, rubric:["Clear introduction (3pts)","At least 3 real-world examples (9pts)","Correct mathematical notation (4pts)","Conclusion (4pts)"] },
  { id:2, type:"Short",  prompt:"What is L'Hôpital's rule and when is it applied?", maxScore:10, rubric:["Correct definition (5pts)","Valid condition stated (3pts)","Example given (2pts)"] },
  { id:3, type:"Essay",  prompt:"Compare and contrast definite and indefinite integrals.", maxScore:15, rubric:["Defines both types (4pts)","Differences explained (5pts)","Notation correct (3pts)","Example for each (3pts)"] },
];

const MANUAL_STUDENTS = MOCK_GRADING_RESULTS.filter(r=>r.status==="review");

function ManualGrading() {
  const navigate = useNavigate();
  const [studentIdx, setStudentIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [scores, setScores] = useState<Record<string,number>>({});
  const [feedback, setFeedback] = useState<Record<string,string>>({});
  const [saved, setSaved] = useState(false);

  const student = MANUAL_STUDENTS[studentIdx];
  const question = MANUAL_QUESTIONS[qIdx];
  const key = `${studentIdx}-${qIdx}`;

  const setScore = (v:number)=>setScores(p=>({...p,[key]:Math.min(question.maxScore,Math.max(0,v))}));
  const setFb = (v:string)=>setFeedback(p=>({...p,[key]:v}));

  const saveAndNext = ()=>{
    setSaved(true);
    setTimeout(()=>{
      setSaved(false);
      if(qIdx<MANUAL_QUESTIONS.length-1) setQIdx(q=>q+1);
      else if(studentIdx<MANUAL_STUDENTS.length-1){ setQIdx(0); setStudentIdx(s=>s+1); }
    },600);
  };

  const sampleResponse = ["Tom Reed's response to this question:\n\n\"Derivatives are used in many real-world scenarios. One important application is optimization — for example, a company can use derivatives to find the maximum profit or minimum cost by setting the derivative equal to zero and solving for the critical points.\n\nAnother application is in physics, where velocity is the derivative of position with respect to time, and acceleration is the derivative of velocity. Engineers use these concepts when designing vehicles and structures.\n\nIn medicine, derivatives are used to model the rate at which drugs are metabolized in the body. By finding the maximum concentration point (the peak), doctors can time doses appropriately.\n\nIn summary, calculus and derivatives provide a powerful tool for understanding rates of change in a wide variety of fields.\"","Lucy Kim's response:\n\n\"Derivatives help us find where functions are increasing or decreasing. They can be used to find maximum and minimum values. For example in business you can find maximum profit. Also in physics velocity is a derivative of position. These are some applications of derivatives in real life.\""][studentIdx]||"No response submitted.";

  return (
    <DashboardLayout active="grading-manual" title="Manual Grading" subtitle={`${student?.name} · ${qIdx+1} of ${MANUAL_QUESTIONS.length} open questions`}
      actions={<>
        <button onClick={()=>navigate("/dashboard/grading")} className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}>← All results</button>
      </>}>

      <div className="grid lg:grid-cols-[200px_1fr_280px] gap-5 h-[calc(100vh-11rem)]">
        {/* Left: student list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
          <div className="px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500" style={{ fontFamily:U }}>Students</p>
            <p className="text-[11px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{MANUAL_STUDENTS.length} need review</p>
          </div>
          {MANUAL_STUDENTS.map((s,i)=>{
            const done = MANUAL_QUESTIONS.every((_,qi)=>scores[`${i}-${qi}`]!==undefined);
            return (
              <button key={s.name} onClick={()=>{setStudentIdx(i);setQIdx(0);}}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-all ${studentIdx===i?"bg-gray-50":"hover:bg-gray-50/50"}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background:studentIdx===i?INK:CAMEL, fontFamily:U }}>{s.name.split(" ").map(w=>w[0]).join("")}</div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-xs font-semibold truncate ${studentIdx===i?"text-gray-900":"text-gray-600"}`} style={{ fontFamily:U }}>{s.name}</p>
                  <p className="text-[10px] text-gray-400" style={{ fontFamily:I }}>{done?"Complete":"In progress"}</p>
                </div>
                {done&&<CheckCircle2 size={13} className="text-green-500 flex-shrink-0"/>}
              </button>
            );
          })}
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2" style={{ fontFamily:U }}>Questions</p>
            {MANUAL_QUESTIONS.map((q,qi)=>(
              <button key={qi} onClick={()=>setQIdx(qi)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 transition-all ${qIdx===qi?"bg-gray-900 text-white":"text-gray-500 hover:bg-gray-50"}`}>
                <span className="text-[10px] font-black" style={{ fontFamily:U }}>Q{q.id}</span>
                <span className="text-[10px] flex-1 text-left truncate" style={{ fontFamily:I }}>{q.type}</span>
                {scores[`${studentIdx}-${qi}`]!==undefined&&<Check size={10} className="text-green-400"/>}
              </button>
            ))}
          </div>
        </div>

        {/* Center: student response */}
        <div className="flex flex-col gap-4 overflow-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background:`${CAMEL}20`, color:CAMEL, fontFamily:U }}>Q{question.id} · {question.type}</span>
              <span className="text-xs text-gray-400" style={{ fontFamily:I }}>Max score: {question.maxScore} pts</span>
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1 leading-relaxed" style={{ fontFamily:U }}>{question.prompt}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 flex-1 overflow-auto">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background:CAMEL, fontFamily:U }}>{student?.name.split(" ").map(w=>w[0]).join("")}</div>
                <p className="text-sm font-bold text-gray-800" style={{ fontFamily:U }}>{student?.name}</p>
              </div>
              <span className="text-xs text-gray-400" style={{ fontFamily:I }}>Submitted 11:02 AM</span>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line" style={{ fontFamily:I }}>{sampleResponse}</p>
            </div>
          </div>
        </div>

        {/* Right: scoring panel */}
        <div className="flex flex-col gap-4 overflow-auto">
          {/* Score input */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-4" style={{ fontFamily:U }}>Score</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <input type="number" value={scores[key]??""} onChange={e=>setScore(Number(e.target.value))} min={0} max={question.maxScore}
                  placeholder="—" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-2xl font-black text-center focus:outline-none focus:border-gray-900 transition-colors" style={{ fontFamily:U, color:INK }}/>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-gray-300" style={{ fontFamily:U }}>/ {question.maxScore}</p>
              </div>
            </div>
            {/* Quick score buttons */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {[0,25,50,75,100].map(pct=>{
                const v = Math.round(question.maxScore*pct/100);
                return <button key={pct} onClick={()=>setScore(v)} className="py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all" style={{ fontFamily:U }}>{pct}%</button>;
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setScore(0)} className="flex items-center gap-1 flex-1 justify-center py-2 rounded-lg text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors" style={{ fontFamily:U }}><ThumbsDown size={12}/>Fail</button>
              <button onClick={()=>setScore(question.maxScore)} className="flex items-center gap-1 flex-1 justify-center py-2 rounded-lg text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 transition-colors" style={{ fontFamily:U }}><ThumbsUp size={12}/>Full marks</button>
            </div>
          </div>

          {/* Rubric */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3" style={{ fontFamily:U }}>Rubric</p>
            <ul className="space-y-1.5">
              {question.rubric.map((r,i)=>(
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600" style={{ fontFamily:I }}>
                  <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0 mt-0.5"/>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Feedback */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2" style={{ fontFamily:U }}>Feedback to student</p>
            <textarea value={feedback[key]||""} onChange={e=>setFb(e.target.value)} rows={4} placeholder="Optional: add written feedback the student will see…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none" style={{ fontFamily:I }}/>
          </div>

          {/* Save & navigate */}
          <div className="space-y-2">
            <button onClick={saveAndNext} disabled={scores[key]===undefined}
              className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-40 transition-all" style={{ background:INK, fontFamily:U }}>
              {saved?<><CheckCircle2 size={15}/>Saved!</>:"Save & Next →"}
            </button>
            <div className="flex gap-2">
              <button onClick={()=>{ if(qIdx>0)setQIdx(q=>q-1); else if(studentIdx>0){setStudentIdx(s=>s-1);setQIdx(MANUAL_QUESTIONS.length-1);} }} className="flex-1 py-2 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50" style={{ fontFamily:U }}>← Prev</button>
              <button onClick={()=>navigate("/dashboard/grading")} className="flex-1 py-2 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50" style={{ fontFamily:U }}>All results</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE MONITORING DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const LIVE_STUDENTS = [
  { init:"AM", name:"Alice Mills",  q:12, pct:48, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"SJ", name:"Sara Jones",  q:8,  pct:32, status:"flag",  flags:2, elapsed:"23:14" },
  { init:"LK", name:"Lucy Kim",    q:14, pct:56, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"TR", name:"Tom Reed",    q:11, pct:44, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"MP", name:"Mike Park",   q:7,  pct:28, status:"flag",  flags:1, elapsed:"23:14" },
  { init:"OB", name:"Owen Bell",   q:13, pct:52, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"HL", name:"Helen Lee",   q:9,  pct:36, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"JW", name:"James Wang",  q:16, pct:64, status:"done",  flags:0, elapsed:"19:42" },
  { init:"RK", name:"Ryan Kim",    q:12, pct:48, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"EM", name:"Emma Mills",  q:10, pct:40, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"BH", name:"Ben Harris",  q:14, pct:56, status:"ok",    flags:0, elapsed:"23:14" },
  { init:"AN", name:"Amy Nguyen",  q:11, pct:44, status:"flag",  flags:1, elapsed:"23:14" },
];

const LIVE_ALERTS = [
  { time:"09:44:27", student:"Sara Jones",  event:"Tab switch (2.4s)",      severity:"warn",     id:1 },
  { time:"09:41:03", student:"Mike Park",   event:"Face not detected (4s)", severity:"warn",     id:2 },
  { time:"09:38:15", student:"Amy Nguyen",  event:"Copy-paste attempt",     severity:"critical", id:3 },
  { time:"09:35:50", student:"Sara Jones",  event:"Multiple faces detected", severity:"critical", id:4 },
  { time:"09:32:11", student:"All",         event:"Exam started · 12 joined",severity:"info",     id:5 },
];

function LiveMonitoring() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string|null>(null);
  const [examId, setExamId] = useState("2");

  const flagged  = LIVE_STUDENTS.filter(s=>s.status==="flag");
  const done     = LIVE_STUDENTS.filter(s=>s.status==="done");
  const active   = LIVE_STUDENTS.filter(s=>s.status==="ok");

  const sevColor: Record<string,string> = { warn:"#d97706", critical:"#ef4444", info:"#3b82f6" };
  const sevBg:    Record<string,string> = { warn:"#fff7ed", critical:"#fff0f0", info:"#eff6ff" };

  const statusStyle = (s:string)=>
    s==="flag"?"bg-red-50 border-red-300":s==="done"?"bg-blue-50 border-blue-200":"bg-white border-gray-200";

  return (
    <DashboardLayout active="monitoring" title="Live Monitor" subtitle="Real-time exam session"
      actions={<>
        <div className="flex items-center gap-2">
          <select value={examId} onChange={e=>setExamId(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-white focus:outline-none" style={{ fontFamily:I }}>
            {MOCK_EXAMS.filter(e=>e.status==="published").map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
          <span className="text-xs font-bold text-green-700" style={{ fontFamily:U }}>Live · 36:46 left</span>
        </div>
      </>}>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[{l:"Active",v:active.length,color:"#16a34a",bg:"#f0fdf4"},{l:"Flagged",v:flagged.length,color:"#ef4444",bg:"#fff0f0"},{l:"Submitted",v:done.length,color:BLUE,bg:"#eff6ff"},{l:"Avg Progress",v:"44%",color:INK,bg:"#F0EDE8"}].map(({l,v,color,bg})=>(
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0" style={{ background:bg, color, fontFamily:U }}>{v}</div>
            <p className="text-xs font-semibold text-gray-500" style={{ fontFamily:I }}>{l}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        {/* Student grid */}
        <div>
          {flagged.length>0&&(
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3"><AlertOctagon size={16} className="text-red-500"/><p className="text-sm font-black text-red-700" style={{ fontFamily:U }}>{flagged.length} Active Alerts</p></div>
              <div className="flex flex-wrap gap-2">
                {flagged.map(s=>(
                  <div key={s.init} className="flex items-center gap-2 bg-white border border-red-200 rounded-lg px-3 py-2">
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-[9px] font-bold" style={{ fontFamily:U }}>{s.init}</div>
                    <div><p className="text-xs font-bold text-gray-800" style={{ fontFamily:U }}>{s.name}</p><p className="text-[10px] text-red-500" style={{ fontFamily:I }}>{s.flags} flag{s.flags!==1?"s":""}</p></div>
                    <button className="text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded-md ml-1 hover:bg-red-600" style={{ fontFamily:U }}>Warn</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {LIVE_STUDENTS.map(s=>(
              <div key={s.init} onClick={()=>setExpanded(expanded===s.name?null:s.name)}
                className={`relative rounded-xl border-2 p-3 cursor-pointer transition-all hover:shadow-md ${statusStyle(s.status)} ${expanded===s.name?"ring-2 ring-gray-800":""}`}>
                {/* Flag badge */}
                {s.flags>0&&<div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold z-10" style={{ fontFamily:U }}>{s.flags}</div>}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background:s.status==="flag"?"#ef4444":s.status==="done"?BLUE:INK, fontFamily:U }}>{s.init}</div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-800 truncate" style={{ fontFamily:U }}>{s.name}</p>
                    <p className={`text-[9px] font-semibold ${s.status==="flag"?"text-red-500":s.status==="done"?"text-blue-500":"text-gray-400"}`} style={{ fontFamily:I }}>{s.status==="done"?"Submitted":`Q${s.q}`}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width:`${s.pct}%`, background:s.status==="flag"?"#ef4444":s.status==="done"?BLUE:CAMEL }}/>
                </div>
                <p className="text-[9px] text-gray-400 mt-1 text-right" style={{ fontFamily:I }}>{s.pct}%</p>

                {/* Expanded details */}
                {expanded===s.name&&(
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                    <p className="text-[10px] text-gray-500" style={{ fontFamily:I }}>Time elapsed: {s.elapsed}</p>
                    <p className="text-[10px] text-gray-500" style={{ fontFamily:I }}>Flags: {s.flags}</p>
                    <div className="flex gap-1.5 mt-2">
                      <button className="flex-1 text-[10px] font-bold py-1 rounded bg-amber-500 text-white hover:bg-amber-600" style={{ fontFamily:U }}>Warn</button>
                      <button className="flex-1 text-[10px] font-bold py-1 rounded bg-red-500 text-white hover:bg-red-600" style={{ fontFamily:U }}>Remove</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Alert feed */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col" style={{ maxHeight:"70vh" }}>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/><p className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Alert Feed</p></div>
            <span className="text-xs text-gray-400" style={{ fontFamily:I }}>{LIVE_ALERTS.length} events</span>
          </div>
          <div className="overflow-y-auto flex-1">
            {LIVE_ALERTS.map(a=>(
              <div key={a.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background:sevBg[a.severity] }}>
                    <AlertTriangle size={13} style={{ color:sevColor[a.severity] }}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 leading-snug" style={{ fontFamily:U }}>{a.event}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5" style={{ fontFamily:I }}>{a.student}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{a.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 space-y-2">
            <button className="w-full text-xs font-bold py-2.5 rounded-xl text-white hover:opacity-90" style={{ background:"#ef4444", fontFamily:U }}>End exam for all</button>
            <button onClick={()=>navigate("/dashboard/monitoring/logs")} className="w-full text-xs font-semibold py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}>View full logs →</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANTI-CHEATING RULES CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
type RuleAction = "ignore"|"warn"|"flag"|"submit";

interface Rule {
  id:string; label:string; desc:string; enabled:boolean; action:RuleAction; threshold?:number;
}

const ACTION_LABELS: Record<RuleAction,{label:string;color:string;bg:string}> = {
  ignore: { label:"Ignore",   color:"#9ca3af", bg:"#f9fafb" },
  warn:   { label:"Warn",     color:"#d97706", bg:"#fffbeb" },
  flag:   { label:"Flag",     color:"#ef4444", bg:"#fff0f0" },
  submit: { label:"Auto-submit",color:"#7c3aed",bg:"#f5f3ff" },
};

function RulesConfig() {
  const [rules, setRules] = useState<Rule[]>([
    { id:"tab",   label:"Tab switch / window blur",    desc:"Student navigates away from the exam tab.",              enabled:true,  action:"flag",   threshold:3 },
    { id:"face",  label:"Face not detected",           desc:"Student's face disappears from the camera view.",        enabled:true,  action:"flag",   threshold:5 },
    { id:"multi", label:"Multiple faces detected",     desc:"More than one face visible in the camera.",              enabled:true,  action:"flag",   threshold:1 },
    { id:"copy",  label:"Copy / paste attempt",        desc:"Student tries to copy text or paste from clipboard.",    enabled:true,  action:"warn" },
    { id:"full",  label:"Fullscreen exited",           desc:"Student exits fullscreen / lockdown browser mode.",      enabled:true,  action:"warn" },
    { id:"dev",   label:"DevTools opened",             desc:"Browser developer tools are detected open.",             enabled:true,  action:"submit" },
    { id:"print", label:"Print screen key pressed",    desc:"Student presses the print screen or screenshot key.",   enabled:false, action:"warn" },
    { id:"phone", label:"Phone detected (AI)",         desc:"AI vision detects a mobile phone near the keyboard.",    enabled:false, action:"flag" },
    { id:"audio", label:"Unusual audio detected",      desc:"Microphone picks up whispering or external voices.",     enabled:false, action:"warn" },
  ]);

  const [globalScreenshots, setGlobalScreenshots] = useState(30);
  const [requireCamera, setRequireCamera] = useState(true);
  const [requireFullscreen, setRequireFullscreen] = useState(true);
  const [lockBrowser, setLockBrowser] = useState(true);
  const [saved, setSaved] = useState(false);

  const toggleRule = (id:string)=>setRules(p=>p.map(r=>r.id===id?{...r,enabled:!r.enabled}:r));
  const setAction = (id:string, a:RuleAction)=>setRules(p=>p.map(r=>r.id===id?{...r,action:a}:r));
  const setThreshold = (id:string, v:number)=>setRules(p=>p.map(r=>r.id===id?{...r,threshold:v}:r));

  const save = ()=>{ setSaved(true); setTimeout(()=>setSaved(false),2000); };

  const ActionChip = ({ rule }: { rule:Rule })=>{
    const [open, setOpen] = useState(false);
    const current = ACTION_LABELS[rule.action];
    return (
      <div className="relative">
        <button onClick={()=>setOpen(o=>!o)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all" style={{ color:current.color, background:current.bg, borderColor:`${current.color}30`, fontFamily:U }}>
          {current.label}<ChevronDown size={11}/>
        </button>
        {open&&(
          <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 w-40" onClick={e=>e.stopPropagation()}>
            {(Object.entries(ACTION_LABELS) as [RuleAction,typeof ACTION_LABELS[RuleAction]][]).map(([id,{label,color,bg}])=>(
              <button key={id} onClick={()=>{ setAction(rule.id,id); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors ${rule.action===id?"font-black":""}`}
                style={{ color, fontFamily:U }}>
                {rule.action===id&&<Check size={10}/>}{label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout active="rules" title="Rules Config" subtitle="Configure anti-cheating behavior"
      actions={<button onClick={save} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}>{saved?<><CheckCircle2 size={13}/>Saved!</>:"Save rules"}</button>}>

      <div className="max-w-3xl space-y-5">
        {/* Global settings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Session Requirements</h3>
          <div className="space-y-1">
            {[
              {l:"Require webcam / camera",   d:"Students must have camera access to start.",         on:requireCamera,    set:setRequireCamera},
              {l:"Lock to fullscreen",        d:"Exam must stay fullscreen. Exit triggers an action.", on:requireFullscreen,set:setRequireFullscreen},
              {l:"Browser lockdown mode",     d:"Block extensions, DevTools, and new tabs.",           on:lockBrowser,      set:setLockBrowser},
            ].map(({l,d,on,set})=>(
              <div key={l} className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
                <div><p className="text-sm font-semibold text-gray-800" style={{ fontFamily:U }}>{l}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{d}</p></div>
                <Toggle on={on} onChange={()=>set((s:boolean)=>!s)}/>
              </div>
            ))}
            <div className="py-3.5 flex items-center justify-between">
              <div><p className="text-sm font-semibold text-gray-800" style={{ fontFamily:U }}>Screenshot frequency</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>Encrypted screenshots taken every N seconds.</p></div>
              <div className="flex items-center gap-2">
                <input type="number" value={globalScreenshots} onChange={e=>setGlobalScreenshots(+e.target.value)} min={10} max={300} className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-gray-400" style={{ fontFamily:U }}/>
                <span className="text-xs text-gray-400" style={{ fontFamily:I }}>sec</span>
              </div>
            </div>
          </div>
        </div>

        {/* Per-event rules */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Event Rules</h3>
            <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>Configure what happens when each suspicious event is detected.</p>
          </div>
          <div className="divide-y divide-gray-50">
            {rules.map(rule=>{
              const cur = ACTION_LABELS[rule.action];
              return (
                <div key={rule.id} className={`px-6 py-4 flex items-center gap-4 transition-all ${!rule.enabled?"opacity-50":""}`}>
                  <Toggle on={rule.enabled} onChange={()=>toggleRule(rule.id)}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800" style={{ fontFamily:U }}>{rule.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{rule.desc}</p>
                  </div>
                  {rule.threshold!==undefined&&rule.enabled&&(
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs text-gray-400" style={{ fontFamily:I }}>after</span>
                      <input type="number" value={rule.threshold} onChange={e=>setThreshold(rule.id,+e.target.value)} min={1} max={99}
                        className="w-12 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:border-gray-400" style={{ fontFamily:U }}/>
                      <span className="text-xs text-gray-400" style={{ fontFamily:I }}>× </span>
                    </div>
                  )}
                  <div className="flex-shrink-0">{rule.enabled?<ActionChip rule={rule}/>:<span className="text-xs text-gray-300 px-3 py-1.5" style={{ fontFamily:U }}>Disabled</span>}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action key */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Action reference</p>
          <div className="flex flex-wrap gap-3">
            {(Object.entries(ACTION_LABELS) as [RuleAction,typeof ACTION_LABELS[RuleAction]][]).map(([id,{label,color,bg}])=>(
              <div key={id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background:bg }}>
                <div className="w-2 h-2 rounded-full" style={{ background:color }}/>
                <p className="text-xs font-bold" style={{ color, fontFamily:U }}>{label}</p>
                <p className="text-[10px] text-gray-400" style={{ fontFamily:I }}>
                  {({"ignore":"No action taken","warn":"Student sees a warning popup","flag":"Alert sent to proctor","submit":"Exam auto-submitted"} as Record<string,string>)[id]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANTI-CHEATING LOGS
// ═══════════════════════════════════════════════════════════════════════════════
const SECURITY_LOGS = [
  { id:1,  ts:"2026-07-13 09:44:27", student:"Sara Jones",  exam:"Biology Mid-term",  event:"Tab switch",          severity:"warn",     action:"Flagged",        resolved:false },
  { id:2,  ts:"2026-07-13 09:41:03", student:"Mike Park",   exam:"Biology Mid-term",  event:"Face not detected",   severity:"warn",     action:"Flagged",        resolved:false },
  { id:3,  ts:"2026-07-13 09:38:15", student:"Amy Nguyen",  exam:"Biology Mid-term",  event:"Copy-paste attempt",  severity:"critical", action:"Warning sent",   resolved:true  },
  { id:4,  ts:"2026-07-13 09:35:50", student:"Sara Jones",  exam:"Biology Mid-term",  event:"Multiple faces",      severity:"critical", action:"Flagged",        resolved:false },
  { id:5,  ts:"2026-07-10 10:58:11", student:"Tom Reed",    exam:"Calculus Final",    event:"DevTools opened",     severity:"critical", action:"Auto-submitted",  resolved:true  },
  { id:6,  ts:"2026-07-10 10:42:33", student:"Lucy Kim",    exam:"Calculus Final",    event:"Tab switch",          severity:"warn",     action:"Warning sent",   resolved:true  },
  { id:7,  ts:"2026-07-10 10:39:05", student:"James Wang",  exam:"Calculus Final",    event:"Fullscreen exited",   severity:"warn",     action:"Warning sent",   resolved:true  },
  { id:8,  ts:"2026-07-08 11:14:22", student:"Ryan Kim",    exam:"Physics Quiz",      event:"Copy-paste attempt",  severity:"warn",     action:"Warning sent",   resolved:true  },
];

function SecurityLogs() {
  const [sevFilter, setSevFilter] = useState("all");
  const [examFilter, setExamFilter] = useState("all");
  const [resolvedFilter, setResolvedFilter] = useState("all");
  const [expanded, setExpanded] = useState<number|null>(null);

  const filtered = SECURITY_LOGS.filter(l=>{
    const matchSev  = sevFilter==="all"||l.severity===sevFilter;
    const matchExam = examFilter==="all"||l.exam===examFilter;
    const matchRes  = resolvedFilter==="all"||(resolvedFilter==="resolved"?l.resolved:!l.resolved);
    return matchSev&&matchExam&&matchRes;
  });

  const sevColor: Record<string,string> = { warn:"text-amber-600 bg-amber-50", critical:"text-red-600 bg-red-50", info:"text-blue-600 bg-blue-50" };
  const uniqueExams = [...new Set(SECURITY_LOGS.map(l=>l.exam))];

  const summary = {
    total:SECURITY_LOGS.length,
    critical:SECURITY_LOGS.filter(l=>l.severity==="critical").length,
    unresolved:SECURITY_LOGS.filter(l=>!l.resolved).length,
    autoSubmit:SECURITY_LOGS.filter(l=>l.action==="Auto-submitted").length,
  };

  return (
    <DashboardLayout active="logs" title="Security Logs" subtitle="Full audit trail of all proctoring events"
      actions={<button className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export logs</button>}>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[{l:"Total Events",v:summary.total,bg:"#F0EDE8",c:INK},{l:"Critical",v:summary.critical,bg:"#fff0f0",c:"#ef4444"},{l:"Unresolved",v:summary.unresolved,bg:"#fffbeb",c:"#d97706"},{l:"Auto-submitted",v:summary.autoSubmit,bg:"#f5f3ff",c:"#7c3aed"}].map(({l,v,bg,c})=>(
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-black" style={{ fontFamily:U, color:c }}>{v}</p>
            <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={sevFilter} onChange={e=>setSevFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-white focus:outline-none" style={{ fontFamily:I }}>
          <option value="all">All severity</option>
          <option value="warn">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <select value={examFilter} onChange={e=>setExamFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-white focus:outline-none" style={{ fontFamily:I }}>
          <option value="all">All exams</option>
          {uniqueExams.map(e=><option key={e} value={e}>{e}</option>)}
        </select>
        <select value={resolvedFilter} onChange={e=>setResolvedFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-white focus:outline-none" style={{ fontFamily:I }}>
          <option value="all">All status</option>
          <option value="resolved">Resolved</option>
          <option value="unresolved">Unresolved</option>
        </select>
        <p className="text-xs text-gray-400 flex items-center" style={{ fontFamily:I }}>{filtered.length} event{filtered.length!==1?"s":""}</p>
      </div>

      {/* Logs table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Timestamp","Student","Exam","Event","Severity","Action Taken","Status"].map(h=>(
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(log=>(
              <>
                <tr key={log.id} onClick={()=>setExpanded(expanded===log.id?null:log.id)} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5 text-xs font-mono text-gray-500 whitespace-nowrap">{log.ts}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ background:CAMEL, fontFamily:U }}>{log.student.split(" ").map(w=>w[0]).join("")}</div>
                      <span className="font-semibold text-gray-800 text-xs whitespace-nowrap" style={{ fontFamily:U }}>{log.student}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap" style={{ fontFamily:I }}>{log.exam}</td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-gray-700 whitespace-nowrap" style={{ fontFamily:U }}>{log.event}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${sevColor[log.severity]||"text-gray-500 bg-gray-100"}`} style={{ fontFamily:U }}>{log.severity}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap" style={{ fontFamily:I }}>{log.action}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${log.resolved?"bg-green-50 text-green-700":"bg-amber-50 text-amber-700"}`} style={{ fontFamily:U }}>{log.resolved?"Resolved":"Open"}</span>
                  </td>
                </tr>
                {expanded===log.id&&(
                  <tr key={`${log.id}-exp`} className="bg-gray-50 border-b border-gray-100">
                    <td colSpan={7} className="px-5 py-4">
                      <div className="flex items-start gap-6">
                        <div className="flex-1">
                          <p className="text-xs font-black text-gray-700 mb-2" style={{ fontFamily:U }}>Event Details</p>
                          <p className="text-xs text-gray-600 leading-relaxed" style={{ fontFamily:I }}>
                            {log.event} detected for <strong>{log.student}</strong> during <em>{log.exam}</em> at {log.ts.split(" ")[1]}. System automatically took action: <strong>{log.action}</strong>.
                            {log.severity==="critical"?" This is a high-priority flag requiring manual review.":" This was a warning-level event."}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {!log.resolved&&<button className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600" style={{ fontFamily:U }}>Mark resolved</button>}
                          <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white" style={{ fontFamily:U }}>View session</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length===0&&(
              <tr><td colSpan={7} className="px-5 py-20 text-center"><p className="text-sm text-gray-400" style={{ fontFamily:U }}>No logs match your filters</p></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLABORATION — INVITE
// ═══════════════════════════════════════════════════════════════════════════════
const ROLES = [
  { id:"owner",       label:"Owner",       icon:Crown,      color:"#d97706", bg:"#fffbeb", desc:"Full access. Can delete exam and manage all roles." },
  { id:"collaborator",label:"Collaborator",icon:UserCheck,  color:"#2563eb", bg:"#eff6ff", desc:"Can edit exam content, questions, and settings." },
  { id:"invigilator", label:"Invigilator", icon:ShieldCheck,color:"#16a34a", bg:"#f0fdf4", desc:"Can monitor live sessions and view results only." },
];

function InviteCollaborators() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("collaborator");
  const [examId, setExamId] = useState("1");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);

  const send = ()=>{
    if(!email.trim()) return;
    setSending(true);
    setTimeout(()=>{ setSent(p=>[...p,`${email} (${role})`]); setEmail(""); setSending(false); },700);
  };

  const copyLink = ()=>{ setLinkCopied(true); setTimeout(()=>setLinkCopied(false),2000); };

  const selectedRole = ROLES.find(r=>r.id===role)!;

  return (
    <DashboardLayout active="collab-invite" title="Invite Collaborators" subtitle="Add co-teachers or invigilators to your exams"
      actions={<button onClick={()=>navigate("/dashboard/collaboration/manage")} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}>Manage roles →</button>}>

      <div className="max-w-2xl space-y-5">
        {/* Exam selector */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Invite to exam</p>
          <select value={examId} onChange={e=>setExamId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}>
            {MOCK_EXAMS.filter(e=>e.status!=="archived").map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>

        {/* Role picker */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4" style={{ fontFamily:U }}>Role</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {ROLES.map(r=>{
              const Icon = r.icon;
              const active = role===r.id;
              return (
                <button key={r.id} onClick={()=>setRole(r.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${active?"border-transparent shadow-sm":"border-gray-100 hover:border-gray-200"}`}
                  style={{ background:active?r.bg:undefined }}>
                  <Icon size={20} style={{ color:active?r.color:"#9ca3af" }}/>
                  <p className={`text-xs font-black ${active?"":"text-gray-400"}`} style={{ fontFamily:U, color:active?r.color:undefined }}>{r.label}</p>
                </button>
              );
            })}
          </div>
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl" style={{ background:selectedRole.bg }}>
            <selectedRole.icon size={14} style={{ color:selectedRole.color, marginTop:1, flexShrink:0 }}/>
            <p className="text-xs text-gray-600 leading-relaxed" style={{ fontFamily:I }}>{selectedRole.desc}</p>
          </div>
        </div>

        {/* Email input */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4" style={{ fontFamily:U }}>Invite by email</p>
          <div className="flex gap-2">
            <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
              type="email" placeholder="colleague@school.edu"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-gray-400 placeholder:text-gray-400" style={{ fontFamily:I }}/>
            <button onClick={send} disabled={!email.trim()||sending}
              className="flex items-center gap-2 text-white text-sm font-bold px-5 py-3 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all" style={{ background:INK, fontFamily:U }}>
              {sending?<RefreshCw size={14} className="animate-spin"/>:<UserPlus size={14}/>}
              {sending?"Sending…":"Send invite"}
            </button>
          </div>

          {/* Sent list */}
          {sent.length>0&&(
            <div className="mt-4 space-y-2">
              {sent.map((s,i)=>(
                <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 bg-green-50 rounded-xl border border-green-100">
                  <CheckCircle2 size={14} className="text-green-500 flex-shrink-0"/>
                  <p className="text-xs text-green-700 flex-1" style={{ fontFamily:I }}>Invite sent to <strong>{s}</strong></p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite link */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Or share an invite link</p>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 mb-3">
            <Link size={13} className="text-gray-400 flex-shrink-0"/>
            <span className="flex-1 text-xs text-gray-600 truncate font-mono">https://examai.app/invite/{MOCK_EXAMS.find(e=>e.id===examId)?.code?.toLowerCase()}</span>
            <button onClick={copyLink} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all" style={{ background:linkCopied?"#f0fdf4":"#F0EDE8", color:linkCopied?"#16a34a":INK, fontFamily:U }}>
              {linkCopied?<><Check size={11}/>Copied</>:<><Copy size={11}/>Copy</>}
            </button>
          </div>
          <p className="text-[11px] text-gray-400" style={{ fontFamily:I }}>Link expires after 7 days. Anyone with this link gets <strong>{role}</strong> access to the selected exam.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLABORATION — MANAGE ROLES
// ═══════════════════════════════════════════════════════════════════════════════
const MOCK_COLLABS = [
  { name:"Sarah Connor",  email:"s.connor@school.edu", role:"collaborator", exam:"All exams",        avatar:"SC", joined:"Jul 1, 2026",  status:"active" },
  { name:"David Nguyen",  email:"d.nguyen@school.edu", role:"invigilator",  exam:"Biology Mid-term", avatar:"DN", joined:"Jul 5, 2026",  status:"active" },
  { name:"Priya Sharma",  email:"p.sharma@school.edu", role:"invigilator",  exam:"Calculus Final",   avatar:"PS", joined:"Jul 8, 2026",  status:"pending"},
  { name:"Marcus Bell",   email:"m.bell@school.edu",   role:"collaborator", exam:"All exams",        avatar:"MB", joined:"Jun 28, 2026", status:"active" },
];

function ManageCollaborators() {
  const navigate = useNavigate();
  const [collabs, setCollabs] = useState(MOCK_COLLABS);
  const [removing, setRemoving] = useState<string|null>(null);

  const changeRole = (email:string, newRole:string)=>setCollabs(p=>p.map(c=>c.email===email?{...c,role:newRole}:c));
  const remove = (email:string)=>{
    setRemoving(email);
    setTimeout(()=>{ setCollabs(p=>p.filter(c=>c.email!==email)); setRemoving(null); },600);
  };

  const roleStyle = (r:string)=>({
    owner:       { color:"#d97706", bg:"#fffbeb" },
    collaborator:{ color:"#2563eb", bg:"#eff6ff" },
    invigilator: { color:"#16a34a", bg:"#f0fdf4" },
  }[r]||{ color:"#6b7280", bg:"#f9fafb" });

  return (
    <DashboardLayout active="collab-manage" title="Manage Collaborators" subtitle="Control who can access and edit your exams"
      actions={<button onClick={()=>navigate("/dashboard/collaboration")} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><UserPlus size={13}/>Invite more</button>}>

      {/* Role permission table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5 max-w-3xl">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Permissions by role</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-gray-100">{["Permission","Owner","Collaborator","Invigilator"].map(h=><th key={h} className="px-5 py-3 text-left font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                ["Edit exam content",   true,  true,  false],
                ["Manage questions",    true,  true,  false],
                ["Change settings",     true,  true,  false],
                ["Share / publish",     true,  false, false],
                ["Monitor live session",true,  true,  true ],
                ["View results",        true,  true,  true ],
                ["Export grades",       true,  true,  false],
                ["Delete exam",         true,  false, false],
                ["Manage collaborators",true,  false, false],
              ].map(([perm,...vals])=>(
                <tr key={String(perm)} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 text-gray-600" style={{ fontFamily:I }}>{perm}</td>
                  {(vals as boolean[]).map((v,i)=>(
                    <td key={i} className="px-5 py-3">
                      {v?<CheckCircle2 size={15} className="text-green-500"/>:<div className="w-4 h-px bg-gray-200 ml-1"/>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collaborator list */}
      <div className="max-w-3xl space-y-2">
        <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>{collabs.length} collaborators</p>
        {collabs.map(c=>{
          const rs = roleStyle(c.role);
          const isRemoving = removing===c.email;
          return (
            <div key={c.email} className={`bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 transition-all ${isRemoving?"opacity-30 scale-95":""}`}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background:CAMEL, fontFamily:U }}>{c.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-800 truncate" style={{ fontFamily:U }}>{c.name}</p>
                  {c.status==="pending"&&<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600" style={{ fontFamily:U }}>Pending</span>}
                </div>
                <p className="text-xs text-gray-400 truncate" style={{ fontFamily:I }}>{c.email} · {c.exam} · Joined {c.joined}</p>
              </div>
              {/* Role selector */}
              <select value={c.role} onChange={e=>changeRole(c.email,e.target.value)}
                className="text-xs font-bold border rounded-xl px-3 py-2 focus:outline-none cursor-pointer" style={{ color:rs.color, background:rs.bg, borderColor:`${rs.color}30`, fontFamily:U }}>
                <option value="owner">Owner</option>
                <option value="collaborator">Collaborator</option>
                <option value="invigilator">Invigilator</option>
              </select>
              <button onClick={()=>remove(c.email)} disabled={isRemoving} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Remove">
                <UserX size={15}/>
              </button>
            </div>
          );
        })}
        {collabs.length===0&&(
          <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3">
            <Users size={32} className="text-gray-200"/>
            <p className="text-sm text-gray-400" style={{ fontFamily:U }}>No collaborators yet</p>
            <button onClick={()=>navigate("/dashboard/collaboration")} className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background:INK, fontFamily:U }}>Invite someone</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED: REPORT EXPORT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function ReportExportModal({ title, onClose }: { title:string; onClose:()=>void }) {
  const [fmt, setFmt] = useState("pdf");
  const [exporting, setExporting] = useState(false);
  const go = ()=>{ setExporting(true); setTimeout(()=>{ setExporting(false); onClose(); },900); };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background:"rgba(13,27,42,0.55)", backdropFilter:"blur(8px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="h-1 w-full" style={{ background:`linear-gradient(90deg,${INK},${CAMEL})` }}/>
        <div className="p-7">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-black" style={{ fontFamily:U, color:INK }}>Export: {title}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><X size={15}/></button>
          </div>
          <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Format</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[{id:"pdf",label:"PDF"},{id:"xlsx",label:"Excel"},{id:"csv",label:"CSV"}].map(f=>(
              <button key={f.id} onClick={()=>setFmt(f.id)} className="py-2.5 rounded-xl border text-xs font-bold transition-all" style={{ background:fmt===f.id?INK:undefined, color:fmt===f.id?"white":"#6b7280", borderColor:fmt===f.id?"transparent":"#e5e7eb", fontFamily:U }}>{f.label}</button>
            ))}
          </div>
          <button onClick={go} disabled={exporting} className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-50" style={{ background:INK, fontFamily:U }}>
            {exporting?<><RefreshCw size={14} className="animate-spin"/>Exporting…</>:<><Download size={14}/>Download .{fmt}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS — DASHBOARD OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
const REPORT_CARDS = [
  { id:"scores",    label:"Scores Report",           desc:"Per-student scores, grades, and rank across all exams.", icon:Award,        color:"#2563eb", bg:"#eff6ff", path:"/dashboard/reports/scores" },
  { id:"attend",    label:"Attendance Report",        desc:"Who joined, who was absent, and submission rates.",      icon:UserCheck,    color:"#16a34a", bg:"#f0fdf4", path:"/dashboard/reports/attendance" },
  { id:"anticheat", label:"Anti-Cheating Report",     desc:"Flag summary, severity breakdown, resolved events.",    icon:ShieldCheck,  color:"#ef4444", bg:"#fff0f0", path:"/dashboard/reports/anticheat" },
  { id:"qana",      label:"Question Analysis Report", desc:"Item difficulty, discrimination, and common errors.",   icon:FileBarChart, color:"#d97706", bg:"#fffbeb", path:"/dashboard/reports/questions" },
];

function ReportsDashboard() {
  const navigate = useNavigate();
  const [showExport, setShowExport] = useState(false);

  return (
    <DashboardLayout active="reports" title="Reports" subtitle="Insights across all your exams"
      actions={<button onClick={()=>setShowExport(true)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export all</button>}>
      {showExport&&<ReportExportModal title="All Reports" onClose={()=>setShowExport(false)}/>}

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { l:"Total Exams",    v:"6",    icon:FileText,   bg:"#F0EDE8" },
          { l:"Students tested",v:"103",  icon:Users,      bg:"#eff6ff" },
          { l:"Avg pass rate",  v:"79%",  icon:TrendingUp, bg:"#f0fdf4" },
          { l:"Flags logged",   v:"8",    icon:ShieldAlert,bg:"#fff0f0" },
        ].map(({l,v,icon:Icon,bg})=>(
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:bg }}><Icon size={17} style={{ color:INK }}/></div>
            <div><p className="text-xl font-black leading-none" style={{ fontFamily:U, color:INK }}>{v}</p><p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p></div>
          </div>
        ))}
      </div>

      {/* Report cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {REPORT_CARDS.map(r=>{
          const Icon = r.icon;
          return (
            <div key={r.id} onClick={()=>navigate(r.path)}
              className="bg-white rounded-2xl border border-gray-100 p-6 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:r.bg }}>
                  <Icon size={20} style={{ color:r.color }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-800 mb-1" style={{ fontFamily:U }}>{r.label}</p>
                  <p className="text-xs text-gray-500 leading-relaxed" style={{ fontFamily:I }}>{r.desc}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5"/>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS — STUDENT SCORES
// ═══════════════════════════════════════════════════════════════════════════════
const SCORES_DATA = [
  { name:"Alice Mills",  score:88, grade:"A", rank:2,  exams:3, avg:84, highest:92, pass:true  },
  { name:"James Wang",   score:92, grade:"A", rank:1,  exams:3, avg:89, highest:95, pass:true  },
  { name:"Sara Jones",   score:71, grade:"B", rank:5,  exams:3, avg:68, highest:74, pass:true  },
  { name:"Mike Park",    score:83, grade:"A", rank:3,  exams:2, avg:80, highest:85, pass:true  },
  { name:"Lucy Kim",     score:67, grade:"C", rank:7,  exams:3, avg:63, highest:70, pass:true  },
  { name:"Owen Bell",    score:76, grade:"B", rank:4,  exams:2, avg:73, highest:78, pass:true  },
  { name:"Tom Reed",     score:45, grade:"F", rank:9,  exams:3, avg:44, highest:50, pass:false },
  { name:"Amy Nguyen",   score:70, grade:"C", rank:6,  exams:2, avg:68, highest:72, pass:true  },
  { name:"Helen Lee",    score:62, grade:"C", rank:8,  exams:2, avg:60, highest:65, pass:true  },
];

function ScoresReport() {
  const [showExport, setShowExport] = useState(false);
  const [sort, setSort] = useState<"rank"|"score"|"name">("rank");
  const sorted = [...SCORES_DATA].sort((a,b)=>sort==="name"?a.name.localeCompare(b.name):sort==="score"?b.score-a.score:a.rank-b.rank);
  const scoreColor = (s:number)=>s>=80?"#16a34a":s>=60?"#d97706":"#ef4444";

  return (
    <DashboardLayout active="reports-scores" title="Scores Report" subtitle="Per-student grades and ranking"
      actions={<>
        <button onClick={()=>setShowExport(true)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export</button>
      </>}>
      {showExport&&<ReportExportModal title="Scores Report" onClose={()=>setShowExport(false)}/>}

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[{l:"Class average",v:"72.7%",c:"#2563eb"},{l:"Pass rate",v:"88.9%",c:"#16a34a"},{l:"Top scorer",v:"James Wang · 92%",c:INK}].map(({l,v,c})=>(
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-lg font-black truncate" style={{ fontFamily:U, color:c }}>{v}</p>
            <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p>
          </div>
        ))}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-400" style={{ fontFamily:I }}>Sort by:</span>
        {(["rank","score","name"] as const).map(s=>(
          <button key={s} onClick={()=>setSort(s)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all capitalize" style={{ background:sort===s?INK:undefined, color:sort===s?"white":"#6b7280", borderColor:sort===s?"transparent":"#e5e7eb", fontFamily:U }}>{s}</button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">{["Rank","Student","Latest Score","Grade","Exams Taken","Session Avg","Highest","Status"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
          <tbody>
            {sorted.map(s=>(
              <tr key={s.name} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors">
                <td className="px-5 py-3.5"><span className="w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center" style={{ background:s.rank<=3?"#fffbeb":s.rank<=6?"#f9fafb":"#fafafa", color:s.rank<=3?CAMEL:INK, fontFamily:U, display:"inline-flex" }}>#{s.rank}</span></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background:CAMEL, fontFamily:U }}>{s.name.split(" ").map(w=>w[0]).join("")}</div>
                    <span className="font-semibold text-gray-800 whitespace-nowrap" style={{ fontFamily:U }}>{s.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2"><div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width:`${s.score}%`, background:scoreColor(s.score) }}/></div><span className="font-black text-sm" style={{ fontFamily:U, color:scoreColor(s.score) }}>{s.score}%</span></div>
                </td>
                <td className="px-5 py-3.5"><span className={`font-black text-sm ${s.grade==="A"?"text-green-600":s.grade==="B"?"text-blue-600":s.grade==="C"?"text-amber-600":"text-red-600"}`} style={{ fontFamily:U }}>{s.grade}</span></td>
                <td className="px-5 py-3.5 text-sm text-gray-600" style={{ fontFamily:I }}>{s.exams}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600" style={{ fontFamily:I }}>{s.avg}%</td>
                <td className="px-5 py-3.5 text-sm text-gray-600" style={{ fontFamily:I }}>{s.highest}%</td>
                <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.pass?"bg-green-50 text-green-700":"bg-red-50 text-red-600"}`} style={{ fontFamily:U }}>{s.pass?"Pass":"Fail"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS — ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════════
const ATTEND_DATA = [
  { exam:"Calculus Final Exam",      date:"Jul 10",  enrolled:36, joined:34, absent:2,  submitted:32, lateStart:3  },
  { exam:"Biology Mid-term",         date:"Jul 13",  enrolled:30, joined:28, absent:2,  submitted:28, lateStart:1  },
  { exam:"English Comprehension",    date:"Jul 15",  enrolled:30, joined:0,  absent:30, submitted:0,  lateStart:0  },
  { exam:"Physics Quiz",             date:"Jul 8",   enrolled:24, joined:22, absent:2,  submitted:22, lateStart:2  },
  { exam:"History Essay Assessment", date:"Jun 20",  enrolled:22, joined:19, absent:3,  submitted:19, lateStart:0  },
];

function AttendanceReport() {
  const [showExport, setShowExport] = useState(false);
  return (
    <DashboardLayout active="reports-attend" title="Attendance Report" subtitle="Participation and submission rates by exam"
      actions={<button onClick={()=>setShowExport(true)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export</button>}>
      {showExport&&<ReportExportModal title="Attendance Report" onClose={()=>setShowExport(false)}/>}

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[{l:"Total enrolled",v:"142",bg:"#F0EDE8"},{l:"Avg attendance",v:"82%",bg:"#f0fdf4"},{l:"Total absent",v:"39",bg:"#fff0f0"},{l:"Submission rate",v:"89%",bg:"#eff6ff"}].map(({l,v,bg})=>(
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xl font-black" style={{ fontFamily:U, color:INK }}>{v}</p>
            <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">{["Exam","Date","Enrolled","Joined","Absent","Submitted","Late Start","Attendance"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
          <tbody>
            {ATTEND_DATA.map(r=>{
              const pct = r.enrolled>0?Math.round(r.joined/r.enrolled*100):0;
              return (
                <tr key={r.exam} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap max-w-[200px] truncate" style={{ fontFamily:U }}>{r.exam}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap" style={{ fontFamily:I }}>{r.date}</td>
                  <td className="px-5 py-3.5 text-gray-700" style={{ fontFamily:I }}>{r.enrolled}</td>
                  <td className="px-5 py-3.5 text-green-600 font-semibold" style={{ fontFamily:U }}>{r.joined}</td>
                  <td className="px-5 py-3.5 text-red-500 font-semibold" style={{ fontFamily:U }}>{r.absent}</td>
                  <td className="px-5 py-3.5 text-gray-700" style={{ fontFamily:I }}>{r.submitted}</td>
                  <td className="px-5 py-3.5 text-gray-700" style={{ fontFamily:I }}>{r.lateStart}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width:`${pct}%`, background:pct>=80?"#22c55e":pct>=60?"#f59e0b":"#ef4444" }}/></div>
                      <span className="text-xs font-black" style={{ fontFamily:U, color:pct>=80?"#16a34a":pct>=60?"#d97706":"#ef4444" }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS — ANTI-CHEATING REPORT
// ═══════════════════════════════════════════════════════════════════════════════
const ANTICHEAT_SUMMARY = [
  { exam:"Calculus Final Exam",  date:"Jul 10", students:34, flags:3, critical:1, autoSubmit:1, resolved:3 },
  { exam:"Biology Mid-term",     date:"Jul 13", students:28, flags:4, critical:2, autoSubmit:0, resolved:1 },
  { exam:"Physics Quiz",         date:"Jul 8",  students:22, flags:1, critical:0, autoSubmit:0, resolved:1 },
  { exam:"History Essay",        date:"Jun 20", students:19, flags:0, critical:0, autoSubmit:0, resolved:0 },
];

const ANTICHEAT_EVENTS = [
  { type:"Tab switch",          count:4, pct:50 },
  { type:"Face not detected",   count:2, pct:25 },
  { type:"Copy-paste attempt",  count:1, pct:12.5 },
  { type:"Multiple faces",      count:1, pct:12.5 },
];

function AntiCheatReport() {
  const navigate = useNavigate();
  const [showExport, setShowExport] = useState(false);

  return (
    <DashboardLayout active="reports-cheat" title="Anti-Cheating Report" subtitle="Flag summary across all proctored exams"
      actions={<>
        <button onClick={()=>navigate("/dashboard/monitoring/logs")} className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}>Full logs →</button>
        <button onClick={()=>setShowExport(true)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export</button>
      </>}>
      {showExport&&<ReportExportModal title="Anti-Cheating Report" onClose={()=>setShowExport(false)}/>}

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[{l:"Total flags",v:"8",bg:"#fff0f0",c:"#ef4444"},{l:"Critical",v:"3",bg:"#fdf4ff",c:"#7c3aed"},{l:"Auto-submitted",v:"1",bg:"#fff7ed",c:"#d97706"},{l:"Resolved",v:"5",bg:"#f0fdf4",c:"#16a34a"}].map(({l,v,bg,c})=>(
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-black" style={{ fontFamily:U, color:c }}>{v}</p>
            <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{l}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5 mb-5">
        {/* Per-exam table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100"><p className="text-sm font-black" style={{ fontFamily:U, color:INK }}>By exam</p></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">{["Exam","Date","Students","Total flags","Critical","Auto-submit","Resolved"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
            <tbody>
              {ANTICHEAT_SUMMARY.map(r=>(
                <tr key={r.exam} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                  <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap" style={{ fontFamily:U }}>{r.exam}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap" style={{ fontFamily:I }}>{r.date}</td>
                  <td className="px-5 py-3.5 text-gray-600" style={{ fontFamily:I }}>{r.students}</td>
                  <td className="px-5 py-3.5"><span className={`font-black text-sm ${r.flags>0?"text-red-500":"text-gray-300"}`} style={{ fontFamily:U }}>{r.flags}</span></td>
                  <td className="px-5 py-3.5"><span className={`font-black text-sm ${r.critical>0?"text-purple-600":"text-gray-300"}`} style={{ fontFamily:U }}>{r.critical}</span></td>
                  <td className="px-5 py-3.5"><span className={`font-black text-sm ${r.autoSubmit>0?"text-amber-600":"text-gray-300"}`} style={{ fontFamily:U }}>{r.autoSubmit}</span></td>
                  <td className="px-5 py-3.5"><span className="text-green-600 font-semibold text-sm" style={{ fontFamily:U }}>{r.resolved}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Event breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Event types</p>
          <div className="space-y-3">
            {ANTICHEAT_EVENTS.map(e=>(
              <div key={e.type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700" style={{ fontFamily:U }}>{e.type}</span>
                  <span className="text-xs font-black" style={{ fontFamily:U, color:INK }}>{e.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width:`${e.pct}%`, background:CAMEL }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS — QUESTION ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════
const Q_ANALYSIS = [
  { exam:"Calculus Final",  q:1,  topic:"Chain Rule",             type:"MCQ",   avg:7.8, pass:88, disc:0.62, flag:false },
  { exam:"Calculus Final",  q:2,  topic:"Integration basics",     type:"MCQ",   avg:8.2, pass:91, disc:0.54, flag:false },
  { exam:"Calculus Final",  q:3,  topic:"Fundamental theorem",    type:"Short", avg:6.5, pass:72, disc:0.71, flag:false },
  { exam:"Calculus Final",  q:6,  topic:"Applications (Essay)",   type:"Essay", avg:6.1, pass:68, disc:0.55, flag:true  },
  { exam:"Biology Mid-term",q:1,  topic:"Cell structure",         type:"MCQ",   avg:7.2, pass:80, disc:0.48, flag:false },
  { exam:"Biology Mid-term",q:3,  topic:"Mitosis vs Meiosis",     type:"MCQ",   avg:5.8, pass:60, disc:0.77, flag:true  },
  { exam:"Biology Mid-term",q:5,  topic:"Enzyme kinetics",        type:"Short", avg:6.9, pass:74, disc:0.60, flag:false },
  { exam:"Physics Quiz",    q:2,  topic:"Newton's laws",          type:"MCQ",   avg:8.5, pass:92, disc:0.42, flag:false },
  { exam:"Physics Quiz",    q:4,  topic:"Wave interference",      type:"MCQ",   avg:5.4, pass:55, disc:0.81, flag:true  },
];

function QuestionAnalysisReport() {
  const [showExport, setShowExport] = useState(false);
  const [examFilter, setExamFilter] = useState("all");
  const [flagOnly, setFlagOnly] = useState(false);

  const filtered = Q_ANALYSIS.filter(q=>{
    const mExam = examFilter==="all"||q.exam===examFilter;
    const mFlag = !flagOnly||q.flag;
    return mExam&&mFlag;
  });

  const uniqueExams = [...new Set(Q_ANALYSIS.map(q=>q.exam))];

  const discColor = (d:number)=>d>=0.70?"text-amber-600":d>=0.40?"text-green-600":"text-gray-400";
  const diffLabel = (avg:number)=>avg>=8?"Easy":avg>=6?"Medium":"Hard";
  const diffStyle = (avg:number)=>avg>=8?"bg-green-50 text-green-600":avg>=6?"bg-amber-50 text-amber-600":"bg-red-50 text-red-600";

  return (
    <DashboardLayout active="reports-qana" title="Question Analysis" subtitle="Item difficulty and discrimination index by exam"
      actions={<button onClick={()=>setShowExport(true)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><Download size={13}/>Export</button>}>
      {showExport&&<ReportExportModal title="Question Analysis" onClose={()=>setShowExport(false)}/>}

      {/* Legend */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3.5 mb-5 flex flex-wrap gap-4">
        <div><p className="text-xs font-black text-blue-800" style={{ fontFamily:U }}>Pass rate</p><p className="text-[11px] text-blue-600" style={{ fontFamily:I }}>% of students who scored &gt; 50% on this item</p></div>
        <div><p className="text-xs font-black text-blue-800" style={{ fontFamily:U }}>Discrimination index</p><p className="text-[11px] text-blue-600" style={{ fontFamily:I }}>How well the question separates strong from weak students (0–1). &gt;0.7 = may be too tricky.</p></div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={examFilter} onChange={e=>setExamFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-white focus:outline-none" style={{ fontFamily:I }}>
          <option value="all">All exams</option>
          {uniqueExams.map(e=><option key={e} value={e}>{e}</option>)}
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <div onClick={()=>setFlagOnly(f=>!f)} className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${flagOnly?"border-transparent":"border-gray-300"}`} style={{ background:flagOnly?INK:undefined }}>
            {flagOnly&&<Check size={10} className="text-white"/>}
          </div>
          <span className="text-xs text-gray-600" style={{ fontFamily:I }}>Flagged items only ({Q_ANALYSIS.filter(q=>q.flag).length})</span>
        </label>
        <p className="text-xs text-gray-400 ml-auto" style={{ fontFamily:I }}>{filtered.length} items</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">{["Exam","Q#","Topic","Type","Avg Score","Pass Rate","Disc. Index","Difficulty","Flag"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((q,i)=>(
              <tr key={i} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors ${q.flag?"bg-amber-50/30":""}`}>
                <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap" style={{ fontFamily:I }}>{q.exam}</td>
                <td className="px-5 py-3.5"><span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background:"#F0EDE8", color:INK, fontFamily:U, display:"inline-flex" }}>Q{q.q}</span></td>
                <td className="px-5 py-3.5 text-gray-700 font-medium whitespace-nowrap" style={{ fontFamily:I }}>{q.topic}</td>
                <td className="px-5 py-3.5"><span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full" style={{ fontFamily:U }}>{q.type}</span></td>
                <td className="px-5 py-3.5 font-black text-sm" style={{ fontFamily:U, color:q.avg>=8?"#16a34a":q.avg>=6?"#d97706":"#ef4444" }}>{q.avg}/10</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2"><div className="h-1.5 w-14 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-green-500" style={{ width:`${q.pass}%` }}/></div><span className="text-xs font-semibold" style={{ fontFamily:U }}>{q.pass}%</span></div>
                </td>
                <td className="px-5 py-3.5"><span className={`text-xs font-black ${discColor(q.disc)}`} style={{ fontFamily:U }}>{q.disc.toFixed(2)}</span></td>
                <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${diffStyle(q.avg)}`} style={{ fontFamily:U }}>{diffLabel(q.avg)}</span></td>
                <td className="px-5 py-3.5">{q.flag&&<AlertTriangle size={14} className="text-amber-500"/>}</td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={9} className="px-5 py-16 text-center text-sm text-gray-400" style={{ fontFamily:U }}>No items match filters</td></tr>}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT — EXAM ENTRY SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
const VALID_CODES = MOCK_EXAMS.filter(e=>e.status==="published").map(e=>e.code.toUpperCase());

function ExamEntry() {
  const navigate = useNavigate();
  // useSearchParams-equivalent: read ?via= and ?code= from URL for magic link / QR landing
  const raw = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const viaLink  = raw?.get("via") ?? null;   // "magic" | "qr"
  const preCode  = (raw?.get("code") ?? "").toUpperCase();

  const [code, setCode]       = useState(preCode);
  const [checking, setChecking] = useState(false);
  const [shake, setShake]     = useState(false);

  // Auto-submit when arriving via magic link / QR with a pre-filled code
  const [autoChecked, setAutoChecked] = useState(false);
  if (viaLink && preCode && !autoChecked && !checking) {
    setAutoChecked(true);
    setChecking(true);
    setTimeout(()=>{
      setChecking(false);
      if (preCode.length >= 3) {
        navigate(`/student/instructions?code=${preCode}`);
      } else navigate("/student/invalid?reason=expired");
    }, 1200);
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const upper = code.trim().toUpperCase();
    if (!upper) return;
    setChecking(true);
    setTimeout(()=>{
      setChecking(false);
      if (upper.length >= 3) {
        navigate(`/student/instructions?code=${upper}`);
      } else { setShake(true); setTimeout(()=>setShake(false),600); }
    }, 900);
  };

  // Format input as XXXX-XXXX-XX style (auto-insert dashes)
  const handleCode = (v: string) => {
    const clean = v.replace(/[^A-Za-z0-9]/g,"").toUpperCase();
    setCode(clean);
  };

  const exam = MOCK_EXAMS.find(e=>e.code.toUpperCase()===code.trim().toUpperCase());

  return (
    <div className="min-h-screen flex flex-col" style={{ background:CREAM }}>
      {/* Minimal header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:INK }}><GraduationCap size={15} className="text-white"/></div>
          <span className="text-base font-black" style={{ fontFamily:U, color:INK }}>exam<span style={{ color:CAMEL }}>·ai</span></span>
        </div>
        <span className="text-xs text-gray-400 font-medium" style={{ fontFamily:I }}>Student portal</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          {/* Auto-checking state (magic link / QR arrival) */}
          {viaLink && !autoChecked ? null : viaLink && autoChecked && checking ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-10 flex flex-col items-center gap-5 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background:`${CAMEL}20` }}>
                {viaLink==="qr" ? <QrCode size={30} style={{ color:CAMEL }}/> : <Link size={30} style={{ color:CAMEL }}/>}
              </div>
              <div>
                <p className="text-xl font-black mb-1" style={{ fontFamily:U, color:INK }}>
                  {viaLink==="qr" ? "Scanning QR code…" : "Verifying magic link…"}
                </p>
                <p className="text-sm text-gray-500" style={{ fontFamily:I }}>Checking access, please wait.</p>
              </div>
              <div className="flex gap-1.5">
                {[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background:CAMEL, animationDelay:`${i*150}ms` }}/>)}
              </div>
            </div>
          ) : (
            <>
              {/* Via-link banner */}
              {viaLink && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border mb-5" style={{ background:`${CAMEL}12`, borderColor:`${CAMEL}40` }}>
                  {viaLink==="qr"?<QrCode size={16} style={{ color:CAMEL }}/>:<Link size={16} style={{ color:CAMEL }}/>}
                  <p className="text-sm font-semibold" style={{ fontFamily:U, color:CAMEL }}>
                    {viaLink==="qr" ? "Arrived via QR code" : "Arrived via magic link"} — code pre-filled below.
                  </p>
                </div>
              )}

              <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
                <div className="h-1 w-full" style={{ background:`linear-gradient(90deg,${INK},${CAMEL})` }}/>
                <div className="p-8">
                  <div className="mb-8 text-center">
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background:"#F0EDE8" }}>
                      <Hash size={26} style={{ color:INK }}/>
                    </div>
                    <h1 className="text-2xl font-black mb-1" style={{ fontFamily:U, color:INK }}>Enter exam code</h1>
                    <p className="text-sm text-gray-500" style={{ fontFamily:I }}>Type the code your teacher provided, or scan a QR code.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className={`transition-transform ${shake?"animate-[shake_0.5s_ease]":""}`}>
                      <input
                        value={code}
                        onChange={e=>handleCode(e.target.value)}
                        placeholder="e.g. CALC-2026-XZ"
                        maxLength={20}
                        autoFocus
                        className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-center text-xl font-black tracking-widest focus:outline-none focus:border-gray-900 transition-colors placeholder:text-gray-300 placeholder:font-normal placeholder:tracking-normal uppercase"
                        style={{ fontFamily:U, color:INK }}
                      />
                    </div>

                    {/* Live preview card */}
                    {exam && (
                      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border" style={{ background:"#f0fdf4", borderColor:"#bbf7d0" }}>
                        <CheckCircle2 size={16} className="text-green-500 flex-shrink-0"/>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-green-800 truncate" style={{ fontFamily:U }}>{exam.title}</p>
                          <p className="text-xs text-green-600 mt-0.5" style={{ fontFamily:I }}>{exam.subject} · {exam.duration} min · {exam.questions} questions</p>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!code.trim() || checking}
                      className="w-full flex items-center justify-center gap-2.5 text-white font-black py-4 rounded-2xl text-base hover:opacity-90 disabled:opacity-40 transition-all"
                      style={{ background:INK, fontFamily:U }}>
                      {checking
                        ? <><RefreshCw size={16} className="animate-spin"/>Checking…</>
                        : <>Join exam <ArrowRight size={16}/></>
                      }
                    </button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center gap-6">
                    <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors" style={{ fontFamily:I }}>
                      <QrCode size={14}/>Scan QR instead
                    </button>
                    <span className="text-gray-200">|</span>
                    <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors" style={{ fontFamily:I }}>
                      <Link size={14}/>Use magic link
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-gray-400 mt-5" style={{ fontFamily:I }}>
                Having trouble? Ask your teacher to resend the exam link.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Demo helper */}
      <div className="pb-8 flex justify-center">
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3.5 shadow-sm max-w-sm w-full mx-4">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2" style={{ fontFamily:U }}>Demo — valid codes</p>
          <div className="flex flex-wrap gap-2">
            {MOCK_EXAMS.filter(e=>e.status==="published").map(e=>(
              <button key={e.code} onClick={()=>{ setCode(e.code); }}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-mono tracking-wide" style={{ fontFamily:U }}>
                {e.code}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2" style={{ fontFamily:I }}>Click a code to pre-fill, then press Join exam.</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT — DESIGN TOKENS & SHARED CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const S  = "#059669";  // emerald-600
const SL = "#ecfdf5";  // emerald-50
const SM = "#6ee7b7";  // emerald-300
const WAITING_CODES = ["PHY-2026-QZ"];

// ─── Shared student header ───────────────────────────────────────────────────
function StudentHeader() {
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:INK}}>
          <GraduationCap size={15} className="text-white"/>
        </div>
        <span className="text-base font-black" style={{fontFamily:U,color:INK}}>exam<span style={{color:CAMEL}}>·ai</span></span>
      </div>
      <span className="text-xs text-gray-400 font-medium cursor-pointer hover:text-gray-600 transition-colors" style={{fontFamily:I}} onClick={()=>navigate("/student/enter")}>Student portal</span>
    </header>
  );
}

// ─── SVG illustration: instructions screen ───────────────────────────────────
function SVGInstructions() {
  return (
    <svg viewBox="0 0 360 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background blobs */}
      <circle cx="280" cy="60"  r="70" fill={SL} opacity="0.6"/>
      <circle cx="60"  cy="320" r="50" fill="#fef9ef" opacity="0.8"/>
      {/* Clipboard */}
      <rect x="100" y="80" width="160" height="200" rx="16" fill="white" stroke="#e5e7eb" strokeWidth="2"/>
      <rect x="140" y="68" width="80"  height="24"  rx="12" fill={INK}/>
      <circle cx="180" cy="68" r="6" fill="white"/>
      {/* Lines on clipboard */}
      {[110,130,150,170,190,210,230].map((y,i)=>(
        <rect key={y} x="118" y={y} width={i%3===0?124:100} height="8" rx="4" fill={i===0?S:i===1?CAMEL:"#e5e7eb"}/>
      ))}
      {/* Check badge */}
      <circle cx="240" cy="110" r="22" fill={S}/>
      <path d="M230 110 l7 7 14-14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Standing figure */}
      <circle cx="80" cy="175" r="20" fill="#f5d0a9"/>
      <path d="M55 240 Q80 210 105 240" fill="#c8a97e" stroke="none"/>
      <rect x="60" y="238" width="40" height="60" rx="8" fill={S}/>
      <line x1="60" y1="248" x2="40"  y2="300" stroke={S} strokeWidth="10" strokeLinecap="round"/>
      <line x1="100" y1="248" x2="118" y2="295" stroke={S} strokeWidth="10" strokeLinecap="round"/>
      <line x1="70" y1="298" x2="66"  y2="340" stroke={CAMEL} strokeWidth="10" strokeLinecap="round"/>
      <line x1="90" y1="298" x2="94"  y2="340" stroke={CAMEL} strokeWidth="10" strokeLinecap="round"/>
      {/* Pencil in hand */}
      <rect x="114" y="258" width="8" height="36" rx="3" fill="#fef3c7" transform="rotate(-20 118 276)"/>
      <polygon points="110,294 118,294 114,305" fill="#fcd34d"/>
      {/* Plants */}
      <ellipse cx="300" cy="340" rx="18" ry="28" fill="#bbf7d0" transform="rotate(-15 300 340)"/>
      <ellipse cx="315" cy="335" rx="15" ry="24" fill={S} opacity="0.7" transform="rotate(10 315 335)"/>
      <rect x="305" y="355" width="6" height="30" rx="3" fill="#6b7280"/>
      {/* Stars */}
      {[[310,80],[330,130],[290,200]].map(([cx,cy],i)=>(
        <text key={i} x={cx} y={cy} textAnchor="middle" fontSize="14" fill={CAMEL} opacity="0.7">★</text>
      ))}
      {/* Floating dots */}
      <circle cx="45"  cy="100" r="5" fill={SM} opacity="0.8"/>
      <circle cx="320" cy="270" r="4" fill={CAMEL} opacity="0.6"/>
      <circle cx="155" cy="370" r="6" fill={SL}/>
    </svg>
  );
}

// ─── SVG illustration: waiting lobby ─────────────────────────────────────────
function SVGWaiting() {
  return (
    <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background blobs */}
      <circle cx="340" cy="60"  r="80" fill={SL} opacity="0.5"/>
      <circle cx="60"  cy="260" r="55" fill="#fef9ef" opacity="0.7"/>
      {/* Laptop */}
      <rect x="100" y="140" width="200" height="130" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="2"/>
      <rect x="108" y="148" width="184" height="110" rx="6" fill="#f8fafc"/>
      <rect x="70"  y="268" width="260" height="14"  rx="7" fill="#e5e7eb"/>
      {/* Screen content — timer display */}
      <rect x="130" y="168" width="140" height="50" rx="8" fill={INK}/>
      <text x="200" y="200" textAnchor="middle" fontSize="22" fontWeight="bold" fill={SM} fontFamily="monospace">24:35</text>
      <rect x="138" y="228" width="40" height="8" rx="4" fill="#e2e8f0"/>
      <rect x="184" y="228" width="60" height="8" rx="4" fill={SL}/>
      <rect x="250" y="228" width="28" height="8" rx="4" fill="#e2e8f0"/>
      {/* Seated figure */}
      <circle cx="310" cy="170" r="22" fill="#f5d0a9"/>
      <path d="M288 220 Q310 200 332 220" fill={CAMEL} stroke="none"/>
      <rect x="290" y="218" width="44" height="50" rx="8" fill="#0d9488"/>
      <line x1="290" y1="228" x2="268" y2="268" stroke="#0d9488" strokeWidth="10" strokeLinecap="round"/>
      <line x1="334" y1="228" x2="356" y2="268" stroke="#0d9488" strokeWidth="10" strokeLinecap="round"/>
      <line x1="300" y1="268" x2="296" y2="305" stroke={CAMEL} strokeWidth="10" strokeLinecap="round"/>
      <line x1="320" y1="268" x2="324" y2="305" stroke={CAMEL} strokeWidth="10" strokeLinecap="round"/>
      {/* Floating clock badge */}
      <circle cx="80" cy="120" r="28" fill={INK}/>
      <circle cx="80" cy="120" r="20" fill="none" stroke={SM} strokeWidth="2"/>
      <line x1="80" y1="120" x2="80"  y2="106" stroke={SM} strokeWidth="2" strokeLinecap="round"/>
      <line x1="80" y1="120" x2="91"  y2="125" stroke={SM} strokeWidth="2" strokeLinecap="round"/>
      {/* Plants */}
      <ellipse cx="40"  cy="280" rx="16" ry="26" fill="#bbf7d0" transform="rotate(-12 40 280)"/>
      <ellipse cx="55"  cy="274" rx="14" ry="22" fill={S} opacity="0.7" transform="rotate(12 55 274)"/>
      <rect x="44"  y="295" width="6" height="28" rx="3" fill="#6b7280"/>
      {/* Floating sparkles */}
      {[[350,180],[370,230],[40,170]].map(([cx,cy],i)=>(
        <text key={i} x={cx} y={cy} textAnchor="middle" fontSize="16" fill={CAMEL} opacity="0.65">✦</text>
      ))}
      <circle cx="360" cy="100" r="5" fill={SM} opacity="0.7"/>
      <circle cx="170" cy="310" r="4" fill={CAMEL} opacity="0.5"/>
    </svg>
  );
}

// ─── B. Pre-Exam: Exam Instructions ─────────────────────────────────────────
function ExamInstructions() {
  const navigate  = useNavigate();
  const raw  = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const code = raw?.get("code") ?? "";
  const exam = MOCK_EXAMS.find(e=>e.code.toUpperCase()===code.toUpperCase()) ?? MOCK_EXAMS[0];
  const [agreed, setAgreed] = useState(false);

  const chips = [
    {icon:Clock,    label:`${exam.duration} minutes`},
    {icon:FileText, label:`${exam.questions || 12} questions`},
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
          {/* Left: illustration */}
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

          {/* Right: instructions card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1.5 w-full" style={{background:`linear-gradient(90deg,${S},${SM})`}}/>
            <div className="p-8">
              <div className="mb-6">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full" style={{background:SL,color:S,fontFamily:U}}>
                  {exam.subject}
                </span>
                <h1 className="text-2xl font-black mt-3 mb-1" style={{fontFamily:U,color:INK}}>{exam.title}</h1>
                <p className="text-sm text-gray-400" style={{fontFamily:I}}>Exam code: <span className="font-semibold text-gray-600">{code||exam.code}</span></p>
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
                disabled={!agreed}
                onClick={()=>navigate(`/student/waiting?code=${code}`)}
                className="w-full flex items-center justify-center gap-2 text-white font-black py-4 rounded-2xl text-base transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{background:S,fontFamily:U}}>
                Ready — Join Waiting Room <ArrowRight size={18}/>
              </button>
              <p className="text-center text-xs text-gray-400 mt-3" style={{fontFamily:I}}>You will enter the exam once your teacher opens the session.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── B. Pre-Exam: Waiting Lobby ──────────────────────────────────────────────
function ExamWaitingLobby() {
  const navigate = useNavigate();
  const raw  = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const code = raw?.get("code") ?? "";
  const exam = MOCK_EXAMS.find(e=>e.code.toUpperCase()===code.toUpperCase()) ?? MOCK_EXAMS[0];

  // "open" = teacher has started the exam
  const [open, setOpen] = useState(false);
  // Dot-pulse tick for the waiting animation
  const [tick, setTick] = useState(0);

  useEffect(()=>{
    const t = setInterval(()=>setTick(n=>(n+1)%3),600);
    return ()=>clearInterval(t);
  },[]);

  const tips = [
    "Find a quiet, well-lit space free from distractions.",
    "Keep water nearby — staying hydrated helps focus.",
    "Review your notes one last time if allowed.",
    "Make sure your camera and microphone work (if required).",
  ];

  return (
    <div className="min-h-screen" style={{background:CREAM}}>
      <StudentHeader/>

      {/* "Exam is open" banner */}
      {open&&(
        <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-3 text-white text-sm font-bold shadow-lg"
          style={{background:S,fontFamily:U}}>
          <span>🎉 Your teacher has started the exam!</span>
          <button onClick={()=>navigate(`/student/exam?code=${code}`)}
            className="flex items-center gap-1.5 bg-white rounded-xl px-4 py-1.5 text-sm font-black hover:opacity-90"
            style={{color:S,fontFamily:U}}>
            Enter Exam <ArrowRight size={14}/>
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-10" style={{paddingTop:open?"60px":undefined}}>
        <div className="grid lg:grid-cols-2 gap-8 items-center">

          {/* Left: illustration + tips */}
          <div className="flex flex-col items-center gap-6">
            <div className="w-full max-w-[380px] aspect-video">
              <SVGWaiting/>
            </div>
            <div className="w-full max-w-[380px] bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{fontFamily:U}}>While you wait</p>
              <div className="space-y-2.5">
                {tips.map((tip,i)=>(
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:SL}}>
                      <Check size={10} style={{color:S}}/>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed" style={{fontFamily:I}}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: status card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1.5 w-full transition-all" style={{background:open?`linear-gradient(90deg,${S},${SM})`:`linear-gradient(90deg,${INK},${S})`}}/>
            <div className="p-8">
              <div className="mb-6">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full" style={{background:open?SL:"#f3f4f6",color:open?S:"#6b7280",fontFamily:U}}>
                  {open?"Exam is open":"Waiting for teacher"}
                </span>
                <h1 className="text-2xl font-black mt-3 mb-1" style={{fontFamily:U,color:INK}}>{exam.title}</h1>
                <p className="text-sm text-gray-400" style={{fontFamily:I}}>
                  {open
                    ? "The exam session is now open. Click the button below to begin."
                    : "Your teacher hasn't opened the exam yet. You will be notified the moment it starts."}
                </p>
              </div>

              {/* Status pulse block */}
              <div className="rounded-2xl p-6 mb-5 text-center" style={{background:open?SL:INK}}>
                {open?(
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle2 size={40} style={{color:S}}/>
                    <p className="text-base font-black" style={{fontFamily:U,color:S}}>Exam is now open!</p>
                    <p className="text-xs" style={{fontFamily:I,color:"#065f46"}}>Your teacher has started the session.</p>
                  </div>
                ):(
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                      {[0,1,2].map(i=>(
                        <div key={i} className="w-3 h-3 rounded-full transition-all duration-300"
                          style={{background:tick===i?SM:"#334155",transform:tick===i?"scale(1.4)":"scale(1)"}}/>
                      ))}
                    </div>
                    <p className="text-sm font-black" style={{fontFamily:U,color:"white"}}>Waiting for teacher to open exam…</p>
                    <p className="text-xs" style={{fontFamily:I,color:SM}}>You are in the queue. Do not close this page.</p>
                  </div>
                )}
              </div>

              {/* Amber notice */}
              {!open&&(
                <div className="flex items-start gap-2.5 p-4 rounded-2xl border border-amber-100 bg-amber-50 mb-5">
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-amber-700 leading-relaxed" style={{fontFamily:I}}>
                    Please keep this page open. Your teacher controls when the exam begins. You will be admitted automatically.
                  </p>
                </div>
              )}

              {/* Main action */}
              {open?(
                <button onClick={()=>navigate(`/student/exam?code=${code}`)}
                  className="w-full flex items-center justify-center gap-2 text-white font-black py-4 rounded-2xl text-base hover:opacity-90"
                  style={{background:S,fontFamily:U}}>
                  Enter Exam Now <ArrowRight size={18}/>
                </button>
              ):(
                <div className="space-y-2">
                  {/* Demo button — simulates teacher starting the exam */}
                  <button onClick={()=>setOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed text-sm font-bold transition-all hover:bg-gray-50"
                    style={{borderColor:"#d1d5db",color:"#6b7280",fontFamily:U}}>
                    <Zap size={14}/>[Demo] Simulate teacher starting exam
                  </button>
                  <button onClick={()=>navigate(`/student/instructions?code=${code}`)}
                    className="w-full py-2.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors" style={{fontFamily:U}}>
                    ← Back to instructions
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT — INVALID / EXPIRED ACCESS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function ExamInvalid() {
  const navigate = useNavigate();
  const raw    = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const reason = raw?.get("reason") ?? "wrong";

  type ReasonKey = "wrong"|"expired"|"ended"|"notstarted"|"attempts";
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
      {/* Minimal header */}
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

              {/* Icon badge */}
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ background:
                reason==="wrong"?"#fff0f0":reason==="expired"?"#fffbeb":reason==="ended"?"#f9fafb":reason==="notstarted"?"#eff6ff":"#faf5ff"
              }}>
                {cfg.icon}
              </div>

              <h1 className="text-2xl font-black mb-3" style={{ fontFamily:U, color:INK }}>{cfg.title}</h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-2" style={{ fontFamily:I }}>{cfg.body}</p>
              <p className="text-xs text-gray-400 mb-8" style={{ fontFamily:I }}>{cfg.hint}</p>

              {/* Actions */}
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

              {/* Edge-case info for "ended" — late entry notice */}
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

              {/* Error code for debugging */}
              <p className="mt-8 text-[10px] text-gray-300 font-mono">err:{reason} · {new Date().toISOString().slice(0,16)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Temporary student lobby placeholder (next screens will replace this)
function StudentLobby() {
  const navigate = useNavigate();
  const raw  = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const code = raw?.get("code") ?? "";
  const exam = MOCK_EXAMS.find(e=>e.code.toUpperCase()===code.toUpperCase());

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background:CREAM }}>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-green-50">
          <CheckCircle2 size={30} className="text-green-500"/>
        </div>
        <h1 className="text-xl font-black mb-2" style={{ fontFamily:U, color:INK }}>Access granted!</h1>
        <p className="text-sm text-gray-500 mb-1" style={{ fontFamily:I }}>{exam?.title ?? code}</p>
        <p className="text-xs text-gray-400 mb-8" style={{ fontFamily:I }}>Student exam screens coming next…</p>
        <button onClick={()=>navigate("/student/enter")} className="text-xs font-semibold text-gray-500 underline" style={{ fontFamily:U }}>← Back to entry</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT — EXAM SESSION DATA
// ═══════════════════════════════════════════════════════════════════════════════
interface SQ { id:number; type:string; points:number; text:string; options?:string[]; pairs?:{L:string;R:string}[]; hint?:string; }

const SESSION_QS: SQ[] = [
  {id:1,  type:"mcq",       points:5,  text:"What is the derivative of sin(x)?",                                               options:["cos(x)","−cos(x)","tan(x)","−sin(x)"]},
  {id:2,  type:"truefalse", points:2,  text:"The integral of eˣ is eˣ + C."},
  {id:3,  type:"short",     points:5,  text:"State the chain rule in your own words."},
  {id:4,  type:"essay",     points:15, text:"Explain the Fundamental Theorem of Calculus and provide two real-world applications."},
  {id:5,  type:"fill",      points:3,  text:"The derivative of xⁿ is ___."},
  {id:6,  type:"matching",  points:8,  text:"Match each function to its derivative.",                                          pairs:[{L:"sin(x)",R:"cos(x)"},{L:"cos(x)",R:"−sin(x)"},{L:"eˣ",R:"eˣ"},{L:"ln(x)",R:"1/x"}]},
  {id:7,  type:"checkbox",  points:4,  text:"Which of the following are continuous at x = 0? (Select all that apply)",        options:["f(x) = x²","f(x) = 1/x","f(x) = |x|","f(x) = sin(x)","f(x) = tan(x)"]},
  {id:8,  type:"dropdown",  points:3,  text:"The second derivative test classifies a critical point as a local ___.",         options:["maximum","minimum","inflection point","saddle point"]},
  {id:9,  type:"file",      points:10, text:"Upload your handwritten proof of the limit definition of the derivative for f(x) = x²."},
  {id:10, type:"math",      points:10, text:"Evaluate: ∫(3x² + 2x − 1) dx",                                                   hint:"Apply the power rule to each term."},
  {id:11, type:"mcq",       points:5,  text:"Which rule is used to differentiate a product of two functions?",                options:["Chain rule","Product rule","Quotient rule","Power rule"]},
  {id:12, type:"short",     points:5,  text:"What is the geometric interpretation of the definite integral?"},
];

const QTLABELS: Record<string,string> = {
  mcq:"Multiple Choice", truefalse:"True / False", short:"Short Answer", essay:"Essay",
  fill:"Fill in Blank", matching:"Matching", checkbox:"Checkbox", dropdown:"Dropdown",
  file:"File Upload", math:"Math / Formula",
};
const QTCOLORS: Record<string,{bg:string;c:string}> = {
  mcq:{bg:"#eff6ff",c:"#3b82f6"}, truefalse:{bg:"#f0fdf4",c:"#22c55e"}, short:{bg:"#fefce8",c:"#ca8a04"},
  essay:{bg:"#fdf4ff",c:"#a855f7"}, fill:{bg:"#fff7ed",c:"#f97316"}, matching:{bg:"#ecfdf5",c:"#10b981"},
  checkbox:{bg:"#f0fdf4",c:"#059669"}, dropdown:{bg:"#fffbeb",c:"#d97706"}, file:{bg:"#fdf2f8",c:"#ec4899"},
  math:{bg:"#fff1f2",c:"#f43f5e"},
};
const MOCK_HISTORY = [
  {id:"h1",title:"Biology Mid-term",      subject:"Science", date:"Jul 13, 2026",score:78, grade:"B",status:"graded", duration:60},
  {id:"h2",title:"Physics Quiz",          subject:"Science", date:"Jul 8, 2026", score:91, grade:"A",status:"graded", duration:30},
  {id:"h3",title:"History Essay",         subject:"History", date:"Jun 20, 2026",score:null,grade:null,status:"pending",duration:120},
  {id:"h4",title:"English Comprehension", subject:"English", date:"Jul 15, 2026",score:85, grade:"A",status:"graded", duration:45},
];

// ─── Anti-cheat warning modal ───────────────────────────────────────────────
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

// ─── Connection lost overlay ─────────────────────────────────────────────────
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

// ─── Math / file upload flow (in-exam modal) ─────────────────────────────────
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

// ─── Question Navigator sidebar ───────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════════
// C. EXAM TAKING — MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function ExamTaking() {
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
  const acCount = useRef(0);
  const questions = SESSION_QS;
  const q = questions[Math.min(qIdx, questions.length-1)];

  // Countdown timer
  useEffect(()=>{
    if (secs<=0) return;
    const t = setInterval(()=>setSecs(s=>{ if(s<=1){clearInterval(t);navigate("/student/exam/auto-submit");return 0;} return s-1; }),1000);
    return ()=>clearInterval(t);
  },[]);

  // Anti-cheat tab-switch detection
  useEffect(()=>{
    const h=()=>{ if(document.hidden){ acCount.current++; setAntiCheat({event:"Tab switch detected — please stay on the exam page.",count:acCount.current}); } };
    document.addEventListener("visibilitychange",h);
    return ()=>document.removeEventListener("visibilitychange",h);
  },[]);

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

  // Render question content by type
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
    <div className="min-h-screen flex flex-col" style={{background:BG}}>
      {/* Modals */}
      {antiCheat&&<AntiCheatModal event={antiCheat.event} count={antiCheat.count} onClose={()=>setAntiCheat(null)}/>}
      {connLost&&<ConnectionLostOverlay onRetry={()=>setConnLost(false)}/>}
      {mathUploadQ!==null&&<MathUploadFlow questionId={mathUploadQ} onClose={()=>setMathUploadQ(null)} onUploaded={qid=>setMathUploaded(p=>({...p,[qid]:true}))}/>}

      {/* Fixed header */}
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
                <Toggle on={dark} onChange={()=>setDark(d=>!d)}/>
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

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question area */}
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
        {/* Right sidebar — desktop */}
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

      {/* Mobile nav overlay */}
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

      {/* Bottom nav bar */}
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

// ═══════════════════════════════════════════════════════════════════════════════
// D. SUBMISSION SCREENS
// ═══════════════════════════════════════════════════════════════════════════════
function ReviewSubmit() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const raw  = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const code = raw?.get("code") ?? "";
  // Mock: first 9 answered, last 3 unanswered, Q4+Q5 flagged
  const answeredIds  = [1,2,3,4,5,6,7,8,9];
  const unansweredQs = SESSION_QS.filter(q=>!answeredIds.includes(q.id));
  const flaggedQs    = SESSION_QS.filter(q=>[4,5].includes(q.id));

  return (
    <div className="min-h-screen" style={{background:CREAM}}>
      <StudentHeader/>
      {showConfirm&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{background:"rgba(0,0,0,0.62)",backdropFilter:"blur(8px)"}}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 mx-auto mb-5 flex items-center justify-center">
              <AlertTriangle size={28} className="text-amber-500"/>
            </div>
            <h3 className="text-xl font-black mb-2" style={{fontFamily:U,color:INK}}>Submit exam?</h3>
            <p className="text-sm text-gray-500 mb-6" style={{fontFamily:I}}>{unansweredQs.length>0?`You have ${unansweredQs.length} unanswered question(s). `:""}Once submitted, you cannot make changes.</p>
            <div className="space-y-2">
              <button onClick={()=>navigate("/student/exam/success")}
                className="w-full py-3.5 rounded-2xl text-white font-black text-sm hover:opacity-90" style={{background:S,fontFamily:U}}>
                Yes, submit now
              </button>
              <button onClick={()=>setShowConfirm(false)}
                className="w-full py-3 text-sm font-semibold text-gray-500 border border-gray-200 rounded-2xl hover:bg-gray-50" style={{fontFamily:U}}>
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
                  <span className="text-sm text-gray-600 truncate" style={{fontFamily:I}}>{q.text.slice(0,48)}{q.text.length>48?"…":""}</span>
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
          {SESSION_QS.map(q=>{
            const fl=flaggedQs.find(f=>f.id===q.id);
            const ans=answeredIds.includes(q.id);
            return (
              <div key={q.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 mb-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0"
                    style={{background:ans?`${S}18`:fl?"#fffbeb":"#f3f4f6",color:ans?S:fl?"#d97706":"#9ca3af",fontFamily:U,display:"inline-flex"}}>
                    Q{q.id}
                  </span>
                  <span className="text-sm text-gray-600 truncate" style={{fontFamily:I}}>{q.text.slice(0,52)}{q.text.length>52?"…":""}</span>
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

function AutoSubmitNotice() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:CREAM}}>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-10 max-w-md w-full text-center overflow-hidden relative">
        <div className="h-1.5 w-full absolute top-0 inset-x-0 rounded-t-3xl" style={{background:"linear-gradient(90deg,#f97316,#ef4444)"}}/>
        <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center mx-auto mb-6">
          <Clock size={36} className="text-orange-500"/>
        </div>
        <h1 className="text-2xl font-black mb-2" style={{fontFamily:U,color:INK}}>Time&apos;s Up!</h1>
        <p className="text-sm text-gray-500 mb-4" style={{fontFamily:I}}>Your exam has been automatically submitted because the time limit was reached.</p>
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 mb-7">
          <p className="text-xs text-orange-700" style={{fontFamily:I}}>Your answers up to this point have been saved. No further changes can be made.</p>
        </div>
        <button onClick={()=>navigate("/student/exam/success")}
          className="w-full py-3.5 rounded-2xl text-white font-black text-sm hover:opacity-90" style={{background:INK,fontFamily:U}}>
          View submission →
        </button>
      </div>
    </div>
  );
}

function SubmissionSuccess() {
  const navigate = useNavigate();
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  const dateStr = now.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:CREAM}}>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-10 max-w-md w-full text-center overflow-hidden relative">
        <div className="h-1.5 w-full absolute top-0 inset-x-0" style={{background:`linear-gradient(90deg,${S},${CAMEL})`}}/>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{background:SL}}>
          <CheckCircle2 size={48} style={{color:S}}/>
        </div>
        <h1 className="text-3xl font-black mb-2" style={{fontFamily:U,color:INK}}>Submitted!</h1>
        <p className="text-sm text-gray-500 mb-7" style={{fontFamily:I}}>Your exam has been received. Good luck with your results!</p>
        <div className="bg-gray-50 rounded-2xl p-5 mb-7 text-left space-y-3">
          {[{l:"Exam",v:"Calculus Final Exam"},{l:"Submitted at",v:`${timeStr} · ${dateStr}`},{l:"Questions answered",v:"9 / 12"},{l:"Time used",v:"56 min 18 sec"},{l:"Status",v:"Under review"}].map(({l,v})=>(
            <div key={l} className="flex items-center justify-between">
              <span className="text-xs text-gray-400" style={{fontFamily:I}}>{l}</span>
              <span className="text-xs font-bold text-gray-700" style={{fontFamily:U}}>{v}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <button onClick={()=>navigate("/student/results")}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm hover:opacity-90" style={{background:S,fontFamily:U}}>
            View results
          </button>
          <button onClick={()=>navigate("/student/history")}
            className="w-full py-3 text-sm font-semibold text-gray-500 border border-gray-200 rounded-2xl hover:bg-gray-50" style={{fontFamily:U}}>
            Exam history
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// E. POST-EXAM SCREENS
// ═══════════════════════════════════════════════════════════════════════════════
function InstantResults() {
  const navigate = useNavigate();
  const autoTypes = ["mcq","truefalse","checkbox","dropdown","matching"];
  const autoQs    = SESSION_QS.filter(q=>autoTypes.includes(q.type));
  const pendingQs = SESSION_QS.filter(q=>!autoTypes.includes(q.type));
  const maxAuto   = autoQs.reduce((a,q)=>a+q.points,0);
  const earned    = 38;
  const pct       = Math.round((earned/maxAuto)*100);
  const grade     = pct>=90?"A":pct>=80?"B":pct>=70?"C":pct>=60?"D":"F";
  const gc        = pct>=80?S:pct>=60?"#d97706":"#ef4444";

  const perQ = SESSION_QS.map((q,i)=>{
    if(!autoTypes.includes(q.type)) return {q,status:"pending" as const,pts:null};
    const ok=[true,true,false,true,true,false,true,true][i%8];
    return {q,status:(ok?"correct":"wrong") as "correct"|"wrong",pts:ok?q.points:0};
  });

  return (
    <div className="min-h-screen" style={{background:CREAM}}>
      <StudentHeader/>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-1" style={{fontFamily:U,color:INK}}>Your Results</h1>
          <p className="text-sm text-gray-400" style={{fontFamily:I}}>Calculus Final Exam · {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>
        </div>

        {/* Score hero */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-6 text-center">
          <div className="relative w-36 h-36 mx-auto mb-4">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="10"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke={gc} strokeWidth="10"
                strokeDasharray={`${2*Math.PI*50}`}
                strokeDashoffset={`${2*Math.PI*50*(1-pct/100)}`}
                strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black" style={{fontFamily:U,color:gc}}>{pct}%</span>
              <span className="text-xs text-gray-400" style={{fontFamily:I}}>score</span>
            </div>
          </div>
          <p className="text-5xl font-black mb-1" style={{fontFamily:U,color:gc}}>{grade}</p>
          <p className="text-sm text-gray-400 mb-4" style={{fontFamily:I}}>{earned} / {maxAuto} auto-graded points</p>
          {pendingQs.length>0&&(
            <div className="inline-flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2" style={{fontFamily:I}}>
              <Clock size={12}/>{pendingQs.length} open-answer questions pending manual review
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {l:"Correct",  v:perQ.filter(r=>r.status==="correct").length, c:S,         bg:SL},
            {l:"Wrong",    v:perQ.filter(r=>r.status==="wrong").length,   c:"#ef4444", bg:"#fff0f0"},
            {l:"Pending",  v:perQ.filter(r=>r.status==="pending").length, c:"#d97706", bg:"#fffbeb"},
          ].map(({l,v,c,bg})=>(
            <div key={l} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <p className="text-2xl font-black" style={{fontFamily:U,color:c}}>{v}</p>
              <p className="text-xs text-gray-400" style={{fontFamily:I}}>{l}</p>
            </div>
          ))}
        </div>

        {/* Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-black" style={{fontFamily:U,color:INK}}>Question Breakdown</p>
          </div>
          {perQ.map(({q,status,pts})=>(
            <div key={q.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0">
              <span className="w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0"
                style={{background:status==="correct"?SL:status==="wrong"?"#fff0f0":"#fffbeb",color:status==="correct"?S:status==="wrong"?"#ef4444":"#d97706",fontFamily:U,display:"inline-flex"}}>
                Q{q.id}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate" style={{fontFamily:U}}>{q.text.slice(0,52)}{q.text.length>52?"…":""}</p>
                <p className="text-[10px] text-gray-400 mt-0.5" style={{fontFamily:I}}>{QTLABELS[q.type]}</p>
              </div>
              <span className={`text-xs font-black px-2.5 py-1 rounded-full whitespace-nowrap ${status==="correct"?"bg-green-50 text-green-600":status==="wrong"?"bg-red-50 text-red-500":"bg-amber-50 text-amber-600"}`} style={{fontFamily:U}}>
                {status==="pending"?"Pending":`${pts}/${q.points}`}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={()=>navigate("/student/history")} className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50" style={{fontFamily:U}}>
            View history
          </button>
          <button onClick={()=>navigate("/student/enter")} className="flex-1 py-3.5 rounded-2xl text-white font-black text-sm hover:opacity-90" style={{background:INK,fontFamily:U}}>
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}

function ExamHistory() {
  const navigate = useNavigate();
  const gc = (s:number|null)=>!s?"#d97706":s>=80?S:s>=60?"#d97706":"#ef4444";
  return (
    <div className="min-h-screen" style={{background:CREAM}}>
      <StudentHeader/>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black mb-1" style={{fontFamily:U,color:INK}}>Exam History</h1>
        <p className="text-sm text-gray-400 mb-6" style={{fontFamily:I}}>All exams you have taken</p>
        <div className="space-y-3">
          {MOCK_HISTORY.map(h=>(
            <div key={h.id} onClick={()=>navigate(`/student/history/${h.id}`)}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{background:h.status==="pending"?"#fffbeb":SL}}>
                {h.status==="pending"
                  ?<Clock size={22} className="text-amber-500"/>
                  :<Award size={22} style={{color:S}}/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-800 truncate" style={{fontFamily:U}}>{h.title}</p>
                <p className="text-xs text-gray-400 mt-0.5" style={{fontFamily:I}}>{h.subject} · {h.date} · {h.duration} min</p>
              </div>
              <div className="text-right flex-shrink-0">
                {h.status==="pending"
                  ?<span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full" style={{fontFamily:U}}>Pending</span>
                  :(
                    <>
                      <p className="text-xl font-black" style={{fontFamily:U,color:gc(h.score)}}>{h.score}%</p>
                      <p className="text-xs font-black" style={{fontFamily:U,color:gc(h.score)}}>{h.grade}</p>
                    </>
                  )
                }
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0"/>
            </div>
          ))}
        </div>
        <button onClick={()=>navigate("/student/enter")}
          className="w-full mt-6 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50" style={{fontFamily:U}}>
          Take another exam
        </button>
      </div>
    </div>
  );
}

function ResultDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const exam = MOCK_HISTORY.find(h=>h.id===id)??MOCK_HISTORY[0];
  const gc = (s:number|null)=>!s?"#d97706":s>=80?S:s>=60?"#d97706":"#ef4444";

  const mockAnswers = SESSION_QS.slice(0,8).map((q,i)=>({
    q,
    given: q.options?q.options[0]:q.type==="truefalse"?"True":"Sample answer provided for demonstration purposes.",
    status:(i%3===0?"wrong":i%5===0?"pending":"correct") as "correct"|"wrong"|"pending",
    pts: i%3===0?0:i%5===0?null:q.points,
    feedback:i===1?"Great work — clear and concise.":i%3===0?"Incorrect. The correct answer is cos(x), not −cos(x).":null,
  }));

  return (
    <div className="min-h-screen" style={{background:CREAM}}>
      <StudentHeader/>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={()=>navigate("/student/history")}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors" style={{fontFamily:U}}>
          <ChevronLeft size={13}/>Back to history
        </button>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black" style={{fontFamily:U,color:INK}}>{exam.title}</h1>
            <p className="text-sm text-gray-400 mt-0.5" style={{fontFamily:I}}>{exam.subject} · {exam.date}</p>
          </div>
          {exam.score&&(
            <div className="text-right">
              <p className="text-3xl font-black" style={{fontFamily:U,color:gc(exam.score)}}>{exam.score}%</p>
              <p className="text-sm font-black" style={{fontFamily:U,color:gc(exam.score)}}>{exam.grade}</p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {mockAnswers.map(({q,given,status,pts,feedback})=>(
            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2 py-1 rounded-lg" style={{background:QTCOLORS[q.type]?.bg??"#f3f4f6",color:QTCOLORS[q.type]?.c??"#6b7280",fontFamily:U}}>Q{q.id}</span>
                  <span className="text-xs text-gray-400" style={{fontFamily:I}}>{QTLABELS[q.type]} · {q.points} pts</span>
                </div>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${status==="correct"?"bg-green-50 text-green-600":status==="wrong"?"bg-red-50 text-red-500":"bg-amber-50 text-amber-600"}`} style={{fontFamily:U}}>
                  {status==="pending"?"Pending review":pts!==null?`${pts}/${q.points}`:"-"}
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm font-semibold text-gray-700 mb-3" style={{fontFamily:U}}>{q.text}</p>
                <div className="bg-gray-50 rounded-xl px-4 py-3 mb-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1" style={{fontFamily:U}}>Your answer</p>
                  <p className="text-sm text-gray-700" style={{fontFamily:I}}>{String(given)}</p>
                </div>
                {feedback&&(
                  <div className={`rounded-xl px-4 py-3 flex items-start gap-2 ${status==="correct"?"bg-green-50":"bg-red-50"}`}>
                    <MessageSquare size={13} className={status==="correct"?"text-green-500":"text-red-400"} style={{flexShrink:0,marginTop:2}}/>
                    <p className="text-xs" style={{fontFamily:I,color:status==="correct"?"#16a34a":"#dc2626"}}>{feedback}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE MATH UPLOAD PAGE (reached via QR scan)
// ═══════════════════════════════════════════════════════════════════════════════
function MathUploadMobile() {
  const [preview, setPreview] = useState<string|null>(null);
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const raw = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const qid = raw?.get("q") ?? "?";

  const handleFile = (e:React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPreview(URL.createObjectURL(f));
  };

  return (
    <div className="min-h-screen flex flex-col" style={{background:CREAM}}>
      <StudentHeader/>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="h-1" style={{background:`linear-gradient(90deg,${INK},${S})`}}/>
          <div className="p-7">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{background:SL}}>
                <Upload size={24} style={{color:S}}/>
              </div>
              <h1 className="text-xl font-black mb-1" style={{fontFamily:U,color:INK}}>Upload Solution</h1>
              <p className="text-xs text-gray-400" style={{fontFamily:I}}>Question {qid} — handwritten solution</p>
            </div>
            {uploaded?(
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 size={40} style={{color:S}}/>
                <p className="font-black text-lg" style={{fontFamily:U,color:INK}}>Uploaded!</p>
                <p className="text-xs text-gray-400 text-center" style={{fontFamily:I}}>Return to your exam on the main device to continue.</p>
              </div>
            ):!preview?(
              <div className="space-y-3">
                <button onClick={()=>fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                  <Camera size={20} className="text-gray-400"/>
                  <span className="text-sm font-semibold text-gray-500" style={{fontFamily:U}}>Take photo</span>
                </button>
                <button onClick={()=>fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all">
                  <Upload size={18} className="text-gray-400"/>
                  <span className="text-sm font-semibold text-gray-500" style={{fontFamily:U}}>Choose from gallery</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile}/>
              </div>
            ):(
              <div>
                <img src={preview} alt="Solution preview" className="w-full h-48 object-cover rounded-2xl mb-4"/>
                <div className="flex gap-2">
                  <button onClick={()=>setPreview(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500" style={{fontFamily:U}}>Retake</button>
                  <button onClick={()=>setUploaded(true)} className="flex-1 py-3 rounded-xl text-white font-black text-sm hover:opacity-90" style={{background:S,fontFamily:U}}>Submit →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const [showCode, setShowCode] = useState(false);
  const [authMode, setAuthMode] = useState<null|"login"|"register">(null);
  return (
    <div className="min-h-screen" style={{ background:CREAM }}>
      {showCode&&<EnterCodeModal onClose={()=>setShowCode(false)}/>}
      {authMode&&<AuthModal mode={authMode} onClose={()=>setAuthMode(null)} onSwitch={()=>setAuthMode(m=>m==="login"?"register":"login")}/>}
      <LandingNavbar onEnterCode={()=>setShowCode(true)} onSignIn={()=>setAuthMode("login")} onSignUp={()=>setAuthMode("register")}/>
      <Hero onEnterCode={()=>setShowCode(true)} onSignUp={()=>setAuthMode("register")}/>
      <TrustBar/>
      <Features/>
      <HowItWorks onEnterCode={()=>setShowCode(true)}/>
      <Security/>
      <Testimonials/>
      <CTA onEnterCode={()=>setShowCode(true)} onSignUp={()=>setAuthMode("register")}/>
      <Footer/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  return null;
}

export {
  LandingPage,
  DashboardOverview,
  DashboardCharts,
  DashboardFilters,
  DashboardNotifications,
  DashboardSettings,
  ExamList,
  ExamCreate,
  ExamDetail,
  QuestionBank,
  QuestionCreate,
  AIGenerator,
  GradingResults,
  ManualGrading,
  LiveMonitoring,
  RulesConfig,
  SecurityLogs,
  InviteCollaborators,
  ManageCollaborators,
  ReportsDashboard,
  ScoresReport,
  AttendanceReport,
  AntiCheatReport,
  QuestionAnalysisReport,
  ExamEntry,
  ExamInvalid,
  StudentLobby,
  ExamInstructions,
  ExamWaitingLobby,
  ExamTaking,
  ReviewSubmit,
  AutoSubmitNotice,
  SubmissionSuccess,
  InstantResults,
  ExamHistory,
  ResultDetail,
  MathUploadMobile,
};
