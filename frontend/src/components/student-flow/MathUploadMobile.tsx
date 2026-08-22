"use client";

import { useState, useRef } from "react";
import { Upload, Camera, CheckCircle2, GraduationCap } from "lucide-react";
import { U, I, INK, CAMEL, CREAM } from "@/lib/tokens";

const S  = "#059669";
const SL = "#ecfdf5";

function StudentHeader() {
  return (
    <header className="flex items-center px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:INK}}>
          <GraduationCap size={15} className="text-white"/>
        </div>
        <span className="text-base font-black" style={{fontFamily:U,color:INK}}>exam<span style={{color:CAMEL}}>·ai</span></span>
      </div>
    </header>
  );
}

export function MathUploadMobile() {
  const [preview, setPreview] = useState<string|null>(null);
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const raw = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const qid = raw?.get("q") ?? "?";

  const handleFile = (e:React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPreview(URL.createObjectURL(f));
  };

  return (
    <div className="min-h-screen flex flex-col" style={{background:CREAM}}>
      <StudentHeader/>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="h-1" style={{background:`linear-gradient(90deg,${INK},${S})`}}/>
          <div className="p-7">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{background:SL}}>
                <Upload size={24} style={{color:S}}/>
              </div>
              <h1 className="text-xl font-black mb-1" style={{fontFamily:U,color:INK}}>Upload Solution</h1>
              <p className="text-xs text-gray-400" style={{fontFamily:I}}>Question {qid} — handwritten solution</p>
            </div>
            {uploaded?(
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 size={40} style={{color:S}}/>
                <p className="font-black text-lg" style={{fontFamily:U,color:INK}}>Uploaded!</p>
                <p className="text-xs text-gray-400 text-center" style={{fontFamily:I}}>Return to your exam on the main device to continue.</p>
              </div>
            ):!preview?(
              <div className="space-y-3">
                <button onClick={()=>fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                  <Camera size={20} className="text-gray-400"/>
                  <span className="text-sm font-semibold text-gray-500" style={{fontFamily:U}}>Take photo</span>
                </button>
                <button onClick={()=>fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all">
                  <Upload size={18} className="text-gray-400"/>
                  <span className="text-sm font-semibold text-gray-500" style={{fontFamily:U}}>Choose from gallery</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile}/>
              </div>
            ):(
              <div>
                <img src={preview} alt="Solution preview" className="w-full h-48 object-cover rounded-2xl mb-4"/>
                <div className="flex gap-2">
                  <button onClick={()=>setPreview(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500" style={{fontFamily:U}}>Retake</button>
                  <button onClick={()=>setUploaded(true)} className="flex-1 py-3 rounded-xl text-white font-black text-sm hover:opacity-90" style={{background:S,fontFamily:U}}>Submit →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
