"use client";

import { useState, useEffect } from "react";
import { Toggle } from "@/components/dashboard/DashboardShared";
import { Check, ChevronDown, CheckCircle2 } from "lucide-react";
import { U, I, INK } from "@/lib/tokens";
import { examsApi } from "@/lib/api/exams";

export type RuleAction = "ignore"|"warn"|"flag"|"submit";

export interface Rule {
  id: string; 
  label: string; 
  desc: string; 
  enabled: boolean; 
  action: RuleAction; 
  threshold?: number;
}

export const ACTION_LABELS: Record<RuleAction,{label:string;color:string;bg:string}> = {
  ignore: { label:"Ignore",   color:"#9ca3af", bg:"#f9fafb" },
  warn:   { label:"Warn",     color:"#d97706", bg:"#fffbeb" },
  flag:   { label:"Flag",     color:"#ef4444", bg:"#fff0f0" },
  submit: { label:"Auto-submit",color:"#7c3aed",bg:"#f5f3ff" },
};

export function AntiCheatRuleEditor({
  examId,
  onSaved,
}: {
  examId: string;
  onSaved?: () => void;
}) {
  const [rules, setRules] = useState<Rule[]>([
    { id:"tab",   label:"Tab switch / window blur",    desc:"Student navigates away from the exam tab.",              enabled:true,  action:"flag",   threshold:3 },
    { id:"copy",  label:"Copy / paste attempt",        desc:"Student tries to copy text or paste from clipboard.",    enabled:true,  action:"warn" },
    { id:"full",  label:"Fullscreen exited",           desc:"Student exits fullscreen.",                              enabled:true,  action:"warn" },
    { id:"print", label:"Print screen key pressed",    desc:"Student presses the print screen or screenshot key.",   enabled:true, action:"warn" },
  ]);

  const [requireFullscreen, setRequireFullscreen] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!examId) return;
    examsApi.getAntiCheatRules(examId).then(apiRules => {
       const fullRule = apiRules.find(r => r.eventType === "fullscreen_exit");
       if (fullRule) setRequireFullscreen(fullRule.enabled);

       setRules(prev => prev.map(r => {
          let eventType = r.id;
          if (r.id === "tab") eventType = "tab_switch";
          if (r.id === "full") eventType = "fullscreen_exit";
          if (r.id === "print") eventType = "print_screen";
          
          const apiR = apiRules.find(a => a.eventType === eventType);
          if (apiR) {
            const mappedAction = apiR.action === "auto_submit" ? "submit" : apiR.action;
            return { ...r, enabled: apiR.enabled, action: mappedAction as RuleAction, threshold: apiR.threshold ?? undefined };
          }
          return r;
       }));
    }).catch(err => console.error("Failed to load rules", err));
  }, [examId]);

  const toggleRule = (id:string)=>{
    if (id === "full") setRequireFullscreen(p=>!p);
    setRules(p=>p.map(r=>r.id===id?{...r,enabled:!r.enabled}:r));
  };
  const setAction = (id:string, a:RuleAction)=>setRules(p=>p.map(r=>r.id===id?{...r,action:a}:r));
  const setThreshold = (id:string, v:number)=>setRules(p=>p.map(r=>r.id===id?{...r,threshold:v}:r));
  
  const save = async ()=>{ 
    if (!examId) return;
    setSaving(true);
    try {
      const rulesToSave = rules.map(r => {
        let eventType = r.id;
        if (r.id === "tab") eventType = "tab_switch";
        if (r.id === "full") eventType = "fullscreen_exit";
        if (r.id === "print") eventType = "print_screen";
        return {
          eventType,
          enabled: r.id === "full" ? requireFullscreen : r.enabled,
          action: r.action === "submit" ? "auto_submit" : r.action,
          threshold: r.threshold || null
        };
      });

      const copyRule = rulesToSave.find(r => r.eventType === "copy");
      if (copyRule) {
        rulesToSave.push({ ...copyRule, eventType: "paste" });
      }

      await examsApi.updateAntiCheatRules(examId, rulesToSave);
      setSaved(true); 
      if (onSaved) onSaved();
      setTimeout(()=>setSaved(false),2000);
    } catch (err: any) {
      alert("Failed to save rules: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const ActionChip = ({ rule }: { rule:Rule })=>{
    const [open, setOpen] = useState(false);
    const current = ACTION_LABELS[rule.action];
    return (
      <div className="relative">
        <button onClick={()=>setOpen(o=>!o)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all" style={{ color:current.color, background:current.bg, borderColor:`${current.color}30`, fontFamily:U }}>
          {current.label}<ChevronDown size={11}/>
        </button>
        {open&&(
          <>
            <div className="fixed inset-0 z-[98]" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-xl shadow-lg z-[99] py-1 w-40" onClick={e=>e.stopPropagation()}>
              {(Object.entries(ACTION_LABELS) as [RuleAction,typeof ACTION_LABELS[RuleAction]][]).map(([id,{label,color}])=>(
                <button key={id} onClick={()=>{ setAction(rule.id,id); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors ${rule.action===id?"font-black":""}`}
                  style={{ color, fontFamily:U }}>
                  {rule.action===id&&<Check size={10}/>}{label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  if (!examId) {
    return <div className="p-4 text-center text-gray-500 text-sm">Please select an exam to configure its rules.</div>;
  }

  return (
    <div className="w-full space-y-5">
      <div className="flex justify-between items-center bg-white rounded-2xl border border-gray-100 p-4">
        <div>
          <h2 className="text-sm font-bold" style={{ fontFamily:U, color:INK }}>Anti-Cheat Rules</h2>
          <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>Configure specific behavioral rules for this exam.</p>
        </div>
        <button onClick={save} disabled={saving || !examId} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50" style={{ background:INK, fontFamily:U }}>
          {saving ? "Saving..." : saved ? <><CheckCircle2 size={13}/>Saved!</> : "Save rules"}
        </button>
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Session Requirements</h3>
        <div className="space-y-1">
          {[
            {l:"Lock to fullscreen",        d:"Exam must stay fullscreen. Exit triggers an action.", on:requireFullscreen,set:()=>{
              setRequireFullscreen(s=>{
                const ns = !s;
                setRules(p=>p.map(r=>r.id==="full"?{...r,enabled:ns}:r));
                return ns;
              });
            }},
          ].map(({l,d,on,set})=>(
            <div key={l} className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
              <div><p className="text-sm font-semibold text-gray-800" style={{ fontFamily:U }}>{l}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{d}</p></div>
              <Toggle on={on} onChange={set}/>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Event Rules</h3>
          <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>Configure what happens when each suspicious event is detected.</p>
        </div>
        <div className="divide-y divide-gray-50">
          {rules.map(rule=>{
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
  );
}
