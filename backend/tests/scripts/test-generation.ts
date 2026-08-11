import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { AIGenerationService } from '../../src/services/ai/generation.service';
import { QuestionType, Difficulty } from '@prisma/client';

dotenv.config();

async function runTest() {
  console.log('🧪 Starting AI Generation Test...');
  
  // 1. Initialize the service
  const aiService = new AIGenerationService();

  // 2. Define parameters
  const params = {
    materialText: '', // This will be ignored since we provide a PDF buffer
    subject: 'History', // Change to your PDF's subject
    topic: 'World War 2',
    difficulty: Difficulty.MEDIUM,
    numQuestions: 2,
    questionType: QuestionType.MULTIPLE_CHOICE,
    language: 'English',
  };

  // 3. Load a sample PDF
  // Put a real PDF in this location to test!
  const pdfPath = path.join(process.cwd(), 'tests', 'sample.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ Error: Could not find PDF file at ${pdfPath}`);
    console.log('💡 Please place a test PDF file named "sample.pdf" inside the "tests" folder and run this again.');
    process.exit(1);
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log(`📄 Loaded PDF (${pdfBuffer.length} bytes). Extracting text and generating questions...`);

  try {
    // 4. Run the generation
    const questions = await aiService.generateQuestions(params, pdfBuffer);
    
    console.log('\n✅ Success! Generated Questions:');
    console.log(JSON.stringify(questions, null, 2));

  } catch (error: any) {
    console.error('\n❌ Test Failed:');
    console.error(error.message);
  }
}

runTest();
