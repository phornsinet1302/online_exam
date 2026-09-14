import { ExamEntry } from "@/components/student-flow/ExamEntry";
export default async function EnterPage({ searchParams }: any) { return <ExamEntry searchParams={await searchParams} />; }