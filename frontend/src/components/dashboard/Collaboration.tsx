"use client";

import { useEffect, useState } from "react";
import { UserCheck, ShieldCheck, Check, CheckCircle2, UserPlus, Link, Copy, RefreshCw, UserX, Users, AlertTriangle } from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";
import { useNavigate } from "@/lib/hooks";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { examsApi, Exam } from "@/lib/api/exams";
import { collaborationApi, Collaborator, CollaboratorRole } from "@/lib/api/collaboration";

// "Owner" isn't a selectable role here — ownership is tied to who created the
// exam (Exam.ownerId) and can't be granted through a collaborator invite.
const ROLES: { id: CollaboratorRole; label: string; icon: any; color: string; bg: string; desc: string }[] = [
  { id:"COLLABORATOR", label:"Collaborator", icon:UserCheck,  color:"#2563eb", bg:"#eff6ff", desc:"Can edit exam content, questions, and settings." },
  { id:"INVIGILATOR",  label:"Invigilator",  icon:ShieldCheck,color:"#16a34a", bg:"#f0fdf4", desc:"Can monitor live sessions and view results only." },
];

export function InviteCollaborators() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [examsError, setExamsError] = useState("");
  const [examId, setExamId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("COLLABORATOR");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sent, setSent] = useState<string[]>([]);

  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setExamsError("");
    examsApi.getAll()
      .then((data) => {
        const active = data.filter(e => e.status !== "ARCHIVED");
        setExams(active);
        if (active.length > 0) setExamId(active[0].id);
      })
      .catch((e) => {
        setExamsError(e instanceof Error && e.message ? e.message : "Failed to load your exams. Please try again.");
      })
      .finally(() => setExamsLoading(false));
  }, []);

  useEffect(() => {
    if (!examId) { setLinkUrl(null); return; }
    let cancelled = false;
    setLinkLoading(true);
    setLinkError("");
    collaborationApi.getInviteLink(examId, role)
      .then((link) => { if (!cancelled) setLinkUrl(link.url); })
      .catch((e) => { if (!cancelled) setLinkError(e instanceof Error && e.message ? e.message : "Couldn't load the invite link."); })
      .finally(() => { if (!cancelled) setLinkLoading(false); });
    return () => { cancelled = true; };
  }, [examId, role]);

  const send = async () => {
    if (!email.trim() || !examId) return;
    setSending(true);
    setSendError("");
    try {
      const result = await collaborationApi.invite(examId, { email: email.trim(), role });
      const roleLabel = role === "COLLABORATOR" ? "Collaborator" : "Invigilator";
      setSent(p => [...p, result.isNewAccount
        ? `${email.trim()} (${roleLabel}) — wasn't on Cheating.me yet, created their account and emailed them to set it up`
        : `${email.trim()} (${roleLabel})`]);
      setEmail("");
    } catch (error) {
      setSendError(error instanceof Error && error.message ? error.message : "Failed to send invite. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const copyLink = () => {
    if (!linkUrl) return;
    navigator.clipboard.writeText(linkUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const selectedRole = ROLES.find(r => r.id === role)!;

  return (
    <DashboardLayout active="collab-invite" title="Invite Collaborators" subtitle="Add co-teachers or invigilators to your exams"
      actions={<button onClick={()=>navigate("/dashboard/collaboration/manage")} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}>Manage roles →</button>}>

      {examsError ? (
        <div className="max-w-2xl bg-white rounded-2xl border border-red-100 py-16 flex flex-col items-center gap-3">
          <AlertTriangle size={32} className="text-red-300"/>
          <p className="text-sm text-red-500 text-center max-w-xs" style={{ fontFamily:U }}>{examsError}</p>
          <button onClick={()=>{ setExamsLoading(true); setExamsError(""); examsApi.getAll().then((data)=>{ const active=data.filter(e=>e.status!=="ARCHIVED"); setExams(active); if(active.length>0) setExamId(active[0].id); }).catch((e)=>setExamsError(e instanceof Error && e.message ? e.message : "Failed to load your exams. Please try again.")).finally(()=>setExamsLoading(false)); }} className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background:INK, fontFamily:U }}>Try again</button>
        </div>
      ) : !examsLoading && exams.length === 0 ? (
        <div className="max-w-2xl bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3">
          <Users size={32} className="text-gray-200"/>
          <p className="text-sm text-gray-400" style={{ fontFamily:U }}>Create an exam first to invite collaborators to it.</p>
          <button onClick={()=>navigate("/dashboard/exams/create")} className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background:INK, fontFamily:U }}>Create an exam</button>
        </div>
      ) : (
        <div className="max-w-2xl space-y-5">
          {/* Exam selector */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Invite to exam</p>
            <select value={examId} onChange={e=>setExamId(e.target.value)} disabled={examsLoading} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:border-gray-400 disabled:opacity-50" style={{ fontFamily:I }}>
              {examsLoading && <option>Loading exams…</option>}
              {exams.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>

          {/* Role picker */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4" style={{ fontFamily:U }}>Role</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {ROLES.map(r=>{
                const Icon = r.icon;
                const active = role===r.id;
                return (
                  <button key={r.id} onClick={()=>setRole(r.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${active?"border-transparent shadow-sm":"border-gray-100 hover:border-gray-200"}`}
                    style={{ background:active?r.bg:undefined }}>
                    <Icon size={20} style={{ color:active?r.color:"#9ca3af" }}/>
                    <p className={`text-xs font-black ${active?"":"text-gray-400"}`} style={{ fontFamily:U, color:active?r.color:undefined }}>{r.label}</p>
                  </button>
                );
              })}
            </div>
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl" style={{ background:selectedRole.bg }}>
              <selectedRole.icon size={14} style={{ color:selectedRole.color, marginTop:1, flexShrink:0 }}/>
              <p className="text-xs text-gray-600 leading-relaxed" style={{ fontFamily:I }}>{selectedRole.desc}</p>
            </div>
          </div>

          {/* Email input */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4" style={{ fontFamily:U }}>Invite by email</p>
            <div className="flex gap-2">
              <input value={email} onChange={e=>{setEmail(e.target.value); setSendError("");}} onKeyDown={e=>e.key==="Enter"&&send()}
                type="email" placeholder="colleague@school.edu"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-gray-400 placeholder:text-gray-400" style={{ fontFamily:I }}/>
              <button onClick={send} disabled={!email.trim()||sending}
                className="flex items-center gap-2 text-white text-sm font-bold px-5 py-3 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all" style={{ background:INK, fontFamily:U }}>
                {sending?<RefreshCw size={14} className="animate-spin"/>:<UserPlus size={14}/>}
                {sending?"Sending…":"Send invite"}
              </button>
            </div>

            {sendError && (
              <div className="flex items-start gap-2.5 mt-3 px-3 py-2.5 bg-red-50 rounded-xl border border-red-100">
                <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5"/>
                <p className="text-xs text-red-600 flex-1" style={{ fontFamily:I }}>{sendError}</p>
              </div>
            )}

            {/* Sent list */}
            {sent.length>0&&(
              <div className="mt-4 space-y-2">
                {sent.map((s,i)=>(
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 bg-green-50 rounded-xl border border-green-100">
                    <CheckCircle2 size={14} className="text-green-500 flex-shrink-0"/>
                    <p className="text-xs text-green-700 flex-1" style={{ fontFamily:I }}>Invite sent to <strong>{s}</strong></p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invite link */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Or share an invite link</p>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 mb-3">
              <Link size={13} className="text-gray-400 flex-shrink-0"/>
              <span className="flex-1 text-xs text-gray-600 truncate font-mono">
                {linkLoading ? "Generating link…" : linkError ? linkError : (linkUrl ?? "—")}
              </span>
              <button onClick={copyLink} disabled={!linkUrl} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40" style={{ background:linkCopied?"#f0fdf4":"#F0EDE8", color:linkCopied?"#16a34a":INK, fontFamily:U }}>
                {linkCopied?<><Check size={11}/>Copied</>:<><Copy size={11}/>Copy</>}
              </button>
            </div>
            <p className="text-[11px] text-gray-400" style={{ fontFamily:I }}>Link expires after 7 days. Anyone with this link who signs in gets <strong>{selectedRole.label}</strong> access to the selected exam.</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COLLABORATION — MANAGE ROLES
// ═══════════════════════════════════════════════════════════════════════════
interface CollabRow { examId: string; examTitle: string; collab: Collaborator }

function formatJoined(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initialsOf(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) || "?";
}

export function ManageCollaborators() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [examsError, setExamsError] = useState("");

  const [rows, setRows] = useState<CollabRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsError, setRowsError] = useState("");

  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const loadExams = () => {
    setExamsLoading(true);
    setExamsError("");
    return examsApi.getAll()
      .then((data) => {
        const active = data.filter(e => e.status !== "ARCHIVED");
        setExams(active);
        return active;
      })
      .catch((e) => {
        setExamsError(e instanceof Error && e.message ? e.message : "Failed to load your exams. Please try again.");
        return [] as Exam[];
      })
      .finally(() => setExamsLoading(false));
  };

  const loadRows = (examList: Exam[]) => {
    if (examList.length === 0) { setRows([]); return; }
    setRowsLoading(true);
    setRowsError("");
    Promise.all(examList.map(e =>
      collaborationApi.list(e.id).then(list => list
        .filter(c => c.status !== "DECLINED")
        .map(c => ({ examId: e.id, examTitle: e.title, collab: c })))
    ))
      .then(lists => setRows(lists.flat()))
      .catch((e) => {
        setRowsError(e instanceof Error && e.message ? e.message : "Failed to load collaborators. Please try again.");
      })
      .finally(() => setRowsLoading(false));
  };

  useEffect(() => {
    loadExams().then(loadRows);
  }, []);

  const changeRole = async (examId: string, collab: Collaborator, newRole: CollaboratorRole) => {
    const key = `${examId}:${collab.id}`;
    const prevRole = collab.role;
    setUpdatingKey(key);
    setRows(rs => rs.map(r => r.examId === examId && r.collab.id === collab.id ? { ...r, collab: { ...r.collab, role: newRole } } : r));
    try {
      await collaborationApi.updateRole(examId, collab.id, newRole);
    } catch (error) {
      setRows(rs => rs.map(r => r.examId === examId && r.collab.id === collab.id ? { ...r, collab: { ...r.collab, role: prevRole } } : r));
      alert(error instanceof Error && error.message ? error.message : "Failed to update role. Please try again.");
    } finally {
      setUpdatingKey(null);
    }
  };

  const remove = async (examId: string, collab: Collaborator) => {
    const key = `${examId}:${collab.id}`;
    setRemovingKey(key);
    try {
      await collaborationApi.remove(examId, collab.id);
      setRows(rs => rs.filter(r => !(r.examId === examId && r.collab.id === collab.id)));
    } catch (error) {
      alert(error instanceof Error && error.message ? error.message : "Failed to remove collaborator. Please try again.");
      setRemovingKey(null);
    }
  };

  const roleStyle = (r: CollaboratorRole) => ({
    COLLABORATOR: { color: "#2563eb", bg: "#eff6ff", label: "Collaborator" },
    INVIGILATOR:  { color: "#16a34a", bg: "#f0fdf4", label: "Invigilator" },
  }[r]);

  const loading = examsLoading || rowsLoading;
  const error = examsError || rowsError;
  const retry = () => loadExams().then(loadRows);

  return (
    <DashboardLayout active="collab-manage" title="Manage Collaborators" subtitle="Control who can access and edit your exams"
      actions={<button onClick={()=>navigate("/dashboard/collaboration")} className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90" style={{ background:INK, fontFamily:U }}><UserPlus size={13}/>Invite more</button>}>

      {/* Role permission table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5 max-w-3xl">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Permissions by role</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-gray-100">{["Permission","Owner","Collaborator","Invigilator"].map(h=><th key={h} className="px-5 py-3 text-left font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                ["Edit exam content",   true,  true,  false],
                ["Manage questions",    true,  true,  false],
                ["Change settings",     true,  true,  false],
                ["Share / publish",     true,  false, false],
                ["Monitor live session",true,  true,  true ],
                ["View results",        true,  true,  true ],
                ["Export grades",       true,  true,  false],
                ["Delete exam",         true,  false, false],
                ["Manage collaborators",true,  false, false],
              ].map(([perm,...vals])=>(
                <tr key={String(perm)} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 text-gray-600" style={{ fontFamily:I }}>{perm}</td>
                  {(vals as boolean[]).map((v,i)=>(
                    <td key={i} className="px-5 py-3">
                      {v?<CheckCircle2 size={15} className="text-green-500"/>:<div className="w-4 h-px bg-gray-200 ml-1"/>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collaborator list */}
      <div className="max-w-3xl space-y-2">
        {error ? (
          <div className="bg-white rounded-2xl border border-red-100 py-16 flex flex-col items-center gap-3">
            <AlertTriangle size={32} className="text-red-300"/>
            <p className="text-sm text-red-500 text-center max-w-xs" style={{ fontFamily:U }}>{error}</p>
            <button onClick={retry} className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background:INK, fontFamily:U }}>Try again</button>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3">
            <RefreshCw size={24} className="text-gray-300 animate-spin"/>
            <p className="text-sm text-gray-400" style={{ fontFamily:U }}>Loading collaborators…</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>{rows.length} collaborator{rows.length===1?"":"s"}</p>
            {rows.map(({ examId, examTitle, collab })=>{
              const rs = roleStyle(collab.role);
              const key = `${examId}:${collab.id}`;
              const isRemoving = removingKey===key;
              const isUpdating = updatingKey===key;
              const name = collab.user?.name || collab.user?.email || "Unknown user";
              const email = collab.user?.email || "";
              return (
                <div key={key} className={`bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 transition-all ${isRemoving?"opacity-30 scale-95":""}`}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background:CAMEL, fontFamily:U }}>{initialsOf(name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800 truncate" style={{ fontFamily:U }}>{name}</p>
                      {collab.status==="PENDING"&&<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600" style={{ fontFamily:U }}>Pending</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate" style={{ fontFamily:I }}>{email} · {examTitle} · Joined {formatJoined(collab.createdAt)}</p>
                  </div>
                  {/* Role selector */}
                  <select value={collab.role} disabled={isUpdating || isRemoving} onChange={e=>changeRole(examId, collab, e.target.value as CollaboratorRole)}
                    className="text-xs font-bold border rounded-xl px-3 py-2 focus:outline-none cursor-pointer disabled:opacity-50" style={{ color:rs.color, background:rs.bg, borderColor:`${rs.color}30`, fontFamily:U }}>
                    <option value="COLLABORATOR">Collaborator</option>
                    <option value="INVIGILATOR">Invigilator</option>
                  </select>
                  <button onClick={()=>remove(examId, collab)} disabled={isRemoving || isUpdating} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50" title="Remove">
                    {isRemoving?<RefreshCw size={14} className="animate-spin"/>:<UserX size={15}/>}
                  </button>
                </div>
              );
            })}
            {rows.length===0&&(
              <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3">
                <Users size={32} className="text-gray-200"/>
                <p className="text-sm text-gray-400" style={{ fontFamily:U }}>No collaborators yet</p>
                <button onClick={()=>navigate("/dashboard/collaboration")} className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background:INK, fontFamily:U }}>Invite someone</button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
