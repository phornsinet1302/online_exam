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

      // The Google session token is only needed once, to prove who this student is.
      // Take it out of the address bar and browser history straight away.
      window.history.replaceState(null, "", window.location.pathname);

      // Where to send the student if something goes wrong: back to their details form.
      let backTo = "/student/enter";
      try {
        const studentId = localStorage.getItem("pending_student_id") || "";
        const code = localStorage.getItem("pending_exam_code") || "";
        const examId = localStorage.getItem("pending_exam_id") || "";
        const examPassword = sessionStorage.getItem("pending_exam_password") || undefined;

        // Clean up
        localStorage.removeItem("pending_student_id");
        localStorage.removeItem("pending_exam_code");
        localStorage.removeItem("pending_exam_id");
        sessionStorage.removeItem("pending_exam_password");

        backTo = code ? `/student/info?code=${encodeURIComponent(code)}` : "/student/enter";

        if (!studentId || !code || !examId) {
          throw new Error("Missing session details. Please try again.");
        }

        // The server verifies the Google session itself and takes the student's
        // real name and email from it (so nothing is asked of Supabase from the
        // browser, and nothing can be faked). It also ends that Google session
        // straight away — a student must not stay signed in.
        setStatus("Registering you for the exam...");
        const regResult = await registerStudent(examId, "Student", studentId, { password: examPassword, googleToken: accessToken });
        localStorage.setItem("student_token", regResult.token);

        const waitingParams = new URLSearchParams();
        waitingParams.set("examId", examId);
        waitingParams.set("code", code);
        router.push(`/student/waiting?${waitingParams.toString()}`);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to complete authentication.");
        setTimeout(() => router.push(backTo), 3500);
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
