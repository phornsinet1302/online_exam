import { Suspense } from "react";
import { ManualGrading } from "@/components/grading/ManualGrading";

export default function ManualGradingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ManualGrading />
    </Suspense>
  );
}
