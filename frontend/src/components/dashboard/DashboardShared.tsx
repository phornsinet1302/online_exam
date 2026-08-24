"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  GraduationCap, Search, Bell, ChevronDown, ChevronUp,
  LogOut, Check, Copy, Settings,
  LayoutDashboard, FileText, Monitor, BarChart2,
} from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";
import { useNavigate } from "@/lib/hooks";

// ─── Layout constants ─────────────────────────────────────────────────────────
export const SIDEBAR_W = 240;

// ─── Nav configuration ────────────────────────────────────────────────────────
type TeacherNavItem = { id: string; label: string; icon: any; path: string };
type DashboardTabItem = { id: string; label: string; path: string; badge?: number };

const TEACHER_NAV: TeacherNavItem[] = [
  { id: "overview",   label: "Overview",   icon: LayoutDashboard, path: "/dashboard" },
  { id: "exams",      label: "Exams",      icon: FileText,        path: "/dashboard/exams" },
  { id: "monitoring", label: "Monitoring", icon: Monitor,         path: "/dashboard/monitoring" },
  { id: "reports",    label: "Reports",    icon: BarChart2,       path: "/dashboard/reports" },
  { id: "settings",   label: "Settings",   icon: Settings,        path: "/dashboard/settings" },
];

const SECTION_TABS: Record<string, DashboardTabItem[]> = {
  overview: [
    { id: "overview", label: "Summary",   path: "/dashboard" },
    { id: "charts",   label: "Analytics", path: "/dashboard/charts" },
  ],
  exams: [
    { id: "exams",          label: "My Exams",       path: "/dashboard/exams" },
    { id: "exams-create",   label: "Create",          path: "/dashboard/exams/create" },
    { id: "grading",        label: "Auto-Grade",      path: "/dashboard/grading" },
    { id: "grading-manual", label: "Manual Grading",  path: "/dashboard/grading/manual" },
  ],
  monitoring: [
    { id: "monitoring", label: "Live Monitor",  path: "/dashboard/monitoring" },
    { id: "rules",      label: "Rules",         path: "/dashboard/monitoring/rules" },
    { id: "logs",       label: "Security Logs", path: "/dashboard/monitoring/logs" },
  ],
  reports: [
    { id: "reports",        label: "Overview",           path: "/dashboard/reports" },
    { id: "reports-scores", label: "Scores",             path: "/dashboard/reports/scores" },
    { id: "reports-attend", label: "Attendance",         path: "/dashboard/reports/attendance" },
    { id: "reports-cheat",  label: "Anti-Cheat",         path: "/dashboard/reports/anticheat" },
    { id: "reports-qana",   label: "Question Analysis",  path: "/dashboard/reports/questions" },
    { id: "filters",        label: "Export",             path: "/dashboard/filters" },
  ],
  settings: [
    { id: "settings",      label: "Account",       path: "/dashboard/settings" },
    { id: "notifications", label: "Notifications", path: "/dashboard/notifications", badge: 4 },
    { id: "collab-invite", label: "Invite",        path: "/dashboard/collaboration" },
    { id: "collab-manage", label: "Roles",         path: "/dashboard/collaboration/manage" },
  ],
};

