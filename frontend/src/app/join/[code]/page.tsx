import { redirect } from "next/navigation";

// `params` is a Promise in this Next.js version — reading `.code` off it
// directly yields undefined, which sent every magic link / QR scan to
// /student/enter?code=undefined.
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  // Redirect directly to the student entry flow with the magic link parameters
  redirect(`/student/enter?code=${encodeURIComponent(code)}&via=link`);
}
