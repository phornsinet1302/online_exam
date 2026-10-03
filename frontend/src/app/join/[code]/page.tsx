import { ExamEntry } from '@/components/student-flow/ExamEntry';

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <ExamEntry searchParams={{ via: 'qr', code }} />;
}