export function getTeacherSection(active: string) {
  if (["charts"].includes(active)) return "overview";
  if (["exams", "exams-create", "grading", "grading-manual"].includes(active)) return "exams";
  if (["monitoring", "rules", "logs"].includes(active)) return "monitoring";
  if (["reports", "reports-scores", "reports-attend", "reports-cheat", "reports-qana", "filters"].includes(active)) return "reports";
  if (["settings", "notifications", "collab-invite", "collab-manage"].includes(active)) return "settings";
  return "overview";
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function DashboardSidebar({ active }: { active: string }) {
  const navigate = useNavigate();
  const section = getTeacherSection(active);
  return (
    <aside className="fixed top-0 left-0 h-screen flex flex-col z-40 select-none"
      style={{ width: SIDEBAR_W, background: INK, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2.5 px-5 h-16 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: CAMEL }}><GraduationCap size={16} className="text-white"/></div>
        <span className="text-[17px] font-black text-white" style={{ fontFamily: U }}>exam<span style={{ color: CAMEL }}>·ai</span></span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <p className="text-[9px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: "rgba(255,255,255,0.22)", fontFamily: U }}>Teacher Workspace</p>
        {TEACHER_NAV.map(({ id, label, icon: Icon, path }) => {
          const isActive = section === id;
          return (
            <button key={id} onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              style={{ fontFamily: I, background: isActive ? `${CAMEL}22` : undefined }}>
              <Icon size={17} style={{ color: isActive ? CAMEL : undefined }}/>
              <span className="flex-1 text-left">{label}</span>
              {id === "settings" && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#ef4444", color: "white", fontFamily: U }}>4</span>}
              {isActive && <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: CAMEL }}/>}
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: CAMEL, fontFamily: U }}>JR</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: U }}>Jane Robertson</p>
            <p className="text-xs text-gray-500 truncate" style={{ fontFamily: I }}>Mathematics · Year 9–12</p>
          </div>
          <button type="button" onClick={() => navigate("/")} aria-label="Log out"
            className="rounded-md p-1 text-gray-600 transition-colors hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-white/20">
            <LogOut size={14} className="flex-shrink-0"/>
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Section Tabs ─────────────────────────────────────────────────────────────
export function DashboardSectionTabs({ active }: { active: string }) {
  const navigate = useNavigate();
  const section = getTeacherSection(active);
  const tabs = SECTION_TABS[section as keyof typeof SECTION_TABS];
  return (
    <div className="fixed top-16 right-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur" style={{ left: SIDEBAR_W }}>
      <div className="px-7 py-3 overflow-x-auto">
        <div className="flex w-max min-w-full gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
          {tabs.map(({ id, label, path, badge }) => {
            const isActive = active === id || (active === "exams-create" && id === "exams-create");
            return (
              <button key={id} onClick={() => navigate(path)}
                className={`dashboard-tab flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.98] ${isActive ? "dashboard-tab-active bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:bg-white/60 hover:text-gray-800"}`}
                style={{ fontFamily: U }}>
                {label}
                {badge ? <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: "#ef4444" }}>{badge}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
export function DashboardHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 right-0 z-30 bg-white border-b border-gray-100 flex items-center justify-between px-7 h-16" style={{ left: SIDEBAR_W }}>
      <div>
        <h1 className="text-lg font-black leading-none" style={{ fontFamily: U, color: INK }}>{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: I }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input placeholder="Search…" className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-300 w-40" style={{ fontFamily: I }}/>
        </div>
        <button onClick={() => navigate("/dashboard/notifications")} className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 transition-all">
          <Bell size={16}/>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "#ef4444" }}>4</span>
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold cursor-pointer" style={{ background: CAMEL, fontFamily: U }}>JR</div>
      </div>
    </header>
  );
}

// ─── Layout wrapper ───────────────────────────────────────────────────────────
export function DashboardLayout({ children, active, title, subtitle, actions }: {
  children: React.ReactNode; active: string; title: string; subtitle?: string; actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen" style={{ background: CREAM }}>
      <DashboardSidebar active={active}/>
      <DashboardHeader title={title} subtitle={subtitle} actions={actions}/>
      <DashboardSectionTabs active={active}/>
      <main className="min-h-screen pt-32" style={{ marginLeft: SIDEBAR_W }}>
        <div key={pathname} className="dashboard-page-transition p-7">{children}</div>
      </main>
    </div>
  );
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, iconBg, trend, trendUp }: {
  label: string; value: string; sub?: string; icon: any; iconBg: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}><Icon size={19} style={{ color: INK }}/></div>
        {trend && <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`} style={{ fontFamily: U }}>{trendUp ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}{trend}</div>}
      </div>
      <p className="text-2xl font-black leading-none mb-1" style={{ fontFamily: U, color: INK }}>{value}</p>
      <p className="text-xs font-semibold text-gray-500" style={{ fontFamily: I }}>{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5" style={{ fontFamily: I }}>{sub}</p>}
    </div>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="relative w-11 h-6 rounded-full transition-all flex-shrink-0" style={{ background: on ? INK : "#e5e7eb" }}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`}/>
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { published: "bg-green-50 text-green-700", draft: "bg-gray-100 text-gray-600", archived: "bg-amber-50 text-amber-700" };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${map[status] || map.draft}`} style={{ fontFamily: U }}>{status}</span>;
}

export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" style={{ fontFamily: U }}>{label}</p>
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <span className="flex-1 text-sm font-mono text-gray-700 truncate">{value}</span>
        <button onClick={copy} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${copied ? "text-green-700 bg-green-50" : "text-gray-500 hover:bg-gray-200"}`} style={{ fontFamily: U }}>
          {copied ? <><Check size={12}/>Copied!</> : <><Copy size={12}/>Copy</>}
        </button>
      </div>
    </div>
  );
}

export function QRPattern() {
  const cells = [1,1,1,0,1,1,1,1,0,1,0,1,0,1,1,1,1,0,0,1,1,0,0,0,0,1,0,0,1,1,1,0,1,1,1,0,1,0,0,0,0,1,1,0,0,1,1,0,1];
  return (
    <div className="inline-block p-3 bg-white rounded-xl border border-gray-200">
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(7, 14px)" }}>
        {cells.map((filled, i) => <div key={i} style={{ width: 14, height: 14, background: filled ? INK : "transparent", borderRadius: filled ? 2 : 0 }}/>)}
      </div>
    </div>
  );
}
