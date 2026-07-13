// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import authRoutes from './routes/auth.routes.js';
import questionRoutes from './routes/question.routes.js';
import examRoutes from './routes/exam.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api', questionRoutes);
app.use('/api', examRoutes);


// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});


export default app;