import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/authRoutes.js';
import { recipeRoutes } from './routes/recipeRoutes.js';

/** Builds and configures the Express application. */
export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(cookieParser(env.cookieSecret));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));
  app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
  app.use('/api/auth', authRoutes);
  app.use('/api', recipeRoutes);
  app.use(errorHandler);
  return app;
}
