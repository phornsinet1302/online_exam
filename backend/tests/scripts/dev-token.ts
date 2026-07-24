// backend/tests/scripts/dev-token.ts
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Use import.meta.dirname (available in Node.js 20+)
const backendRoot = path.resolve(import.meta.dirname, "../../");
const envLocalPath = path.join(backendRoot, ".env.local");
const envPath = path.join(backendRoot, ".env");

// Load .env.local or .env
let loadedPath: string | null = null;
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  loadedPath = envLocalPath;
  console.log(`📄 Loaded env from: ${envLocalPath}`);
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  loadedPath = envPath;
  console.log(`📄 Loaded env from: ${envPath}`);
} else {
  console.error("❌ No .env.local or .env file found in backend root!");
  console.error(`   Expected: ${envLocalPath} or ${envPath}`);
  process.exit(1);
}

// Verify SUPABASE_URL is set
if (!process.env.SUPABASE_URL) {
  console.error("❌ SUPABASE_URL is still undefined after loading env.");
  console.error("   Please check that the file contains SUPABASE_URL=...");
  process.exit(1);
}

// Dynamically import supabase after env is loaded
const { supabase } = await import("../../src/config/supabase");

async function main() {
  const email = process.env.DEV_EMAIL || "teacher@test.com";
  const password = process.env.DEV_PASSWORD || "password123";

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login failed:", error.message);
    process.exit(1);
  }

  console.log("\n✅ Access Token:\n");
  console.log(data.session?.access_token);

  console.log("\n🔄 Refresh Token:\n");
  console.log(data.session?.refresh_token);
}

main();