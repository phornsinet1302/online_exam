"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "@/lib/hooks";
import { DashboardLayout, StatusBadge, CopyField, Toggle } from "@/components/dashboard/DashboardShared";
import { Pencil, ChevronRight, Download, Clock, Users, Play, StopCircle, Wifi, WifiOff, Loader2, UserX, ClipboardList, AlertTriangle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { examsApi } from "@/lib/api/exams";
import { startExamSession, endExamSession } from "@/lib/api/session";
import { rosterApi, RosterEntry } from "@/lib/api/roster";
import { API_URL } from "@/lib/api/client";
import { U, I, INK, CAMEL } from "@/lib/tokens";

const S = "#059669";
const SL = "#ecfdf5";

// ─── Live Session Panel ───────────────────────────────────────────────────────
function LiveSessionPanel({ examId, sessionState, onSessionChange }: {
  examId: string;
  sessionState: string;
  onSessionChange: (state: string) => void;
}) {
  const [waitingStudents, setWaitingStudents] = useState<any[]>([]);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!examId) return;
    const es = new EventSource(`${API_URL}/session/${examId}/teacher-live`);
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
  }, [examId]);

  const handleStart = async () => {
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
                : `${waitingStudents.length} student${waitingStudents.length !== 1 ? "s" : ""} waiting to start`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live connection indicator */}
          <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
            style={{ fontFamily: U }}>
            {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
            {connected ? "Live" : "Reconnecting..."}
          </span>
          {!isActive && !isEnded && (
            <button onClick={handleStart} disabled={starting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white hover:opacity-90 transition-all disabled:opacity-60"
              style={{ background: S, fontFamily: U }}>
              {starting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {starting ? "Starting..." : "Start Exam Now"}
            </button>
          )}
          {isActive && (
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
        </div>
      )}
    </div>
  );
}

// ─── Roster Panel ─────────────────────────────────────────────────────────────
function parseRosterText(text: string): { email: string; name?: string }[] {
  const emailRegex = /[^\s<>,;]+@[^\s<>,;]+\.[^\s<>,;]+/;
  const entries: { email: string; name?: string }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(emailRegex);
    if (!match) continue;
    const email = match[0];
    const name = line.replace(email, "").replace(/[<>,;]/g, "").trim();
    entries.push(name ? { email, name } : { email });
  }
  return entries;
}

