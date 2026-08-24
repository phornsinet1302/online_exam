"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/hooks";
import { MOCK_EXAMS, StudentSearchParams, getSearchValue } from "@/lib/mock-data";
import { GraduationCap, Hash, QrCode, Link, RefreshCw, ArrowRight, CheckCircle2 } from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";

export function ExamEntry({ searchParams }: { searchParams?: StudentSearchParams } = {}) {
  const navigate = useNavigate();
  const viaLink = getSearchValue(searchParams, "via");
  const preCode = getSearchValue(searchParams, "code").toUpperCase();

  const [code, setCode]       = useState(preCode);
  const [checking, setChecking] = useState(false);
  const [shake, setShake]     = useState(false);

  const [autoChecked, setAutoChecked] = useState(false);
  if (viaLink && preCode && !autoChecked && !checking) {
    setAutoChecked(true);
    setChecking(true);
    setTimeout(()=>{
      setChecking(false);
      if (preCode) navigate(`/student/info?code=${encodeURIComponent(preCode)}`);
      else navigate("/student/invalid?reason=expired");
    }, 1200);
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const upper = code.trim().toUpperCase();
    if (!upper) return;
    setChecking(true);
    setTimeout(()=>{
      setChecking(false);
      if (upper) navigate(`/student/info?code=${encodeURIComponent(upper)}`);
      else { setShake(true); setTimeout(()=>setShake(false),600); }
    }, 900);
  };

  const handleCode = (v: string) => {
    const clean = v.replace(/[^A-Za-z0-9]/g,"").toUpperCase();
    setCode(clean);
  };

  const exam = MOCK_EXAMS.find(e=>e.code.toUpperCase()===code.trim().toUpperCase());

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
