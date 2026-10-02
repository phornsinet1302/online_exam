"use client";

import { useState, useRef } from "react";
import { Upload, Camera, CheckCircle2 } from "lucide-react";
import { U, I, INK, CREAM } from "@/lib/tokens";
import { Logo } from "@/components/Logo";

const S  = "#059669";
const SL = "#ecfdf5";

function StudentHeader() {
  return (
    <header className="flex items-center px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <Logo height={44} />
      </div>
    </header>
  );
}

export function MathUploadMobile() {
  const MAX_SIZE_MB = 10;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);

  const [preview, setPreview] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const raw = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const qid = raw?.get("q") ?? "?";
  // Session token is embedded in the QR URL by the backend's createMathUploadSession
  const sessionToken = raw?.get("session") ?? "";

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // reset so same file can be re-chosen after error
    if (!f) return;

    // ── Client-side validation ────────────────────────────────────────────
    if (!ALLOWED_TYPES.has(f.type)) {
      setError("Unsupported file type. Please upload a JPG, PNG, or PDF.");
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
      setError(`File too large (${sizeMB} MB). Max size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    // ─────────────────────────────────────────────────────────────────────

    setSelectedFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    if (!sessionToken) {
      setError("Invalid upload link — session token is missing. Please scan the QR code again.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("sessionToken", sessionToken);
      if (qid !== "?") formData.append("questionId", qid);

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const res = await fetch(`${apiBase}/exam/math-upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Upload failed (${res.status})`);
      }

      setUploaded(true);
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CREAM }}>
      <StudentHeader />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="h-1" style={{ background: `linear-gradient(90deg,${INK},${S})` }} />
          <div className="p-7">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: SL }}>
                <Upload size={24} style={{ color: S }} />
              </div>
              <h1 className="text-xl font-black mb-1" style={{ fontFamily: U, color: INK }}>Upload Solution</h1>
              <p className="text-xs text-gray-400" style={{ fontFamily: I }}>Question {qid} — handwritten solution</p>
            </div>

            {uploaded ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 size={40} style={{ color: S }} />
                <p className="font-black text-lg" style={{ fontFamily: U, color: INK }}>Uploaded!</p>
                <p className="text-xs text-gray-400 text-center" style={{ fontFamily: I }}>
                  Return to your exam on the main device to continue.
                </p>
              </div>
            ) : !preview ? (
              <div className="space-y-3">
                {/* Requirements notice */}
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>📎</span>
                  <p className="text-[11px] leading-relaxed" style={{ fontFamily: I, color: "#166534" }}>
                    <strong>Accepted:</strong> JPG, PNG, PDF &nbsp;·&nbsp; <strong>Max:</strong> 10 MB
                  </p>
                </div>
                {/* Inline error */}
                {error && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "#fff0f0", border: "1px solid #fecaca" }}>
                    <span style={{ fontSize: 13, color: "#ef4444", flexShrink: 0 }}>⚠</span>
                    <p className="text-[11px] leading-relaxed text-red-600" style={{ fontFamily: I }}>{error}</p>
                  </div>
                )}
                <button
                  onClick={() => { setError(null); fileRef.current?.click(); }}
                  className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-dashed hover:border-gray-300 hover:bg-gray-50 transition-all"
                  style={{ borderColor: error ? "#fca5a5" : "#e5e7eb" }}
                >
                  <Camera size={20} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-500" style={{ fontFamily: U }}>Take photo</span>
                </button>
                <button
                  onClick={() => { setError(null); fileRef.current?.click(); }}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  <Upload size={18} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-500" style={{ fontFamily: U }}>Choose from gallery</span>
                </button>
                {/* accept matches backend: JPG, PNG, PDF only */}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf" capture="environment" className="hidden" onChange={handleFile} />
              </div>
            ) : (
              <div>
                <img src={preview} alt="Solution preview" className="w-full h-48 object-cover rounded-2xl mb-4" />
                {error && (
                  <p className="text-xs text-red-500 mb-3 text-center" style={{ fontFamily: I }}>{error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setPreview(null); setSelectedFile(null); setError(null); }}
                    disabled={uploading}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 disabled:opacity-50"
                    style={{ fontFamily: U }}
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={uploading}
                    className="flex-1 py-3 rounded-xl text-white font-black text-sm hover:opacity-90 disabled:opacity-60"
                    style={{ background: S, fontFamily: U }}
                  >
                    {uploading ? "Uploading…" : "Submit →"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
