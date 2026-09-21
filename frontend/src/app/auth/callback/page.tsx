"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { authApi } from "@/lib/api/auth";
import { Logo } from "@/components/Logo";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";

// Where Supabase sends people after they click the confirmation link in their
// email (and after Google sign-in). The link carries the session in the URL, so
// the user is signed in right here and taken straight to the dashboard — they
// never have to log in again after confirming.
export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuth();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return; // dev StrictMode runs effects twice
    started.current = true;

    // A password-recovery link must not log the user straight in — it belongs
    // on the reset page, where they choose a new password first.
    if (/[#&]type=recovery(&|$)/.test(window.location.hash)) {
      window.location.replace(`/auth/reset-password${window.location.hash}`);
      return;
    }

    // Tokens arrive in the URL hash; failures arrive as ?error / #error.
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const get = (k: string) => params.get(k) ?? query.get(k);

    const accessToken = get("access_token");
    const refreshToken = get("refresh_token");
    const errorCode = get("error_code");
    const errorDescription = get("error_description");

    // Don't leave the tokens sitting in the address bar / browser history.
    window.history.replaceState(null, "", window.location.pathname);

    if (!accessToken) {
      if (get("error") || errorCode) {
        const expired = errorCode === "otp_expired" || /expired|invalid/i.test(errorDescription ?? "");
        setError(expired
          ? "This confirmation link has expired or was already used. If you've already confirmed your email, just sign in."
          : (errorDescription || "We couldn't verify your email. Please try signing in."));
        return;
      }
      // Opened directly: go to the dashboard if already signed in, else the home page.
      router.replace(localStorage.getItem("token") ? "/dashboard" : "/");
      return;
    }

    // Save both tokens so the session can be silently refreshed later.
    localStorage.setItem("token", accessToken);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);

    // Create/load the account on our side, then go straight into the app.
    authApi.google(accessToken)
      .then(res => {
        login(accessToken, res.user, refreshToken ?? undefined);
        router.replace("/dashboard");
      })
      .catch(err => {
        console.error("Failed to finish sign-in", err);
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        setError("Your email is confirmed, but we couldn't finish signing you in. Please sign in with your email and password.");
      });
  }, [router, login]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: CREAM }}>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-9 max-w-md w-full text-center">
          <div className="flex justify-center mb-5"><Logo height={56} /></div>
          <h1 className="text-xl font-black mb-2" style={{ fontFamily: U, color: INK }}>We couldn't sign you in</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-6" style={{ fontFamily: I }}>{error}</p>
          <button onClick={() => router.replace("/?auth=login")}
            className="w-full text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 transition-all" style={{ background: INK, fontFamily: U }}>
            Go to sign in
          </button>
          <button onClick={() => router.replace("/?auth=register")}
            className="mt-3 text-xs font-semibold hover:underline" style={{ color: CAMEL, fontFamily: U }}>
            Create a new account instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: CREAM }}>
      <div className="flex flex-col items-center">
        <Logo height={64} />
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mt-5 mb-4" style={{ borderColor: CAMEL, borderTopColor: "transparent" }}></div>
        <p className="text-gray-600 font-medium" style={{ fontFamily: I }}>Confirming your account…</p>
      </div>
    </div>
  );
}
