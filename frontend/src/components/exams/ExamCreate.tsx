"use client";

import { useState, useRef } from "react";
import { useNavigate, useParams } from "@/lib/hooks";
import { DashboardLayout, Toggle } from "@/components/dashboard/DashboardShared";
import { ChevronRight, Sparkles, ChevronUp, FileText, X, Upload, ChevronDown, Check, Plus, ArrowLeftRight, Copy, Trash2, Layers, FlaskConical, RefreshCw, CheckCircle2 } from "lucide-react";
import { MOCK_EXAMS, Q_TYPES } from "@/lib/mock-data";
import { U, I, INK, CAMEL } from "@/lib/tokens";

type ExamBuilderOption = {
  id: string;
  text: string;
  correct: boolean;
};

type ExamBuilderPair = {
  id: string;
  left: string;
  right: string;
};

type ExamBuilderQuestion = {
  id: string;
  type: string;
  title: string;
  description: string;
  points: string;
  required: boolean;
  options: ExamBuilderOption[];
  pairs: ExamBuilderPair[];
  answer: string;
  fileTypes: string;
  maxFiles: string;
  wordLimit: string;
};

type ExamBuilderSection = {
  id: string;
  title: string;
  description: string;
  questions: ExamBuilderQuestion[];
};

function makeBuilderQuestion(id: string, type = "mcq"): ExamBuilderQuestion {
  return {
    id,
    type,
    title:"",
    description:"",
    points:"1",
    required:true,
    options:[
      { id:`${id}-opt-1`, text:"Option 1", correct:true },
      { id:`${id}-opt-2`, text:"Option 2", correct:false },
    ],
    pairs:[
      { id:`${id}-pair-1`, left:"", right:"" },
      { id:`${id}-pair-2`, left:"", right:"" },
    ],
    answer:type==="truefalse"?"True":"",
    fileTypes:"PDF, DOCX, JPG, PNG",
    maxFiles:"1",
    wordLimit:"300",
  };
}

