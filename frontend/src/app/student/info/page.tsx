import { StudentInfo } from "@/components/student-flow/StudentInfo";
import { Suspense } from "react";
export default function InfoPage() { return <Suspense fallback={<div>Loading...</div>}><StudentInfo /></Suspense>; }