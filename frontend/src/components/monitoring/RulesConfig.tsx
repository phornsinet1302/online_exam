"use client";

import { useEffect, useState } from "react";
import { DashboardLayout, Toggle } from "@/components/dashboard/DashboardShared";
import { Check, ChevronDown, CheckCircle2, RefreshCw, AlertTriangle, Users } from "lucide-react";
import { U, I, INK } from "@/lib/tokens";
import { examsApi, Exam } from "@/lib/api/exams";
import { antiCheatApi, AntiCheatRule, RuleAction } from "@/lib/api/anticheat";
import { eventLabel } from "@/lib/violationEvents";

const ACTION_LABELS: Record<RuleAction,{label:string;color:string;bg:string;desc:string}> = {
  ignore:      { label:"Allow",       color:"#9ca3af", bg:"#f9fafb", desc:"Allowed — nothing happens" },
  warn:        { label:"Warn",        color:"#d97706", bg:"#fffbeb", desc:"Student sees a warning; you're alerted" },
  flag:        { label:"Flag",        color:"#ef4444", bg:"#fff0f0", desc:"Flagged for review; you're alerted live" },
  block:       { label:"Block",       color:"#dc2626", bg:"#fef2f2", desc:"Locks the student's screen for 15 seconds" },
  auto_submit: { label:"Auto-submit", color:"#7c3aed", bg:"#f5f3ff", desc:"Exam is submitted and graded immediately" },
};

// Extra context beyond the shared eventLabel() — kept local since it's just
// for this settings page, not the Security Logs table.
const EVENT_DESCRIPTIONS: Record<string, string> = {
  tab_switch:          "Student navigates away from the exam tab.",
  copy:                "Student tries to copy exam content.",
  paste:               "Student pastes content into an answer.",
  right_click:         "Student right-clicks during the exam.",
  keyboard_shortcut:   "Student uses a restricted keyboard shortcut.",
  fullscreen_exit:     "Student exits fullscreen / lockdown browser mode.",
  window_blur:         "The exam window loses focus — e.g. another application is opened.",
  devtools:            "Browser developer tools are detected open.",
  print_screen:        "Student presses the print screen / screenshot key.",
  idle:                "Student is inactive for an extended period.",
  disconnect_internet: "Student's connection drops during the exam.",
  disconnect_camera:   "Student's webcam feed is lost or disabled.",
  disconnect_mic:      "Student's microphone feed is lost or disabled.",
  resize:              "The exam window is resized unexpectedly.",
  multiple_windows:    "More than one browser window/tab is open.",
  extension_detected:  "A browser extension is detected running.",
};