export function ExamCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const existing = id ? MOCK_EXAMS.find(e=>e.id===id) : null;
  const isEdit = !!existing;

  const [title, setTitle]       = useState(existing?.title||"");
  const [subject, setSubject]   = useState(existing?.subject||"");
  const [desc, setDesc]         = useState("");
  const [startDate, setStartDate] = useState("2026-07-20");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(String(existing?.duration||60));
  const [timezone, setTimezone] = useState("UTC+0 London");
  const [passingScore, setPassingScore] = useState("50");
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [privacy, setPrivacy]   = useState("public");
  const [randomize, setRandomize] = useState(true);
  const [showResults, setShowResults] = useState(true);
  const [saved, setSaved]       = useState(false);
  const idRef = useRef(3);
  const aiFileRef = useRef<HTMLInputElement|null>(null);
  const [sections, setSections] = useState<ExamBuilderSection[]>([
    {
      id:"section-1",
      title:"Section 1",
      description:"Add instructions for this part of the exam.",
      questions:[makeBuilderQuestion("question-1","mcq"), makeBuilderQuestion("question-2","short")],
    },
  ]);
  const [activeQuestionId, setActiveQuestionId] = useState("question-1");
  const [showAiAssist, setShowAiAssist] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiFile, setAiFile] = useState<string|null>(null);
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState("Mixed");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiAdded, setAiAdded] = useState(false);

  const subjects = ["Mathematics","Science","English","History","Computer Science","Physics","Chemistry","Geography"];
  const timezones = ["UTC+0 London","UTC+1 Paris","UTC+2 Cairo","UTC+3 Nairobi","UTC+5:30 Mumbai","UTC+8 Singapore","UTC+10 Sydney","UTC-5 New York","UTC-8 Los Angeles"];
  const totalQuestions = sections.reduce((sum, section)=>sum + section.questions.length, 0);
  const totalPoints = sections.reduce((sum, section)=>sum + section.questions.reduce((qSum, q)=>qSum + (Number(q.points)||0), 0), 0);
  const activeSection = sections.find(section=>section.questions.some(question=>question.id===activeQuestionId)) || sections[0];

  const nextId = (prefix: string) => `${prefix}-${idRef.current++}`;

  const updateSection = (sectionId: string, patch: Partial<ExamBuilderSection>) => {
    setSections(prev=>prev.map(section=>section.id===sectionId?{...section,...patch}:section));
  };

  const updateQuestion = (sectionId: string, questionId: string, patch: Partial<ExamBuilderQuestion>) => {
    setSections(prev=>prev.map(section=>section.id===sectionId?{
      ...section,
      questions:section.questions.map(question=>question.id===questionId?{...question,...patch}:question),
    }:section));
  };

  const changeQuestionType = (sectionId: string, question: ExamBuilderQuestion, type: string) => {
    const nextQuestion = makeBuilderQuestion(question.id, type);
    updateQuestion(sectionId, question.id, {
      ...nextQuestion,
      title:question.title,
      description:question.description,
      points:question.points,
      required:question.required,
    });
  };

  const addQuestion = (sectionId: string, type = "mcq") => {
    const question = makeBuilderQuestion(nextId("question"), type);
    setSections(prev=>prev.map(section=>section.id===sectionId?{...section,questions:[...section.questions, question]}:section));
    setActiveQuestionId(question.id);
  };

  const addSection = () => {
    const sectionId = nextId("section");
    const question = makeBuilderQuestion(nextId("question"), "mcq");
    setSections(prev=>[...prev, { id:sectionId, title:`Section ${prev.length + 1}`, description:"", questions:[question] }]);
    setActiveQuestionId(question.id);
  };

  const addAiQuestions = () => {
    if (!aiTopic && !aiFile) return;
    const sample = [
      { type:"mcq", title:"Which concept best matches the main topic?", options:["Primary idea","Unrelated detail","Example only","Exception"], answer:"Primary idea" },
      { type:"short", title:"Explain the key idea in your own words.", answer:"Clear explanation of the topic" },
      { type:"truefalse", title:"The statement is always true for this topic.", answer:"False" },
      { type:"essay", title:"Analyze the topic and include evidence or examples.", answer:"Reasoned analysis with evidence" },
      { type:"fill", title:"Fill in the blank: The core term is ___.", answer:aiTopic || "topic" },
      { type:"mcq", title:"Which answer is the strongest example?", options:["Accurate example","Distractor one","Distractor two","Distractor three"], answer:"Accurate example" },
      { type:"checkbox", title:"Select all correct statements.", options:["Correct statement","Another correct statement","Incorrect statement","Unrelated statement"], answer:"Correct statement, Another correct statement" },
      { type:"matching", title:"Match each term with its meaning.", answer:"Terms matched correctly" },
      { type:"math", title:"Write the formula or calculation that applies.", answer:"Expected formula" },
      { type:"dropdown", title:"Choose the best category.", options:["Category A","Category B","Category C"], answer:"Category A" },
    ];

    setAiGenerating(true);
    setAiAdded(false);
    setTimeout(()=>{
      const topicLabel = aiTopic.trim() || aiFile || "uploaded material";
      const questions = sample.slice(0, aiCount).map((item, index)=>{
        const question = makeBuilderQuestion(nextId("question"), item.type);
        const optionValues = item.options || ["Correct answer","Distractor","Another option","Final option"];
        return {
          ...question,
          title:`${item.title} (${topicLabel})`,
          description:`AI generated · ${aiDifficulty}`,
          answer:item.answer,
          options:optionValues.map((text, optionIndex)=>({ id:nextId("option"), text, correct:optionIndex===0 })),
          pairs:item.type==="matching"?[
            { id:nextId("pair"), left:"Term 1", right:"Meaning 1" },
            { id:nextId("pair"), left:"Term 2", right:"Meaning 2" },
            { id:nextId("pair"), left:"Term 3", right:"Meaning 3" },
          ]:question.pairs,
          points:index<2?"1":"2",
        };
      });
      const firstId = questions[0]?.id;
      setSections(prev=>prev.map(section=>section.id===activeSection.id?{...section,questions:[...section.questions, ...questions]}:section));
      if (firstId) setActiveQuestionId(firstId);
      setAiGenerating(false);
      setAiAdded(true);
    }, 900);
  };

  const duplicateQuestion = (sectionId: string, question: ExamBuilderQuestion) => {
    const copyId = nextId("question");
    const copy: ExamBuilderQuestion = {
      ...question,
      id:copyId,
      title:question.title?`${question.title} copy`:"",
      options:question.options.map(option=>({...option,id:nextId("option")})),
      pairs:question.pairs.map(pair=>({...pair,id:nextId("pair")})),
    };
    setSections(prev=>prev.map(section=>section.id===sectionId?{...section,questions:[...section.questions, copy]}:section));
    setActiveQuestionId(copy.id);
  };

  const deleteQuestion = (sectionId: string, questionId: string) => {
    setSections(prev=>prev.map(section=>{
      if (section.id!==sectionId) return section;
      const nextQuestions = section.questions.filter(question=>question.id!==questionId);
      return {...section, questions:nextQuestions.length?nextQuestions:[makeBuilderQuestion(nextId("question"), "mcq")]};
    }));
  };

  const addOption = (sectionId: string, questionId: string) => {
    setSections(prev=>prev.map(section=>section.id===sectionId?{
      ...section,
      questions:section.questions.map(question=>question.id===questionId?{
        ...question,
        options:[...question.options, { id:nextId("option"), text:`Option ${question.options.length + 1}`, correct:false }],
      }:question),
    }:section));
  };

  const updateOption = (sectionId: string, questionId: string, optionId: string, text: string) => {
    setSections(prev=>prev.map(section=>section.id===sectionId?{
      ...section,
      questions:section.questions.map(question=>question.id===questionId?{
        ...question,
        options:question.options.map(option=>option.id===optionId?{...option,text}:option),
      }:question),
    }:section));
  };

  const removeOption = (sectionId: string, questionId: string, optionId: string) => {
    setSections(prev=>prev.map(section=>section.id===sectionId?{
      ...section,
      questions:section.questions.map(question=>question.id===questionId?{
        ...question,
        options:question.options.length>2?question.options.filter(option=>option.id!==optionId):question.options,
      }:question),
    }:section));
  };

  const toggleCorrectOption = (sectionId: string, questionId: string, optionId: string, multi = false) => {
    setSections(prev=>prev.map(section=>section.id===sectionId?{
      ...section,
      questions:section.questions.map(question=>question.id===questionId?{
        ...question,
        options:question.options.map(option=>option.id===optionId?{...option,correct:multi?!option.correct:true}:{...option,correct:multi?option.correct:false}),
      }:question),
    }:section));
  };

  const addPair = (sectionId: string, questionId: string) => {
    setSections(prev=>prev.map(section=>section.id===sectionId?{
      ...section,
      questions:section.questions.map(question=>question.id===questionId?{
        ...question,
        pairs:[...question.pairs, { id:nextId("pair"), left:"", right:"" }],
      }:question),
    }:section));
  };

  const updatePair = (sectionId: string, questionId: string, pairId: string, key: "left"|"right", value: string) => {
    setSections(prev=>prev.map(section=>section.id===sectionId?{
      ...section,
      questions:section.questions.map(question=>question.id===questionId?{
        ...question,
        pairs:question.pairs.map(pair=>pair.id===pairId?{...pair,[key]:value}:pair),
      }:question),
    }:section));
  };

  const removePair = (sectionId: string, questionId: string, pairId: string) => {
    setSections(prev=>prev.map(section=>section.id===sectionId?{
      ...section,
      questions:section.questions.map(question=>question.id===questionId?{
        ...question,
        pairs:question.pairs.length>2?question.pairs.filter(pair=>pair.id!==pairId):question.pairs,
      }:question),
    }:section));
  };

  const handleSave = (status = "draft") => {
    setSaved(true);
    setTimeout(()=>{ setSaved(false); navigate("/dashboard/exams"); }, 800);
  };

  const renderQuestionBody = (sectionId: string, question: ExamBuilderQuestion) => {
    const isChoice = ["mcq","checkbox","dropdown"].includes(question.type);
    const multi = question.type==="checkbox";

    if (isChoice) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ fontFamily:U }}>Answer choices</p>
            <p className="text-[11px] text-gray-400" style={{ fontFamily:I }}>{multi?"Select all correct answers":"Mark the correct answer"}</p>
          </div>
          {question.options.map((option, index)=>(
            <div key={option.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5">
              <button onClick={()=>toggleCorrectOption(sectionId, question.id, option.id, multi)}
                className={`h-5 w-5 flex-shrink-0 border-2 flex items-center justify-center transition-all ${multi?"rounded-md":"rounded-full"} ${option.correct?"border-green-500 bg-green-500":"border-gray-300 bg-white"}`}>
                {option.correct&&<Check size={12} className="text-white"/>}
              </button>
              <input value={option.text} onChange={e=>updateOption(sectionId, question.id, option.id, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none" style={{ fontFamily:I }}/>
              <button onClick={()=>removeOption(sectionId, question.id, option.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-300 hover:bg-white hover:text-red-400 transition-all">
                <X size={14}/>
              </button>
            </div>
          ))}
          <button onClick={()=>addOption(sectionId, question.id)} className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-dashed border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all" style={{ fontFamily:U }}>
            <Plus size={13}/>Add option
          </button>
        </div>
      );
    }

    if (question.type==="truefalse") {
      return (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" style={{ fontFamily:U }}>Correct answer</p>
          <div className="grid grid-cols-2 gap-3">
            {["True","False"].map(value=>(
              <button key={value} onClick={()=>updateQuestion(sectionId, question.id, { answer:value })}
                className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${question.answer===value?"text-white border-transparent":"border-gray-200 text-gray-600 hover:border-gray-300"}`}
                style={{ background:question.answer===value?INK:undefined, fontFamily:U }}>{value}</button>
            ))}
          </div>
        </div>
      );
    }

    if (question.type==="matching") {
      return (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ fontFamily:U }}>Matching pairs</p>
          {question.pairs.map((pair, index)=>(
            <div key={pair.id} className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
              <input value={pair.left} onChange={e=>updatePair(sectionId, question.id, pair.id, "left", e.target.value)} placeholder={`Prompt ${index + 1}`}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
              <ArrowLeftRight size={15} className="hidden text-gray-300 sm:block"/>
              <input value={pair.right} onChange={e=>updatePair(sectionId, question.id, pair.id, "right", e.target.value)} placeholder={`Match ${index + 1}`}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
              <button onClick={()=>removePair(sectionId, question.id, pair.id)} className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-400 transition-all"><X size={14}/></button>
            </div>
          ))}
          <button onClick={()=>addPair(sectionId, question.id)} className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-dashed border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all" style={{ fontFamily:U }}>
            <Plus size={13}/>Add pair
          </button>
        </div>
      );
    }

    if (question.type==="file") {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Allowed file types</label>
            <input value={question.fileTypes} onChange={e=>updateQuestion(sectionId, question.id, { fileTypes:e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Max files</label>
            <input type="number" min="1" max="10" value={question.maxFiles} onChange={e=>updateQuestion(sectionId, question.id, { maxFiles:e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
          </div>
        </div>
      );
    }

    if (question.type==="essay") {
      return (
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Word limit</label>
            <input type="number" value={question.wordLimit} onChange={e=>updateQuestion(sectionId, question.id, { wordLimit:e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Rubric notes</label>
            <input value={question.answer} onChange={e=>updateQuestion(sectionId, question.id, { answer:e.target.value })} placeholder="What should a strong answer include?"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
          </div>
        </div>
      );
    }

    return (
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>{question.type==="math"?"Formula / answer key":"Correct answer"}</label>
        <input value={question.answer} onChange={e=>updateQuestion(sectionId, question.id, { answer:e.target.value })}
          placeholder={question.type==="fill"?"e.g. photosynthesis":"Type the expected answer"}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
      </div>
    );
  };

  return (
    <DashboardLayout active="exams-create" title={isEdit?"Edit Exam":"Create Exam"} subtitle={isEdit?existing?.title:"Set up your exam in minutes"}>
      <div className="w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6" style={{ fontFamily:I }}>
          <button onClick={()=>navigate("/dashboard/exams")} className="hover:text-gray-700 transition-colors">My Exams</button>
          <ChevronRight size={13}/><span className="text-gray-600">{isEdit?"Edit Exam":"New Exam"}</span>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 xl:col-span-2">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Exam Title <span className="text-red-400">*</span></label>
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Year 12 Calculus Final Exam"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors" style={{ fontFamily:I }}/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Subject <span className="text-red-400">*</span></label>
                <select value={subject} onChange={e=>setSubject(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 bg-white appearance-none" style={{ fontFamily:I }}>
                  <option value="">Select a subject</option>
                  {subjects.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Description</label>
                <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="Optional: add instructions or a note for students…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none" style={{ fontFamily:I }}/>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 xl:col-span-2">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Schedule</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Start Date</label>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Start Time</label>
                <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Duration (minutes)</label>
                <input type="number" value={duration} onChange={e=>setDuration(e.target.value)} min="5" max="480"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Timezone</label>
                <select value={timezone} onChange={e=>setTimezone(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 bg-white" style={{ fontFamily:I }}>
                  {timezones.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Rules & Settings</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Passing Score (%)</label>
                <input type="number" value={passingScore} onChange={e=>setPassingScore(e.target.value)} min="0" max="100"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily:I }}/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Max Attempts</label>
                <select value={maxAttempts} onChange={e=>setMaxAttempts(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 bg-white" style={{ fontFamily:I }}>
                  {["1","2","3","Unlimited"].map(v=><option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {[{label:"Randomize question order",desc:"Shuffle questions differently for each student",on:randomize,set:setRandomize},{label:"Show results after submission",desc:"Students see their score immediately",on:showResults,set:setShowResults}].map(({label,desc,on,set})=>(
                <div key={label} className="flex items-center justify-between py-3 border-t border-gray-50">
                  <div><p className="text-sm font-semibold text-gray-700" style={{ fontFamily:U }}>{label}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{desc}</p></div>
                  <Toggle on={on} onChange={()=>set((s: boolean)=>!s)}/>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily:U, color:INK }}>Access & Privacy</h3>
            <div className="space-y-2">
              {[{id:"public",label:"Public",desc:"Anyone with the link or code can join"},{id:"private",label:"Private",desc:"Only invited students can access"},{id:"password",label:"Password protected",desc:"Students enter a password to access"}].map(opt=>(
                <label key={opt.id} onClick={()=>setPrivacy(opt.id)} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${privacy===opt.id?"border-gray-800":"border-gray-100 hover:border-gray-200"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${privacy===opt.id?"border-gray-800":"border-gray-300"}`}>
                    {privacy===opt.id&&<div className="w-2 h-2 rounded-full" style={{ background:INK }}/>}
                  </div>
                  <div><p className="text-sm font-bold text-gray-800" style={{ fontFamily:U }}>{opt.label}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>{opt.desc}</p></div>
                </label>
              ))}
            </div>
          </div>

          {/* AI Assist */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 xl:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background:"#F0EDE8" }}><Sparkles size={20} style={{ color:CAMEL }}/></div>
                <div>
                  <h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>AI Question Generator</h3>
                  <p className="text-xs text-gray-400 mt-1" style={{ fontFamily:I }}>Add generated questions directly into this exam.</p>
                </div>
              </div>
              <button onClick={()=>setShowAiAssist(s=>!s)}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${showAiAssist?"border border-gray-200 text-gray-700 hover:bg-gray-50":"text-white hover:opacity-90"}`}
                style={{ background:showAiAssist?undefined:INK, fontFamily:U }}>
                {showAiAssist?<><ChevronUp size={14}/>Hide AI</>:<><Sparkles size={14}/>Use AI</>}
              </button>
            </div>

            {showAiAssist&&(
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Material</label>
                  <input ref={aiFileRef} type="file" accept=".pdf,.doc,.docx,.txt,.ppt,.pptx" className="hidden" onChange={e=>setAiFile(e.target.files?.[0]?.name||null)}/>
                  {aiFile?(
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <FileText size={16} style={{ color:CAMEL }}/>
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-700" style={{ fontFamily:I }}>{aiFile}</span>
                      <button onClick={()=>setAiFile(null)} className="text-gray-400 hover:text-gray-700"><X size={14}/></button>
                    </div>
                  ):(
                    <button onClick={()=>aiFileRef.current?.click()} className="w-full rounded-xl border-2 border-dashed border-gray-200 py-6 text-center text-sm font-semibold text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-all" style={{ fontFamily:U }}>
                      <Upload size={18} className="mx-auto mb-2" style={{ color:CAMEL }}/>Upload lesson material
                    </button>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily:U }}>Topic</label>
                  <textarea value={aiTopic} onChange={e=>setAiTopic(e.target.value)} rows={4}
                    placeholder="e.g. Calculus chain rule, product rule, and definite integrals"
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none" style={{ fontFamily:I }}/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block" style={{ fontFamily:U }}>Questions: <span style={{ color:INK }}>{aiCount}</span></label>
                  <input type="range" min={3} max={10} step={1} value={aiCount} onChange={e=>setAiCount(+e.target.value)} className="w-full accent-gray-900"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block" style={{ fontFamily:U }}>Difficulty</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Easy","Medium","Hard","Mixed"].map(level=>(
                      <button key={level} onClick={()=>setAiDifficulty(level)}
                        className={`rounded-lg border py-2 text-xs font-bold transition-all ${aiDifficulty===level?"border-transparent text-white":"border-gray-200 text-gray-500 hover:border-gray-300"}`}
                        style={{ background:aiDifficulty===level?INK:undefined, fontFamily:U }}>{level}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center xl:col-span-2">
                  <button onClick={addAiQuestions} disabled={(!aiTopic&&!aiFile)||aiGenerating}
                    className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                    style={{ background:INK, fontFamily:U }}>
                    {aiGenerating?<><RefreshCw size={15} className="animate-spin"/>Generating...</>:<><Sparkles size={15}/>Generate into exam</>}
                  </button>
                  {aiAdded&&<span className="text-xs font-semibold text-green-600" style={{ fontFamily:U }}>Questions added to {activeSection.title || "current section"}.</span>}
                </div>
              </div>
            )}
          </div>

          {/* Google Forms style builder */}
          <div className="xl:col-span-2 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Exam Questions</h3>
                    <p className="text-xs text-gray-400 mt-1" style={{ fontFamily:I }}>Build sections and mix question types in the same exam.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600" style={{ fontFamily:U }}>{totalQuestions} questions</span>
                    <span className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600" style={{ fontFamily:U }}>{totalPoints} points</span>
                  </div>
                </div>
              </div>

              {sections.map((section, sectionIndex)=>(
                <div key={section.id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                  <div className="border-l-4 px-6 py-5" style={{ borderColor:CAMEL }}>
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                      <div className="space-y-3">
                        <input value={section.title} onChange={e=>updateSection(section.id, { title:e.target.value })}
                          className="w-full text-lg font-black text-gray-900 placeholder:text-gray-300 focus:outline-none" placeholder={`Section ${sectionIndex + 1}`}
                          style={{ fontFamily:U }}/>
                        <input value={section.description} onChange={e=>updateSection(section.id, { description:e.target.value })}
                          className="w-full text-sm text-gray-500 placeholder:text-gray-300 focus:outline-none" placeholder="Section description or instructions"
                          style={{ fontFamily:I }}/>
                      </div>
                      <span className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-500" style={{ fontFamily:U }}>{section.questions.length} items</span>
                    </div>
                  </div>

                  <div className="space-y-3 bg-gray-50/60 p-4">
                    {section.questions.map((question, questionIndex)=>{
                      const typeInfo = Q_TYPES.find(type=>type.id===question.type) || Q_TYPES[0];
                      const TypeIcon = typeInfo.icon;
                      const isActive = activeQuestionId===question.id;

                      return (
                        <div key={question.id} onClick={()=>setActiveQuestionId(question.id)}
                          className={`rounded-2xl border bg-white p-5 transition-all ${isActive?"border-gray-300 shadow-sm":"border-gray-100 hover:border-gray-200"}`}>
                          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start">
                            <div className="flex min-w-0 flex-1 gap-3">
                              <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-black" style={{ background:typeInfo.color, color:INK, fontFamily:U }}>
                                {questionIndex + 1}
                              </div>
                              <div className="min-w-0 flex-1 space-y-3">
                                <input value={question.title} onChange={e=>updateQuestion(section.id, question.id, { title:e.target.value })}
                                  placeholder="Question"
                                  className="w-full border-b border-gray-200 px-0 py-2 text-base font-bold text-gray-900 placeholder:text-gray-300 focus:border-gray-500 focus:outline-none"
                                  style={{ fontFamily:U }}/>
                                <input value={question.description} onChange={e=>updateQuestion(section.id, question.id, { description:e.target.value })}
                                  placeholder="Description or helper text"
                                  className="w-full border-b border-transparent px-0 py-1 text-sm text-gray-500 placeholder:text-gray-300 focus:border-gray-200 focus:outline-none"
                                  style={{ fontFamily:I }}/>
                              </div>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-[1fr_96px] lg:w-[360px]">
                              <div className="relative">
                                <select value={question.type} onChange={e=>changeQuestionType(section.id, question, e.target.value)}
                                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-9 text-sm font-semibold text-gray-700 focus:border-gray-400 focus:outline-none"
                                  style={{ fontFamily:U }}>
                                  {Q_TYPES.map(type=><option key={type.id} value={type.id}>{type.label}</option>)}
                                </select>
                                <TypeIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                              </div>
                              <input type="number" min="0" value={question.points} onChange={e=>updateQuestion(section.id, question.id, { points:e.target.value })}
                                className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold text-gray-800 focus:border-gray-400 focus:outline-none" style={{ fontFamily:U }}/>
                            </div>
                          </div>

                          <div className="mb-4">{renderQuestionBody(section.id, question)}</div>

                          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-gray-500" style={{ fontFamily:U }}>Required</span>
                              <Toggle on={question.required} onChange={()=>updateQuestion(section.id, question.id, { required:!question.required })}/>
                            </div>
                            <div className="flex items-center gap-1 sm:ml-auto">
                              <button onClick={()=>duplicateQuestion(section.id, question)} className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-all" title="Duplicate question"><Copy size={15}/></button>
                              <button onClick={()=>deleteQuestion(section.id, question.id)} className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Delete question"><Trash2 size={15}/></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex flex-wrap gap-2">
                      <button onClick={()=>addQuestion(section.id)} className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-all" style={{ fontFamily:U }}>
                        <Plus size={14}/>Add question
                      </button>
                      <button onClick={addSection} className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-all" style={{ fontFamily:U }}>
                        <Layers size={14}/>Add section
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="xl:sticky xl:top-36 xl:self-start">
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily:U }}>Builder tools</p>
                <div className="grid gap-2">
                  <button onClick={()=>setShowAiAssist(true)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50" style={{ fontFamily:U }}><Sparkles size={16} style={{ color:CAMEL }}/>AI generator</button>
                  <button onClick={()=>addQuestion(activeSection.id, "mcq")} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50" style={{ fontFamily:U }}><Plus size={16} style={{ color:CAMEL }}/>Add question</button>
                  <button onClick={addSection} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50" style={{ fontFamily:U }}><Layers size={16} style={{ color:CAMEL }}/>Add section</button>
                  <button onClick={()=>addQuestion(activeSection.id, "file")} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50" style={{ fontFamily:U }}><Upload size={16} style={{ color:CAMEL }}/>File upload</button>
                  <button onClick={()=>addQuestion(activeSection.id, "math")} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50" style={{ fontFamily:U }}><FlaskConical size={16} style={{ color:CAMEL }}/>Formula item</button>
                </div>
                <div className="mt-4 rounded-xl bg-gray-50 p-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div><p className="text-lg font-black" style={{ fontFamily:U, color:INK }}>{sections.length}</p><p className="text-[11px] text-gray-400" style={{ fontFamily:I }}>Sections</p></div>
                    <div><p className="text-lg font-black" style={{ fontFamily:U, color:INK }}>{totalPoints}</p><p className="text-[11px] text-gray-400" style={{ fontFamily:I }}>Points</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-2 xl:col-span-2">
            <button onClick={()=>handleSave("published")} className="flex items-center gap-2 text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity" style={{ background:INK, fontFamily:U }}>
              {saved?<><CheckCircle2 size={15}/>Saved!</>:isEdit?"Save changes":"Publish exam"}
            </button>
            <button onClick={()=>handleSave("draft")} className="flex items-center gap-2 font-bold px-6 py-3 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all" style={{ fontFamily:U }}>Save as draft</button>
            <button onClick={()=>navigate("/dashboard/exams")} className="ml-auto text-sm font-medium text-gray-400 hover:text-gray-600 px-4 py-3" style={{ fontFamily:I }}>Cancel</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
