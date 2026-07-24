import { ExamInstructions, type StudentSearchParams } from "../../App";

export default async function StudentInstructionsPage({
  searchParams,
}: {
  searchParams: Promise<StudentSearchParams>;
}) {
  return <ExamInstructions searchParams={await searchParams} />;
}
