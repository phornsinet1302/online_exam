"use client";

import { useState, useRef } from "react";
import { useNavigate, useParams } from "@/lib/hooks";
import { DashboardLayout, Toggle } from "@/components/dashboard/DashboardShared";
import { ChevronRight, Sparkles, ChevronUp, FileText, X, Upload, ChevronDown, Check, Plus, ArrowLeftRight, Copy, Trash2, Layers, FlaskConical, RefreshCw, CheckCircle2, GripVertical, Hash } from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { MOCK_EXAMS, Q_TYPES } from "@/lib/mock-data";
import { examsApi } from "@/lib/api/exams";
import { questionsApi } from "@/lib/api/questions";
import { aiApi } from "@/lib/api/ai";
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
    title: "",
    description: "",
    points: "1",
    required: true,
    options: [
      { id: `${id}-opt-1`, text: "Option 1", correct: true },
      { id: `${id}-opt-2`, text: "Option 2", correct: false },
    ],
    pairs: [
      { id: `${id}-pair-1`, left: "", right: "" },
      { id: `${id}-pair-2`, left: "", right: "" },
    ],
    answer: type === "truefalse" ? "True" : "",
    fileTypes: "PDF, DOCX, JPG, PNG",
    maxFiles: "1",
    wordLimit: "300",
  };
}

