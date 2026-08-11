import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is missing from environment variables.');
  process.exit(1);
}

const modelName = 'gemini-flash-lite-latest';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: modelName });

(async () => {
  try {
    console.log(`🧪 Testing Gemini AI with model: ${modelName}`);
    const result = await model.generateContent('Say hello in exactly 5 words');
    console.log('✅ Response:', result.response.text().trim());
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
})();