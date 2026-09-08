"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@/lib/hooks";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { AlertTriangle, StopCircle, Users, Wifi, WifiOff, Loader2, CheckCircle2 } from "lucide-react";
import { U, I, INK, CAMEL } from "@/lib/tokens";
import { API_URL, fetchApi } from "@/lib/api/client";
import { endExamSession, approveLateEntry, rejectLateEntry } from "@/lib/api/session";
import { examsApi } from "@/lib/api/exams";

const S = "#059669";
const BLUE = "#2563EB";

interface LiveStudent {
  attemptId: string;
  studentInfo: { name?: string; studentId?: string; email?: string };
  joinedAt: string;
  submitted?: boolean;
  violationCount?: number;
  isApproved?: boolean;
}

interface AlertEntry {
  id: number;
  time: string;
  student: string;
  event: string;
  severity: "info" | "warn" | "critical";
}

export function LiveMonitoring() {
  const navigate = useNavigate();

  // ── Exam picker ──────────────────────────────────────────────────────────────
  const [myExams, setMyExams] = useState<any[]>([]);
  const [examId, setExamId] = useState<string>("");
  const [examTitle, setExamTitle] = useState("Live Monitor");
  const [sessionState, setSessionState] = useState("WAITING");

  useEffect(() => {
    examsApi.getAll().then((data: any) => {
      const published = (data.exams || data || []).filter((e: any) => e.status === "PUBLISHED");
      setMyExams(published);
      if (published.length > 0) {
        setExamId(published[0].id);
        setExamTitle(published[0].title);
        setSessionState(published[0].sessionState || "WAITING");
      }
    }).catch(() => {});
  }, []);

  // ── Live SSE data ────────────────────────────────────────────────────────────
  const [students, setStudents] = useState<LiveStudent[]>([]);
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const alertId = useRef(0);
  const esRef = useRef<EventSource | null>(null);

  const addAlert = (student: string, event: string, severity: AlertEntry["severity"]) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}`;
    alertId.current++;
    setAlerts(prev => [{ id: alertId.current, time, student, event, severity }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    if (!examId) return;
    esRef.current?.close();
    setStudents([]);
    setAlerts([]);
    setConnected(false);

    const es = new EventSource(`${API_URL}/session/${examId}/teacher-live`);
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.addEventListener("session_state", (e) => {
      try {
        const state = JSON.parse(e.data);
        setSessionState(state.sessionState || "WAITING");
        const mapped: LiveStudent[] = (state.joinedStudents || []).map((s: any) => ({
          attemptId: s.attemptId,
          studentInfo: s.studentInfo || {},
          joinedAt: s.joinedAt,
          submitted: s.submitted || false,
          violationCount: s.violationCount || 0,
          isApproved: s.isApproved !== false,
        }));
        setStudents(mapped);
        setConnected(true);
        addAlert("All", `Session state: ${state.sessionState || "WAITING"} · ${mapped.length} student(s) online`, "info");
      } catch {}
    });

    es.addEventListener("student_joined", (e) => {
      try {
        const payload = JSON.parse(e.data);
        const info = payload.studentInfo || {};
        setStudents(prev => {
          const exists = prev.findIndex(s => s.attemptId === payload.attemptId);
          if (exists >= 0) return prev;
          return [...prev, { attemptId: payload.attemptId, studentInfo: info, joinedAt: payload.joinedAt, submitted: false, violationCount: 0, isApproved: payload.isApproved !== false }];
        });
        addAlert(info.name || "Student", "Joined the session", "info");
      } catch {}
    });

    es.addEventListener("late_approved", (e) => {
      try {
        const { attemptId } = JSON.parse(e.data);
        setStudents(prev => prev.map(s => s.attemptId === attemptId ? { ...s, isApproved: true } : s));
      } catch {}
    });

    es.addEventListener("late_rejected", (e) => {
      try {
        const { attemptId } = JSON.parse(e.data);
        setStudents(prev => prev.filter(s => s.attemptId !== attemptId));
      } catch {}
    });

    es.addEventListener("student_offline", (e) => {
      try {
        const { attemptId } = JSON.parse(e.data);
        setStudents(prev => prev.filter(s => s.attemptId !== attemptId));
        const name = students.find(s => s.attemptId === attemptId)?.studentInfo?.name || "Student";
        addAlert(name, "Left / disconnected", "warn");
      } catch {}
    });

    es.addEventListener("student_kicked", (e) => {
      try {
        const { attemptId } = JSON.parse(e.data);
        setStudents(prev => prev.filter(s => s.attemptId !== attemptId));
      } catch {}
    });

    es.addEventListener("exam_started", () => {
      setSessionState("ACTIVE");
      addAlert("System", "Exam started — all students redirected", "info");
    });

    es.addEventListener("exam_ended", () => {
      setSessionState("ENDED");
      setStudents([]);
      addAlert("System", "Exam ended — all students auto-submitted", "info");
    });

    es.addEventListener("violation", (e) => {
      try {
        const payload = JSON.parse(e.data);
        const student = students.find(s => s.attemptId === payload.attemptId);
        const name = student?.studentInfo?.name || payload.studentId || "Student";
        setStudents(prev => prev.map(s =>
          s.attemptId === payload.attemptId
            ? { ...s, violationCount: (s.violationCount || 0) + 1 }
            : s
        ));
        addAlert(name, payload.event || "Violation detected", payload.count >= 3 ? "critical" : "warn");
      } catch {}
    });

    es.addEventListener("student_submitted", (e) => {
      try {
        const { attemptId } = JSON.parse(e.data);
        const student = students.find(s => s.attemptId === attemptId);
        const name = student?.studentInfo?.name || "Student";
        setStudents(prev => prev.map(s => s.attemptId === attemptId ? { ...s, submitted: true } : s));
        addAlert(name, "Submitted exam", "info");
      } catch {}
    });

    return () => { es.close(); esRef.current = null; };
  }, [examId]);

  const handleKick = async (attemptId: string, name: string) => {
    if (!confirm(`Remove ${name} from the session?`)) return;
    try {
      await fetchApi(`/session/${examId}/attempts/${attemptId}`, { method: "DELETE" });
      setStudents(prev => prev.filter(s => s.attemptId !== attemptId));
      addAlert(name, "Removed from session by teacher", "warn");
    } catch {
      alert("Failed to remove student.");
    }
  };

  const handleEnd = async () => {
    if (!confirm("End the exam for all students? They will be auto-submitted immediately.")) return;
    setEnding(true);
    try {
      await endExamSession(examId);
      setSessionState("ENDED");
    } catch (err: any) {
      alert(err.message || "Failed to end exam.");
    } finally {
      setEnding(false);
    }
  };

  const handleApprove = async (attemptId: string, name: string) => {
    try {
      await approveLateEntry(examId, attemptId);
      setStudents(prev => prev.map(s => s.attemptId === attemptId ? { ...s, isApproved: true } : s));
      addAlert(name, "Approved for late entry", "info");
    } catch {
      alert("Failed to approve student.");
    }
  };

  const handleReject = async (attemptId: string, name: string) => {
    if (!confirm(`Reject ${name}'s request to join?`)) return;
    try {
      await rejectLateEntry(examId, attemptId);
      setStudents(prev => prev.filter(s => s.attemptId !== attemptId));
      addAlert(name, "Rejected late entry", "warn");
    } catch {
      alert("Failed to reject student.");
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────────
  const pendingApprovals = students.filter(s => s.isApproved === false);
  const flagged = students.filter(s => (s.violationCount || 0) > 0 && !s.submitted && s.isApproved !== false);
  const submitted = students.filter(s => s.submitted && s.isApproved !== false);
  const active = students.filter(s => !s.submitted && s.isApproved !== false);
  const avatarColors = [S, CAMEL, INK, BLUE, "#7c3aed", "#db2777"];

  const sevColor: Record<string, string> = { warn: "#d97706", critical: "#ef4444", info: "#3b82f6" };
  const sevBg: Record<string, string> = { warn: "#fff7ed", critical: "#fff0f0", info: "#eff6ff" };

  return (
    <DashboardLayout active="monitoring" title="Live Monitor" subtitle="Real-time exam session"
      actions={<>
        <div className="flex items-center gap-2">
          {myExams.length > 0 ? (
            <select value={examId} onChange={e => {
              const exam = myExams.find(x => x.id === e.target.value);
              setExamId(e.target.value);
              setExamTitle(exam?.title || "");
              setSessionState(exam?.sessionState || "WAITING");
            }} className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-white focus:outline-none" style={{ fontFamily: I }}>
              {myExams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          ) : (
            <span className="text-xs text-gray-400" style={{ fontFamily: I }}>No published exams</span>
          )}
        </div>
        <div className={`flex items-center gap-1.5 rounded-xl px-3 py-2 border ${connected ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
          {connected ? <Wifi size={12} className="text-green-600"/> : <WifiOff size={12} className="text-gray-400"/>}
          <span className={`text-xs font-bold ${connected ? "text-green-700" : "text-gray-400"}`} style={{ fontFamily: U }}>
            {connected ? "Live" : "Connecting..."}
          </span>
        </div>
      </>}>

      {!examId ? (
        <div className="p-20 text-center">
          <Users size={40} className="mx-auto mb-4 text-gray-200"/>
          <p className="text-sm font-black text-gray-400" style={{ fontFamily: U }}>No published exams found</p>
          <p className="text-xs text-gray-300 mt-1" style={{ fontFamily: I }}>Publish an exam to start monitoring</p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">

            {/* Session health */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${sessionState === "ACTIVE" ? "bg-green-500 animate-pulse" : sessionState === "ENDED" ? "bg-gray-400" : "bg-amber-400"}`}/>
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily: U }}>Session Health</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${sessionState === "ACTIVE" ? "bg-green-50 text-green-700" : sessionState === "ENDED" ? "bg-gray-100 text-gray-500" : "bg-amber-50 text-amber-700"}`} style={{ fontFamily: U }}>
                      {sessionState}
                    </span>
                  </div>
                  <h2 className="mt-1 text-lg font-black" style={{ fontFamily: U, color: INK }}>{examTitle}</h2>
                  <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: I }}>
                    {students.length} student{students.length !== 1 ? "s" : ""} · {submitted.length} submitted · {flagged.length} flagged
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2 lg:w-[420px]">
                  {[
                    { l: "Active", v: active.length, c: S },
                    { l: "Flagged", v: flagged.length, c: "#ef4444" },
                    { l: "Submitted", v: submitted.length, c: BLUE },
                    { l: "Total", v: students.length, c: INK },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="rounded-xl bg-gray-50 px-3 py-3 text-center">
                      <p className="text-xl font-black leading-none" style={{ fontFamily: U, color: c }}>{v}</p>
                      <p className="text-[10px] text-gray-400 mt-1" style={{ fontFamily: I }}>{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pending Approvals */}
            {pendingApprovals.length > 0 && (
              <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <div className="bg-amber-50 flex items-center justify-between border-b border-amber-100 px-5 py-4">
                  <div>
                    <h3 className="text-sm font-black text-amber-900" style={{ fontFamily: U }}>Pending Approvals</h3>
                    <p className="text-xs text-amber-700 mt-0.5" style={{ fontFamily: I }}>{pendingApprovals.length} student{pendingApprovals.length !== 1 ? "s" : ""} waiting to join</p>
                  </div>
                </div>
                <div className="grid gap-0 md:grid-cols-2 lg:grid-cols-3">
                  {pendingApprovals.map(s => {
                    const name = s.studentInfo.name || "Student";
                    const initials = name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <div key={s.attemptId} className="border-b border-gray-50 px-5 py-4 md:border-b-0 md:border-r last:border-r-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-white text-xs font-black" style={{ fontFamily: U }}>{initials}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: U }}>{name}</p>
                            <p className="text-xs text-amber-600 truncate" style={{ fontFamily: I }}>{s.studentInfo.email}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => handleApprove(s.attemptId, name)} className="flex-1 rounded-lg bg-green-500 py-2 text-xs font-bold text-white hover:bg-green-600 shadow-sm" style={{ fontFamily: U }}>Approve</button>
                          <button onClick={() => handleReject(s.attemptId, name)} className="flex-1 rounded-lg bg-red-50 py-2 text-xs font-bold text-red-600 hover:bg-red-100" style={{ fontFamily: U }}>Reject</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Flagged students */}
            {flagged.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                  <div>
                    <h3 className="text-sm font-black" style={{ fontFamily: U, color: INK }}>Needs Attention</h3>
                    <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: I }}>{flagged.length} student{flagged.length !== 1 ? "s" : ""} flagged</p>
                  </div>
                </div>
                <div className="grid gap-0 md:grid-cols-3">
                  {flagged.map(s => {
                    const name = s.studentInfo.name || "Student";
                    const initials = name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <div key={s.attemptId} className="border-b border-gray-50 px-5 py-4 md:border-b-0 md:border-r last:border-r-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center text-white text-xs font-black" style={{ fontFamily: U }}>{initials}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: U }}>{name}</p>
                            <p className="text-xs text-red-500" style={{ fontFamily: I }}>{s.violationCount} violation{s.violationCount !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => handleKick(s.attemptId, name)} className="flex-1 rounded-lg bg-red-50 py-2 text-xs font-bold text-red-600 hover:bg-red-100" style={{ fontFamily: U }}>Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All students table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h3 className="text-sm font-black" style={{ fontFamily: U, color: INK }}>Student Activity</h3>
                <div className="flex items-center gap-2 text-[11px] text-gray-400" style={{ fontFamily: I }}>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"/>Flagged</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: CAMEL }}/>Active</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: BLUE }}/>Submitted</span>
                </div>
              </div>
              {students.length === 0 ? (
                <div className="p-12 text-center">
                  <Loader2 size={28} className={`mx-auto mb-3 ${connected ? "text-gray-200" : "text-gray-300 animate-spin"}`}/>
                  <p className="text-sm text-gray-400" style={{ fontFamily: I }}>
                    {connected ? "No students online yet" : "Connecting to live stream..."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {students.map((s, idx) => {
                    const name = s.studentInfo.name || "Student";
                    const initials = name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
                    const color = s.submitted ? BLUE : (s.violationCount || 0) > 0 ? "#ef4444" : avatarColors[idx % avatarColors.length];
                    return (
                      <div key={s.attemptId} role="button" tabIndex={0}
                        onClick={() => setExpanded(expanded === s.attemptId ? null : s.attemptId)}
                        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(expanded === s.attemptId ? null : s.attemptId); }}}
                        className={`w-full px-5 py-3.5 text-left transition-colors hover:bg-gray-50 cursor-pointer ${expanded === s.attemptId ? "bg-gray-50" : ""}`}>
                        <div className="grid grid-cols-[minmax(180px,1fr)_120px_90px] items-center gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{ background: color, fontFamily: U }}>{initials}</div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: U }}>{name}</p>
                              <p className="text-xs text-gray-400 truncate" style={{ fontFamily: I }}>{s.studentInfo.studentId || s.studentInfo.email || "—"}</p>
                            </div>
                          </div>
                          <div>
                            {s.submitted
                              ? <span className="flex items-center gap-1 text-xs font-bold text-blue-600"><CheckCircle2 size={12}/>Submitted</span>
                              : <span className="text-xs text-gray-500" style={{ fontFamily: I }}>In progress</span>}
                          </div>
                          <div className="flex justify-end">
                            {(s.violationCount || 0) > 0
                              ? <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-600" style={{ fontFamily: U }}>{s.violationCount} flags</span>
                              : <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-600" style={{ fontFamily: U }}>Clear</span>}
                          </div>
                        </div>
                        {expanded === s.attemptId && (
                          <div onClick={e => e.stopPropagation()} className="mt-3 ml-12 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                            <button onClick={() => handleKick(s.attemptId, name)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100" style={{ fontFamily: U }}>Remove from session</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Alert feed */}
          <div className="sticky top-36 bg-white rounded-2xl border border-gray-100 overflow-hidden flex max-h-[calc(100vh-10rem)] flex-col">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
                <p className="text-sm font-black" style={{ fontFamily: U, color: INK }}>Alert Feed</p>
              </div>
              <span className="text-xs text-gray-400" style={{ fontFamily: I }}>{alerts.length} events</span>
            </div>
            <div className="overflow-y-auto flex-1">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-300" style={{ fontFamily: I }}>No events yet</div>
              ) : alerts.map(a => (
                <div key={a.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: sevBg[a.severity] }}>
                      <AlertTriangle size={13} style={{ color: sevColor[a.severity] }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 leading-snug" style={{ fontFamily: U }}>{a.event}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5" style={{ fontFamily: I }}>{a.student}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{a.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 space-y-2">
              {sessionState === "ACTIVE" && (
                <button onClick={handleEnd} disabled={ending}
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl text-white hover:opacity-90 disabled:opacity-60"
                  style={{ background: "#ef4444", fontFamily: U }}>
                  {ending ? <Loader2 size={12} className="animate-spin"/> : <StopCircle size={12}/>}
                  {ending ? "Ending..." : "End exam for all"}
                </button>
              )}
              <button onClick={() => navigate("/dashboard/monitoring/logs")} className="w-full text-xs font-semibold py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily: U }}>View full logs →</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
