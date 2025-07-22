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
  // CORS robusto: origens configuráveis por env, headers extra
  const allowedOrigins = (process.env.CORS_ORIGINS || 'https://teu-dominio.pt,http://localhost:3000').split(',');
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS não permitido para esta origem.'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['ETag', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  }));
  // Helmet com opções extra para headers de segurança
  app.use(helmet({
    contentSecurityPolicy: false, // Ajustar conforme necessário
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  }));
  // Rate limiting mais restrito para produção
  const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: process.env.NODE_ENV === 'production' ? 50 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Demasiados pedidos. Tente novamente mais tarde.'
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