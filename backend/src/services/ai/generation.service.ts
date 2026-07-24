import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { QuestionType, BloomLevel, Difficulty } from '@prisma/client';


interface GenerateQuestionsParams {
  materialText: string;
  subject: string;
  topic?: string;
  difficulty: Difficulty;
  bloomLevel?: BloomLevel;
  numQuestions: number;
  questionType: QuestionType;
  language: string;
}


export class AIGenerationService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  // Extract text from PDF buffer
  async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      
      const uint8Array = new Uint8Array(buffer);
      const loadingTask = pdfjs.getDocument({ data: uint8Array });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
      return this.cleanText(fullText);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`PDF extraction failed: ${message}`);
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[^\x00-\x7F]/g, ' ') // remove non-ASCII if not needed
      .trim();
  }

  // Build prompt for Gemini
  private buildPrompt(params: GenerateQuestionsParams): string {
    const {
      materialText,
      subject,
      topic,
      difficulty,
      bloomLevel,
      numQuestions,
      questionType,
      language,
    } = params;

    const bloomInstruction = bloomLevel ? ` at Bloom's ${bloomLevel} level` : '';
    const topicInstruction = topic ? ` focusing on the topic: "${topic}"` : '';

    return `
      You are an expert exam question generator. Based on the provided learning material, generate ${numQuestions} ${questionType} questions${topicInstruction} for the subject "${subject}"${bloomInstruction}. The difficulty level should be "${difficulty}". Respond in ${language}.

      Each question must include:
      - "questionText": string
      - "type": "${questionType}"
      - "options": array of strings (only for MCQ/MultipleSelect)
      - "correctAnswers": array of strings (indices or text)
      - "marks": number (default 1)
      - "explanation": string (optional)
      - "difficulty": "${difficulty}"
      - "bloomLevel": "${bloomLevel || 'N/A'}"

      Return a valid JSON array of question objects. Do not include any extra text.

      Material:
"""
${materialText}
"""
    `;
  }

  // Call Gemini API
  async generateQuestions(params: GenerateQuestionsParams): Promise<any[]> {
    const prompt = this.buildPrompt(params);
    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      // Expect JSON array
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('AI response did not contain valid JSON');
      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) throw new Error('Response is not an array');
      return parsed;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`AI generation failed: ${message}`);
    }
  }
}