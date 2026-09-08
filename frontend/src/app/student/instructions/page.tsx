import { ExamInstructions } from "@/components/student-flow/ExamInstructions";
import { Suspense } from "react";
export default function InstructionsPage() { return <Suspense fallback={<div>Loading...</div>}><ExamInstructions /></Suspense>; }