"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { Bell, X, CheckCheck, Activity, AlertTriangle } from "lucide-react";
import { U, I, INK, CAMEL } from "@/lib/tokens";
import { notificationsApi, Notification, NotificationType } from "@/lib/api/notifications";

const BLUE = "#2563EB";

const TYPE_META: Record<NotificationType, { icon: any; color: string }> = {
  exam: { icon: Activity, color: "#eff6ff" },
  alert: { icon: AlertTriangle, color: "#fff0f0" },
  grade: { icon: CheckCheck, color: "#f0fdf4" },
  system: { icon: Bell, color: `${CAMEL}15` },
};

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

export function DashboardNotifications() {
  const [filter, setFilter] = useState("all");
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    notificationsApi
      .list(filter)
      .then((data) => { if (!cancelled) setNotifs(data); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error && e.message ? e.message : "Failed to load notifications."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filter]);

  const tabs = ["all", "exam", "alert", "grade", "system"];
  const unread = notifs.filter(n => !n.read).length;

  const markRead = async (id: string) => {
    setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));
    try { await notificationsApi.markRead(id); } catch { /* optimistic; ignore */ }
  };

  const markAllRead = async () => {
    setNotifs(p => p.map(n => ({ ...n, read: true })));
    try { await notificationsApi.markAllRead(); } catch { /* optimistic; ignore */ }
  };

  const remove = async (id: string) => {
    setNotifs(p => p.filter(n => n.id !== id));
    try { await notificationsApi.remove(id); } catch { /* optimistic; ignore */ }
  };

  return (
    <DashboardLayout active="notifications" title="Notifications" subtitle={unread > 0 ? `${unread} unread` : undefined}>
      <div className="w-full">
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1">
            {tabs.map(t => (
              <button key={t} onClick={() => setFilter(t)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-all ${filter === t ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`} style={{ background: filter === t ? INK : undefined, fontFamily: U }}>{t}</button>
            ))}
          </div>
          <button onClick={markAllRead} className="text-xs font-semibold flex items-center gap-1.5 hover:underline" style={{ color: CAMEL, fontFamily: U }}><CheckCheck size={13}/>Mark all read</button>
        </div>
        <div className="space-y-2">
          {loading && (
            <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-20">
              <p className="text-sm font-semibold text-gray-400" style={{ fontFamily: U }}>Loading…</p>
            </div>
          )}
          {!loading && error && (
            <div className="bg-white rounded-2xl border border-red-100 flex flex-col items-center py-20">
              <p className="text-sm font-semibold text-red-400" style={{ fontFamily: U }}>{error}</p>
            </div>
          )}
          {!loading && !error && notifs.map(n => {
            const meta = TYPE_META[n.type] ?? TYPE_META.system;
            const Icon = meta.icon;
            return (
              <div key={n.id} onClick={() => !n.read && markRead(n.id)} className={`bg-white rounded-2xl border transition-all hover:shadow-md cursor-pointer ${!n.read ? "border-blue-100" : "border-gray-100"}`}>
                <div className="flex gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.color }}><Icon size={18} style={{ color: INK }}/></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-bold leading-snug ${!n.read ? "text-gray-900" : "text-gray-600"}`} style={{ fontFamily: U }}>{n.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: BLUE }}/>}
                        <button onClick={e => { e.stopPropagation(); remove(n.id); }} className="text-gray-300 hover:text-red-400 transition-colors p-0.5"><X size={13}/></button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed" style={{ fontFamily: I }}>{n.body}</p>
                    <p className="text-[11px] text-gray-400 mt-1.5" style={{ fontFamily: I }}>{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {!loading && !error && notifs.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-20"><Bell size={32} className="text-gray-200 mb-3"/><p className="text-sm font-semibold text-gray-400" style={{ fontFamily: U }}>All clear</p></div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
