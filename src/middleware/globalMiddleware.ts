import { Request, Response, NextFunction } from 'express';

// Logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
}

// Error handler middleware
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Erro global:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: {
      message: err.message || 'Erro interno do servidor',
      details: err.details || undefined,
    },
  });
}

// Middleware para respostas padronizadas (opcional, pode ser usado em rotas)
export function sendResponse(req: Request, res: Response, next: NextFunction) {
  res.sendSuccess = (data: any) => res.json({ success: true, data });
  next();
}

declare global {
  namespace Express {
    interface Response {
      sendSuccess?: (data: any) => void;
    }
  }
} 