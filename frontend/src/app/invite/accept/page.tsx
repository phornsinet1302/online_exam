"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, RefreshCw, LogIn } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { collaborationApi, AcceptLinkResult } from "@/lib/api/collaboration";
import { U, I, INK } from "@/lib/tokens";

type Status = "checking-token" | "need-login" | "accepting" | "success" | "error";

export default function AcceptInvitePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("checking-token");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AcceptLinkResult | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

  useEffect(() => {
    if (loading || token === null) return;
    if (!token) {
      setStatus("error");
      setError("This invite link is missing its token.");
      return;
    }
    if (!user) {
      setStatus("need-login");
      return;
    }
    setStatus("accepting");
    collaborationApi.acceptInviteLink(token)
      .then((res) => { setResult(res); setStatus("success"); })
      .catch((e) => {
        setError(e instanceof Error && e.message ? e.message : "Failed to accept this invite link.");
        setStatus("error");
      });
  }, [loading, user, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-sm w-full text-center">
        {(status === "checking-token" || status === "accepting") && (
          <>
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4 mx-auto"/>
            <p className="text-sm text-gray-500" style={{ fontFamily: I }}>Joining the exam…</p>
          </>
        )}

        {status === "need-login" && (
          <>
            <LogIn size={32} className="text-gray-300 mb-4 mx-auto"/>
            <h1 className="text-lg font-black mb-2" style={{ fontFamily: U, color: INK }}>Log in to accept this invite</h1>
            <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: I }}>You'll need a Cheating.me account to join this exam. Log in, then open this invite link again.</p>
            <button onClick={() => router.push("/")} className="text-white text-sm font-bold px-6 py-3 rounded-xl hover:opacity-90" style={{ background: INK, fontFamily: U }}>Go to login</button>
          </>
        )}

        {status === "success" && result && (
          <>
            <CheckCircle2 size={32} className="text-green-500 mb-4 mx-auto"/>
            <h1 className="text-lg font-black mb-2" style={{ fontFamily: U, color: INK }}>You're in!</h1>
            <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: I }}>
              You've joined <strong>{result.examTitle}</strong> as {result.role === "COLLABORATOR" ? "a Collaborator" : "an Invigilator"}.
            </p>
            <button onClick={() => router.push(`/dashboard/exams/${result.examId}`)} className="text-white text-sm font-bold px-6 py-3 rounded-xl hover:opacity-90" style={{ background: INK, fontFamily: U }}>Go to exam</button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={32} className="text-red-400 mb-4 mx-auto"/>
            <h1 className="text-lg font-black mb-2" style={{ fontFamily: U, color: INK }}>Couldn't join this exam</h1>
            <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: I }}>{error}</p>
            <button onClick={() => router.push("/dashboard")} className="text-sm font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1.5 mx-auto" style={{ fontFamily: U }}>
              <RefreshCw size={13}/>Go to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
