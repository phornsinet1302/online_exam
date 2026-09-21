"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/hooks";
import { DashboardLayout, StatusBadge } from "@/components/dashboard/DashboardShared";
import { Users, UserCheck, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { U, I, INK, CAMEL } from "@/lib/tokens";
import { collaborationApi, Collaborator } from "@/lib/api/collaboration";

const ROLE_META = {
  COLLABORATOR: { label: "Collaborator", icon: UserCheck, color: "#2563eb", bg: "#eff6ff", desc: "You can edit questions and exam details." },
  INVIGILATOR:  { label: "Invigilator",  icon: ShieldCheck, color: "#16a34a", bg: "#f0fdf4", desc: "You can monitor the live session and review flags." },
} as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SharedExams() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    collaborationApi.mine()
      .then(data => setRows(data.filter(c => c.status === "ACCEPTED")))
      .catch(e => setError(e instanceof Error && e.message ? e.message : "Failed to load shared exams. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const open = (c: Collaborator) => {
    if (!c.exam) return;
    if (c.role === "INVIGILATOR") {
      navigate(`/dashboard/monitoring?examId=${c.exam.id}`);
    } else {
      navigate(`/dashboard/exams/${c.exam.id}`);
    }
  };

  return (
    <DashboardLayout active="exams-shared" title="Shared with me" subtitle="Exams you've been added to as a collaborator or invigilator">
      {error ? (
        <div className="bg-white rounded-2xl border border-red-100 py-24 flex flex-col items-center gap-3">
          <AlertTriangle size={32} className="text-red-300"/>
          <p className="text-sm text-red-500 text-center max-w-xs" style={{ fontFamily:U }}>{error}</p>
          <button onClick={load} className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background:INK, fontFamily:U }}>Try again</button>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-24 flex flex-col items-center gap-3">
          <RefreshCw size={24} className="text-gray-300 animate-spin"/>
          <p className="text-sm text-gray-400" style={{ fontFamily:U }}>Loading shared exams…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-24 text-center">
          <Users size={32} className="text-gray-200 mb-3"/>
          <p className="text-sm font-semibold text-gray-400" style={{ fontFamily:U }}>No exams have been shared with you yet</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs" style={{ fontFamily:I }}>When a teacher invites you as a collaborator or invigilator and you accept, their exam shows up here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map(c => {
            const meta = ROLE_META[c.role];
            const Icon = meta.icon;
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: meta.bg, color: meta.color, fontFamily: U }}>
                    <Icon size={12}/>{meta.label}
                  </span>
                  {c.exam && <StatusBadge status={c.exam.status.toLowerCase()}/>}
                </div>
                <h3 className="text-sm font-black mb-1 leading-snug" style={{ fontFamily: U, color: INK }}>{c.exam?.title || "Untitled exam"}</h3>
                <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: I }}>{c.exam?.subject || "No subject"} · Joined {formatDate(c.createdAt)}</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1" style={{ fontFamily: I }}>
                  {meta.desc} Invited by <strong>{c.inviter?.name || c.inviter?.email || "the exam owner"}</strong>.
                </p>
                <button onClick={() => open(c)} className="w-full text-xs font-semibold py-2 rounded-lg text-white hover:opacity-90 transition-all" style={{ background: INK, fontFamily: U }}>
                  {c.role === "INVIGILATOR" ? "Monitor session" : "Open exam"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
