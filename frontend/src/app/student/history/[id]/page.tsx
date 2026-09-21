import { redirect } from "next/navigation";

// This route used to render hard-coded sample answers. Results live on
// /student/results (opened from the history list), so send anyone here there.
export default function ResultDetailPage() {
  redirect("/student/history");
}
