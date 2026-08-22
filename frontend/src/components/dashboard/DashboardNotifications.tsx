"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { Bell, X, CheckCheck, Activity, AlertTriangle, CalendarDays } from "lucide-react";
import { U, I, INK, CAMEL } from "@/lib/tokens";

const BLUE = "#2563EB";

export function DashboardNotifications() {
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
      <div className="w-full">
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
