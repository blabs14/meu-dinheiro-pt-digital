import { Request, Response, NextFunction } from 'express';

export function makeJwtAuth(supabase) {
  return async function jwtAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err: any = new Error('Token não fornecido');
      err.status = 401;
      next(err);
      return;
    }
    const token = authHeader.split(' ')[1];
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        const err: any = new Error(error?.message || 'Token inválido ou expirado');
        err.status = 401;
        next(err);
        return;
      }
      (req as any).user = data.user;
      next();
    } catch (err: any) {
      err.status = 401;
      next(err);
      return;
    }
  };
} 