function RosterPanel({ examId }: { examId: string }) {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError("");
    rosterApi.get(examId)
      .then(setRoster)
      .catch(e => setError(e instanceof Error && e.message ? e.message : "Failed to load the roster. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [examId]);

  const save = async () => {
    const entries = parseRosterText(text);
    if (entries.length === 0) { setSaveError("Paste at least one valid email, one per line."); return; }
    setSaving(true);
    setSaveError("");
    try {
      const updated = await rosterApi.upload(examId, entries);
      setRoster(updated);
      setText("");
    } catch (e) {
      setSaveError(e instanceof Error && e.message ? e.message : "Failed to save the roster. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setRemovingId(id);
    try {
      await rosterApi.remove(examId, id);
      setRoster(p => p.filter(r => r.id !== id));
    } catch (e) {
      alert(e instanceof Error && e.message ? e.message : "Failed to remove student. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-5">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black" style={{ fontFamily: U, color: INK }}>Expected Students</h3>
            <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: I }}>{roster.length} on roster</p>
          </div>
        </div>
        {error ? (
          <div className="p-10 text-center">
            <AlertTriangle size={28} className="mx-auto mb-2 text-red-300"/>
            <p className="text-sm text-red-500 mb-3" style={{ fontFamily: U }}>{error}</p>
            <button onClick={load} className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background: INK, fontFamily: U }}>Try again</button>
          </div>
        ) : loading ? (
          <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-gray-300" size={22}/></div>
        ) : roster.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardList size={28} className="mx-auto mb-2 text-gray-200"/>
            <p className="text-sm text-gray-400" style={{ fontFamily: I }}>No roster uploaded yet — attendance will just show who joined.</p>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
            {roster.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-6 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: CAMEL, fontFamily: U }}>
                  {(r.name || r.email)[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate" style={{ fontFamily: U }}>{r.name || r.email}</p>
                  {r.name && <p className="text-xs text-gray-400 truncate" style={{ fontFamily: I }}>{r.email}</p>}
                </div>
                <button onClick={() => remove(r.id)} disabled={removingId === r.id} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50 flex-shrink-0">
                  {removingId === r.id ? <Loader2 size={13} className="animate-spin"/> : <UserX size={14}/>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-black mb-1" style={{ fontFamily: U, color: INK }}>Upload roster</h3>
        <p className="text-xs text-gray-400 mb-4" style={{ fontFamily: I }}>Paste one student per line — email, or &quot;Name, email&quot;. This replaces the current roster.</p>
        <textarea value={text} onChange={e => { setText(e.target.value); setSaveError(""); }} rows={8}
          placeholder={"jane.doe@school.edu\nJohn Smith, john.smith@school.edu"}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-700 focus:outline-none focus:border-gray-400 resize-none mb-3" style={{ fontFamily: I }}/>
        {saveError && <p className="text-xs text-red-500 mb-3" style={{ fontFamily: I }}>{saveError}</p>}
        <button onClick={save} disabled={saving || !text.trim()} className="w-full text-sm font-bold text-white py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all" style={{ background: INK, fontFamily: U }}>
          {saving ? "Saving…" : "Save roster"}
        </button>
      </div>
    </div>
  );
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
      if (initialTab && ["session", "overview", "sharing", "roster", "settings", "preview"].includes(initialTab)) {
        setTab(initialTab);
      }
    }
  }, []);

  const [privacy, setPrivacy] = useState("public");
  const [proctoring, setProctoring] = useState(true);
  const [shuffleQ, setShuffleQ] = useState(true);

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

  const tabs = ["session", "overview", "sharing", "roster", "settings", "preview"];

  const sessionStateLabel: Record<string, string> = {
    WAITING: "Waiting",
    ACTIVE: "Active",
    ENDED: "Ended",
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
        {sessionState !== "ENDED" && (
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
          sessionState={sessionState}
          onSessionChange={setSessionState}
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

      {/* Roster tab */}
      {tab === "roster" && <RosterPanel examId={exam.id} />}

      {/* Settings tab */}
      {tab === "settings" && (
        <div className="max-w-lg">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-1">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily: U, color: INK }}>Exam Settings</h3>
            {[{ l: "Enable live proctoring", d: "Face detection and tab monitoring", on: proctoring, set: setProctoring }, { l: "Randomize questions", d: "Different order for each student", on: shuffleQ, set: setShuffleQ }].map(({ l, d, on, set }) => (
              <div key={l} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                <div><p className="text-sm font-semibold text-gray-700" style={{ fontFamily: U }}>{l}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: I }}>{d}</p></div>
                <Toggle on={on} onChange={() => set((s: boolean) => !s)} />
              </div>
            ))}
            <div className="pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: U }}>Privacy</p>
              <div className="flex gap-2">
                {["public", "private", "password"].map(p => (
                  <button key={p} onClick={() => setPrivacy(p)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border capitalize transition-all ${privacy === p ? "text-white border-transparent" : "border-gray-200 text-gray-500"}`} style={{ background: privacy === p ? INK : undefined, fontFamily: U }}>{p}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="text-sm font-bold text-white px-6 py-2.5 rounded-xl hover:opacity-90" style={{ background: INK, fontFamily: U }}>Save settings</button>
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
                  {(q.type === 'MCQ' || q.type === 'MULTIPLE_SELECT' || q.type === 'TRUE_FALSE') && q.options ? (
                    <div className="space-y-2">
                      {q.options.map((o: any) => (
                        <div key={o.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm text-gray-700" style={{ fontFamily: I }}>
                          <div className={`w-4 h-4 flex-shrink-0 border-2 border-gray-300 ${q.type === 'MULTIPLE_SELECT' ? 'rounded' : 'rounded-full'}`} />
                          {o.text}
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
