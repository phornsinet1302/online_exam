import { ExamEntry, type StudentSearchParams } from "../../App";

export default async function StudentEntryPage({
  searchParams,
}: {
  searchParams: Promise<StudentSearchParams>;
}) {
  return <ExamEntry searchParams={await searchParams} />;
}
