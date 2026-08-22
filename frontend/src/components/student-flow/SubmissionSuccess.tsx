"use client";

import { useNavigate } from "@/lib/hooks";
import { CheckCircle2 } from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";

const S  = "#059669";
const SL = "#ecfdf5";

export function SubmissionSuccess() {
  const navigate = useNavigate();
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  const dateStr = now.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:CREAM}}>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-10 max-w-md w-full text-center overflow-hidden relative">
        <div className="h-1.5 w-full absolute top-0 inset-x-0" style={{background:`linear-gradient(90deg,${S},${CAMEL})`}}/>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{background:SL}}>
          <CheckCircle2 size={48} style={{color:S}}/>
        </div>
        <h1 className="text-3xl font-black mb-2" style={{fontFamily:U,color:INK}}>Submitted!</h1>
        <p className="text-sm text-gray-500 mb-7" style={{fontFamily:I}}>Your exam has been received. Good luck with your results!</p>
        <div className="bg-gray-50 rounded-2xl p-5 mb-7 text-left space-y-3">
          {[{l:"Exam",v:"Calculus Final Exam"},{l:"Submitted at",v:`${timeStr} · ${dateStr}`},{l:"Questions answered",v:"9 / 12"},{l:"Time used",v:"56 min 18 sec"},{l:"Status",v:"Under review"}].map(({l,v})=>(
            <div key={l} className="flex items-center justify-between">
              <span className="text-xs text-gray-400" style={{fontFamily:I}}>{l}</span>
              <span className="text-xs font-bold text-gray-700" style={{fontFamily:U}}>{v}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <button onClick={()=>navigate("/student/results")}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm hover:opacity-90" style={{background:S,fontFamily:U}}>
            View results
          </button>
          <button onClick={()=>navigate("/student/history")}
            className="w-full py-3 text-sm font-semibold text-gray-500 border border-gray-200 rounded-2xl hover:bg-gray-50" style={{fontFamily:U}}>
            Exam history
          </button>
        </div>
      </div>
    </div>
  );
}
