import { Request, Response, NextFunction } from 'express';

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ success: false, error: { message: 'Acesso negado' } });
    }
    next();
  };
} 