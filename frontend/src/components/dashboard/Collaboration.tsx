"use client";

import { useState } from "react";
import { Crown, UserCheck, ShieldCheck, Mail, ArrowRight, Check, CheckCircle2, UserPlus, Link, Copy, MoreVertical, Trash2, RefreshCw, UserX, Users } from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";
import { useNavigate } from "@/lib/hooks";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { MOCK_EXAMS } from "@/lib/mock-data";

const ROLES = [
  { id:"owner",       label:"Owner",       icon:Crown,      color:"#d97706", bg:"#fffbeb", desc:"Full access. Can delete exam and manage all roles." },
  { id:"collaborator",label:"Collaborator",icon:UserCheck,  color:"#2563eb", bg:"#eff6ff", desc:"Can edit exam content, questions, and settings." },
  { id:"invigilator", label:"Invigilator", icon:ShieldCheck,color:"#16a34a", bg:"#f0fdf4", desc:"Can monitor live sessions and view results only." },
];

export function InviteCollaborators() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("collaborator");
  const [examId, setExamId] = useState("1");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);

  const send = ()=>{
    if(!email.trim()) return;
    setSending(true);
    setTimeout(()=>{ setSent(p=>[...p,`${email} (${role})`]); setEmail(""); setSending(false); },700);
  };

  const copyLink = ()=>{ setLinkCopied(true); setTimeout(()=>setLinkCopied(false),2000); };

  const selectedRole = ROLES.find(r=>r.id===role)!;

  return (
    <DashboardLayout active="collab-invite" title="Invite Collaborators" subtitle="Add co-teachers or invigilators to your exams"
      actions={<button onClick={()=>navigate("/dashboard/collaboration/manage")} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}>Manage roles ΓåÆ</button>}>

      <div className="max-w-2xl space-y-5">
        {/* Exam selector */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>Invite to exam</p>
          <select value={examId} onChange={e=>setExamId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}>
            {MOCK_EXAMS.filter(e=>e.status!=="archived").map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>

        {/* Role picker */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4" style={{ fontFamily:U }}>Role</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
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
            <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
              type="email" placeholder="colleague@school.edu"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-gray-400 placeholder:text-gray-400" style={{ fontFamily:I }}/>
            <button onClick={send} disabled={!email.trim()||sending}
              className="flex items-center gap-2 text-white text-sm font-bold px-5 py-3 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all" style={{ background:INK, fontFamily:U }}>
              {sending?<RefreshCw size={14} className="animate-spin"/>:<UserPlus size={14}/>}
              {sending?"SendingΓÇª":"Send invite"}
            </button>
          </div>

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
            <span className="flex-1 text-xs text-gray-600 truncate font-mono">https://examai.app/invite/{MOCK_EXAMS.find(e=>e.id===examId)?.code?.toLowerCase()}</span>
            <button onClick={copyLink} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all" style={{ background:linkCopied?"#f0fdf4":"#F0EDE8", color:linkCopied?"#16a34a":INK, fontFamily:U }}>
              {linkCopied?<><Check size={11}/>Copied</>:<><Copy size={11}/>Copy</>}
            </button>
          </div>
          <p className="text-[11px] text-gray-400" style={{ fontFamily:I }}>Link expires after 7 days. Anyone with this link gets <strong>{role}</strong> access to the selected exam.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
// COLLABORATION ΓÇö MANAGE ROLES
// ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
const MOCK_COLLABS = [
  { name:"Sarah Connor",  email:"s.connor@school.edu", role:"collaborator", exam:"All exams",        avatar:"SC", joined:"Jul 1, 2026",  status:"active" },
  { name:"David Nguyen",  email:"d.nguyen@school.edu", role:"invigilator",  exam:"Biology Mid-term", avatar:"DN", joined:"Jul 5, 2026",  status:"active" },
  { name:"Priya Sharma",  email:"p.sharma@school.edu", role:"invigilator",  exam:"Calculus Final",   avatar:"PS", joined:"Jul 8, 2026",  status:"pending"},
  { name:"Marcus Bell",   email:"m.bell@school.edu",   role:"collaborator", exam:"All exams",        avatar:"MB", joined:"Jun 28, 2026", status:"active" },
];

export function ManageCollaborators() {
  const navigate = useNavigate();
  const [collabs, setCollabs] = useState(MOCK_COLLABS);
  const [removing, setRemoving] = useState<string|null>(null);

  const changeRole = (email:string, newRole:string)=>setCollabs(p=>p.map(c=>c.email===email?{...c,role:newRole}:c));
  const remove = (email:string)=>{
    setRemoving(email);
    setTimeout(()=>{ setCollabs(p=>p.filter(c=>c.email!==email)); setRemoving(null); },600);
  };

  const roleStyle = (r:string)=>({
    owner:       { color:"#d97706", bg:"#fffbeb" },
    collaborator:{ color:"#2563eb", bg:"#eff6ff" },
    invigilator: { color:"#16a34a", bg:"#f0fdf4" },
  }[r]||{ color:"#6b7280", bg:"#f9fafb" });

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
        <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily:U }}>{collabs.length} collaborators</p>
        {collabs.map(c=>{
          const rs = roleStyle(c.role);
          const isRemoving = removing===c.email;
          return (
            <div key={c.email} className={`bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 transition-all ${isRemoving?"opacity-30 scale-95":""}`}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background:CAMEL, fontFamily:U }}>{c.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-800 truncate" style={{ fontFamily:U }}>{c.name}</p>
                  {c.status==="pending"&&<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600" style={{ fontFamily:U }}>Pending</span>}
                </div>
                <p className="text-xs text-gray-400 truncate" style={{ fontFamily:I }}>{c.email} ┬╖ {c.exam} ┬╖ Joined {c.joined}</p>
              </div>
              {/* Role selector */}
              <select value={c.role} onChange={e=>changeRole(c.email,e.target.value)}
                className="text-xs font-bold border rounded-xl px-3 py-2 focus:outline-none cursor-pointer" style={{ color:rs.color, background:rs.bg, borderColor:`${rs.color}30`, fontFamily:U }}>
                <option value="owner">Owner</option>
                <option value="collaborator">Collaborator</option>
                <option value="invigilator">Invigilator</option>
              </select>
              <button onClick={()=>remove(c.email)} disabled={isRemoving} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Remove">
                <UserX size={15}/>
              </button>
            </div>
          );
        })}
        {collabs.length===0&&(
          <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3">
            <Users size={32} className="text-gray-200"/>
            <p className="text-sm text-gray-400" style={{ fontFamily:U }}>No collaborators yet</p>
            <button onClick={()=>navigate("/dashboard/collaboration")} className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background:INK, fontFamily:U }}>Invite someone</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );

}
