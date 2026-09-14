"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { INK, CREAM, U } from "@/lib/tokens";
import { registerStudent } from "@/lib/api/session";

export default function StudentAuthCallback() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Verifying Google account...");
  const processed = useRef(false);

  useEffect(() => {
    const processAuth = async () => {
      if (processed.current) return;
      processed.current = true;

      const hash = window.location.hash;
      if (!hash) {
        setError("No authentication token found.");
        setTimeout(() => router.push("/student/enter"), 3000);
        return;
      }

      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      
      if (!accessToken) {
        setError("Authentication failed.");
        setTimeout(() => router.push("/student/enter"), 3000);
        return;
      }

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jfebblgfihkhuaewxnjs.supabase.co";
        // Note: The Anon key is required by Supabase to hit the /auth/v1/user endpoint.
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
        
        const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "apikey": anonKey
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch user profile from Google.");
        }

        const data = await res.json();
        const email = data.email || "";
        const name = data.user_metadata?.full_name || "Student";
        
        const studentId = localStorage.getItem("pending_student_id") || "";
        const code = localStorage.getItem("pending_exam_code") || "";
        const examId = localStorage.getItem("pending_exam_id") || "";

        // Sign out from Supabase so the student doesn't stay logged in as a teacher
        fetch(`${supabaseUrl}/auth/v1/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "apikey": anonKey
          }
        }).catch(() => {}); // fire and forget

        // Clean up
        localStorage.removeItem("pending_student_id");
        localStorage.removeItem("pending_exam_code");
        localStorage.removeItem("pending_exam_id");

        if (!studentId || !code || !examId) {
          throw new Error("Missing session details. Please try again.");
        }

        // Register the student directly and go to waiting room
        setStatus("Registering you for the exam...");
        const regResult = await registerStudent(examId, name, studentId, email);
        localStorage.setItem("student_token", regResult.token);

        const waitingParams = new URLSearchParams();
        waitingParams.set("examId", examId);
        waitingParams.set("code", code);
        router.push(`/student/waiting?${waitingParams.toString()}`);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to complete authentication.");
        setTimeout(() => router.push("/student/enter"), 3000);
      }
    };

    processAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CREAM }}>
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {error ? (
          <>
            <p className="text-xl font-black mb-4 text-red-500" style={{ fontFamily: U }}>{error}</p>
            <p className="text-sm text-gray-500">Redirecting back...</p>
          </>
        ) : (
          <>
            <Loader2 className="animate-spin text-gray-400 mb-4" size={32} />
            <p className="text-lg font-bold" style={{ fontFamily: U, color: INK }}>{status}</p>
          </>
        )}
      </div>
    </div>
  );
}
