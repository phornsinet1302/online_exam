"use client";

import { Check } from "lucide-react";
import { U, I, INK } from "@/lib/tokens";

export type StudentIdentity = "NAME_ID" | "GOOGLE";

const OPTIONS: { id: StudentIdentity; label: string; desc: string }[] = [
  { id: "NAME_ID", label: "Name + Student ID", desc: "Students type their full name and Student ID. No sign-in needed." },
  { id: "GOOGLE", label: "Google sign-in + Student ID", desc: "Students sign in with Google and enter their Student ID. Their name comes from their Google account." },
];

// The teacher's choice of how students identify themselves when they join.
// `locked` is for invitation-only exams: those are matched by email, so Google
// sign-in is the only option and can't be changed.
export function StudentIdentityPicker({ value, onChange, locked = false }: {
  value: StudentIdentity;
  onChange: (v: StudentIdentity) => void;
  locked?: boolean;
}) {
  const current: StudentIdentity = locked ? "GOOGLE" : value;
  return (
    <div>
      <div className="space-y-2">
        {OPTIONS.map(opt => {
          const selected = current === opt.id;
          const disabled = locked && opt.id !== "GOOGLE";
          return (
            <button key={opt.id} type="button" disabled={disabled} onClick={() => onChange(opt.id)}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${selected ? "border-gray-800" : "border-gray-100 hover:border-gray-200"} ${disabled ? "opacity-40 cursor-not-allowed hover:border-gray-100" : "cursor-pointer"}`}>
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? "border-gray-800" : "border-gray-300"}`}>
                {selected && <div className="w-2 h-2 rounded-full" style={{ background: INK }} />}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800" style={{ fontFamily: U }}>{opt.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed" style={{ fontFamily: I }}>{opt.desc}</p>
              </div>
              {selected && <Check size={15} className="ml-auto mt-0.5 text-gray-700 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
      {locked && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-700" style={{ fontFamily: I }}>
          Invitation-only exams check each student against your Roster by email, so students must sign in with Google.
        </p>
      )}
    </div>
  );
}
