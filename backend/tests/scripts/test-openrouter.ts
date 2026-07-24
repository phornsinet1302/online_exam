import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const provider = process.env.AI_PROVIDER || 'openrouter';

let baseURL: string;
let apiKey: string;
let model: string;

switch (provider) {
  case 'openrouter':
    baseURL = 'https://openrouter.ai/api/v1';
    apiKey = process.env.OPENROUTER_API_KEY!;
    model = process.env.OPENROUTER_MODEL || 'openrouter/auto-beta';
    break;
  default:
    throw new Error(`Unknown provider: ${provider}`);
}

const client = new OpenAI({ baseURL, apiKey });

(async () => {
  try {
    console.log(`🧪 Testing ${provider} with model: ${model}`);
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Say hello in exactly 5 words' }],
      max_tokens: 20,
    });
    console.log('✅ Response:', response.choices[0].message.content);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
})();