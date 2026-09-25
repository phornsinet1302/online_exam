"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "@/lib/hooks";
import { DashboardLayout, StatusBadge, CopyField, Toggle } from "@/components/dashboard/DashboardShared";
import { Pencil, ChevronRight, Download, Clock, Users, Play, StopCircle, Wifi, WifiOff, Loader2, UserX, ClipboardList, AlertTriangle, RotateCcw, X, Upload } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { examsApi } from "@/lib/api/exams";
import { startExamSession, endExamSession, getTeacherStreamUrl } from "@/lib/api/session";
import { RulesConfig } from "@/components/monitoring/RulesConfig";
import { API_URL } from "@/lib/api/client";
import { to12h } from "@/lib/datetime";
import { U, I, INK, CAMEL } from "@/lib/tokens";

const S = "#059669";
const SL = "#ecfdf5";

// ─── Reopen Exam dialog ───────────────────────────────────────────────────────
const REOPEN_PRESETS = [0, 5, 10, 15, 30, 60];

function ReopenDialog({ exam, onClose, onReopened }: { exam: any; onClose: () => void; onReopened: (exam: any) => void }) {
  const [minutes, setMinutes] = useState(0);
  const [newDuration, setNewDuration] = useState(exam.duration || 10);
  const [hardClose, setHardClose] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("23:59");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const tz = exam.timezone || "UTC";
  const fmt = (d: Date) => {
    const opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };
    try { return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: tz }).format(d); }
    catch { return new Intl.DateTimeFormat("en-GB", opts).format(d); }
  };
  const start = new Date(Date.now() + Math.max(0, minutes) * 60_000);
  const end = new Date(start.getTime() + newDuration * 60_000);

  const manual = !!exam.manualStart;

  const submit = async () => {
    setError("");
    if (!manual && (!Number.isInteger(minutes) || minutes < 0)) { setError("Enter a valid start time."); return; }
    if (!manual && (!Number.isInteger(newDuration) || newDuration < 1)) { setError("Enter a valid duration."); return; }
    let endParams: { endDate: string; endTime: string } | null = null;
    if (!manual && hardClose) {
      if (!endDate) { setError("Pick the date the exam should close, or turn the hard close off."); return; }
      const [y, m, d] = endDate.split("-");
      endParams = { endDate: `${m}/${d}/${y}`, endTime: to12h(endTime || "23:59") };
    }
    setBusy(true);
    try {
      const updated = await examsApi.reopen(exam.id, { startsInMinutes: minutes, duration: newDuration, ...(endParams ?? {}) });
      onReopened(updated);
    } catch (e: any) {
      setError(e?.message || "Couldn't reopen the exam. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background: "rgba(13,27,42,0.55)", backdropFilter: "blur(8px)" }} onClick={busy ? undefined : onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg,${INK},${CAMEL})` }} />
        <div className="p-7">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-black" style={{ fontFamily: U, color: INK }}>Reopen exam</h3>
            <button onClick={onClose} disabled={busy} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-50"><X size={15} /></button>
          </div>
          <p className="text-xs text-gray-500 mb-5 leading-relaxed" style={{ fontFamily: I }}>
            {manual
              ? <>Opens the waiting room for <strong>{exam.title?.trim()}</strong> again. Nothing is scheduled: students wait in the lobby and the exam starts when you press Start. Earlier results are kept, and Max Attempts still applies.</>
              : <>Starts a new session for <strong>{exam.title?.trim()}</strong>. The waiting room opens right away, so students can enter the code before it starts. Earlier results are kept, and Max Attempts still applies.</>}
          </p>

          {!manual && <>
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" style={{ fontFamily: U }}>Start in</p>
              <div className="flex flex-wrap items-center gap-2">
                {REOPEN_PRESETS.map(m => (
                  <button key={m} onClick={() => setMinutes(m)} className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${minutes === m ? "text-white border-transparent" : "border-gray-200 text-gray-500 hover:border-gray-300"}`} style={{ background: minutes === m ? INK : undefined, fontFamily: U }}>{m === 0 ? 'Now' : `${m}m`}</button>
                ))}
                <input type="number" min={0} max={20160} value={minutes} onChange={e => setMinutes(parseInt(e.target.value, 10) || 0)}
                  className="w-16 border border-gray-200 rounded-xl px-2 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-400" style={{ fontFamily: I }} aria-label="Custom minutes" />
              </div>
            </div>
            
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" style={{ fontFamily: U }}>New Duration</p>
              <div className="flex items-center gap-2">
                <input type="number" min={1} max={1440} value={newDuration} onChange={e => setNewDuration(parseInt(e.target.value, 10) || 0)}
                  className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-400" style={{ fontFamily: I }} />
                <span className="text-xs font-semibold text-gray-500">minutes</span>
              </div>
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 mb-3 cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-gray-700" style={{ fontFamily: U }}>Set a hard close time</p>
              <p className="text-[11px] text-gray-400" style={{ fontFamily: I }}>Otherwise it closes {newDuration} min after it starts.</p>
            </div>
            <Toggle on={hardClose} onChange={() => setHardClose(h => !h)} />
          </label>
          {hardClose && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily: I }} />
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily: I }} />
            </div>
          )}

          <div className="rounded-xl bg-gray-50 px-4 py-3 mb-5 text-xs text-gray-600 space-y-1" style={{ fontFamily: I }}>
            <p>Starts <strong>{fmt(start)}</strong></p>
            <p>{hardClose && endDate ? <>Closes <strong>{endDate} {endTime}</strong></> : <>Closes <strong>{fmt(end)}</strong></>} <span className="text-gray-400">({tz})</span></p>
          </div>
          </>}

          {error && <p className="text-xs text-red-500 mb-3 leading-relaxed" style={{ fontFamily: I }}>{error}</p>}
          <button onClick={submit} disabled={busy} className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-50" style={{ background: INK, fontFamily: U }}>
            {busy ? <><Loader2 size={14} className="animate-spin" />Reopening…</> : <><RotateCcw size={14} />Reopen exam</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Live Session Panel ───────────────────────────────────────────────────────
function LiveSessionPanel({ examId, exam, sessionState, onSessionChange, onReopened, canControl }: {
  examId: string;
  exam: any;
  sessionState: string;
  onSessionChange: (state: string) => void;
  onReopened: (exam: any) => void;
  // Starting/ending/reopening the session is owner-only; everyone else just watches.
  canControl: boolean;
}) {
  const [showReopen, setShowReopen] = useState(false);
  const [waitingStudents, setWaitingStudents] = useState<any[]>([]);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;
    let cancelled = false;
    setStreamUrl(null);
    getTeacherStreamUrl(examId)
      .then(url => { if (!cancelled) setStreamUrl(url); })
      .catch(() => { if (!cancelled) setConnected(false); });
    return () => { cancelled = true; };
  }, [examId]);

  useEffect(() => {
    if (!examId || !streamUrl) return;
    const es = new EventSource(streamUrl);
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.addEventListener("session_state", (e) => {
      try {
        const state = JSON.parse(e.data);
        setWaitingStudents(state.joinedStudents || []);
        if (state.sessionState) onSessionChange(state.sessionState);
        setConnected(true);
      } catch { }
    });

    es.addEventListener("student_joined", (e) => {
      try {
        const payload = JSON.parse(e.data);
        setWaitingStudents(prev => {
          const exists = prev.findIndex(s => s.attemptId === payload.attemptId);
          if (exists >= 0) {
            const updated = [...prev];
            updated[exists] = { ...updated[exists], ...payload };
            return updated;
          }
          return [...prev, payload];
        });
      } catch { }
    });

    es.addEventListener("student_offline", (e) => {
      try {
        const { attemptId } = JSON.parse(e.data);
        setWaitingStudents(prev => prev.filter(s => s.attemptId !== attemptId));
      } catch { }
    });

    es.addEventListener("student_kicked", (e) => {
      try {
        const { attemptId } = JSON.parse(e.data);
        setWaitingStudents(prev => prev.filter(s => s.attemptId !== attemptId));
      } catch { }
    });

    es.addEventListener("exam_started", () => {
      onSessionChange("ACTIVE");
    });

    es.addEventListener("exam_ended", () => {
      onSessionChange("ENDED");
      setWaitingStudents([]);
    });

    return () => { es.close(); esRef.current = null; };
  }, [examId, streamUrl]);

  const handleStart = async () => {
    const n = waitingStudents.length;
    if (!confirm(`Start the exam now? ${n === 0 ? "No students are in the waiting room yet." : `${n} student${n === 1 ? "" : "s"} in the waiting room will begin immediately.`} The timer starts for everyone.`)) return;
    setStarting(true);
    try {
      await startExamSession(examId);
      onSessionChange("ACTIVE");
    } catch (err: any) {
      alert(err.message || "Failed to start exam.");
    } finally {
      setStarting(false);
    }
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      await endExamSession(examId);
      onSessionChange("ENDED");
    } catch (err: any) {
      alert(err.message || "Failed to end exam.");
    } finally {
      setEnding(false);
    }
  };

  const isActive = sessionState === "ACTIVE";
  const isEnded = sessionState === "ENDED";
  const avatarColors = [S, CAMEL, INK, "#2563EB", "#7c3aed", "#db2777"];

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={`rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap`}
        style={{ background: isActive ? SL : isEnded ? "#f3f4f6" : INK }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{
              background: isActive ? S : isEnded ? "#9ca3af" : CAMEL,
              boxShadow: isActive ? `0 0 0 4px ${SL}` : undefined,
              animation: isActive ? undefined : "pulse 1.5s infinite",
            }} />
            <span className="text-xs font-black uppercase tracking-wider"
              style={{ fontFamily: U, color: isActive ? S : isEnded ? "#6b7280" : "#fde68a" }}>
              {isActive ? "Session Active" : isEnded ? "Session Ended" : "Waiting Room Open"}
            </span>
          </div>
          <p className="text-sm" style={{
            fontFamily: I,
            color: isActive ? "#065f46" : isEnded ? "#6b7280" : "rgba(255,255,255,0.75)"
          }}>
            {isActive
              ? `${waitingStudents.length} student${waitingStudents.length !== 1 ? "s" : ""} currently in the exam`
              : isEnded
                ? "This exam session has ended"
                : `${waitingStudents.length} student${waitingStudents.length !== 1 ? "s" : ""} waiting${exam.manualStart ? " — press Start whenever you're ready" : " to start"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live connection indicator */}
          <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
            style={{ fontFamily: U }}>
            {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
            {connected ? "Live" : "Reconnecting..."}
          </span>
          {canControl && !isActive && !isEnded && (
            <button onClick={handleStart} disabled={starting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white hover:opacity-90 transition-all disabled:opacity-60"
              style={{ background: S, fontFamily: U }}>
              {starting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {starting ? "Starting..." : exam.manualStart ? "Start Exam" : "Start Exam Now"}
            </button>
          )}
          {canControl && isActive && (
            <button onClick={handleEnd} disabled={ending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white hover:opacity-90 transition-all disabled:opacity-60"
              style={{ background: "#ef4444", fontFamily: U }}>
              {ending ? <Loader2 size={14} className="animate-spin" /> : <StopCircle size={14} />}
              {ending ? "Ending..." : "End Exam"}
            </button>
          )}
        </div>
      </div>

      {/* Student list */}
      {!isEnded && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black" style={{ fontFamily: U, color: INK }}>
                {isActive ? "Students in Exam" : "Students in Waiting Room"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: I }}>
                Updates in real-time via live connection
              </p>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-full"
              style={{ background: `${S}15`, color: S, fontFamily: U }}>
              {waitingStudents.length} online
            </span>
          </div>
          {waitingStudents.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-400" style={{ fontFamily: I }}>
                {isActive ? "No active students" : "Waiting for students to join..."}
              </p>
              <p className="text-xs text-gray-300 mt-1" style={{ fontFamily: I }}>
                Students join using the exam code or link
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4">
              {waitingStudents.map((student, idx) => {
                const info = student.studentInfo || {};
                const name = info.name || "Student";
                const initials = name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
                const color = avatarColors[idx % avatarColors.length];
                return (
                  <div key={student.attemptId}
                    className="flex flex-col items-center rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                    <div className="relative mb-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white"
                        style={{ background: color, fontFamily: U }}>{initials}</div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                        style={{ background: S }} />
                    </div>
                    <p className="text-xs font-black truncate w-full" style={{ fontFamily: U, color: INK }}>{name}</p>
                    <p className="text-[10px] text-gray-400 truncate w-full mt-0.5" style={{ fontFamily: I }}>
                      {info.studentId || info.email || "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isEnded && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <StopCircle size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-black text-gray-500" style={{ fontFamily: U }}>Session has ended</p>
          <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: I }}>
            Student results are available in the Overview tab
          </p>
          {canControl && (
            <button onClick={() => setShowReopen(true)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white hover:opacity-90 transition-all" style={{ background: INK, fontFamily: U }}>
              <RotateCcw size={14} />Reopen exam
            </button>
          )}
        </div>
      )}

      {showReopen && (
        <ReopenDialog exam={exam} onClose={() => setShowReopen(false)}
          onReopened={updated => { setShowReopen(false); onReopened(updated); }} />
      )}
    </div>
  );
}

// ─── Roster Panel ─────────────────────────────────────────────────────────────
// ─── Shared UI Helpers ────────────────────────────────────────────────────────
function DetailRow({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="py-4 border-b border-gray-50 last:border-0">
      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1" style={{ fontFamily: U }}>{label}</p>
      <div className="text-sm text-gray-800 font-medium" style={{ fontFamily: I }}>{value}</div>
      {note && <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: I }}>{note}</p>}
    </div>
  );
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionState, setSessionState] = useState("WAITING");

  useEffect(() => {
    if (id) {
      examsApi.getById(id as string).then(data => {
        setExam(data);
        setSessionState(data.sessionState || "WAITING");
        setPrivacy(data.accessType === "PRIVATE" ? "private" : data.accessType === "PASSWORD_PROTECTED" ? "password" : "public");
        setShuffleQ(!!data.randomizeQuestions);
      }).catch(() => setExam(null)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  const [tab, setTab] = useState("session");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const initialTab = urlParams.get("tab");
      if (initialTab && ["session", "overview", "sharing", "rules", "settings", "preview"].includes(initialTab)) {
        setTab(initialTab);
      }
    }
  }, []);

  // Settings tab — initialised from the exam once it loads
  const [privacy, setPrivacy] = useState("public");
  const [shuffleQ, setShuffleQ] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const magicLink = exam && typeof window !== "undefined"
    ? `${window.location.origin}/join/${(exam.uniqueCode || "").toLowerCase()}`
    : exam ? `http://localhost:3000/join/${(exam.uniqueCode || "").toLowerCase()}` : "";

  const allQuestions = exam?.sections?.flatMap((s: any) => s.questions) || [];
  const scoredAttempts = (exam?.attempts || []).filter((a: any) => a.score !== null);
  const avgScore = scoredAttempts.length > 0
    ? Math.round(scoredAttempts.reduce((acc: number, a: any) => acc + a.score, 0) / scoredAttempts.length)
    : null;
  const passRate = scoredAttempts.length > 0
    ? Math.round((scoredAttempts.filter((a: any) => a.score >= (exam.passingScore || 50)).length / scoredAttempts.length) * 100)
    : null;

  const downloadQRCode = () => {
    const canvas = document.getElementById("qrCodeCanvas") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `exam-qr-${exam.uniqueCode || "code"}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  // Role-aware UI: the backend enforces these rules; this just avoids showing
  // controls that would only 403. Rules + sharing are owner-only, and an
  // Invigilator is read-only (can't edit the exam).
  const isOwner = exam?.myRole === "OWNER";
  const canEdit = exam?.myRole === "OWNER" || exam?.myRole === "COLLABORATOR";
  const tabs = ["session", "overview", "sharing", "rules", "settings", "preview"]
    .filter(t => isOwner || (t !== "rules" && t !== "sharing" && (t !== "settings" || canEdit)));

  const sessionStateLabel: Record<string, string> = {
    WAITING: "Waiting",
    ACTIVE: "Active",
    ENDED: "Ended",
  };

  const saveSettings = async () => {
    if (privacy === "password" && !settingsPassword.trim() && !exam.hasPassword) {
      setSettingsMsg({ ok: false, text: "Enter a password for this password-protected exam." });
      return;
    }
    setSettingsSaving(true);
    setSettingsMsg(null);
    try {
      const updated = await examsApi.update(exam.id, {
        accessType: privacy === "private" ? "PRIVATE" : privacy === "password" ? "PASSWORD_PROTECTED" : "PUBLIC",
        randomizeQuestions: shuffleQ,
        ...(privacy === "password" && settingsPassword.trim() ? { password: settingsPassword.trim() } : {}),
      });
      setExam((prev: any) => ({ ...prev, ...updated }));
      setSettingsPassword("");
      setSettingsMsg({ ok: true, text: "Settings saved." });
    } catch (e: any) {
      setSettingsMsg({ ok: false, text: e?.message || "Failed to save settings." });
    } finally {
      setSettingsSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-gray-400" size={28} /></div>;
  if (!exam) return <div className="p-10 text-center">Exam not found</div>;

  return (
    <DashboardLayout active="exams" title={exam.title} subtitle={`${exam.subject || "No Subject"} · ${new Date(exam.createdAt).toLocaleDateString()}`}
      actions={<>
        <StatusBadge status={exam.status} />
        {sessionState !== "WAITING" && (
          <span className={`text-xs font-black px-3 py-1.5 rounded-full`}
            style={{
              background: sessionState === "ACTIVE" ? SL : "#f3f4f6",
              color: sessionState === "ACTIVE" ? S : "#6b7280",
              fontFamily: U,
            }}>
            ● {sessionStateLabel[sessionState] || sessionState}
          </span>
        )}
        {canEdit && sessionState !== "ENDED" && (
          <button onClick={() => navigate(`/dashboard/exams/${exam.id}/edit`)} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background: INK, fontFamily: U }}><Pencil size={13} />Edit</button>
        )}
      </>}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-5" style={{ fontFamily: I }}>
        <button onClick={() => navigate("/dashboard/exams")} className="hover:text-gray-700">My Exams</button>
        <ChevronRight size={13} /><span className="text-gray-600 truncate max-w-xs">{exam.title}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 w-fit mb-5 flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-xs font-semibold px-4 py-2 rounded-lg capitalize transition-all flex items-center gap-1.5 ${tab === t ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            style={{ background: tab === t ? INK : undefined, fontFamily: U }}>
            {t === "session" && sessionState === "ACTIVE" && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            )}
            {t}
          </button>
        ))}
      </div>

      {/* Session tab (Live Control) */}
      {tab === "session" && exam.status === "PUBLISHED" && (
        <LiveSessionPanel
          examId={exam.id}
          exam={exam}
          sessionState={sessionState}
          onSessionChange={setSessionState}
          onReopened={updated => {
            setExam((prev: any) => ({ ...prev, ...updated }));
            setSessionState(updated.sessionState || "WAITING");
          }}
          canControl={isOwner}
        />
      )}
      {tab === "session" && exam.status !== "PUBLISHED" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <p className="text-sm font-black text-amber-700" style={{ fontFamily: U }}>Exam is not published</p>
          <p className="text-xs text-amber-600 mt-1 mb-4" style={{ fontFamily: I }}>
            Publish this exam first before starting a live session.
          </p>
          <button onClick={() => navigate(`/dashboard/exams/${exam.id}/edit`)}
            className="text-xs font-bold px-4 py-2 rounded-xl text-white hover:opacity-90"
            style={{ background: INK, fontFamily: U }}>
            Go to Editor
          </button>
        </div>
      )}

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { l: "Questions", v: String(exam.questionsCount || 0) },
                { l: "Duration", v: `${exam.duration || 0} min` },
                { l: "Students", v: String(exam.studentsCount || 0) },
                { l: "Avg Score", v: avgScore !== null ? `${avgScore}%` : "—" },
                { l: "Pass Rate", v: passRate !== null ? `${passRate}%` : "—" },
                { l: "Attempts", v: exam.maxAttempts ? `${exam.maxAttempts} max` : "Unlimited" }
              ].map(({ l, v }) => (
                <div key={l} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-xl font-black" style={{ fontFamily: U, color: INK }}>{v}</p>
                  <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: I }}>{l}</p>
                </div>
              ))}
            </div>
            {(exam.studentsCount || 0) > 0 && exam.attempts && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-sm font-black" style={{ fontFamily: U, color: INK }}>Student Results</h3></div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-50">{["Student", "Submitted", "Score", "Status"].map(h => <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider" style={{ fontFamily: U }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {exam.attempts.slice(0, 5).map((attempt: any) => {
                      const isPass = attempt.score !== null ? attempt.score >= (exam.passingScore || 50) : false;
                      const hasScore = attempt.score !== null;
                      return (
                        <tr key={attempt.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                          <td className="px-6 py-3 text-sm font-medium text-gray-800" style={{ fontFamily: U }}>{attempt.studentId || "Anonymous"}</td>
                          <td className="px-6 py-3 text-xs text-gray-500" style={{ fontFamily: I }}>{new Date(attempt.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-6 py-3 text-sm font-bold" style={{ fontFamily: U, color: hasScore ? (isPass ? "#16a34a" : "#ef4444") : "#9ca3af" }}>{hasScore ? `${attempt.score}%` : "—"}</td>
                          <td className="px-6 py-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${!hasScore ? "bg-gray-100 text-gray-600" : (isPass ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600")}`} style={{ fontFamily: U }}>
                              {!hasScore ? "Ongoing" : (isPass ? "PASS" : "FAIL")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-black mb-4" style={{ fontFamily: U, color: INK }}>Exam Code</h3>
            <div className="bg-gray-50 rounded-xl p-4 text-center mb-4 border border-gray-200">
              <p className="text-2xl font-black tracking-widest" style={{ fontFamily: U, color: INK }}>{exam.uniqueCode || "NO-CODE"}</p>
            </div>
            <p className="text-xs text-gray-400 text-center mb-4" style={{ fontFamily: I }}>Share this code with students to let them join</p>
            <button onClick={() => setTab("sharing")} className="w-full text-xs font-semibold py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all" style={{ fontFamily: U }}>View all sharing options</button>
          </div>
        </div>
      )}

      {/* Sharing tab */}
      {tab === "sharing" && (
        <div className="max-w-lg space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <CopyField label="Magic Link" value={magicLink} />
            <CopyField label="Exam Code" value={exam.uniqueCode || ""} />
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3" style={{ fontFamily: U }}>QR Code</p>
              <div className="flex items-start gap-5">
                <div className="bg-white p-2 rounded-xl border border-gray-200">
                  <QRCodeCanvas id="qrCodeCanvas" value={magicLink} size={100} level={"H"} includeMargin={true} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: I }}>Students can scan this code to join the exam instantly from their phone.</p>
                  <button onClick={downloadQRCode} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer" style={{ fontFamily: U }}><Download size={13} />Download PNG</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules tab */}
      {tab === "rules" && <RulesConfig targetExamId={exam.id} />}

      {/* Settings tab */}
      {tab === "settings" && (
        <div className="max-w-lg">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-1">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily: U, color: INK }}>Exam Settings</h3>
            <div className="flex items-center justify-between py-4 border-b border-gray-50">
              <div><p className="text-sm font-semibold text-gray-700" style={{ fontFamily: U }}>Randomize questions</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: I }}>Different order for each student</p></div>
              <Toggle on={shuffleQ} onChange={() => setShuffleQ(s => !s)} />
            </div>
            <div className="py-4 border-b border-gray-50">
              <p className="text-sm font-semibold text-gray-700" style={{ fontFamily: U }}>Live proctoring</p>
              <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: I }}>
                Tab-switch, copy/paste and other monitoring rules are configured per event in the{" "}
                <button onClick={() => setTab("rules")} className="font-semibold underline" style={{ color: CAMEL }}>Rules tab</button>.
              </p>
            </div>
            <div className="pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: U }}>Privacy</p>
              <div className="flex gap-2">
                {["public", "private", "password"].map(p => (
                  <button key={p} onClick={() => setPrivacy(p)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border capitalize transition-all ${privacy === p ? "text-white border-transparent" : "border-gray-200 text-gray-500"}`} style={{ background: privacy === p ? INK : undefined, fontFamily: U }}>{p}</button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: I }}>
                {privacy === "public" && "Anyone with the code or link can join."}
                {privacy === "private" && "Only invited students can join (matched by Google email)."}
                {privacy === "password" && "Students must enter the password to join."}
              </p>
              {privacy === "password" && (
                <input type="text" value={settingsPassword} onChange={e => setSettingsPassword(e.target.value)} autoComplete="off"
                  placeholder={exam.hasPassword ? "Leave blank to keep the current password" : "Set a password"}
                  className="mt-3 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400" style={{ fontFamily: I }} />
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={saveSettings} disabled={settingsSaving || !canEdit} className="text-sm font-bold text-white px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50" style={{ background: INK, fontFamily: U }}>
              {settingsSaving ? "Saving…" : "Save settings"}
            </button>
            {settingsMsg && <span className={`text-xs font-semibold ${settingsMsg.ok ? "text-green-600" : "text-red-500"}`} style={{ fontFamily: U }}>{settingsMsg.text}</span>}
          </div>
        </div>
      )}

      {/* Preview tab */}
      {tab === "preview" && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ background: "#f9fafb" }}>
              <div><p className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: I }}>Student view · Read-only preview</p><h3 className="text-sm font-bold" style={{ fontFamily: U, color: INK }}>{exam.title}</h3></div>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ fontFamily: U, color: INK }}><Clock size={14} style={{ color: CAMEL }} />{exam.duration || 0}:00</div>
            </div>
            <div className="p-6 space-y-6">
              {allQuestions.length > 0 ? allQuestions.map((q: any, i: number) => (
                <div key={q.id || i} className="border border-gray-100 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: `${CAMEL}18`, color: CAMEL, fontFamily: U }}>Q{i + 1}</span>
                    <span className="text-xs text-gray-400" style={{ fontFamily: I }}>{q.type.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-sm text-gray-800 mb-4 font-medium" style={{ fontFamily: I }}>{q.text}</p>
                  {(q.type === 'MCQ' || q.type === 'MULTIPLE_SELECT') && q.options ? (
                    <div className="space-y-2">
                      {q.options.map((o: any) => (
                        <div key={o.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm text-gray-700" style={{ fontFamily: I }}>
                          <div className={`w-4 h-4 flex-shrink-0 border-2 border-gray-300 ${q.type === 'MULTIPLE_SELECT' ? 'rounded' : 'rounded-full'}`} />
                          {o.text}
                        </div>
                      ))}
                    </div>
                  ) : q.type === 'TRUE_FALSE' ? (
                    <div className="grid grid-cols-2 gap-3">
                      {["True", "False"].map(v => (
                        <div key={v} className="rounded-xl border-2 border-gray-200 text-gray-600 py-3 text-sm font-bold text-center" style={{ fontFamily: U }}>
                          {v}
                        </div>
                      ))}
                    </div>
                  ) : q.type === 'MATCHING' && q.metadata?.pairs ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                      {/* Left Column: Prompts */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2" style={{fontFamily:I}}>Prompts</p>
                        {q.metadata.pairs.map((p: any, idx: number) => (
                          <div key={`prompt-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                            <span className="text-sm font-semibold text-gray-800 mb-2 sm:mb-0" style={{fontFamily:I}}>{p.L}</span>
                            <div className="px-4 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 bg-gray-50 flex-shrink-0">Match here</div>
                          </div>
                        ))}
                      </div>
                      {/* Right Column: Choices */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2" style={{fontFamily:I}}>Answers</p>
                        {q.metadata.pairs.map((p: any, idx: number) => (
                          <div key={`match-${idx}`} className="p-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 shadow-sm" style={{fontFamily:I}}>
                            {p.R}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : q.type === 'FILE_UPLOAD' ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500" style={{ fontFamily: I }}>
                      <Upload size={18} className="mx-auto mb-2 text-gray-400" />
                      Upload up to {q.maxFiles || "1"} file(s) — {q.fileTypes || "any type"}
                    </div>
                  ) : (
                    <textarea rows={3} placeholder="Type your answer here…" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 focus:outline-none resize-none" style={{ fontFamily: I }} />
                  )}
                </div>
              )) : (
                <div className="text-center p-10 text-gray-400 text-sm">No questions added yet.</div>
              )}
              {allQuestions.length > 0 && (
                <div className="flex justify-end gap-3">
                  <button className="text-sm text-gray-400 px-4 py-2.5" style={{ fontFamily: I }}>Previous</button>
                  <button className="text-sm font-bold text-white px-6 py-2.5 rounded-xl" style={{ background: INK, fontFamily: U }}>Next →</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
