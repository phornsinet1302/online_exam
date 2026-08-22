"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/hooks";
import { MOCK_EXAMS, StudentSearchParams, getSearchValue } from "@/lib/mock-data";
import { GraduationCap, CheckCircle2, Hash, Mail, User, ArrowRight } from "lucide-react";
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

export function StudentInfo({ searchParams }: { searchParams?: StudentSearchParams } = {}) {
  const navigate = useNavigate();
  const code = getSearchValue(searchParams, "code");
  const exam = MOCK_EXAMS.find(e=>e.code.toUpperCase()===code.toUpperCase()) ?? MOCK_EXAMS[0];
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("code", code || exam.code);
    params.set("name", name.trim());
    params.set("studentId", studentId.trim());
    params.set("email", email.trim());
    navigate(`/student/instructions?${params.toString()}`);
  };

  const fields = [
    { label:"Full name", value:name, onChange:setName, placeholder:"e.g. Dara Sok", icon:User, type:"text", autoComplete:"name" },
    { label:"Student ID", value:studentId, onChange:setStudentId, placeholder:"e.g. STU-1029", icon:Hash, type:"text", autoComplete:"off" },
    { label:"Email", value:email, onChange:setEmail, placeholder:"e.g. dara@school.edu", icon:Mail, type:"email", autoComplete:"email" },
  ];

  return (
    <div className="min-h-screen" style={{ background:CREAM }}>
      <StudentHeader/>
      <div className="mx-auto flex min-h-[calc(100vh-65px)] max-w-5xl items-center px-4 py-10">
        <div className="grid w-full gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
          <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background:SL }}>
              <CheckCircle2 size={26} style={{ color:S }}/>
            </div>
            <p className="mb-2 text-xs font-black uppercase tracking-wider" style={{ fontFamily:U, color:S }}>Code accepted</p>
            <h1 className="mb-3 text-2xl font-black" style={{ fontFamily:U, color:INK }}>Tell us who is joining</h1>
            <p className="text-sm leading-relaxed text-gray-500" style={{ fontFamily:I }}>
              Enter your student details before reviewing the exam instructions.
            </p>

            <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-1 text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily:U }}>Exam code</p>
              <p className="font-mono text-lg font-black tracking-wider" style={{ color:INK }}>{code || exam.code}</p>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="text-sm font-black" style={{ fontFamily:U, color:INK }}>{exam.title}</p>
                <p className="mt-1 text-xs text-gray-500" style={{ fontFamily:I }}>{exam.subject} · {exam.duration} min · {exam.questions || 12} questions</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-black" style={{ fontFamily:U, color:INK }}>Student information</h2>
              <p className="mt-1 text-sm text-gray-500" style={{ fontFamily:I }}>Your teacher will see this with your submission.</p>
            </div>

            <div className="space-y-4">
              {fields.map(({ label, value, onChange, placeholder, icon:Icon, type, autoComplete })=>(
                <label key={label} className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily:U }}>{label}</span>
                  <div className="relative">
                    <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input
                      type={type}
                      value={value}
                      onChange={e=>onChange(e.target.value)}
                      placeholder={placeholder}
                      required
                      autoComplete={autoComplete}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-11 py-4 text-sm text-gray-900 transition-colors placeholder:text-gray-300 focus:border-gray-900 focus:outline-none"
                      style={{ fontFamily:I }}
                    />
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={()=>navigate("/student/enter")}
                className="rounded-2xl border border-gray-200 px-5 py-3.5 text-sm font-black text-gray-500 transition-colors hover:bg-gray-50"
                style={{ fontFamily:U }}>
                Change code
              </button>
              <button type="submit"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background:S, fontFamily:U }}>
                Continue to instructions <ArrowRight size={16}/>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
