import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createAuthRoutes } from './features/auth/routes/authRoutes';
import { requestLogger, errorHandler, sendResponse } from './middleware/globalMiddleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import pino from 'pino-http';
import * as Sentry from '@sentry/node';
import compression from 'compression';

export function createApp({ authRoutes: injectedAuthRoutes, jwtAuth: injectedJwtAuth }: { authRoutes?: any, jwtAuth?: any } = {}) {
  const app = express();
  app.use(express.json());

  Sentry.init({ dsn: process.env.SENTRY_DSN });
  app.use(Sentry.Handlers.requestHandler());
  app.use(cors({
    origin: ['https://teu-dominio.pt', 'http://localhost:3000'],
    credentials: true
  }));
  app.use(helmet());
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
  app.use(requestLogger);
  app.use(pino());
  app.use(compression());
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use(sendResponse);
  if (injectedAuthRoutes) {
    app.use('/auth', injectedAuthRoutes);
  } else {
    throw new Error('createAuthRoutes requer um cliente Supabase. Deve ser injetado explicitamente.');
  }
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  if (injectedJwtAuth) {
    app.use(injectedJwtAuth);
  } else {
    // Em produção, o middleware real será injetado no server.ts
  }
  // NÃO montar rotas /family, /goals, /transactions, etc. por defeito!
  // Apenas montar rotas se forem explicitamente injetadas no createApp.
  app.get('/settings', (req, res) => res.json({ success: true, data: { tema: 'claro', notificacoes: true } }));
  app.post('/settings', (req, res) => res.json({ success: true, data: { tema: 'claro', notificacoes: true } }));
  app.use(Sentry.Handlers.errorHandler());
  app.use(errorHandler);
  // Middleware global de erro para testes e integração (deve ser o último)
  app.use((err, req, res, next) => {
    console.log('[GLOBAL ERROR HANDLER]', err && err.status, err && err.message);
    if (err && err.status === 401) {
      return res.status(401).json({ success: false, error: { message: err.message || 'Não autorizado' } });
    }
    if (err && err.status === 403) {
      return res.status(403).json({ success: false, error: { message: err.message || 'Proibido' } });
    }
    // Outros erros
    return res.status(400).json({ success: false, error: { message: err.message || 'Erro inesperado' } });
  });
  return app;
} 