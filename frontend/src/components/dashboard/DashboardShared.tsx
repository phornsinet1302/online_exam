"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Search, Bell, ChevronDown, ChevronUp,
  LogOut, Check, X, Copy, Settings,
  LayoutDashboard, FileText, Monitor, BarChart2,
} from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";
import { useNavigate, useUnreadNotificationCount } from "@/lib/hooks";
import { useAuth } from "@/components/providers/AuthProvider";
import { notificationsApi, Notification } from "@/lib/api/notifications";
import { collaborationApi, Collaborator } from "@/lib/api/collaboration";
import { Logo } from "@/components/Logo";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr${hr > 1 ? "s" : ""} ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day} days ago`;
  return new Date(iso).toLocaleDateString();
}

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
    { id: "exams-shared",   label: "Shared with me",  path: "/dashboard/exams/shared" },
    { id: "exams-create",   label: "Create",          path: "/dashboard/exams/create" },
    { id: "grading",        label: "Auto-Grade",      path: "/dashboard/grading" },
    { id: "grading-manual", label: "Manual Grading",  path: "/dashboard/grading/manual" },
  ],
  monitoring: [
    { id: "monitoring", label: "Live Monitor",  path: "/dashboard/monitoring" },
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
    { id: "notifications", label: "Notifications", path: "/dashboard/notifications" },
    { id: "collab-invite", label: "Invite",        path: "/dashboard/collaboration" },
    { id: "collab-manage", label: "Roles",         path: "/dashboard/collaboration/manage" },
  ],
};

export function getTeacherSection(active: string) {
  if (["charts"].includes(active)) return "overview";
  if (["exams", "exams-shared", "exams-create", "grading", "grading-manual"].includes(active)) return "exams";
  if (["monitoring", "rules", "logs"].includes(active)) return "monitoring";
  if (["reports", "reports-scores", "reports-attend", "reports-cheat", "reports-qana", "filters"].includes(active)) return "reports";
  if (["settings", "notifications", "collab-invite", "collab-manage"].includes(active)) return "settings";
  return "overview";
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function DashboardSidebar({ active }: { active: string }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const unread = useUnreadNotificationCount();
  const section = getTeacherSection(active);
  const name = user?.name || "Teacher";
  const initials = name ? name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2) : "T";

  // Profile menu (Account settings / Log out) — closes on outside click or Escape.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  return (
    <aside className="fixed top-0 left-0 h-screen flex flex-col z-40 select-none"
      style={{ width: SIDEBAR_W, background: INK, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2.5 px-5 h-16 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <Logo height={44} onDark href="/dashboard" />
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
              {id === "settings" && unread > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#ef4444", color: "white", fontFamily: U }}>{unread > 9 ? "9+" : unread}</span>}
              {isActive && <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: CAMEL }}/>}
            </button>
          );
        })}
      </nav>
      <div ref={menuRef} className="relative px-4 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        {menuOpen && (
          <div role="menu" className="absolute bottom-full left-4 right-4 mb-2 z-10 overflow-hidden rounded-xl border shadow-xl"
            style={{ background: "#14283d", borderColor: "rgba(255,255,255,0.1)" }}>
            <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); navigate("/dashboard/settings"); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-3 text-sm text-gray-200 hover:bg-white/5 transition-colors" style={{ fontFamily: I }}>
              <Settings size={15} className="flex-shrink-0"/>Account settings
            </button>
            <button type="button" role="menuitem" onClick={logout}
              className="w-full flex items-center gap-2.5 px-3.5 py-3 text-sm text-red-300 hover:bg-red-500/10 transition-colors border-t" style={{ fontFamily: I, borderColor: "rgba(255,255,255,0.08)" }}>
              <LogOut size={15} className="flex-shrink-0"/>Log out
            </button>
          </div>
        )}
        <button type="button" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-all text-left focus:outline-none focus:ring-2 focus:ring-white/20">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0"/>
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: CAMEL, fontFamily: U }}>{initials}</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: U }}>{name}</p>
            <p className="text-xs text-gray-500 truncate" style={{ fontFamily: I }}>{user?.email || "Teacher"}</p>
          </div>
          <ChevronUp size={14} className={`flex-shrink-0 text-gray-500 transition-transform ${menuOpen ? "" : "rotate-180"}`}/>
        </button>
      </div>
    </aside>
  );
}

// ─── Section Tabs ─────────────────────────────────────────────────────────────
export function DashboardSectionTabs({ active }: { active: string }) {
  const navigate = useNavigate();
  const unread = useUnreadNotificationCount();
  const section = getTeacherSection(active);
  const tabs = SECTION_TABS[section as keyof typeof SECTION_TABS];
  return (
    <div className="fixed top-16 right-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur" style={{ left: SIDEBAR_W }}>
      <div className="px-7 py-3 overflow-x-auto">
        <div className="flex w-max min-w-full gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
          {tabs.map(({ id, label, path, badge }) => {
            const isActive = active === id || (active === "exams-create" && id === "exams-create");
            const shownBadge = id === "notifications" ? unread : badge;
            return (
              <button key={id} onClick={() => navigate(path)}
                className={`dashboard-tab flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.98] ${isActive ? "dashboard-tab-active bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:bg-white/60 hover:text-gray-800"}`}
                style={{ fontFamily: U }}>
                {label}
                {shownBadge ? <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: "#ef4444" }}>{shownBadge}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Notification bell (dropdown) ──────────────────────────────────────────────
function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [invites, setInvites] = useState<Collaborator[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const refresh = () => {
    notificationsApi.list("all").then(setNotifs).catch(() => {});
    collaborationApi.mine().then(rows => setInvites(rows.filter(r => r.status === "PENDING"))).catch(() => {});
  };

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const toggle = () => {
    setOpen(o => {
      if (!o) refresh();
      return !o;
    });
  };

  const markRead = async (id: string) => {
    setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));
    try { await notificationsApi.markRead(id); } catch { /* optimistic; ignore */ }
  };

  const respond = async (id: string, accept: boolean) => {
    setRespondingId(id);
    try {
      await (accept ? collaborationApi.accept(id) : collaborationApi.decline(id));
      setInvites(p => p.filter(i => i.id !== id));
    } catch (error) {
      alert(error instanceof Error && error.message ? error.message : "Failed to respond to invitation. Please try again.");
    } finally {
      setRespondingId(null);
    }
  };

  const unread = notifs.filter(n => !n.read).length;
  const badge = unread + invites.length;
  const items = notifs.slice(0, 6);

  return (
    <div className="relative" ref={boxRef}>
      <button onClick={toggle} className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 transition-all">
        <Bell size={16}/>
        {badge > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "#ef4444" }}>{badge > 9 ? "9+" : badge}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-[340px] bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-black" style={{ fontFamily: U, color: INK }}>Notifications</p>
            <button onClick={() => { setOpen(false); navigate("/dashboard/notifications"); }} className="text-[11px] font-semibold hover:underline" style={{ color: CAMEL, fontFamily: U }}>View all</button>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {invites.length > 0 && (
              <div className="p-3 space-y-2 border-b border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1" style={{ fontFamily: U }}>Invitations</p>
                {invites.map(inv => {
                  const roleLabel = inv.role === "COLLABORATOR" ? "Collaborator" : "Invigilator";
                  const responding = respondingId === inv.id;
                  return (
                    <div key={inv.id} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-bold text-gray-800" style={{ fontFamily: U }}>{inv.inviter?.name || inv.inviter?.email || "Someone"} invited you</p>
                      <p className="text-[11px] text-gray-500 mt-0.5" style={{ fontFamily: I }}>As {roleLabel} on &quot;{inv.exam?.title || "an exam"}&quot;</p>
                      <div className="flex gap-2 mt-2.5">
                        <button onClick={() => respond(inv.id, true)} disabled={responding}
                          className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold text-white rounded-lg py-1.5 disabled:opacity-50" style={{ background: INK, fontFamily: U }}>
                          <Check size={11}/>Accept
                        </button>
                        <button onClick={() => respond(inv.id, false)} disabled={responding}
                          className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold text-gray-500 border border-gray-200 rounded-lg py-1.5 hover:bg-gray-100 disabled:opacity-50" style={{ fontFamily: U }}>
                          <X size={11}/>Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {items.map(n => (
              <div key={n.id} onClick={() => !n.read && markRead(n.id)}
                className={`px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? "bg-blue-50/30" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs font-bold leading-snug ${!n.read ? "text-gray-900" : "text-gray-600"}`} style={{ fontFamily: U }}>{n.title}</p>
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: "#2563EB" }}/>}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed" style={{ fontFamily: I }}>{n.body}</p>
                <p className="text-[10px] text-gray-400 mt-1" style={{ fontFamily: I }}>{timeAgo(n.createdAt)}</p>
              </div>
            ))}
            {items.length === 0 && invites.length === 0 && (
              <div className="py-14 flex flex-col items-center">
                <Bell size={24} className="text-gray-200 mb-2"/>
                <p className="text-xs font-semibold text-gray-400" style={{ fontFamily: U }}>All clear</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
export function DashboardHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  const { user } = useAuth();
  const name = user?.name || "Teacher";
  const initials = name ? name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2) : "T";
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
        <NotificationBell/>
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={name} className="w-9 h-9 rounded-xl object-cover cursor-pointer"/>
        ) : (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold cursor-pointer" style={{ background: CAMEL, fontFamily: U }}>{initials}</div>
        )}
      </div>
    </header>
  );
}

// ─── Layout wrapper ───────────────────────────────────────────────────────────
export function DashboardLayout({ children, active, title, subtitle, actions }: {
  children: React.ReactNode; active: string; title: string; subtitle?: string; actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: CREAM }}>
        <div className="flex items-center gap-2 mb-4 animate-pulse">
           <Logo height={56} />
        </div>
        <p className="text-sm text-gray-500 font-semibold" style={{ fontFamily: I }}>Authenticating...</p>
      </div>
    );
  }

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
