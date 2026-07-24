import { ExamWaitingLobby, type StudentSearchParams } from "../../App";

export default async function StudentWaitingPage({
  searchParams,
}: {
  searchParams: Promise<StudentSearchParams>;
}) {
  return <ExamWaitingLobby searchParams={await searchParams} />;
}
