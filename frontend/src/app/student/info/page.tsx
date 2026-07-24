import { StudentInfo, type StudentSearchParams } from "../../App";

export default async function StudentInfoPage({
  searchParams,
}: {
  searchParams: Promise<StudentSearchParams>;
}) {
  return <StudentInfo searchParams={await searchParams} />;
}
