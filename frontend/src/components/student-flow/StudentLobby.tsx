"use client";

import { useNavigate } from "@/lib/hooks";
import { MOCK_EXAMS } from "@/lib/mock-data";
import { CheckCircle2 } from "lucide-react";
import { U, I, INK, CREAM } from "@/lib/tokens";

export function StudentLobby() {
  const navigate = useNavigate();
  const raw  = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const code = raw?.get("code") ?? "";
  const exam = MOCK_EXAMS.find(e=>e.code.toUpperCase()===code.toUpperCase());

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background:CREAM }}>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-green-50">
          <CheckCircle2 size={30} className="text-green-500"/>
        </div>
        <h1 className="text-xl font-black mb-2" style={{ fontFamily:U, color:INK }}>Access granted!</h1>
        <p className="text-sm text-gray-500 mb-1" style={{ fontFamily:I }}>{exam?.title ?? code}</p>
        <p className="text-xs text-gray-400 mb-8" style={{ fontFamily:I }}>Student exam screens coming next…</p>
        <button onClick={()=>navigate("/student/enter")} className="text-xs font-semibold text-gray-500 underline" style={{ fontFamily:U }}>← Back to entry</button>
      </div>
    </div>
  );
}
