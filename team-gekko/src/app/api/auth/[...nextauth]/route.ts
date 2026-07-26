// Auth.js v5 handler — handles every /api/auth/* OAuth + credentials + session route.
// The exported `handlers` object from our server config has GET + POST.
import { handlers } from '@/server/auth/config';

export const { GET, POST } = handlers;
export const runtime = 'nodejs';
