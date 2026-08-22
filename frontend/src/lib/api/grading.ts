const API_BASE = 'http://localhost:3001/api';

const getAuthHeaders = () => {
  // Since authentication is not integrated yet, we pass a dummy token
  // that the backend auth middleware might accept or we assume the backend
  // is temporarily permissive for development.
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || 'dummy-auth-token' : 'dummy-auth-token';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export interface SubmittedAnswer {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  matchingPairs?: { leftId: string; rightId: string }[];
  fileUrl?: string;
}

export interface StudentAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  score: number | null;
  maxScore: number;
  status: 'auto_graded' | 'needs_review' | 'graded';
  feedback: string | null;
  gradedBy: string | null;
  gradedAt: string | null;
  // Included from student submission in mock for manual grading UI
  studentName?: string;
  questionTitle?: string;
  questionType?: string;
  textAnswer?: string;
  rubric?: string;
}

export const submitExamAttempt = async (examId: string, attemptId: string, answers: SubmittedAnswer[]) => {
  const res = await fetch(`${API_BASE}/exams/${examId}/attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ answers })
  });
  if (!res.ok) throw new Error('Failed to submit exam attempt');
  return res.json();
};

export const fetchPendingReviews = async (examId: string): Promise<StudentAnswer[]> => {
  const res = await fetch(`${API_BASE}/exams/${examId}/attempts/pending-review`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch pending reviews');
  return res.json();
};

export const submitManualGrade = async (answerId: string, score: number, feedback: string) => {
  const res = await fetch(`${API_BASE}/student-answers/${answerId}/grade`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ score, feedback })
  });
  if (!res.ok) throw new Error('Failed to submit manual grade');
  return res.json();
};

export const triggerRegrade = async (examId: string, attemptId: string) => {
  const res = await fetch(`${API_BASE}/exams/${examId}/attempts/${attemptId}/regrade`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to trigger regrade');
  return res.json();
};