export function RulesConfig() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [examsError, setExamsError] = useState("");
  const [examId, setExamId] = useState("");

  const [rules, setRules] = useState<AntiCheatRule[]>([]);
  const [requireCamera, setRequireCamera] = useState(false);
  const [lockFullscreen, setLockFullscreen] = useState(false);
  const [browserLockdown, setBrowserLockdown] = useState(false);
  const [screenshotIntervalSec, setScreenshotIntervalSec] = useState(30);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setExamsError("");
    examsApi.getAll()
      .then((data) => {
        const active = data.filter(e => e.status !== "ARCHIVED");
        setExams(active);
        if (active.length > 0) setExamId(active[0].id);
      })
      .catch((e) => setExamsError(e instanceof Error && e.message ? e.message : "Failed to load your exams. Please try again."))
      .finally(() => setExamsLoading(false));
  }, []);

  useEffect(() => {
    if (!examId) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");
    Promise.all([antiCheatApi.getRules(examId), examsApi.getById(examId)])
      .then(([fetchedRules, exam]) => {
        if (cancelled) return;
        setRules(fetchedRules);
        setRequireCamera(!!exam.requireCamera);
        setLockFullscreen(!!exam.lockFullscreen);
        setBrowserLockdown(!!exam.browserLockdown);
        setScreenshotIntervalSec(exam.screenshotIntervalSec ?? 30);
      })
      .catch((e) => { if (!cancelled) setDetailError(e instanceof Error && e.message ? e.message : "Failed to load rules for this exam."); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [examId]);

  const toggleRule = (eventType:string)=>setRules(p=>p.map(r=>r.eventType===eventType?{...r,enabled:!r.enabled}:r));
  const setAction = (eventType:string, a:RuleAction)=>setRules(p=>p.map(r=>r.eventType===eventType?{...r,action:a}:r));
  const setThreshold = (eventType:string, v:number)=>setRules(p=>p.map(r=>r.eventType===eventType?{...r,threshold:v}:r));

  const save = async () => {
    if (!examId) return;
    setSaving(true);
    setSaveError("");
    try {
      await Promise.all([
        examsApi.update(examId, { requireCamera, lockFullscreen, browserLockdown, screenshotIntervalSec }),
        antiCheatApi.updateRules(examId, rules.map(r => ({ eventType: r.eventType, enabled: r.enabled, action: r.action, threshold: r.threshold }))),
      ]);
      setSaved(true);
      setTimeout(()=>setSaved(false), 2000);
    } catch (e) {
      setSaveError(e instanceof Error && e.message ? e.message : "Failed to save rules. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const ActionChip = ({ rule }: { rule:AntiCheatRule })=>{
    const [open, setOpen] = useState(false);
    const current = ACTION_LABELS[rule.action];
    return (
      <div className="relative">
        <button onClick={()=>setOpen(o=>!o)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all" style={{ color:current.color, background:current.bg, borderColor:`${current.color}30`, fontFamily:U }}>
          {current.label}<ChevronDown size={11}/>
        </button>
        {open&&(
          <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 w-40" onClick={e=>e.stopPropagation()}>
            {(Object.entries(ACTION_LABELS) as [RuleAction,typeof ACTION_LABELS[RuleAction]][]).map(([id,{label,color}])=>(
              <button key={id} onClick={()=>{ setAction(rule.eventType,id); setOpen(false); }}
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

  const noExams = !examsLoading && !examsError && exams.length === 0;

  return (
    <DashboardLayout active="rules" title="Rules Config" subtitle="Configure anti-cheating behavior"
      actions={examId && !noExams ? <button onClick={save} disabled={saving || detailLoading} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-60" style={{ background:INK, fontFamily:U }}>
        {saving ? <><RefreshCw size={13} className="animate-spin"/>Saving…</> : saved?<><CheckCircle2 size={13}/>Saved!</>:"Save rules"}
      </button> : undefined}>

      <div className="w-full space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Exam</p>
          <select value={examId} onChange={e=>setExamId(e.target.value)} disabled={examsLoading} className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:border-gray-400 disabled:opacity-50" style={{ fontFamily:I }}>
            {examsLoading && <option>Loading exams…</option>}
            {exams.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>

        {examsError ? (
          <div className="bg-white rounded-2xl border border-red-100 py-16 flex flex-col items-center gap-3">
            <AlertTriangle size={32} className="text-red-300"/>
            <p className="text-sm text-red-500 text-center max-w-xs" style={{ fontFamily:U }}>{examsError}</p>
          </div>
        ) : noExams ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3">
            <Users size={32} className="text-gray-200"/>
            <p className="text-sm text-gray-400" style={{ fontFamily:U }}>Create an exam first to configure its anti-cheating rules.</p>
          </div>
        ) : detailError ? (
          <div className="bg-white rounded-2xl border border-red-100 py-16 flex flex-col items-center gap-3">
            <AlertTriangle size={32} className="text-red-300"/>
            <p className="text-sm text-red-500 text-center max-w-xs" style={{ fontFamily:U }}>{detailError}</p>
          </div>
        ) : detailLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3">
            <RefreshCw size={24} className="text-gray-300 animate-spin"/>
            <p className="text-sm text-gray-400" style={{ fontFamily:U }}>Loading rules…</p>
          </div>
        ) : (
          <>
            {saveError && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 rounded-xl border border-red-100">
                <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5"/>
                <p className="text-xs text-red-600 flex-1" style={{ fontFamily:I }}>{saveError}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Session Requirements</h3>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full" style={{ fontFamily:U }}>Camera enforced; others not yet</span>
              </div>
              <div className="space-y-1">
                {[
                  {l:"Require webcam / camera",   d:"Students must have camera access to start.",         on:requireCamera,    set:setRequireCamera},
                  {l:"Lock to fullscreen",        d:"Exam must stay fullscreen. Exit triggers an action.", on:lockFullscreen,   set:setLockFullscreen},
                  {l:"Browser lockdown mode",     d:"Block extensions, DevTools, and new tabs.",           on:browserLockdown,  set:setBrowserLockdown},
                ].map(({l,d,on,set})=>(
                  <div key={l} className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
                    <div><p className="text-sm font-semibold text-gray-800" style={{ fontFamily:U }}>{l}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{d}</p></div>
                    <Toggle on={on} onChange={()=>set(s=>!s)}/>
                  </div>
                ))}
                <div className="py-3.5 flex items-center justify-between">
                  <div><p className="text-sm font-semibold text-gray-800" style={{ fontFamily:U }}>Screenshot frequency</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>Encrypted screenshots taken every N seconds.</p></div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={screenshotIntervalSec} onChange={e=>setScreenshotIntervalSec(+e.target.value)} min={10} max={300} className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-gray-400" style={{ fontFamily:U }}/>
                    <span className="text-xs text-gray-400" style={{ fontFamily:I }}>sec</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Event Rules</h3>
                <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>Configure what happens when each suspicious event is detected.</p>
              </div>
              <div className="divide-y divide-gray-50">
                {rules.map(rule=>(
                  <div key={rule.eventType} className={`px-6 py-4 flex items-center gap-4 transition-all ${!rule.enabled?"opacity-50":""}`}>
                    <Toggle on={rule.enabled} onChange={()=>toggleRule(rule.eventType)}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800" style={{ fontFamily:U }}>{eventLabel(rule.eventType)}</p>
                      <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{EVENT_DESCRIPTIONS[rule.eventType] || ""}</p>
                    </div>
                    {rule.threshold!==null&&rule.enabled&&(
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-gray-400" style={{ fontFamily:I }}>after</span>
                        <input type="number" value={rule.threshold} onChange={e=>setThreshold(rule.eventType,+e.target.value)} min={1} max={99}
                          className="w-12 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:border-gray-400" style={{ fontFamily:U }}/>
                        <span className="text-xs text-gray-400" style={{ fontFamily:I }}>× </span>
                      </div>
                    )}
                    <div className="flex-shrink-0">{rule.enabled?<ActionChip rule={rule}/>:<span className="text-xs text-gray-300 px-3 py-1.5" style={{ fontFamily:U }}>Disabled</span>}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Action reference</p>
              <div className="flex flex-wrap gap-3">
                {(Object.entries(ACTION_LABELS) as [RuleAction,typeof ACTION_LABELS[RuleAction]][]).map(([id,{label,color,bg,desc}])=>(
                  <div key={id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background:bg }}>
                    <div className="w-2 h-2 rounded-full" style={{ background:color }}/>
                    <p className="text-xs font-bold" style={{ color, fontFamily:U }}>{label}</p>
                    <p className="text-[10px] text-gray-400" style={{ fontFamily:I }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