import { useEffect } from "react";
function TimezoneSelect({ value, onChange, timezones }: { value: string, onChange: (v: string) => void, timezones: { label: string, value: string }[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = timezones.filter(t => t.label.toLowerCase().includes(search.toLowerCase()) || t.value.toLowerCase().includes(search.toLowerCase()));
  const selected = timezones.find(t => t.value === value) || { label: value, value }; // fallback if not in list

  return (
    <div className="relative w-full" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full text-left border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 bg-white flex items-center justify-between" style={{ fontFamily: I }}>
        <span className="truncate">{selected.label}</span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-2 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg p-2">
          <input
            autoFocus
            type="text"
            placeholder="Search timezone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 mb-2 text-sm border-b border-gray-100 focus:outline-none"
            style={{ fontFamily: I }}
          />
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">No timezones found</div>
          ) : (
            filtered.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => { onChange(t.value); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${value === t.value ? 'bg-gray-100 font-bold' : 'hover:bg-gray-50'}`}
                style={{ fontFamily: I }}
              >
                {t.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const ITEM_TYPE = { SECTION: "section", QUESTION: "question" };

function DraggableSection({ section, index, moveSection, children }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const [, drop] = useDrop({
    accept: ITEM_TYPE.SECTION,
    hover(item: any, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      moveSection(dragIndex, hoverIndex);
      item.index = hoverIndex;
    }
  });
  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE.SECTION,
    item: { type: ITEM_TYPE.SECTION, id: section.id, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  });
  preview(drop(ref));
  return <div ref={ref} style={{ opacity: isDragging ? 0.4 : 1 }}>
    {children(drag)}
  </div>;
}

function DraggableQuestion({ question, index, sectionId, moveQuestion, children }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const [, drop] = useDrop({
    accept: ITEM_TYPE.QUESTION,
    hover(item: any, monitor) {
      if (!ref.current || item.sectionId !== sectionId) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      moveQuestion(sectionId, dragIndex, hoverIndex);
      item.index = hoverIndex;
    }
  });
  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE.QUESTION,
    item: { type: ITEM_TYPE.QUESTION, id: question.id, index, sectionId },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  });
  preview(drop(ref));
  return <div ref={ref} style={{ opacity: isDragging ? 0.4 : 1 }}>
    {children(drag)}
  </div>;
}

export function ExamCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreateRoute = id === "create" || typeof id === "undefined";
  const actualId = isCreateRoute ? undefined : id;
  const [isEdit, setIsEdit] = useState(!isCreateRoute);
  const [isLoading, setIsLoading] = useState(!isCreateRoute);

  const [title, setTitle] = useState("");
  const [uniqueCode, setUniqueCode] = useState("");
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [startDate, setStartDate] = useState("2026-07-20");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [timezone, setTimezone] = useState(() => typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London" : "Europe/London");
  const [passingScore, setPassingScore] = useState("50");
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [privacy, setPrivacy] = useState("public");
  const [randomize, setRandomize] = useState(true);
  const [showResults, setShowResults] = useState(true);
  const [requireLateApproval, setRequireLateApproval] = useState(false);
  const [saved, setSaved] = useState(false);
  const idRef = useRef(3);
  const aiFileRef = useRef<HTMLInputElement | null>(null);
  const [sections, setSections] = useState<ExamBuilderSection[]>([
    {
      id: "section-1",
      title: "Section 1",
      description: "Add instructions for this part of the exam.",
      questions: [makeBuilderQuestion("question-1", "mcq"), makeBuilderQuestion("question-2", "short")],
    },
  ]);

  useEffect(() => {
    if (actualId) {
      examsApi.getById(actualId as string).then(exam => {
        setTitle(exam.title);
        setUniqueCode(exam.uniqueCode || "");
        setSubject(exam.subject || "");
        setDesc(exam.description || "");
        if (exam.startDate) {
          const d = new Date(exam.startDate);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          setStartDate(`${year}-${month}-${day}`);
          const hh = String(d.getHours()).padStart(2, "0");
          const mm = String(d.getMinutes()).padStart(2, "0");
          setStartTime(`${hh}:${mm}`);
        }
        setDuration(String(exam.duration || 60));
        if (exam.timezone) setTimezone(exam.timezone);
        setPassingScore(String(exam.passingScore || 50));
        if (exam.maxAttempts) setMaxAttempts(String(exam.maxAttempts));
        if ((exam as any).accessType === "PUBLIC") setPrivacy("public");
        else if ((exam as any).accessType === "PRIVATE") setPrivacy("private");

        if (exam.requireLateApproval !== undefined) setRequireLateApproval(exam.requireLateApproval);

        if (exam.sections && exam.sections.length > 0) {
          setSections(exam.sections.map((sec: any) => ({
            id: sec.id,
            title: sec.title,
            description: "",
            questions: sec.questions.map((q: any) => {
              let qType = q.type.toLowerCase();
              if (qType === "true_false") qType = "truefalse";
              if (qType === "multiple_select") qType = "checkbox";
              if (qType === "short_answer") qType = "short";
              if (qType === "fill_in_blank") qType = "fill";
              if (qType === "file_upload") qType = "file";
              if (qType === "math_formula") qType = "math";

              const baseQuestion = makeBuilderQuestion(q.id, qType);
              let pairs = baseQuestion.pairs;
              if (qType === "matching" && q.metadata?.pairs) {
                pairs = q.metadata.pairs.map((p: any, idx: number) => ({
                  id: `${q.id}-pair-${idx}`,
                  left: p.L,
                  right: p.R,
                }));
              }
              let answer = baseQuestion.answer;
              if (qType === "fill" && q.metadata?.expectedText) {
                answer = q.metadata.expectedText;
              } else if (qType === "truefalse") {
                if (q.metadata?.expectedText) {
                  answer = q.metadata.expectedText;
                } else if (q.options) {
                  const correctOpt = q.options.find((o: any) => o.isCorrect);
                  if (correctOpt) answer = correctOpt.text;
                }
              }

              return {
                ...baseQuestion,
                title: q.text,
                description: q.description || "",
                points: String(q.points || 1),
                required: q.required,
                options: (q.options && q.options.length > 0) ? q.options.map((o: any) => ({ id: o.id, text: o.text, correct: o.isCorrect })) : baseQuestion.options,
                pairs,
                answer
              };

            })
          })));
        }
        setIsLoading(false);
      }).catch(err => {
        console.error("Failed to load exam:", err);
        setIsLoading(false);
      });
    }
  }, [actualId]);
  const [activeQuestionId, setActiveQuestionId] = useState("question-1");
  const [showAiAssist, setShowAiAssist] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState("Mixed");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiAdded, setAiAdded] = useState(false);

  const subjects = ["Mathematics", "Science", "English", "History", "Computer Science", "Physics", "Chemistry", "Geography"];
  const timezones = [
    { label: "UTC-11 Pago Pago", value: "Pacific/Pago_Pago" },
    { label: "UTC-10 Honolulu", value: "Pacific/Honolulu" },
    { label: "UTC-9 Anchorage", value: "America/Anchorage" },
    { label: "UTC-8 Pacific Time", value: "America/Los_Angeles" },
    { label: "UTC-7 Mountain Time", value: "America/Denver" },
    { label: "UTC-6 Central Time", value: "America/Chicago" },
    { label: "UTC-5 Eastern Time", value: "America/New_York" },
    { label: "UTC-4 Halifax", value: "America/Halifax" },
    { label: "UTC-3 Buenos Aires", value: "America/Argentina/Buenos_Aires" },
    { label: "UTC-2 Fernando de Noronha", value: "America/Noronha" },
    { label: "UTC-1 Azores", value: "Atlantic/Azores" },
    { label: "UTC+0 London", value: "Europe/London" },
    { label: "UTC+1 Paris", value: "Europe/Paris" },
    { label: "UTC+2 Cairo", value: "Africa/Cairo" },
    { label: "UTC+3 Nairobi", value: "Africa/Nairobi" },
    { label: "UTC+4 Dubai", value: "Asia/Dubai" },
    { label: "UTC+5 Karachi", value: "Asia/Karachi" },
    { label: "UTC+5:30 Mumbai", value: "Asia/Kolkata" },
    { label: "UTC+6 Dhaka", value: "Asia/Dhaka" },
    { label: "UTC+7 Bangkok", value: "Asia/Bangkok" },
    { label: "UTC+7 Jakarta", value: "Asia/Jakarta" },
    { label: "UTC+7 Ho Chi Minh", value: "Asia/Ho_Chi_Minh" },
    { label: "UTC+8 Singapore", value: "Asia/Singapore" },
    { label: "UTC+9 Tokyo", value: "Asia/Tokyo" },
    { label: "UTC+10 Sydney", value: "Australia/Sydney" },
    { label: "UTC+11 Noumea", value: "Pacific/Noumea" },
    { label: "UTC+12 Auckland", value: "Pacific/Auckland" }
  ];
  const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
  const totalPoints = sections.reduce((sum, section) => sum + section.questions.reduce((qSum, q) => qSum + (Number(q.points) || 0), 0), 0);
  const activeSection = sections.find(section => section.questions.some(question => question.id === activeQuestionId)) || sections[0];

  const nextId = (prefix: string) => `${prefix}-${idRef.current++}`;

  const updateSection = (sectionId: string, patch: Partial<ExamBuilderSection>) => {
    setSections(prev => prev.map(section => section.id === sectionId ? { ...section, ...patch } : section));
  };

  const updateQuestion = (sectionId: string, questionId: string, patch: Partial<ExamBuilderQuestion>) => {
    setSections(prev => prev.map(section => section.id === sectionId ? {
      ...section,
      questions: section.questions.map(question => question.id === questionId ? { ...question, ...patch } : question),
    } : section));
  };

  const changeQuestionType = (sectionId: string, question: ExamBuilderQuestion, type: string) => {
    const nextQuestion = makeBuilderQuestion(question.id, type);
    updateQuestion(sectionId, question.id, {
      ...nextQuestion,
      title: question.title,
      description: question.description,
      points: question.points,
      required: question.required,
    });
  };

  const addQuestion = (sectionId: string, type = "mcq") => {
    const question = makeBuilderQuestion(nextId("question"), type);
    setSections(prev => prev.map(section => section.id === sectionId ? { ...section, questions: [...section.questions, question] } : section));
    setActiveQuestionId(question.id);
  };

  const addSection = () => {
    const sectionId = nextId("section");
    const question = makeBuilderQuestion(nextId("question"), "mcq");
    setSections(prev => [...prev, { id: sectionId, title: `Section ${prev.length + 1}`, description: "", questions: [question] }]);
    setActiveQuestionId(question.id);
  };

  const addAiQuestions = async () => {
    if (!aiTopic && !aiFile) return;

    setAiGenerating(true);
    setAiAdded(false);

    try {
      let currentExamId = id;
      let currentSectionId = activeSection.id;

      // If exam hasn't been saved yet, auto-save as draft
      if (!currentExamId) {
        const savedExam = await handleSave("draft", false);
        if (!savedExam) throw new Error("Failed to auto-save exam draft");
        currentExamId = savedExam.id;

        // When exam is created, we need to fetch the newly created section ID
        // The backend creates sections in order, so let's get the sections for this exam
        const examDetails = await examsApi.getById(currentExamId);
        // Find the matching section by order (index) or title
        const activeSectionIndex = sections.findIndex(s => s.id === activeSection.id);
        if (examDetails.sections && examDetails.sections[activeSectionIndex]) {
          currentSectionId = examDetails.sections[activeSectionIndex].id;
        } else if (examDetails.sections && examDetails.sections.length > 0) {
          currentSectionId = examDetails.sections[0].id;
        }

        // Update URL without a full page reload so user can keep editing
        navigate(`/dashboard/exams/${currentExamId}/edit`);
      }

      // Prepare FormData
      const formData = new FormData();
      formData.append("examId", currentExamId as string);
      formData.append("sectionId", currentSectionId);
      formData.append("subject", subject || "General Subject");
      if (aiTopic) formData.append("topic", aiTopic);
      formData.append("difficulty", aiDifficulty);
      formData.append("numQuestions", aiCount.toString());
      formData.append("questionType", "MIXED");
      if (aiFile) formData.append("file", aiFile);

      // Call API
      const result = await aiApi.generateFromPdf(formData);

      // Map generated questions to frontend builder format
      const generatedQuestions = result.questions.map((q: any) => {
        const qId = q.id || nextId("question");
        const mappedType = q.type === "TRUE_FALSE" ? "truefalse" : (q.type === "MULTIPLE_SELECT" ? "checkbox" : "mcq"); // Fallbacks for UI
        const baseQuestion = makeBuilderQuestion(qId, mappedType);

        return {
          ...baseQuestion,
          title: q.text || q.questionText,
          description: q.metadata?.explanation ? `AI generated: ${q.metadata.explanation}` : "AI generated",
          points: (q.points || q.marks || 1).toString(),
          required: false,
          options: q.options ? q.options.map((opt: any) => ({
            id: opt.id || nextId("option"),
            text: opt.text,
            correct: opt.isCorrect
          })) : [],
        };
      });

      // Update local state
      setSections(prev => prev.map(section => {
        if (section.id === activeSection.id) {
          // If we had a temporary section ID, we might need to map it, but for UI state we just append
          return { ...section, questions: [...section.questions, ...generatedQuestions] };
        }
        return section;
      }));

      const firstId = generatedQuestions[0]?.id;
      if (firstId) setActiveQuestionId(firstId);
      setAiAdded(true);

    } catch (error) {
      console.error("AI Generation failed:", error);
      const message = error instanceof Error && error.message
        ? error.message
        : "Failed to generate questions. Please ensure you have uploaded a valid PDF and filled out subject details.";
      alert(message);
    } finally {
      setAiGenerating(false);
    }
  };

  const duplicateQuestion = (sectionId: string, question: ExamBuilderQuestion) => {
    const copyId = nextId("question");
    const copy: ExamBuilderQuestion = {
      ...question,
      id: copyId,
      title: question.title ? `${question.title} copy` : "",
      options: question.options.map(option => ({ ...option, id: nextId("option") })),
      pairs: question.pairs.map(pair => ({ ...pair, id: nextId("pair") })),
    };
    setSections(prev => prev.map(section => section.id === sectionId ? { ...section, questions: [...section.questions, copy] } : section));
    setActiveQuestionId(copy.id);
  };

  const deleteQuestion = (sectionId: string, questionId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      const nextQuestions = section.questions.filter(question => question.id !== questionId);
      return { ...section, questions: nextQuestions.length ? nextQuestions : [makeBuilderQuestion(nextId("question"), "mcq")] };
    }));
  };

  const moveSection = (dragIndex: number, hoverIndex: number) => {
    setSections(prev => {
      const newSections = [...prev];
      const dragged = newSections[dragIndex];
      newSections.splice(dragIndex, 1);
      newSections.splice(hoverIndex, 0, dragged);
      return newSections;
    });
  };

  const moveQuestion = (sectionId: string, dragIndex: number, hoverIndex: number) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      const newQuestions = [...section.questions];
      const dragged = newQuestions[dragIndex];
      newQuestions.splice(dragIndex, 1);
      newQuestions.splice(hoverIndex, 0, dragged);
      return { ...section, questions: newQuestions };
    }));
  };

  const deleteSection = (sectionId: string) => {
    if (sections.length === 1) return; // Prevent deleting the last section
    setSections(prev => {
      const filtered = prev.filter(s => s.id !== sectionId);
      if (activeSection.id === sectionId) {
        setActiveQuestionId(filtered[0].questions[0].id);
      }
      return filtered;
    });
  };

  const addOption = (sectionId: string, questionId: string) => {
    setSections(prev => prev.map(section => section.id === sectionId ? {
      ...section,
      questions: section.questions.map(question => question.id === questionId ? {
        ...question,
        options: [...question.options, { id: nextId("option"), text: `Option ${question.options.length + 1}`, correct: false }],
      } : question),
    } : section));
  };

  const updateOption = (sectionId: string, questionId: string, optionId: string, text: string) => {
    setSections(prev => prev.map(section => section.id === sectionId ? {
      ...section,
      questions: section.questions.map(question => question.id === questionId ? {
        ...question,
        options: question.options.map(option => option.id === optionId ? { ...option, text } : option),
      } : question),
    } : section));
  };

  const removeOption = (sectionId: string, questionId: string, optionId: string) => {
    setSections(prev => prev.map(section => section.id === sectionId ? {
      ...section,
      questions: section.questions.map(question => question.id === questionId ? {
        ...question,
        options: question.options.length > 2 ? question.options.filter(option => option.id !== optionId) : question.options,
      } : question),
    } : section));
  };

  const toggleCorrectOption = (sectionId: string, questionId: string, optionId: string, multi = false) => {
    setSections(prev => prev.map(section => section.id === sectionId ? {
      ...section,
      questions: section.questions.map(question => question.id === questionId ? {
        ...question,
        options: question.options.map(option => option.id === optionId ? { ...option, correct: multi ? !option.correct : true } : { ...option, correct: multi ? option.correct : false }),
      } : question),
    } : section));
  };

  const addPair = (sectionId: string, questionId: string) => {
    setSections(prev => prev.map(section => section.id === sectionId ? {
      ...section,
      questions: section.questions.map(question => question.id === questionId ? {
        ...question,
        pairs: [...question.pairs, { id: nextId("pair"), left: "", right: "" }],
      } : question),
    } : section));
  };

  const updatePair = (sectionId: string, questionId: string, pairId: string, key: "left" | "right", value: string) => {
    setSections(prev => prev.map(section => section.id === sectionId ? {
      ...section,
      questions: section.questions.map(question => question.id === questionId ? {
        ...question,
        pairs: question.pairs.map(pair => pair.id === pairId ? { ...pair, [key]: value } : pair),
      } : question),
    } : section));
  };

  const removePair = (sectionId: string, questionId: string, pairId: string) => {
    setSections(prev => prev.map(section => section.id === sectionId ? {
      ...section,
      questions: section.questions.map(question => question.id === questionId ? {
        ...question,
        pairs: question.pairs.length > 2 ? question.pairs.filter(pair => pair.id !== pairId) : question.pairs,
      } : question),
    } : section));
  };

  async function handleSave(status: string = "draft", redirect: boolean = true) {
    try {
      setSaved(false);
      const [year, month, day] = startDate.split("-");
      const formattedStartDate = `${month}/${day}/${year}`;

      let formattedStartTime = startTime;
      if (startTime && startTime.includes(":")) {
        const [hr, min] = startTime.split(":");
        let h = parseInt(hr, 10);
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12;
        if (h === 0) h = 12;
        formattedStartTime = `${h.toString().padStart(2, "0")}:${min} ${ampm}`;
      }

      const accessType = privacy === "public" ? "PUBLIC" : (privacy === "private" ? "PRIVATE" : "PASSWORD_PROTECTED");

      const examData = {
        title: title || "Untitled Exam",
        description: desc,
        subject,
        startDate: formattedStartDate,
        startTime: formattedStartTime,
        duration: parseInt(duration, 10) || 60,
        timezone,
        passingScore: parseInt(passingScore, 10) || 50,
        maxAttempts: maxAttempts === "Unlimited" ? undefined : parseInt(maxAttempts, 10),
        randomizeQuestions: randomize,
        showResults,
        requireLateApproval,
        accessType,
        fullSections: sections,
        status: status === "published" ? "PUBLISHED" : "DRAFT",
      };

      const exam = isEdit
        ? await examsApi.update(actualId as string, examData)
        : await examsApi.create(examData);

      setSaved(true);

      if (redirect) {
        navigate("/dashboard/exams");
      } else if (!isEdit) {
        navigate(`/dashboard/exams/${exam.id}/edit`, { replace: true });
      }
      return exam;
    } catch (err: any) {
      console.error(err);
      alert("Failed to save exam: " + err.message);
    }
  };

  const renderQuestionBody = (sectionId: string, question: ExamBuilderQuestion) => {
    const isChoice = ["mcq", "checkbox", "dropdown"].includes(question.type);
    const multi = question.type === "checkbox";

    if (isChoice) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ fontFamily: U }}>Answer choices</p>
            <p className="text-[11px] text-gray-400" style={{ fontFamily: I }}>{multi ? "Select all correct answers" : "Mark the correct answer"}</p>
          </div>
          {question.options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5">
              <button onClick={() => toggleCorrectOption(sectionId, question.id, option.id, multi)}
                className={`h-5 w-5 flex-shrink-0 border-2 flex items-center justify-center transition-all ${multi ? "rounded-md" : "rounded-full"} ${option.correct ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"}`}>
                {option.correct && <Check size={12} className="text-white" />}
              </button>
              <input value={option.text} onChange={e => updateOption(sectionId, question.id, option.id, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none" style={{ fontFamily: I }} />
              <button onClick={() => removeOption(sectionId, question.id, option.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-300 hover:bg-white hover:text-red-400 transition-all">
                <X size={14} />
              </button>
            </div>
          ))}
          <button onClick={() => addOption(sectionId, question.id)} className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-dashed border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all" style={{ fontFamily: U }}>
            <Plus size={13} />Add option
          </button>
        </div>
      );
    }

    if (question.type === "truefalse") {
      return (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" style={{ fontFamily: U }}>Correct answer</p>
          <div className="grid grid-cols-2 gap-3">
            {["True", "False"].map(value => (
              <button key={value} onClick={() => updateQuestion(sectionId, question.id, { answer: value })}
                className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${question.answer === value ? "text-white border-transparent" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                style={{ background: question.answer === value ? INK : undefined, fontFamily: U }}>{value}</button>
            ))}
          </div>
        </div>
      );
    }

    if (question.type === "matching") {
      return (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ fontFamily: U }}>Matching pairs</p>
          {question.pairs.map((pair, index) => (
            <div key={pair.id} className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
              <input value={pair.left} onChange={e => updatePair(sectionId, question.id, pair.id, "left", e.target.value)} placeholder={`Prompt ${index + 1}`}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily: I }} />
              <ArrowLeftRight size={15} className="hidden text-gray-300 sm:block" />
              <input value={pair.right} onChange={e => updatePair(sectionId, question.id, pair.id, "right", e.target.value)} placeholder={`Match ${index + 1}`}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily: I }} />
              <button onClick={() => removePair(sectionId, question.id, pair.id)} className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-400 transition-all"><X size={14} /></button>
            </div>
          ))}
          <button onClick={() => addPair(sectionId, question.id)} className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-dashed border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all" style={{ fontFamily: U }}>
            <Plus size={13} />Add pair
          </button>
        </div>
      );
    }

    if (question.type === "file") {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>Allowed file types</label>
            <div className="w-full flex items-center border border-gray-100 bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-sm font-semibold text-gray-500" style={{ fontFamily: I }}>PDF Only</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>Max files</label>
            <input type="number" min="1" max="10" value={question.maxFiles} onChange={e => updateQuestion(sectionId, question.id, { maxFiles: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily: I }} />
          </div>
        </div>
      );
    }

    if (question.type === "essay") {
      return (
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>Word limit</label>
            <input type="number" value={question.wordLimit} onChange={e => updateQuestion(sectionId, question.id, { wordLimit: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily: I }} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>Rubric notes</label>
            <input value={question.answer} onChange={e => updateQuestion(sectionId, question.id, { answer: e.target.value })} placeholder="What should a strong answer include?"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" style={{ fontFamily: I }} />
          </div>
        </div>
      );
    }

    return (
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>{question.type === "math" ? "Formula / answer key" : "Correct answer"}</label>
        <input value={question.answer} onChange={e => updateQuestion(sectionId, question.id, { answer: e.target.value })}
          placeholder={question.type === "fill" ? "e.g. photosynthesis" : "Type the expected answer"}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400" style={{ fontFamily: I }} />
      </div>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout active="exams" title="Loading Exam..." subtitle="Please wait">
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="animate-spin text-gray-400" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="exams-create" title={isEdit ? "Edit Exam" : "Create Exam"} subtitle={isEdit ? title : "Set up your exam in minutes"}>
      <div className="w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6" style={{ fontFamily: I }}>
          <button onClick={() => navigate("/dashboard/exams")} className="hover:text-gray-700 transition-colors">My Exams</button>
          <ChevronRight size={13} /><span className="text-gray-600">{isEdit ? "Edit Exam" : "New Exam"}</span>
          {uniqueCode && (
            <>
              <span className="mx-2 text-gray-300">•</span>
              <span className="font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1">
                <Hash size={11} className="text-gray-400" />
                {uniqueCode}
              </span>
            </>
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 xl:col-span-2">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily: U, color: INK }}>Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>Exam Title <span className="text-red-400">*</span></label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Year 12 Calculus Final Exam"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors" style={{ fontFamily: I }} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>Subject <span className="text-red-400">*</span></label>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 bg-white appearance-none" style={{ fontFamily: I }}>
                  <option value="">Select a subject</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Optional: add instructions or a note for students…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none" style={{ fontFamily: I }} />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 xl:col-span-2">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily: U, color: INK }}>Schedule</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily: I }} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>Start Time</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily: I }} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>Duration (minutes)</label>
                <input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="5" max="480"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily: I }} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>Timezone</label>
                <TimezoneSelect value={timezone} onChange={setTimezone} timezones={timezones} />
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily: U, color: INK }}>Rules & Settings</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>Passing Score (%)</label>
                <input type="number" value={passingScore} onChange={e => setPassingScore(e.target.value)} min="0" max="100"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400" style={{ fontFamily: I }} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>Max Attempts</label>
                <select value={maxAttempts} onChange={e => setMaxAttempts(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 bg-white" style={{ fontFamily: I }}>
                  {["1", "2", "3", "Unlimited"].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Require late entry approval", desc: "Students arriving after start time need teacher approval to enter", on: requireLateApproval, set: setRequireLateApproval },
                { label: "Randomize question order", desc: "Shuffle questions differently for each student", on: randomize, set: setRandomize },
                { label: "Show results after submission", desc: "Students see their score immediately", on: showResults, set: setShowResults }
              ].map(({ label, desc, on, set }) => (
                <div key={label} className="flex items-center justify-between py-3 border-t border-gray-50">
                  <div><p className="text-sm font-semibold text-gray-700" style={{ fontFamily: U }}>{label}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: I }}>{desc}</p></div>
                  <Toggle on={on} onChange={() => set((s: boolean) => !s)} />
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-black mb-5" style={{ fontFamily: U, color: INK }}>Access & Privacy</h3>
            <div className="space-y-2">
              {[{ id: "public", label: "Public", desc: "Anyone with the link or code can join" }, { id: "private", label: "Private", desc: "Only invited students can access" }, { id: "password", label: "Password protected", desc: "Students enter a password to access" }].map(opt => (
                <label key={opt.id} onClick={() => setPrivacy(opt.id)} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${privacy === opt.id ? "border-gray-800" : "border-gray-100 hover:border-gray-200"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${privacy === opt.id ? "border-gray-800" : "border-gray-300"}`}>
                    {privacy === opt.id && <div className="w-2 h-2 rounded-full" style={{ background: INK }} />}
                  </div>
                  <div><p className="text-sm font-bold text-gray-800" style={{ fontFamily: U }}>{opt.label}</p><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: I }}>{opt.desc}</p></div>
                </label>
              ))}
            </div>
          </div>

          {/* AI Assist */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 xl:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: "#F0EDE8" }}><Sparkles size={20} style={{ color: CAMEL }} /></div>
                <div>
                  <h3 className="text-sm font-black" style={{ fontFamily: U, color: INK }}>AI Question Generator</h3>
                  <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: I }}>Add generated questions directly into this exam.</p>
                </div>
              </div>
              <button onClick={() => setShowAiAssist(s => !s)}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${showAiAssist ? "border border-gray-200 text-gray-700 hover:bg-gray-50" : "text-white hover:opacity-90"}`}
                style={{ background: showAiAssist ? undefined : INK, fontFamily: U }}>
                {showAiAssist ? <><ChevronUp size={14} />Hide AI</> : <><Sparkles size={14} />Use AI</>}
              </button>
            </div>

            {showAiAssist && (
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>Material</label>
                  <input ref={aiFileRef} type="file" accept=".pdf" className="hidden" onChange={e => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.size > 10 * 1024 * 1024) {
                      alert("That file is too large. Please upload a PDF up to 10MB.");
                      e.target.value = "";
                      return;
                    }
                    setAiFile(file);
                  }} />
                  {aiFile ? (
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <FileText size={16} style={{ color: CAMEL }} />
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-700" style={{ fontFamily: I }}>{aiFile.name}</span>
                      <button onClick={() => setAiFile(null)} className="text-gray-400 hover:text-gray-700"><X size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => aiFileRef.current?.click()} className="w-full rounded-xl border-2 border-dashed border-gray-200 py-6 text-center text-sm font-semibold text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-all" style={{ fontFamily: U }}>
                      <Upload size={18} className="mx-auto mb-2" style={{ color: CAMEL }} />Upload lesson material
                    </button>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: U }}>Topic</label>
                  <textarea value={aiTopic} onChange={e => setAiTopic(e.target.value)} rows={4}
                    placeholder="e.g. Calculus chain rule, product rule, and definite integrals"
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none" style={{ fontFamily: I }} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block" style={{ fontFamily: U }}>Questions: <span style={{ color: INK }}>{aiCount}</span></label>
                  <input type="range" min={3} max={10} step={1} value={aiCount} onChange={e => setAiCount(+e.target.value)} className="w-full accent-gray-900" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block" style={{ fontFamily: U }}>Difficulty</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Easy", "Medium", "Hard", "Mixed"].map(level => (
                      <button key={level} onClick={() => setAiDifficulty(level)}
                        className={`rounded-lg border py-2 text-xs font-bold transition-all ${aiDifficulty === level ? "border-transparent text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                        style={{ background: aiDifficulty === level ? INK : undefined, fontFamily: U }}>{level}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center xl:col-span-2">
                  <button onClick={addAiQuestions} disabled={(!aiTopic && !aiFile) || aiGenerating}
                    className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                    style={{ background: INK, fontFamily: U }}>
                    {aiGenerating ? <><RefreshCw size={15} className="animate-spin" />Generating...</> : <><Sparkles size={15} />Generate into exam</>}
                  </button>
                  {aiAdded && <span className="text-xs font-semibold text-green-600" style={{ fontFamily: U }}>Questions added to {activeSection.title || "current section"}.</span>}
                </div>
              </div>
            )}
          </div>

          {/* Google Forms style builder */}
          <DndProvider backend={HTML5Backend}>
            <div className="xl:col-span-2 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-black" style={{ fontFamily: U, color: INK }}>Exam Questions</h3>
                      <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: I }}>Build sections and mix question types in the same exam.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600" style={{ fontFamily: U }}>{totalQuestions} questions</span>
                      <span className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600" style={{ fontFamily: U }}>{totalPoints} points</span>
                    </div>
                  </div>
                </div>

                {sections.map((section, sectionIndex) => (
                  <DraggableSection key={section.id} section={section} index={sectionIndex} moveSection={moveSection}>
                    {(dragHandle: any) => (
                      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                        <div className="border-l-4 px-6 py-5" style={{ borderColor: CAMEL }}>
                          <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-start">
                            <div ref={dragHandle} className="cursor-grab text-gray-300 hover:text-gray-500 pt-1" title="Drag to reorder section">
                              <GripVertical size={20} />
                            </div>
                            <div className="space-y-3">
                              <input value={section.title} onChange={e => updateSection(section.id, { title: e.target.value })}
                                className="w-full text-lg font-black text-gray-900 placeholder:text-gray-300 focus:outline-none" placeholder={`Section ${sectionIndex + 1}`}
                                style={{ fontFamily: U }} />
                              <input value={section.description} onChange={e => updateSection(section.id, { description: e.target.value })}
                                className="w-full text-sm text-gray-500 placeholder:text-gray-300 focus:outline-none" placeholder="Section description or instructions"
                                style={{ fontFamily: I }} />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-500" style={{ fontFamily: U }}>{section.questions.length} items</span>
                              {sections.length > 1 && (
                                <button onClick={() => deleteSection(section.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50" title="Delete section">
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 bg-gray-50/60 p-4">
                          {section.questions.map((question, questionIndex) => {
                            const typeInfo = Q_TYPES.find(type => type.id === question.type) || Q_TYPES[0];
                            const TypeIcon = typeInfo.icon;
                            const isActive = activeQuestionId === question.id;

                            return (
                              <DraggableQuestion key={question.id} question={question} index={questionIndex} sectionId={section.id} moveQuestion={moveQuestion}>
                                {(qDragHandle: any) => (
                                  <div onClick={() => setActiveQuestionId(question.id)}
                                    className={`rounded-2xl border bg-white p-5 transition-all ${isActive ? "border-gray-300 shadow-sm" : "border-gray-100 hover:border-gray-200"}`}>
                                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start">
                                      <div className="flex min-w-0 flex-1 gap-3">
                                        <div ref={qDragHandle} className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-black cursor-grab" style={{ background: typeInfo.color, color: INK, fontFamily: U }} title="Drag to reorder question">
                                          <GripVertical size={16} className="opacity-50" />
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-3">
                                          <input value={question.title} onChange={e => updateQuestion(section.id, question.id, { title: e.target.value })}
                                            placeholder="Question"
                                            className="w-full border-b border-gray-200 px-0 py-2 text-base font-bold text-gray-900 placeholder:text-gray-300 focus:border-gray-500 focus:outline-none"
                                            style={{ fontFamily: U }} />
                                          <input value={question.description} onChange={e => updateQuestion(section.id, question.id, { description: e.target.value })}
                                            placeholder="Description or helper text"
                                            className="w-full border-b border-transparent px-0 py-1 text-sm text-gray-500 placeholder:text-gray-300 focus:border-gray-200 focus:outline-none"
                                            style={{ fontFamily: I }} />
                                        </div>
                                      </div>
                                      <div className="grid gap-2 sm:grid-cols-[1fr_96px] lg:w-[360px]">
                                        <div className="relative">
                                          <select value={question.type} onChange={e => changeQuestionType(section.id, question, e.target.value)}
                                            className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-9 text-sm font-semibold text-gray-700 focus:border-gray-400 focus:outline-none"
                                            style={{ fontFamily: U }}>
                                            {Q_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
                                          </select>
                                          <TypeIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                          <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                        <input type="number" min="0" value={question.points} onChange={e => updateQuestion(section.id, question.id, { points: e.target.value })}
                                          className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold text-gray-800 focus:border-gray-400 focus:outline-none" style={{ fontFamily: U }} />
                                      </div>
                                    </div>

                                    <div className="mb-4">{renderQuestionBody(section.id, question)}</div>

                                    <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center">
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-gray-500" style={{ fontFamily: U }}>Required</span>
                                        <Toggle on={question.required} onChange={() => updateQuestion(section.id, question.id, { required: !question.required })} />
                                      </div>
                                      <div className="flex items-center gap-1 sm:ml-auto">
                                        <button onClick={() => duplicateQuestion(section.id, question)} className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-all" title="Duplicate question"><Copy size={15} /></button>
                                        <button onClick={() => deleteQuestion(section.id, question.id)} className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Delete question"><Trash2 size={15} /></button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DraggableQuestion>
                            );
                          })}

                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => addQuestion(section.id)} className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-all" style={{ fontFamily: U }}>
                              <Plus size={14} />Add question
                            </button>
                            <button onClick={addSection} className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-all" style={{ fontFamily: U }}>
                              <Layers size={14} />Add section
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </DraggableSection>
                ))}
              </div>

              <div className="xl:sticky xl:top-36 xl:self-start">
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily: U }}>Builder tools</p>
                  <div className="grid gap-2">
                    <button onClick={() => setShowAiAssist(true)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50" style={{ fontFamily: U }}><Sparkles size={16} style={{ color: CAMEL }} />AI generator</button>
                    <button onClick={() => addQuestion(activeSection.id, "mcq")} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50" style={{ fontFamily: U }}><Plus size={16} style={{ color: CAMEL }} />Add question</button>
                    <button onClick={addSection} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50" style={{ fontFamily: U }}><Layers size={16} style={{ color: CAMEL }} />Add section</button>
                    <button onClick={() => addQuestion(activeSection.id, "file")} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50" style={{ fontFamily: U }}><Upload size={16} style={{ color: CAMEL }} />File upload</button>
                    <button onClick={() => addQuestion(activeSection.id, "math")} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50" style={{ fontFamily: U }}><FlaskConical size={16} style={{ color: CAMEL }} />Formula item</button>
                  </div>
                  <div className="mt-4 rounded-xl bg-gray-50 p-4">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div><p className="text-lg font-black" style={{ fontFamily: U, color: INK }}>{sections.length}</p><p className="text-[11px] text-gray-400" style={{ fontFamily: I }}>Sections</p></div>
                      <div><p className="text-lg font-black" style={{ fontFamily: U, color: INK }}>{totalPoints}</p><p className="text-[11px] text-gray-400" style={{ fontFamily: I }}>Points</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DndProvider>

          {/* Actions */}
          <div className="flex gap-3 pb-2 xl:col-span-2">
            <button onClick={() => handleSave("published")} className="flex items-center gap-2 text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity" style={{ background: INK, fontFamily: U }}>
              {saved ? <><CheckCircle2 size={15} />Saved!</> : isEdit ? "Save changes" : "Publish exam"}
            </button>
            <button onClick={() => handleSave("draft")} className="flex items-center gap-2 font-bold px-6 py-3 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all" style={{ fontFamily: U }}>Save as draft</button>
            <button onClick={() => navigate("/dashboard/exams")} className="ml-auto text-sm font-medium text-gray-400 hover:text-gray-600 px-4 py-3" style={{ fontFamily: I }}>Cancel</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
