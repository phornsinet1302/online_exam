"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Camera, CheckCircle2 } from "lucide-react";
import { U, I, INK, CREAM } from "@/lib/tokens";
import { Logo } from "@/components/Logo";
import { API_URL } from "@/lib/api/client";
import { jsPDF } from "jspdf";
import { Trash2, Plus } from "lucide-react";
import { compressImage, dataUrlBytes } from "@/lib/imageCompress";

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

  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [files, setFiles] = useState<File[]>([]);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // These start as placeholders so the server-rendered HTML matches the client
  // on the first paint. The real values are loaded from window.location in the
  // effect below — reading them during render causes a hydration mismatch.
  const [qid, setQid] = useState<string>("?");
  const [sessionToken, setSessionToken] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search);
    setQid(raw.get("q") ?? "?");
    setSessionToken(raw.get("session") ?? "");
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    e.target.value = ""; // reset
    if (!newFiles.length) return;

    let errorMsg = null;
    const validFiles: File[] = [];

    for (const f of newFiles) {
      if (!ALLOWED_TYPES.has(f.type)) {
        errorMsg = "Unsupported file type. Please upload a JPG, PNG, or PDF.";
        continue;
      }
      if (f.size > MAX_SIZE_BYTES) {
        errorMsg = `File too large (${(f.size / (1024 * 1024)).toFixed(1)} MB). Max is ${MAX_SIZE_MB} MB.`;
        continue;
      }
      validFiles.push(f);
    }

    if (errorMsg) setError(errorMsg);

    if (validFiles.length > 0) {
      const hasPdf = validFiles.some(f => f.type === "application/pdf");
      if (hasPdf) {
        // If a PDF is uploaded, it becomes the only file
        setFiles([validFiles.find(f => f.type === "application/pdf")!]);
      } else {
        setFiles(prev => {
          // If previous was a PDF, replace it. Otherwise append.
          if (prev.some(f => f.type === "application/pdf")) return validFiles;
          return [...prev, ...validFiles];
        });
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generatePDF = async (): Promise<Blob> => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const PAGE_W = doc.internal.pageSize.getWidth();
    const PAGE_H = doc.internal.pageSize.getHeight();
    const MARGIN = 20;
    const MAX_W = PAGE_W - MARGIN * 2;
    const MAX_H = PAGE_H - MARGIN * 2;
    let totalBytes = 0;

    for (let i = 0; i < files.length; i++) {
      if (i > 0) doc.addPage();
      const f = files[i];

      const dataUrl = await compressImage(f, 1600, 0.8);
      totalBytes += dataUrlBytes(dataUrl);

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = dataUrl;
      });

      const ratio = Math.min(MAX_W / img.width, MAX_H / img.height);
      const drawW = img.width * ratio;
      const drawH = img.height * ratio;
      const x = (PAGE_W - drawW) / 2;
      const y = (PAGE_H - drawH) / 2;

      doc.addImage(dataUrl, 'JPEG', x, y, drawW, drawH, undefined, 'FAST');
    }
    console.log(`PDF built: ${files.length} pages, ~${(totalBytes / 1024 / 1024).toFixed(2)} MB raw`);
    return doc.output("blob");
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    if (!sessionToken) {
      setError("Invalid upload link — session token is missing. Please scan the QR code again.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const blob = files.length === 1 && files[0].type === "application/pdf"
        ? files[0]
        : await generatePDF();

      const finalFile = new File([blob], "solution.pdf", { type: "application/pdf" });

      const formData = new FormData();
      formData.append("file", finalFile);
      formData.append("sessionToken", sessionToken);
      if (qid !== "?") formData.append("questionId", qid);

      const res = await fetch(`${API_URL}/exam/math-upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || `Upload failed (${res.status})`);
      }

      setUploaded(true);
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(
        err?.message?.includes("400")
          ? "Upload rejected — the file might be too large. Try fewer pages."
          : err?.message || "Upload failed. Please try again.",
      );
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
            ) : files.length === 0 ? (
              <div className="space-y-3">
                {/* Requirements notice */}
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>📎</span>
                  <p className="text-[11px] leading-relaxed" style={{ fontFamily: I, color: "#166534" }}>
                    <strong>Accepted:</strong> JPG, PNG, PDF &nbsp;·&nbsp; <strong>Max:</strong> 10 MB per image
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
                  onClick={() => { setError(null); cameraRef.current?.click(); }}
                  className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-dashed hover:border-gray-300 hover:bg-gray-50 transition-all"
                  style={{ borderColor: error ? "#fca5a5" : "#e5e7eb" }}
                >
                  <Camera size={20} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-500" style={{ fontFamily: U }}>Take photo</span>
                </button>
                <button
                  onClick={() => { setError(null); galleryRef.current?.click(); }}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  <Upload size={18} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-500" style={{ fontFamily: U }}>Choose from gallery</span>
                </button>
                
                {/* Inputs */}
                <input ref={cameraRef} type="file" accept="image/jpeg,image/png" capture="environment" className="hidden" onChange={handleFile} />
                <input ref={galleryRef} type="file" accept="image/jpeg,image/png,application/pdf" multiple className="hidden" onChange={handleFile} />
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 gap-3 mb-4 max-h-64 overflow-y-auto pr-1">
                  {files.map((f, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-[3/4]">
                      {f.type === "application/pdf" ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <span className="text-xs font-bold mt-2">PDF</span>
                        </div>
                      ) : (
                        <img src={URL.createObjectURL(f)} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => removeFile(idx)}
                        className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 shadow-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur">
                        Page {idx + 1}
                      </div>
                    </div>
                  ))}
                  
                  {/* Add another button */}
                  {files[0]?.type !== "application/pdf" && (
                    <button
                      onClick={() => cameraRef.current?.click()}
                      className="rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-gray-500 aspect-[3/4] transition-colors"
                    >
                      <Plus size={24} className="mb-2" />
                      <span className="text-xs font-semibold" style={{ fontFamily: U }}>Add Page</span>
                    </button>
                  )}
                </div>

                {error && (
                  <p className="text-xs text-red-500 mb-3 text-center" style={{ fontFamily: I }}>{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => { setFiles([]); setError(null); }}
                    disabled={uploading}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 disabled:opacity-50"
                    style={{ fontFamily: U }}
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={uploading || files.length === 0}
                    className="flex-[2] py-3 rounded-xl text-white font-black text-sm hover:opacity-90 disabled:opacity-60"
                    style={{ background: S, fontFamily: U }}
                  >
                    {uploading ? "Generating PDF…" : `Submit ${files.length} ${files.length === 1 ? 'Page' : 'Pages'} →`}
                  </button>
                </div>
                
                {/* Inputs for "Add Another" */}
                <input ref={cameraRef} type="file" accept="image/jpeg,image/png" capture="environment" className="hidden" onChange={handleFile} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
