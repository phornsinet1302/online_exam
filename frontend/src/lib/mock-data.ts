import {
  ListChecks, ToggleLeft, AlignLeft, FileText, Minus,
  ArrowLeftRight, CheckSquare, ChevronDown, Upload, FlaskConical,
} from "lucide-react";

export type StudentSearchParams = Record<string, string | string[] | undefined>;

export function getSearchValue(
  searchParams: StudentSearchParams | undefined,
  key: string,
): string {
  const value = searchParams?.[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export const MOCK_EXAMS = [
  { id: "1", title: "Calculus Final Exam",        subject: "Mathematics", status: "published", students: 34, date: "Jul 10, 2026", duration: 90,  code: "CALC-2026-XZ", questions: 24 },
  { id: "2", title: "Biology Mid-term",           subject: "Science",     status: "published", students: 28, date: "Jul 13, 2026", duration: 60,  code: "BIO-2026-MT",  questions: 18 },
  { id: "3", title: "English Comprehension",      subject: "English",     status: "draft",     students: 0,  date: "Jul 15, 2026", duration: 45,  code: "ENG-2026-CP",  questions: 12 },
  { id: "4", title: "Physics Quiz",               subject: "Science",     status: "published", students: 22, date: "Jul 8, 2026",  duration: 30,  code: "PHY-2026-QZ",  questions: 10 },
  { id: "5", title: "History Essay Assessment",   subject: "History",     status: "archived",  students: 19, date: "Jun 20, 2026", duration: 120, code: "HIS-2026-ES",  questions: 5  },
  { id: "6", title: "Computer Science Practical", subject: "CS",          status: "draft",     students: 0,  date: "Jul 20, 2026", duration: 90,  code: "CS-2026-PR",   questions: 0  },
];

export const MOCK_QUESTIONS = [
  { id: "1", type: "mcq",       text: "What is the derivative of sin(x)?",                      subject: "Mathematics", difficulty: "Easy",   tags: ["calculus", "derivatives"] },
  { id: "2", type: "essay",     text: "Discuss the role of mitochondria in cellular respiration.", subject: "Science",   difficulty: "Hard",   tags: ["biology", "cell"] },
  { id: "3", type: "truefalse", text: "The speed of light in vacuum is 3Ã—10â¸ m/s.",              subject: "Science",     difficulty: "Easy",   tags: ["physics"] },
  { id: "4", type: "short",     text: "Define Newton's First Law of Motion.",                    subject: "Science",     difficulty: "Easy",   tags: ["physics", "mechanics"] },
  { id: "5", type: "mcq",       text: "Which of the following is a prime number?",               subject: "Mathematics", difficulty: "Easy",   tags: ["number theory"] },
  { id: "6", type: "fill",      text: "The process by which plants make food is called ___.",    subject: "Science",     difficulty: "Easy",   tags: ["biology"] },
  { id: "7", type: "matching",  text: "Match the following elements to their symbols.",          subject: "Science",     difficulty: "Medium", tags: ["chemistry"] },
  { id: "8", type: "essay",     text: "Analyze the causes of World War I.",                      subject: "History",     difficulty: "Hard",   tags: ["history", "wwi"] },
];

export const Q_TYPES = [
  { id: "mcq",       label: "Multiple Choice", icon: ListChecks,    color: "#eff6ff" },
  { id: "truefalse", label: "True / False",    icon: ToggleLeft,    color: "#f0fdf4" },
  { id: "short",     label: "Short Answer",    icon: AlignLeft,     color: "#fefce8" },
  { id: "essay",     label: "Essay",           icon: FileText,      color: "#fdf4ff" },
  { id: "fill",      label: "Fill in Blank",   icon: Minus,         color: "#fff7ed" },
  { id: "matching",  label: "Matching",        icon: ArrowLeftRight, color: "#eff6ff" },
  { id: "checkbox",  label: "Checkbox",        icon: CheckSquare,   color: "#f0fdf4" },
  { id: "dropdown",  label: "Dropdown",        icon: ChevronDown,   color: "#fefce8" },
  { id: "file",      label: "File Upload",     icon: Upload,        color: "#fdf4ff" },
  { id: "math",      label: "Math / Formula",  icon: FlaskConical,  color: "#fff7ed" },
];
export const MOCK_GRADING_RESULTS = [
  { name:"Alice Mills",   score:88, grade:"A", status:"auto",   q:[9,10,8,10,9,8,10,10,9,5] },
  { name:"Sara Jones",    score:71, grade:"B", status:"auto",   q:[7,8,6,9,7,6,8,7,8,5] },
  { name:"Tom Reed",      score:45, grade:"F", status:"review", q:[5,4,3,8,4,3,4,5,4,5] },
  { name:"Mike Park",     score:83, grade:"A", status:"auto",   q:[8,9,8,10,9,7,9,8,7,8] },
  { name:"Lucy Kim",      score:67, grade:"C", status:"review", q:[6,7,5,9,6,5,7,6,7,9] },
  { name:"James Wang",    score:92, grade:"A", status:"auto",   q:[10,10,9,10,9,9,10,10,8,7] },
];

export const MOCK_Q_PERF = [
  { q:1, type:"MCQ",    topic:"Chain Rule",           avg:7.8, pass:88, wrong:"Option C (28%)" },
  { q:2, type:"MCQ",    topic:"Integration basics",   avg:8.2, pass:91, wrong:"Option B (18%)" },
  { q:3, type:"Short",  topic:"Fundamental theorem",  avg:6.5, pass:72, wrong:"—" },
  { q:4, type:"MCQ",    topic:"Limits",               avg:9.2, pass:96, wrong:"Option D (4%)" },
  { q:5, type:"MCQ",    topic:"Product rule",         avg:7.3, pass:82, wrong:"Option A (22%)" },
  { q:6, type:"Essay",  topic:"Applications",         avg:6.1, pass:68, wrong:"—" },
  { q:7, type:"T/F",    topic:"Second derivative",    avg:8.8, pass:92, wrong:"False (12%)" },
  { q:8, type:"MCQ",    topic:"e^x derivative",       avg:8.4, pass:90, wrong:"Option C (14%)" },
  { q:9, type:"Short",  topic:"L'Hôpital's rule",     avg:7.1, pass:78, wrong:"—" },
  { q:10, type:"Essay", topic:"Definite vs indefinite",avg:6.4, pass:70, wrong:"—" },
];

export const MANUAL_QUESTIONS = [
  { id:1, type:"Essay",  prompt:"Discuss the applications of derivatives in real life, including optimization problems.", maxScore:20, rubric:["Clear introduction (3pts)","At least 3 real-world examples (9pts)","Correct mathematical notation (4pts)","Conclusion (4pts)"] },
  { id:2, type:"Short",  prompt:"What is L'Hôpital's rule and when is it applied?", maxScore:10, rubric:["Correct definition (5pts)","Valid condition stated (3pts)","Example given (2pts)"] },
  { id:3, type:"Essay",  prompt:"Compare and contrast definite and indefinite integrals.", maxScore:15, rubric:["Defines both types (4pts)","Differences explained (5pts)","Notation correct (3pts)","Example for each (3pts)"] },
];

export interface SQ { id:number; type:string; points:number; text:string; options?:string[]; pairs?:{L:string;R:string}[]; hint?:string; }

export const SESSION_QS: SQ[] = [
  {id:1,  type:"mcq",       points:5,  text:"What is the derivative of sin(x)?",                                               options:["cos(x)","-cos(x)","tan(x)","-sin(x)"]},
  {id:2,  type:"truefalse", points:2,  text:"The integral of e? is e? + C."},
  {id:3,  type:"short",     points:5,  text:"State the chain rule in your own words."},
  {id:4,  type:"essay",     points:15, text:"Explain the Fundamental Theorem of Calculus and provide two real-world applications."},
  {id:5,  type:"fill",      points:3,  text:"The derivative of xn is ___."},
  {id:6,  type:"matching",  points:8,  text:"Match each function to its derivative.",                                          pairs:[{L:"sin(x)",R:"cos(x)"},{L:"cos(x)",R:"-sin(x)"},{L:"e?",R:"e?"},{L:"ln(x)",R:"1/x"}]},
  {id:7,  type:"checkbox",  points:4,  text:"Which of the following are continuous at x = 0? (Select all that apply)",        options:["f(x) = x²","f(x) = 1/x","f(x) = |x|","f(x) = sin(x)","f(x) = tan(x)"]},
  {id:8,  type:"dropdown",  points:3,  text:"The second derivative test classifies a critical point as a local ___.",         options:["maximum","minimum","inflection point","saddle point"]},
  {id:9,  type:"file",      points:10, text:"Upload your handwritten proof of the limit definition of the derivative for f(x) = x²."},
  {id:10, type:"math",      points:10, text:"Evaluate: ?(3x² + 2x - 1) dx",                                                   hint:"Apply the power rule to each term."},
  {id:11, type:"mcq",       points:5,  text:"Which rule is used to differentiate a product of two functions?",                options:["Chain rule","Product rule","Quotient rule","Power rule"]},
  {id:12, type:"short",     points:5,  text:"What is the geometric interpretation of the definite integral?"},
];

export const QTLABELS: Record<string,string> = {
  mcq:"Multiple Choice", truefalse:"True / False", short:"Short Answer", essay:"Essay",
  fill:"Fill in Blank", matching:"Matching", checkbox:"Checkbox", dropdown:"Dropdown",
  file:"File Upload", math:"Math / Formula",
};

export const QTCOLORS: Record<string,{bg:string;c:string}> = {
  mcq:{bg:"#eff6ff",c:"#3b82f6"}, truefalse:{bg:"#f0fdf4",c:"#22c55e"}, short:{bg:"#fefce8",c:"#ca8a04"},
  essay:{bg:"#fdf4ff",c:"#a855f7"}, fill:{bg:"#fff7ed",c:"#f97316"}, matching:{bg:"#ecfdf5",c:"#10b981"},
  checkbox:{bg:"#f0fdf4",c:"#059669"}, dropdown:{bg:"#fffbeb",c:"#d97706"}, file:{bg:"#fdf2f8",c:"#ec4899"},
  math:{bg:"#fff1f2",c:"#f43f5e"},
};

export const MOCK_HISTORY = [
  {id:"h1",title:"Biology Mid-term",      subject:"Science", date:"Jul 13, 2026",score:78, grade:"B",status:"graded", duration:60},
  {id:"h2",title:"Physics Quiz",          subject:"Science", date:"Jul 8, 2026", score:91, grade:"A",status:"graded", duration:30},
  {id:"h3",title:"History Essay",         subject:"History", date:"Jun 20, 2026",score:null,grade:null,status:"pending",duration:120},
  {id:"h4",title:"English Comprehension", subject:"English", date:"Jul 15, 2026",score:85, grade:"A",status:"graded", duration:45},
];

