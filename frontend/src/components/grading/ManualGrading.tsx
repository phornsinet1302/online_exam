"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@/lib/hooks";
import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { CheckCircle2, Check, RefreshCw } from "lucide-react";
import { U, I, INK, CAMEL } from "@/lib/tokens";
import { gradingApi, StudentAnswer } from "@/lib/api/grading";
import { examsApi, Exam } from "@/lib/api/exams";

export function ManualGrading() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [studentIdx, setStudentIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [scores, setScores] = useState<Record<string,number>>({});
  const [feedback, setFeedback] = useState<Record<string,string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    examsApi.getAll().then(data => {
      const published = data.filter(e => e.status !== "DRAFT");
      setExams(published);
      // ?examId= lets the results page link straight to the right exam
      const requested = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("examId") : null;
      const initial = published.find(e => e.id === requested) ?? published[0];
      if (initial) setExamId(initial.id);
    });
  }, []);

  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    gradingApi.getPendingReviews(examId, showAll).then(data => {
      setAnswers(data);
      // Pre-fill scores and feedback if they already exist
      const initialScores: Record<string, number> = {};
      const initialFb: Record<string, string> = {};
      
      // Group by student to align with the UI
      const grouped = data.reduce((acc, curr) => {
        const key = curr.attempt?.studentId || "Unknown";
        if (!acc[key]) acc[key] = [];
        acc[key].push(curr);
        return acc;
      }, {} as Record<string, StudentAnswer[]>);
      
      const students = Object.keys(grouped);
      students.forEach((studentName, sIdx) => {
        grouped[studentName].forEach((ans, qi) => {
          if (ans.score != null) initialScores[`${sIdx}-${qi}`] = ans.score;
          if (ans.feedback) initialFb[`${sIdx}-${qi}`] = ans.feedback;
        });
      });

      setScores(initialScores);
      setFeedback(initialFb);
      setStudentIdx(0);
      setQIdx(0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [examId, showAll]);

  const groupedByStudent = useMemo(() => {
    return answers.reduce((acc, curr) => {
      const key = curr.attempt?.studentId || "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(curr);
      return acc;
    }, {} as Record<string, StudentAnswer[]>);
  }, [answers]);

  const manualStudents = Object.keys(groupedByStudent);
  const student = manualStudents[studentIdx];
  const studentAnswers = student ? groupedByStudent[student] : [];
  const questionAnswer = studentAnswers[qIdx];
  const question = questionAnswer?.question;
  const key = `${studentIdx}-${qIdx}`;

  const setScore = (v:number) => {
    if(!question) return;
    setScores(p=>({...p,[key]:Math.min(question.points || 10, Math.max(0,v))}));
  };
  const setFb = (v:string)=>setFeedback(p=>({...p,[key]:v}));

  const saveAndNext = async ()=>{
    if (!questionAnswer) return;
    try {
      await gradingApi.gradeStudentAnswer(questionAnswer.id, scores[key] || 0, feedback[key]);
      setSaved(true);
      setTimeout(()=>{
        setSaved(false);
        if(qIdx < studentAnswers.length - 1) setQIdx(q=>q+1);
        else if(studentIdx < manualStudents.length - 1){ setQIdx(0); setStudentIdx(s=>s+1); }
      },600);
    } catch (err) {
      console.error(err);
      alert("Failed to save grade");
    }
  };

  return (
    <DashboardLayout active="grading-manual" title="Manual Grading" subtitle={student ? `${student} · ${qIdx+1} of ${studentAnswers.length} questions` : "No questions to grade"}
      actions={<>
        <button onClick={()=>navigate("/dashboard/grading")} className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}>← All results</button>
      </>}>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-5 items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily:U }}>Exam</label>
          <select value={examId} onChange={e=>setExamId(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-gray-400 min-w-[240px]" style={{ fontFamily:I }}>
            {exams.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          <span className="text-sm text-gray-600" style={{ fontFamily:I }}>Show all answers (allow overriding auto-grades)</span>
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20"><RefreshCw className="animate-spin text-gray-400" /></div>
      ) : manualStudents.length === 0 ? (
        <div className="flex items-center justify-center p-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-500" style={{ fontFamily:I }}>No pending reviews found for this exam.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[200px_1fr_320px] gap-5 h-[calc(100vh-14rem)]">
          {/* Left: student list */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
            <div className="px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
              <p className="text-xs font-black uppercase tracking-wider text-gray-500" style={{ fontFamily:U }}>Students</p>
              <p className="text-[11px] text-gray-400 mt-0.5" style={{ fontFamily:I }}>{manualStudents.length} {showAll ? "students" : "need review"}</p>
            </div>
            {manualStudents.map((s,i)=>{
              const qAnswers = groupedByStudent[s];
              const done = qAnswers.every((_,qi)=>scores[`${i}-${qi}`]!==undefined);
              return (
                <button key={s} onClick={()=>{setStudentIdx(i);setQIdx(0);}}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-all ${studentIdx===i?"bg-gray-50":"hover:bg-gray-50/50"}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background:studentIdx===i?INK:CAMEL, fontFamily:U }}>{s.substring(0, 2).toUpperCase()}</div>
                  <div className="flex-1 text-left min-w-0">
                    <p className={`text-xs font-semibold truncate ${studentIdx===i?"text-gray-900":"text-gray-600"}`} style={{ fontFamily:U }}>{s}</p>
                    <p className="text-[10px] text-gray-400" style={{ fontFamily:I }}>{done?"Complete":"In progress"}</p>
                  </div>
                  {done&&<CheckCircle2 size={13} className="text-green-500 flex-shrink-0"/>}
                </button>
              );
            })}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2" style={{ fontFamily:U }}>Questions</p>
              {studentAnswers.map((q,qi)=>(
                <button key={qi} onClick={()=>setQIdx(qi)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 transition-all ${qIdx===qi?"bg-gray-900 text-white":"text-gray-500 hover:bg-gray-50"}`}>
                  <span className="text-[10px] font-black" style={{ fontFamily:U }}>{qi + 1}</span>
                  <span className="text-[10px] flex-1 text-left truncate" style={{ fontFamily:I }}>{q.question?.type || "Unknown"}</span>
                  {scores[`${studentIdx}-${qi}`]!==undefined&&<Check size={10} className="text-green-400"/>}
                </button>
              ))}
            </div>
          </div>

          {/* Center: student response */}
          <div className="flex min-h-0 flex-col gap-4 overflow-auto">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex-shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background:`${CAMEL}20`, color:CAMEL, fontFamily:U }}>Q{qIdx + 1} · {question?.type}</span>
                <span className="text-xs text-gray-400" style={{ fontFamily:I }}>Max score: {question?.points || 0} pts</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1 leading-relaxed" style={{ fontFamily:U }} dangerouslySetInnerHTML={{ __html: question?.text || "" }}></p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 flex-1 overflow-auto flex flex-col">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background:CAMEL, fontFamily:U }}>{student?.substring(0, 2).toUpperCase()}</div>
                  <p className="text-sm font-bold text-gray-800" style={{ fontFamily:U }}>{student}</p>
                </div>
                <span className="text-xs text-gray-400" style={{ fontFamily:I }}>Submitted {new Date(questionAnswer?.attempt?.submittedAt || "").toLocaleString()}</span>
              </div>
              <div className="p-6 flex-1 overflow-auto">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line" style={{ fontFamily:I }}>{questionAnswer?.textAnswer || "No text response submitted."}</p>
                {questionAnswer?.fileUrl && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase" style={{ fontFamily:U }}>Attached File</p>
                    <a href={questionAnswer.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm hover:underline">{questionAnswer.fileUrl}</a>
                  </div>
                )}
                {questionAnswer?.status === "auto_graded" && (
                   <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100">
                   <p className="text-xs font-bold text-green-600 mb-1 uppercase" style={{ fontFamily:U }}>Auto-graded Score</p>
                   <p className="text-sm text-green-800">{questionAnswer.score} / {question?.points}</p>
                 </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: scoring panel */}
          <div className="sticky top-36 flex h-[calc(100vh-14rem)] min-h-0 flex-col gap-3 overflow-hidden">
            {/* Score input */}
            <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2" style={{ fontFamily:U }}>Score</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input type="number" value={scores[key]??""} onChange={e=>setScore(Number(e.target.value))} min={0} max={question?.points || 0}
                    placeholder="—" className="w-full border-2 border-gray-200 rounded-xl px-3 py-1.5 text-lg font-black text-center focus:outline-none focus:border-gray-900 transition-colors" style={{ fontFamily:U, color:INK }}/>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-gray-300" style={{ fontFamily:U }}>/ {question?.points || 0}</p>
                </div>
              </div>
            </div>

            {/* Rubric */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex-1 overflow-auto">
              <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2" style={{ fontFamily:U }}>Rubric & Options</p>
              {question?.rubric && question.rubric.length > 0 ? (
                <ul className="space-y-1">
                  {question.rubric.map((r: any,i: number)=>(
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600" style={{ fontFamily:I }}>
                      <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0 mt-0.5"/>
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 italic">No formal rubric provided.</p>
                  {question?.options && (
                    <div className="text-xs text-gray-600">
                      <strong>Options:</strong>
                      <ul className="list-disc pl-4 mt-1">
                        {question.options.map((opt: any) => (
                          <li key={opt.id} className={opt.isCorrect ? "text-green-600 font-bold" : ""}>{opt.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Feedback */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2" style={{ fontFamily:U }}>Feedback to student</p>
              <textarea value={feedback[key]||""} onChange={e=>setFb(e.target.value)} rows={2} placeholder="Optional: add written feedback the student will see…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none" style={{ fontFamily:I }}/>
            </div>

            {/* Save & navigate */}
            <div className="mt-auto space-y-2 rounded-2xl border border-gray-100 bg-white/95 p-3 shadow-sm">
              <button onClick={saveAndNext} disabled={scores[key]===undefined}
                className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-40 transition-all" style={{ background:INK, fontFamily:U }}>
                {saved?<><CheckCircle2 size={15}/>Saved!</>:"Save & Next →"}
              </button>
              <div className="flex gap-2">
                <button onClick={()=>{ if(qIdx>0)setQIdx(q=>q-1); else if(studentIdx>0){setStudentIdx(s=>s-1);setQIdx((groupedByStudent[manualStudents[studentIdx-1]]?.length || 1)-1);} }} className="flex-1 py-2 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50" style={{ fontFamily:U }}>← Prev</button>
                <button onClick={()=>navigate("/dashboard/grading")} className="flex-1 py-2 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50" style={{ fontFamily:U }}>All results</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
