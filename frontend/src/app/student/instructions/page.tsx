import { redirect } from "next/navigation";

// Legacy route: it used to register a student from name/email taken straight
// from the URL, with no identity check — which would let anyone pose as an
// invited student on a private exam. The real flow (enter → info → Google
// sign-in → waiting room) is the only way in now.
export default async function InstructionsPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  redirect(code ? `/student/info?code=${encodeURIComponent(code)}` : "/student/enter");
}
