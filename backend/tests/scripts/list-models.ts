import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await res.json();
  if (data.models) {
    console.log(data.models.map((m: any) => m.name).filter((n: string) => n.includes('gemini')));
  } else {
    console.log(data);
  }
}
listModels();
