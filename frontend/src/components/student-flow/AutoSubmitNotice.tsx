"use client";

import { useNavigate } from "@/lib/hooks";
import { Clock } from "lucide-react";
import { U, I, INK, CREAM } from "@/lib/tokens";

export function AutoSubmitNotice() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:CREAM}}>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-10 max-w-md w-full text-center overflow-hidden relative">
        <div className="h-1.5 w-full absolute top-0 inset-x-0 rounded-t-3xl" style={{background:"linear-gradient(90deg,#f97316,#ef4444)"}}/>
        <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center mx-auto mb-6">
          <Clock size={36} className="text-orange-500"/>
        </div>
        <h1 className="text-2xl font-black mb-2" style={{fontFamily:U,color:INK}}>Time&apos;s Up!</h1>
        <p className="text-sm text-gray-500 mb-4" style={{fontFamily:I}}>Your exam has been automatically submitted because the time limit was reached.</p>
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 mb-7">
          <p className="text-xs text-orange-700" style={{fontFamily:I}}>Your answers up to this point have been saved. No further changes can be made.</p>
        </div>
        <button onClick={()=>navigate("/student/exam/success")}
          className="w-full py-3.5 rounded-2xl text-white font-black text-sm hover:opacity-90" style={{background:INK,fontFamily:U}}>
          View submission →
        </button>
      </div>
    </div>
  );
}
