// backend/src/utils/fileProcessor.ts
//
// Parses a question-bank spreadsheet (.csv / .xlsx) into questions ready to be
// saved. Columns (header names are case-insensitive, order doesn't matter):
//
//   Type | Question | Points | Difficulty | Options | Correct Answer
//
//   Options         pipe-separated:  Paris|London|Rome
//                   MATCHING uses:   France=Paris|Italy=Rome
//   Correct Answer  MCQ / DROPDOWN:  option text, or its 1-based number / letter
//                   CHECKBOX:        several of those, pipe-separated
//                   TRUE_FALSE:      True or False
//                   FILL_IN_BLANK:   the expected text (alternatives with |)

export interface ParsedQuestion {
  type: string;
  text: string;
  points: number;
  difficulty: string;
  options?: { text: string; isCorrect: boolean }[];
  metadata?: Record<string, unknown>;
}

const TYPE_ALIASES: Record<string, string> = {
  MCQ: 'MCQ',
  MULTIPLE_CHOICE: 'MCQ',
  TRUE_FALSE: 'TRUE_FALSE',
  TRUEFALSE: 'TRUE_FALSE',
  TF: 'TRUE_FALSE',
  SHORT_ANSWER: 'SHORT_ANSWER',
  SHORT: 'SHORT_ANSWER',
  ESSAY: 'ESSAY',
  FILL_IN_BLANK: 'FILL_IN_BLANK',
  FILL_IN_THE_BLANK: 'FILL_IN_BLANK',
  FILL: 'FILL_IN_BLANK',
  MATCHING: 'MATCHING',
  CHECKBOX: 'MULTIPLE_SELECT',
  MULTIPLE_SELECT: 'MULTIPLE_SELECT',
  DROPDOWN: 'DROPDOWN',
  DROP_DOWN: 'DROPDOWN',
  FILE_UPLOAD: 'FILE_UPLOAD',
  FILE: 'FILE_UPLOAD',
  MATH: 'MATH_FORMULA',
  MATHEMATICAL: 'MATH_FORMULA',
  MATH_FORMULA: 'MATH_FORMULA',
};

const HEADER_ALIASES: Record<string, string> = {
  type: 'type',
  'question type': 'type',
  question: 'question',
  'question text': 'question',
  text: 'question',
  title: 'question',
  points: 'points',
  marks: 'points',
  difficulty: 'difficulty',
  options: 'options',
  choices: 'options',
  correct: 'correct',
  'correct answer': 'correct',
  answer: 'correct',
};

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'MIXED'];
const MAX_ERRORS_REPORTED = 5;

// ── Template ────────────────────────────────────────────────────────────────

export const IMPORT_TEMPLATE_CSV = [
  'Type,Question,Points,Difficulty,Options,Correct Answer',
  'Multiple Choice,What is the capital of France?,1,Easy,Paris|London|Rome|Madrid,Paris',
  'Checkbox,Which of these are prime numbers?,2,Medium,2|3|4|9,2|3',
  'Dropdown,Water boils at what temperature (°C)?,1,Easy,50|100|150,100',
  'True/False,The Earth orbits the Sun.,1,Easy,,True',
  'Fill in the Blank,The chemical symbol for gold is ____.,1,Medium,,Au',
  'Matching,Match each country to its capital.,3,Medium,France=Paris|Italy=Rome|Spain=Madrid,',
  'Short Answer,Define photosynthesis.,3,Medium,,',
  'Essay,Discuss the causes of World War I.,10,Hard,,',
  'Math,Solve for x: 2x + 3 = 11,2,Medium,,4',
  'File Upload,Upload your lab report.,5,Medium,,',
].join('\n');

// ── File readers ────────────────────────────────────────────────────────────

// Minimal RFC 4180 parser: quoted fields, "" escapes, commas/newlines in quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field); field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

async function readXlsx(buffer: Buffer): Promise<string[][]> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    for (let c = 1; c <= sheet.columnCount; c++) cells.push(row.getCell(c).text ?? '');
    rows.push(cells);
  });
  return rows;
}

// ── Row → question ──────────────────────────────────────────────────────────

const splitPipes = (value: string) => value.split('|').map((s) => s.trim()).filter(Boolean);

// Resolve one "correct answer" token to an option index: exact text first,
// then a 1-based number, then a letter (A = first option).
function resolveOptionIndex(token: string, options: string[]): number {
  const t = token.trim();
  const byText = options.findIndex((o) => o.toLowerCase() === t.toLowerCase());
  if (byText >= 0) return byText;
  if (/^\d+$/.test(t)) {
    const n = parseInt(t, 10) - 1;
    if (n >= 0 && n < options.length) return n;
  }
  if (/^[A-Za-z]$/.test(t)) {
    const n = t.toUpperCase().charCodeAt(0) - 65;
    if (n >= 0 && n < options.length) return n;
  }
  return -1;
}

