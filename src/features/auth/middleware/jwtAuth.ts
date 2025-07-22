import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string;

// Usar anon key para validar tokens de utilizador
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { message: 'Token não fornecido' } });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Valida o JWT com Supabase usando anon key
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) {
    return res.status(401).json({ success: false, error: { message: 'Token inválido ou expirado' } });
  }
  
  (req as any).user = data.user;
  next();
} 