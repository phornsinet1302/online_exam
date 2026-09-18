import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { QuestionType, Difficulty } from '@prisma/client';

export interface GenerateQuestionsParams {
  materialText?: string;
  subject: string;
  topic?: string;
  difficulty: Difficulty;
  numQuestions: number;
  questionType: QuestionType | 'MIXED'; // Added MIXED support
  language: string;
}

export class AIGenerationService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private fallbackModel: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    // gemini-flash-latest has been persistently overloaded (503) — verified
    // directly against the API, not just inferred from app logs. gemini-2.5-flash
    // was tried as a fallback but Google has deprecated it for new API keys
    // (404: "no longer available to new users... use models/gemini-3.6-flash").
    // gemini-3.6-flash is confirmed working, so it's primary now; -latest is
    // kept as the fallback in case 3.6 has its own bad day.
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    this.fallbackModel = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  }

  async extractTextFromPDF(buffer: Buffer): Promise<string> {
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjs.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      fullText += `--- Page ${i} ---\n` + pageText + '\n\n';
    }

    return this.cleanText(fullText);
  }

  private cleanText(text: string): string {
    return text
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '')
      .trim();
  }

  // UPDATED: Semantic Topic Filtering & Fallback Trap Prevention
  public filterContentByTopic(fullText: string, topic?: string): string {
    const MAX_SAFE_LENGTH = 15000; // ~3.5k tokens. Strictly prevents the Fallback Trap.

    if (!topic || !topic.trim()) {
      return fullText.slice(0, MAX_SAFE_LENGTH); 
    }

    const cleanTopic = topic.trim().toLowerCase();
    const words = cleanTopic.split(' ').filter(w => w.length > 0);
    
    // Auto-generate acronym (e.g., "Machine Learning" -> "ml")
    const acronym = words.length > 1 ? words.map(w => w[0]).join('') : '';
    const topicKeywords = words.filter(k => k.length > 2);
    
    const paragraphs = fullText.split(/\n\n+/);
    const matchedParagraphs: string[] = [];

    for (const paragraph of paragraphs) {
      const paraLower = paragraph.toLowerCase();
      
      // Semantic check: exact phrase, isolated acronym (using regex boundaries), or keyword
      const matchesTopic = 
        paraLower.includes(cleanTopic) || 
        (acronym && new RegExp(`\\b${acronym}\\b`, 'i').test(paraLower)) || 
        topicKeywords.some(keyword => paraLower.includes(keyword));

      if (matchesTopic) {
        matchedParagraphs.push(paragraph.trim());
      }
    }

    // Fallback Trap fix: Slice the fallback to strictly save tokens
    if (matchedParagraphs.length === 0) {
      console.warn(`[AI Engine] Topic "${topic}" not found. Falling back to truncated text.`);
      return fullText.slice(0, MAX_SAFE_LENGTH);
    }

    return matchedParagraphs.join('\n\n').slice(0, MAX_SAFE_LENGTH);
  }

  // UPDATED: Random Mixed Types & Strict DB-ready JSON Output
  private buildPrompt(params: GenerateQuestionsParams, filteredMaterial: string): string {
    const { subject, topic, difficulty, numQuestions, questionType, language } = params;
    const topicInstruction = topic ? ` focusing specifically on the topic: "${topic}"` : '';

    const typeInstruction = questionType === 'MIXED' 
      ? `Randomly select the question type for each question from these allowed types: "MCQ", "MULTIPLE_SELECT", "TRUE_FALSE", "SHORT_ANSWER". Ensure a good mix.`
      : `All questions must strictly be of type: "${questionType}".`;

    return `
You are an expert exam question generator for the subject "${subject}".
Generate ${numQuestions} questions${topicInstruction}.
Difficulty: "${difficulty}".
Language: ${language}.
${typeInstruction}

STRICT JSON FORMAT REQUIREMENTS:
- Return ONLY a valid JSON array of objects. Do not wrap in markdown tags.
- The structure MUST match this exact schema to save directly to a database:
[
  {
    "questionText": "The actual question prompt string",
    "type": "MCQ" | "MULTIPLE_SELECT" | "TRUE_FALSE" | "SHORT_ANSWER",
    "marks": 1,
    "difficulty": "${difficulty}",
    "explanation": "Explanation of the correct answer",
    "options": [
      { "text": "Option text here", "isCorrect": true },
      { "text": "Option text here", "isCorrect": false }
    ]
  }
]

Material:
"""
${filteredMaterial}
"""
`;
  }

  // Gemini returns 503 ("high demand") or 429 (rate limit) fairly often and
  // explicitly says these are transient — retry a couple of times with
  // backoff before giving up, instead of failing the whole generation.
  private async withRetry<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 1500): Promise<T> {
    let lastError: any;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        const retryable = err?.status === 503 || err?.status === 429 || err?.status === 500;
        if (!retryable || i === attempts - 1) throw err;
        const delay = baseDelayMs * Math.pow(2, i);
        console.warn(`[AI Engine] Gemini request failed (status ${err?.status}), retrying in ${delay}ms (attempt ${i + 1}/${attempts})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  async generateQuestions(params: GenerateQuestionsParams, pdfBuffer?: Buffer): Promise<any[]> {
    let extractedText = params.materialText || '';

    if (pdfBuffer) {
      extractedText = await this.extractTextFromPDF(pdfBuffer);
    }

    const isScannedOrEmpty = pdfBuffer && extractedText.replace(/--- Page \d+ ---/g, '').trim().length < 50;

    let prompt: string;
    let mediaParam: { inlineData: { data: string; mimeType: string } } | null = null;
    if (isScannedOrEmpty) {
      console.log("[AI Engine] Scanned PDF detected. Routing via Gemini Multimodal Direct...");
      const topicContext = params.topic ? `Focus on topic: ${params.topic}` : '';
      prompt = this.buildPrompt(params, `[Document attached as image/pdf. ${topicContext}]`);
      mediaParam = { inlineData: { data: pdfBuffer!.toString('base64'), mimeType: 'application/pdf' } };
    } else {
      const relevantContent = this.filterContentByTopic(extractedText, params.topic);
      prompt = this.buildPrompt(params, relevantContent);
    }

    const callModel = (model: any) => mediaParam
      ? model.generateContent([prompt, mediaParam])
      : model.generateContent(prompt);
    const isOverloaded = (err: any) => err?.status === 503 || err?.status === 429;

    try {
      const result = await this.withRetry<any>(() => callModel(this.model));
      return this.parseAIResponse(result.response.text());
    } catch (primaryErr: any) {
      if (!isOverloaded(primaryErr)) throw primaryErr;

      console.warn('[AI Engine] Primary model overloaded — falling back...');
      try {
        const result = await this.withRetry<any>(() => callModel(this.fallbackModel), 2);
        return this.parseAIResponse(result.response.text());
      } catch (fallbackErr: any) {
        // Don't swallow the real reason — a bad model name (404) looks
        // nothing like "high demand" (503) and needs to be diagnosable
        // from logs alone, not by manually re-running requests later.
        console.error('[AI Engine] Fallback model also failed:', fallbackErr?.status, fallbackErr?.message);
        throw new Error('The AI question generator is currently experiencing high demand. Please wait a minute and try again.');
      }
    }
  }

  private parseAIResponse(responseText: string): any[] {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('AI response did not contain a valid JSON array');
    return JSON.parse(jsonMatch[0]);
  }
}