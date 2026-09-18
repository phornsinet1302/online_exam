// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import authRoutes from './routes/auth.routes.js';
import aiRoutes from './routes/ai.routes.js';
import questionRoutes from './routes/question.routes.js';
import examRoutes from './routes/exam.routes.js';
import gradingRoutes from './routes/grading.routes.js';
import sessionRoutes from './routes/session.routes.js';
import collaborationRoutes from './routes/collaboration.routes.js';
import reportRoutes from './routes/report.routes.js';
import studentRoutes from './routes/student.routes.js';
import multer from 'multer';
import antiCheatRoutes from './routes/anti-cheat.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import rosterRoutes from './routes/roster.routes.js';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://unpkg.com"],
      },
    },
  })
);
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);
app.use('/api/auth', authRoutes);
app.use('/api', sessionRoutes);
app.use('/api', gradingRoutes);
app.use('/api', aiRoutes);
app.use('/api', questionRoutes);
app.use('/api', studentRoutes);
app.use('/api', examRoutes);
app.use('/api', antiCheatRoutes);
app.use('/api', collaborationRoutes);
app.use('/api', reportRoutes);
app.use('/api', notificationRoutes);
app.use('/api', rosterRoutes);


// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);

  if (res.headersSent) return next(err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'That file is too large. Please upload a PDF up to 10MB.' });
    }
    // Other Multer-specific errors (unexpected field, wrong file type, etc.)
    return res.status(400).json({ error: err.message });
  }

  res.status(err.status || err.statusCode || 500).json({ message: err.message || 'Internal server error' });
});


export default app;