import { Request, Response } from 'express';

export function makeAuthController(supabase) {
  return {
    async refreshToken(req: Request, res: Response) {
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
    },
    // ... outros handlers podem ser adicionados aqui ...
  };
} 