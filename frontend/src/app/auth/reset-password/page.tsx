"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { authApi } from "@/lib/api/auth";
import { Logo } from "@/components/Logo";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";

const MIN_LENGTH = 8;

// Defined at module level on purpose: a component declared inside another one is
// a new type on every render, which remounts the form and drops input focus.
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: CREAM }}>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-9 max-w-md w-full">
        <div className="flex justify-center mb-6"><Logo height={56} /></div>
        {children}
      </div>
    </div>
  );
}

// The page the "reset your password" email opens. The link carries a short-lived
// session in the URL; it is only used to authorise the password change (it is
// not saved as a login). Once the password is changed the user is signed in
// with it and taken to the dashboard.
export default function ResetPasswordPage() {
  const router = useRouter();
  const { login } = useAuth();
  const started = useRef(false);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<"signed-in" | "sign-in-needed" | null>(null);

  useEffect(() => {
    if (started.current) return; // dev StrictMode runs effects twice
    started.current = true;

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const get = (k: string) => params.get(k) ?? query.get(k);

    const token = get("access_token");
    const errorCode = get("error_code");
    const errorDescription = get("error_description");

    // Keep the token out of the address bar and browser history.
    window.history.replaceState(null, "", window.location.pathname);

    if (token && get("type") === "recovery") {
      setAccessToken(token);
    } else if (get("error") || errorCode) {
      const expired = errorCode === "otp_expired" || /expired|invalid/i.test(errorDescription ?? "");
      setLinkError(expired
        ? "This reset link has expired or was already used. Reset links only work once, for about an hour."
        : (errorDescription || "We couldn't verify this reset link."));
    } else {
      setLinkError("Open this page from the link in your password reset email.");
    }
    setChecking(false);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (password.length < MIN_LENGTH) { setFormError(`Password must be at least ${MIN_LENGTH} characters.`); return; }
    if (password !== confirm) { setFormError("The two passwords don't match."); return; }
    if (!accessToken) return;

    setSaving(true);
    try {
      const res = await authApi.resetPassword(accessToken, password);
      if (res.access_token && res.user) {
        // Signed in with the new password — no separate login needed.
        login(res.access_token, res.user, res.refresh_token);
        setDone("signed-in");
        setTimeout(() => router.replace("/dashboard"), 900);
      } else {
        setDone("sign-in-needed");
      }
    } catch (err: any) {
      const message: string = err?.message || "Couldn't reset your password. Please try again.";
      // A link that stopped working mid-way (expired / already used) can't be retried here.
      if (/expired|already used|reset email/i.test(message)) { setLinkError(message); setAccessToken(null); }
      else setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <Shell>
        <div className="flex flex-col items-center py-4">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: CAMEL, borderTopColor: "transparent" }} />
          <p className="text-gray-600 font-medium" style={{ fontFamily: I }}>Checking your reset link…</p>
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#ecfdf5" }}><CheckCircle2 size={28} style={{ color: "#059669" }} /></div>
          <h1 className="text-xl font-black mb-2" style={{ fontFamily: U, color: INK }}>Password updated</h1>
          {done === "signed-in" ? (
            <p className="text-sm text-gray-500" style={{ fontFamily: I }}>Taking you to your dashboard…</p>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: I }}>Your password was changed. Sign in with the new one to continue.</p>
              <button onClick={() => router.replace("/?auth=login")} className="w-full text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 transition-all" style={{ background: INK, fontFamily: U }}>Go to sign in</button>
            </>
          )}
        </div>
      </Shell>
    );
  }

  if (linkError || !accessToken) {
    return (
      <Shell>
        <div className="text-center">
          <h1 className="text-xl font-black mb-2" style={{ fontFamily: U, color: INK }}>This link can't be used</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-6" style={{ fontFamily: I }}>{linkError}</p>
          <button onClick={() => router.replace("/?auth=forgot")} className="w-full text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 transition-all" style={{ background: INK, fontFamily: U }}>Send me a new reset link</button>
          <button onClick={() => router.replace("/?auth=login")} className="mt-3 text-xs font-semibold hover:underline" style={{ color: CAMEL, fontFamily: U }}>Back to sign in</button>
        </div>
      </Shell>
    );
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors";
  return (
    <Shell>
      <h1 className="text-2xl font-black mb-1 text-center" style={{ fontFamily: U, color: INK }}>Choose a new password</h1>
      <p className="text-sm text-gray-500 mb-6 text-center" style={{ fontFamily: I }}>Pick something you haven't used before. At least {MIN_LENGTH} characters.</p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="relative">
          <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" required autoFocus autoComplete="new-password" className={`${inputCls} pr-11`} style={{ fontFamily: I }} />
          <button type="button" onClick={() => setShowPw(s => !s)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
        </div>
        <input type={showPw ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm new password" required autoComplete="new-password" className={inputCls} style={{ fontFamily: I }} />
        {formError && <p className="text-xs font-semibold text-red-500" style={{ fontFamily: I }}>{formError}</p>}
        <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] mt-1 disabled:opacity-60" style={{ background: INK, fontFamily: U }}>
          {saving ? <RefreshCw size={15} className="animate-spin" /> : "Update password & sign in"}
        </button>
      </form>
    </Shell>
  );
}
