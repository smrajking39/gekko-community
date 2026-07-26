/**
 * Boot-time env validation. Run on the server only.
 * Fail fast if a required var is missing in production.
 */
import { z } from 'zod';

const optionalUrl = z.string().url().optional().or(z.literal(''));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  // Database — optional in Phase 0 (mock mode)
  DATABASE_URL: optionalUrl,

  // Auth.js — optional in Phase 0
  AUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: optionalUrl,
  AUTH_DISCORD_ID: z.string().optional(),
  AUTH_DISCORD_SECRET: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),

  JWT_VERIFY_SECRET: z.string().optional(),

  // Email / Storage / Realtime / KV — wired in later phases
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().optional(),
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  QSTASH_TOKEN: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  WEB_PUSH_PUBLIC_KEY: z.string().optional(),
  WEB_PUSH_PRIVATE_KEY: z.string().optional(),

  RATE_LIMIT_GLOBAL: z.coerce.number().default(120),
  RATE_LIMIT_AUTH: z.coerce.number().default(10),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
export type Env = z.infer<typeof schema>;
