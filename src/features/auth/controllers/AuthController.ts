import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ... outros handlers ...

/**
 * POST /auth/refresh
 * Recebe { refresh_token } e devolve novo access_token e refresh_token
 */
export async function refreshToken(req: Request, res: Response) {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ success: false, error: { message: 'Refresh token não fornecido' } });
  }
  const { data, error } = await supabase.auth.refreshSession({ refresh_token });
  if (error || !data?.session) {
    return res.status(401).json({ success: false, error: { message: 'Refresh token inválido ou expirado' } });
  }
  return res.json({
    success: true,
    data: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.session.user,
      expires_in: data.session.expires_in,
    }
  });
} 