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

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
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

  async generateQuestions(params: GenerateQuestionsParams, pdfBuffer?: Buffer): Promise<any[]> {
    let extractedText = params.materialText || '';

    if (pdfBuffer) {
      extractedText = await this.extractTextFromPDF(pdfBuffer);
    }

    const isScannedOrEmpty = pdfBuffer && extractedText.replace(/--- Page \d+ ---/g, '').trim().length < 50;

    if (isScannedOrEmpty) {
      console.log("[AI Engine] Scanned PDF detected. Routing via Gemini Multimodal Direct...");
      const topicContext = params.topic ? `Focus on topic: ${params.topic}` : '';
      const prompt = this.buildPrompt(params, `[Document attached as image/pdf. ${topicContext}]`);

      const mediaParam = {
        inlineData: {
          data: pdfBuffer!.toString('base64'),
          mimeType: 'application/pdf',
        },
      };

      const result = await this.model.generateContent([prompt, mediaParam]);
      return this.parseAIResponse(result.response.text());
    } else {
      const relevantContent = this.filterContentByTopic(extractedText, params.topic);
      const prompt = this.buildPrompt(params, relevantContent);
      
      const result = await this.model.generateContent(prompt);
      return this.parseAIResponse(result.response.text());
    }
  }

  private parseAIResponse(responseText: string): any[] {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('AI response did not contain a valid JSON array');
    return JSON.parse(jsonMatch[0]);
  }
}