import { createApp } from './appFactory';
import { createAuthRoutes } from './features/auth/routes/authRoutes';
import { makeJwtAuth } from './features/auth/middleware/jwtAuth';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const authRouter = createAuthRoutes(supabase);
const jwtAuth = makeJwtAuth(supabase);
const app = createApp({ authRoutes: authRouter, jwtAuth });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
}); 