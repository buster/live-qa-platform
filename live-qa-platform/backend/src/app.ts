import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import sessionRoutes from './routes/sessions';
import questionRoutes from './routes/questions';

// Load environment variables
dotenv.config();

// Create Express application
const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/questions', questionRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Error handler
app.use(errorHandler);

export { app };