import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './features/auth/routes/authRoutes';
import { jwtAuth } from './features/auth/middleware/jwtAuth';
import { requestLogger, errorHandler, sendResponse } from './middleware/globalMiddleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import pino from 'pino-http';
import * as Sentry from '@sentry/node';
import compression from 'compression';
// Importar outras rotas feature-centric quando existirem
// import transactionsRoutes from './features/transactions/routes/transactionsRoutes';
// import goalsRoutes from './features/goals/routes/goalsRoutes';
// import familyRoutes from './features/family/routes/familyRoutes';
// import settingsRoutes from './features/settings/routes/settingsRoutes';

const app = express();
app.use(express.json());

// Inicializar Sentry antes de tudo
Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.requestHandler());

// Segurança: CORS
app.use(cors({
  origin: ['https://teu-dominio.pt', 'http://localhost:3000'], // ajusta conforme necessário
  credentials: true
}));
// Segurança: Headers
app.use(helmet());
// Segurança: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Logging global
app.use(requestLogger);
app.use(pino());
app.use(compression());

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware de resposta padronizada (opcional, mas recomendado)
app.use(sendResponse);

// Rotas públicas
app.use('/auth', authRoutes);

// Health check (público)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Middleware JWT para todas as rotas privadas
app.use(jwtAuth);

// Rotas privadas
app.get('/transactions', (req, res) => res.json({ success: true, data: [] }));
app.post('/transactions', (req, res) => res.json({ success: true, data: { id: 'mock-id' } }));
app.get('/goals', (req, res) => res.json({ success: true, data: [] }));
app.post('/goals', (req, res) => res.json({ success: true, data: { id: 'mock-id' } }));
app.get('/family', (req, res) => res.json({ success: true, data: [] }));
app.post('/family', (req, res) => res.json({ success: true, data: { id: 'mock-id' } }));
app.get('/settings', (req, res) => res.json({ success: true, data: { tema: 'claro', notificacoes: true } }));
app.post('/settings', (req, res) => res.json({ success: true, data: { tema: 'claro', notificacoes: true } }));

// Error handler global (deve ser o último)
app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

export default app; 