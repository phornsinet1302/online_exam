// src/index.ts
import 'dotenv/config';      // load env variables first
import app from './app.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📄 Swagger UI at http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown (optional)
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});