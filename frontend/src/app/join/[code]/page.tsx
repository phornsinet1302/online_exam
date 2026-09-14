import { redirect } from "next/navigation";

export default function JoinPage({ params }: { params: { code: string } }) {
  // Redirect directly to the student entry flow with the magic link parameters
  redirect(`/student/enter?code=${params.code}&via=link`);
}
