// src/index.ts
import 'dotenv/config';      // load env variables first
import app from './app.js';
import { restoreAutoStartSchedules, startExpirySweeper } from './services/session.service.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📄 Swagger UI at http://localhost:${PORT}/api-docs`);
  // Re-schedule any published exams that have a future startDate
  await restoreAutoStartSchedules();
  startExpirySweeper();
});


// Graceful shutdown (optional)
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});