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
import collaborationRoutes from './routes/collaboration.routes.js';
import reportRoutes from './routes/report.routes.js';
import studentRoutes from './routes/student.routes.js';
import multer from 'multer'; 

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
app.use('/api', aiRoutes);
app.use('/api', questionRoutes);
app.use('/api', examRoutes);
app.use('/api', gradingRoutes);
app.use('/api', collaborationRoutes);
app.use('/api', reportRoutes);
app.use('/api', studentRoutes);


// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });

  if (err instanceof multer.MulterError) {
    // Multer-specific errors (like file size, unexpected field)
    return res.status(400).json({ error: err.message });
  }
});


export default app;