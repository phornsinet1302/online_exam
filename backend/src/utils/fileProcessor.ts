// backend/src/utils/fileProcessor.ts
export async function processFileImport(buffer: Buffer, fileName: string) {
  // In a real implementation, parse PDF, DOCX, TXT based on extension
  // For demo, return a few dummy questions
  return [
    {
      type: 'MCQ',
      text: 'What is 2+2?',
      options: [
        { text: '3', isCorrect: false },
        { text: '4', isCorrect: true },
        { text: '5', isCorrect: false },
      ],
      points: 1,
    },
    {
      type: 'TRUE_FALSE',
      text: 'The earth is flat.',
      options: [
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: true },
      ],
      points: 1,
    },
  ];
}