function buildQuestion(cells: Record<string, string>): ParsedQuestion {
  const rawType = (cells.type ?? '').trim();
  if (!rawType) throw new Error('Type is required');
  const type = TYPE_ALIASES[rawType.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')];
  if (!type) throw new Error(`Unknown question type "${rawType}"`);

  const text = (cells.question ?? '').trim();
  if (!text) throw new Error('Question text is required');

  const pointsRaw = (cells.points ?? '').trim();
  const points = pointsRaw === '' ? 1 : Number(pointsRaw);
  if (!Number.isFinite(points) || points <= 0) throw new Error(`Invalid points "${pointsRaw}"`);

  const difficultyRaw = (cells.difficulty ?? '').trim().toUpperCase();
  if (difficultyRaw && !DIFFICULTIES.includes(difficultyRaw)) {
    throw new Error(`Invalid difficulty "${cells.difficulty}" (use Easy, Medium, Hard or Mixed)`);
  }

  const optionTexts = splitPipes(cells.options ?? '');
  const correctRaw = (cells.correct ?? '').trim();
  const question: ParsedQuestion = { type, text, points, difficulty: difficultyRaw || 'MEDIUM' };

  switch (type) {
    case 'MCQ':
    case 'DROPDOWN': {
      if (optionTexts.length < 2) throw new Error(`${type} needs at least 2 options`);
      const idx = resolveOptionIndex(correctRaw, optionTexts);
      if (idx < 0) throw new Error(`Correct answer "${correctRaw}" doesn't match any option`);
      question.options = optionTexts.map((o, i) => ({ text: o, isCorrect: i === idx }));
      break;
    }
    case 'MULTIPLE_SELECT': {
      if (optionTexts.length < 2) throw new Error('CHECKBOX needs at least 2 options');
      const tokens = splitPipes(correctRaw);
      if (tokens.length === 0) throw new Error('Correct answer is required');
      const correct = new Set<number>();
      for (const token of tokens) {
        const idx = resolveOptionIndex(token, optionTexts);
        if (idx < 0) throw new Error(`Correct answer "${token}" doesn't match any option`);
        correct.add(idx);
      }
      question.options = optionTexts.map((o, i) => ({ text: o, isCorrect: correct.has(i) }));
      break;
    }
    case 'TRUE_FALSE': {
      const answer = correctRaw.toLowerCase();
      if (!['true', 'false', 't', 'f'].includes(answer)) throw new Error('Correct answer must be True or False');
      const isTrue = answer.startsWith('t');
      question.options = [
        { text: 'True', isCorrect: isTrue },
        { text: 'False', isCorrect: !isTrue },
      ];
      question.metadata = { expectedText: isTrue ? 'True' : 'False' };
      break;
    }
    case 'FILL_IN_BLANK': {
      // Blank is allowed — the question then just goes to manual review.
      question.metadata = { expectedText: correctRaw, caseSensitive: false };
      break;
    }
    case 'MATCHING': {
      const pairs = optionTexts.map((entry) => {
        const [left, ...rest] = entry.split('=');
        return { L: left.trim(), R: rest.join('=').trim() };
      });
      if (pairs.length < 2 || pairs.some((p) => !p.L || !p.R)) {
        throw new Error('MATCHING needs at least 2 pairs written as left=right|left=right');
      }
      question.metadata = {
        pairs,
        correctPairs: pairs.map((p) => ({ leftId: p.L, rightId: p.R })),
      };
      break;
    }
    default:
      // SHORT_ANSWER, ESSAY, FILE_UPLOAD, MATH_FORMULA — graded by hand.
      break;
  }

  return question;
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function processFileImport(buffer: Buffer, fileName: string): Promise<ParsedQuestion[]> {
  const ext = fileName.toLowerCase().split('.').pop();
  let rows: string[][];
  if (ext === 'csv') {
    rows = parseCsv(buffer.toString('utf8').replace(/^﻿/, ''));
  } else if (ext === 'xlsx') {
    rows = await readXlsx(buffer);
  } else {
    throw new Error('Unsupported file type. Upload a .csv or .xlsx file.');
  }

  rows = rows.filter((r) => r.some((c) => c.trim() !== ''));
  if (rows.length < 2) throw new Error('The file has no question rows.');

  const columns = rows[0].map((h) => HEADER_ALIASES[h.trim().toLowerCase()] ?? null);
  if (!columns.includes('type') || !columns.includes('question')) {
    throw new Error('The header row must include "Type" and "Question" columns.');
  }

  const questions: ParsedQuestion[] = [];
  const errors: string[] = [];
  rows.slice(1).forEach((row, i) => {
    const cells: Record<string, string> = {};
    columns.forEach((name, c) => { if (name) cells[name] = row[c] ?? ''; });
    try {
      questions.push(buildQuestion(cells));
    } catch (e: any) {
      errors.push(`Row ${i + 2}: ${e.message}`);
    }
  });

  if (errors.length > 0) {
    const shown = errors.slice(0, MAX_ERRORS_REPORTED).join('; ');
    const more = errors.length > MAX_ERRORS_REPORTED ? ` (and ${errors.length - MAX_ERRORS_REPORTED} more)` : '';
    throw new Error(`Nothing was imported. ${shown}${more}`);
  }

  return questions;
}
