"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardLayout, Toggle } from "@/components/dashboard/DashboardShared";
import { User, Lock, Bell, Shield, CheckCircle2, Camera, Eye, EyeOff, Check, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { authApi, DEFAULT_NOTIFICATION_PREFS, NotificationPrefs, DEFAULT_PRIVACY_PREFS, PrivacyPrefs } from "@/lib/api/auth";
import { U, I, INK, CAMEL } from "@/lib/tokens";

const AVATAR_MAX_BYTES = 3 * 1024 * 1024;
const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function DashboardSettings() {
  const { user, updateUser } = useAuth();

  const [tab, setTab]               = useState("profile");
  const [name, setName]             = useState(user?.name || "");
  const [email, setEmail]           = useState(user?.email || "");
  const [phone, setPhone]           = useState(user?.phone || "");
  const [institution, setInstitution] = useState(user?.institution || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [bio, setBio]               = useState(user?.bio || "");
  const [curPw, setCurPw]           = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwSaved, setPwSaved]       = useState(false);
  const [pwError, setPwError]       = useState("");
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [notifsSaved, setNotifsSaved] = useState(false);
  const [privacyPrefs, setPrivacyPrefs] = useState<PrivacyPrefs>(DEFAULT_PRIVACY_PREFS);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // The auth session resolves asynchronously — user is often still null on
  // first render, so sync the form fields once the real profile loads.
  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setInstitution(user.institution || "");
    setDepartment(user.department || "");
    setBio(user.bio || "");
    setNotifPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...(user.notificationPrefs || {}) });
    setPrivacyPrefs({ ...DEFAULT_PRIVACY_PREFS, ...(user.privacyPrefs || {}) });
  }, [user]);

  const initials = name ? name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) : "U";

  const save = () => { setSaved(true); setTimeout(()=>setSaved(false),2500); };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const result = await authApi.updateProfile({ name, phone, institution, department, bio });
      updateUser(result.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      alert(error instanceof Error && error.message ? error.message : "Failed to save profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const pwRequirementsMet = newPw.length >= 8 && /[A-Z]/.test(newPw) && /\d/.test(newPw) && /[^A-Za-z0-9]/.test(newPw);

  const changePassword = async () => {
    setPwError("");
    if (!curPw || !newPw || !confirmPw) {
      setPwError("Please fill in all password fields.");
      return;
    }
    if (!pwRequirementsMet) {
      setPwError("New password doesn't meet the requirements below.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("New password and confirmation don't match.");
      return;
    }
    setChangingPw(true);
    try {
      await authApi.changePassword({ currentPassword: curPw, newPassword: newPw });
      setCurPw("");
      setNewPw("");
      setConfirmPw("");
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    } catch (error) {
      setPwError(error instanceof Error && error.message ? error.message : "Failed to update password. Please try again.");
    } finally {
      setChangingPw(false);
    }
  };

  const saveNotifications = async () => {
    setSavingNotifs(true);
    try {
      const result = await authApi.updateNotificationPrefs(notifPrefs);
      updateUser({ notificationPrefs: result.notificationPrefs });
      setNotifsSaved(true);
      setTimeout(() => setNotifsSaved(false), 2500);
    } catch (error) {
      alert(error instanceof Error && error.message ? error.message : "Failed to save preferences. Please try again.");
    } finally {
      setSavingNotifs(false);
    }
  };

  const savePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      const result = await authApi.updatePrivacyPrefs(privacyPrefs);
      updateUser({ privacyPrefs: result.privacyPrefs });
      setPrivacySaved(true);
      setTimeout(() => setPrivacySaved(false), 2500);
    } catch (error) {
      alert(error instanceof Error && error.message ? error.message : "Failed to save privacy settings. Please try again.");
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      alert("Please upload a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      alert("That image is too large. Please upload a photo up to 3MB.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setAvatarUploading(true);
    try {
      const result = await authApi.uploadAvatar(file);
      updateUser({ avatarUrl: result.user.avatarUrl });
    } catch (error) {
      setAvatarPreview(null);
      alert(error instanceof Error && error.message ? error.message : "Failed to upload photo. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  };
  const tabs = [{ id:"profile",label:"Profile",icon:User },{ id:"password",label:"Password",icon:Lock },{ id:"notifications",label:"Notifications",icon:Bell },{ id:"privacy",label:"Privacy",icon:Shield }];

  return (
    <DashboardLayout active="settings" title="Settings">
      <div className="w-full">
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6 w-fit">
          {tabs.map(({ id,label,icon:Icon })=>(
            <button key={id} onClick={()=>setTab(id)} className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all ${tab===id?"text-white shadow-sm":"text-gray-500 hover:text-gray-700"}`} style={{ background:tab===id?INK:undefined, fontFamily:U }}><Icon size={14}/>{label}</button>
          ))}
        </div>

        {tab==="profile"&&(
          <div className="bg-white rounded-2xl border border-gray-100 p-7">
            <div className="flex items-center gap-5 mb-8 pb-8 border-b border-gray-100">
              <div className="relative">
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange}/>
                {(avatarPreview || user?.avatarUrl) ? (
                  <img src={avatarPreview || user?.avatarUrl || undefined} alt="Profile photo" className="w-20 h-20 rounded-2xl object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black" style={{ background:CAMEL, fontFamily:U }}>{initials}</div>
                )}
                <button onClick={()=>avatarInputRef.current?.click()} disabled={avatarUploading} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-gray-500 shadow-sm disabled:opacity-50">
                  {avatarUploading ? <RefreshCw size={13} className="animate-spin"/> : <Camera size={13}/>}
                </button>
              </div>
              <div><p className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily:U }}>Profile photo</p><p className="text-xs text-gray-400 mb-2" style={{ fontFamily:I }}>JPG, PNG or WEBP · Max 3MB</p><button onClick={()=>avatarInputRef.current?.click()} disabled={avatarUploading} className="text-xs font-semibold hover:underline disabled:opacity-50" style={{ color:CAMEL, fontFamily:U }}>{avatarUploading ? "Uploading…" : "Upload new photo"}</button></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {[{label:"Full Name",val:name,set:setName,col:2,placeholder:"e.g. Jane Doe",disabled:false},{label:"Email Address",val:email,set:setEmail,placeholder:"jane@university.edu",disabled:true},{label:"Phone Number",val:phone,set:setPhone,placeholder:"+1 (555) 000-0000",disabled:false},{label:"Institution",val:institution,set:setInstitution,placeholder:"e.g. University of Melbourne",disabled:false},{label:"Department",val:department,set:setDepartment,placeholder:"e.g. Mathematics",disabled:false}].map(({label,val,set,col,placeholder,disabled})=>(
                <div key={label} className={col===2?"sm:col-span-2":""}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>{label}{disabled && <span className="normal-case font-medium text-gray-400"> · tied to your login, can't be changed here</span>}</label>
                  <input value={val} onChange={e=>set(e.target.value)} placeholder={placeholder} disabled={disabled} className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors placeholder:text-gray-300 ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "text-gray-900 focus:border-gray-400"}`} style={{ fontFamily:I }}/>
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Bio</label>
                <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Tell us a little about your teaching experience..." rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors resize-none placeholder:text-gray-300" style={{ fontFamily:I }}/>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100">
              <button onClick={saveProfile} disabled={savingProfile} className="flex items-center gap-2 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-60" style={{ background:INK, fontFamily:U }}>
                {savingProfile ? <><RefreshCw size={15} className="animate-spin"/>Saving…</> : saved ? <><CheckCircle2 size={15}/>Saved!</> : "Save changes"}
              </button>
              <button className="text-sm font-medium text-gray-400 hover:text-gray-600 px-4 py-2.5" style={{ fontFamily:I }}>Cancel</button>
            </div>
          </div>
        )}

        {tab==="password"&&(
          <div className="bg-white rounded-2xl border border-gray-100 p-7">
            <h3 className="text-base font-black mb-2" style={{ fontFamily:U, color:INK }}>Change Password</h3>
            <p className="text-sm text-gray-500 mb-7" style={{ fontFamily:I }}>Choose a strong password you haven't used before.</p>
            <div className="max-w-sm space-y-4">
              {[["Current password",curPw,setCurPw],["New password",newPw,setNewPw],["Confirm new password",confirmPw,setConfirmPw]].map(([label,val,set])=>(
                <div key={label as string}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>{label as string}</label>
                  <div className="relative">
                    <input type={showPw?"text":"password"} value={val as string} onChange={e=>(set as (v:string)=>void)(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
                    <button type="button" onClick={()=>setShowPw(s=>!s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">{showPw?<EyeOff size={15}/>:<Eye size={15}/>}</button>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[{l:"8+ characters",ok:newPw.length>=8},{l:"Uppercase",ok:/[A-Z]/.test(newPw)},{l:"Number",ok:/\d/.test(newPw)},{l:"Special char",ok:/[^A-Za-z0-9]/.test(newPw)}].map(({l,ok})=>(
                  <div key={l} className="flex items-center gap-1.5"><div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${ok?"bg-green-500":"bg-gray-200"}`}>{ok&&<Check size={8} className="text-white"/>}</div><span className={`text-xs ${ok?"text-green-600":"text-gray-400"}`} style={{ fontFamily:I }}>{l}</span></div>
                ))}
              </div>
              {pwError && <p className="text-xs text-red-500" style={{ fontFamily:I }}>{pwError}</p>}
              <button onClick={changePassword} disabled={changingPw} className="flex items-center gap-2 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 mt-2 disabled:opacity-60" style={{ background:INK, fontFamily:U }}>
                {changingPw ? <><RefreshCw size={15} className="animate-spin"/>Updating…</> : pwSaved ? <><CheckCircle2 size={15}/>Updated!</> : "Update password"}
              </button>
            </div>
          </div>
        )}

        {tab==="notifications"&&(
          <div className="bg-white rounded-2xl border border-gray-100 p-7">
            <h3 className="text-base font-black mb-2" style={{ fontFamily:U, color:INK }}>Notification Preferences</h3>
            <p className="text-sm text-gray-500 mb-7" style={{ fontFamily:I }}>Control what you're notified about.</p>
            {[{key:"examAlerts",l:"Exam start & end alerts",d:"When an exam goes live or time runs out"},{key:"flagAlerts",l:"Proctoring flags",d:"When a student is flagged"},{key:"gradeReady",l:"Grading complete",d:"When auto-grading finishes"},{key:"weeklyReport",l:"Weekly summary",d:"Performance digest every Monday"},{key:"systemUpdates",l:"Platform updates",d:"New features and maintenance"},{key:"studentJoins",l:"Student joins exam",d:"Each time a student enters"}].map(({key,l,d})=>(
              <div key={key} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                <div><p className="text-sm font-semibold text-gray-800" style={{ fontFamily:U }}>{l}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{d}</p></div>
                <Toggle on={(notifPrefs as unknown as Record<string,boolean>)[key]} onChange={()=>setNotifPrefs(p=>({...p,[key]:!p[key as keyof typeof p]}))}/>
              </div>
            ))}
            <button onClick={saveNotifications} disabled={savingNotifs} className="flex items-center gap-2 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 mt-6 disabled:opacity-60" style={{ background:INK, fontFamily:U }}>
              {savingNotifs ? <><RefreshCw size={15} className="animate-spin"/>Saving…</> : notifsSaved ? <><CheckCircle2 size={15}/>Saved!</> : "Save preferences"}
            </button>
          </div>
        )}

        {tab==="privacy"&&(
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-7">
              <h3 className="text-base font-black mb-2" style={{ fontFamily:U, color:INK }}>Privacy & Data</h3>
              <p className="text-sm text-gray-500 mb-6" style={{ fontFamily:I }}>Control what's shared about you and your usage.</p>
              {[{key:"shareUsageData",l:"Share anonymised usage data",d:"Helps improve the platform. No personal data."},{key:"showInDirectory",l:"Appear in institution directory",d:"Others at your institution can find you."},{key:"allowResearch",l:"Allow research participation",d:"Occasional academic research surveys."}].map(({key,l,d})=>(
                <div key={key} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                  <div><p className="text-sm font-semibold text-gray-800" style={{ fontFamily:U }}>{l}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{d}</p></div>
                  <Toggle on={(privacyPrefs as unknown as Record<string,boolean>)[key]} onChange={()=>setPrivacyPrefs(p=>({...p,[key]:!p[key as keyof typeof p]}))}/>
                </div>
              ))}
              <button onClick={savePrivacy} disabled={savingPrivacy} className="flex items-center gap-2 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 mt-6 disabled:opacity-60" style={{ background:INK, fontFamily:U }}>
                {savingPrivacy ? <><RefreshCw size={15} className="animate-spin"/>Saving…</> : privacySaved ? <><CheckCircle2 size={15}/>Saved!</> : "Save privacy settings"}
              </button>
            </div>
            <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
              <h3 className="text-sm font-black text-red-700 mb-2" style={{ fontFamily:U }}>Danger Zone</h3>
              <p className="text-xs text-red-500 mb-4" style={{ fontFamily:I }}>These actions are permanent and cannot be undone.</p>
              <div className="flex gap-3">
                <button className="text-xs font-semibold text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors" style={{ fontFamily:U }}>Delete all exam data</button>
                <button className="text-xs font-semibold text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors" style={{ fontFamily:U }}>Close account</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
