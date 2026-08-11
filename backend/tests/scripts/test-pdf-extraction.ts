import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { QuestionType, Difficulty } from '@prisma/client';
import { AIGenerationService } from '../../src/services/ai/generation.service.js';

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPDFTest() {
    const aiService = new AIGenerationService();

    // Resolve path to sample.pdf in the same folder as this script
    const samplePdfPath = path.join(__dirname, 'AI Calendar Automation.pdf');

    if (!fs.existsSync(samplePdfPath)) {
        console.error(`❌ PDF file not found at: ${samplePdfPath}`);
        console.error(`👉 Please place a test PDF file named "sample.pdf" in: ${__dirname}`);
        return;
    }

    console.log('📄 Loading PDF buffer...');
    const pdfBuffer = fs.readFileSync(samplePdfPath);

    console.log('🔍 Extracting raw text from PDF...');
    const rawText = await aiService.extractTextFromPDF(pdfBuffer);
    console.log(`\n--- [RAW TEXT PREVIEW] ---\n${rawText.slice(0, 300)}...\n`);

    const testTopic = 'Math'; // Change to match topic in your test PDF
    console.log(`🎯 Filtering extracted text for topic: "${testTopic}"...`);
    const filteredText = aiService.filterContentByTopic(rawText, testTopic);

    console.log(`\n--- [FILTERED TEXT OUTPUT] ---\n${filteredText}\n`);
}

runPDFTest().catch(console.error);