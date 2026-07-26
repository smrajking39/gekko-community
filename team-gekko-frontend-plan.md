# Team Gekko — Frontend Plan (v3 · Vercel free-tier)

> Goal: a distinctive, production-grade community platform with cinematic 3D moments, smooth scroll, real-time presence, and a complete feature surface — **all deployable on Vercel's free Hobby tier with $0/month infrastructure**. Frontend + API + auth + database + real-time + jobs + file storage all run on free tiers of best-in-class services.

---

## 0. Deployment Reality Check

This plan is built around the **constraints of free serverless hosting**:

- **No long-running Node process** → no Express/Fastify server, no Socket.io. The "backend" is Next.js Route Handlers and Server Actions running on Vercel's serverless functions (with a few Edge runtime routes).
- **No native WebSocket support on Vercel Hobby** → real-time via a managed pub/sub service (Pusher Channels or Ably — both have generous free tiers).
- **No background workers** → scheduled tasks via Vercel Cron (2 free crons); deferred jobs via Upstash QStash (500/day free).
- **Cold starts exist** → keep functions small, prefer Edge runtime for fast-path routes, use Neon's serverless driver to avoid connection pooling pain.

### 0.1 Free-Tier Stack

| Concern | Service | Free Tier |
|---|---|---|
| Hosting (frontend + API) | **Vercel Hobby** | 100 GB bandwidth/mo, unlimited deployments |
| Database | **Neon** (Postgres) | 0.5 GB storage, autosuspend, branching |
| Real-time pub/sub | **Pusher Channels** | 200k msgs/day, 100 concurrent connections |
| Cache / KV / rate-limit | **Upstash Redis** | 10k commands/day, 256 MB |
| Job queue | **Upstash QStash** | 500 messages/day |
| Scheduled jobs | **Vercel Cron** | 2 cron jobs (Hobby) |
| File storage / CDN | **Cloudinary** | 25 GB storage, 25 GB bandwidth, transformations |
| Email | **Resend** | 3,000/mo, 100/day, custom domain |
| Auth | **Auth.js (NextAuth v5)** | $0, self-hosted in your Next app |
| Error tracking | **Sentry** | 5k errors/mo |
| Analytics | **Vercel Analytics** + **PostHog Cloud** | Vercel: free tier; PostHog: 1M events/mo |
| DNS / CDN edge | **Cloudflare** | Free plan |
| Push notifications | **Web Push API** | $0 (self-hosted VAPID) |

Total monthly cost: **$0** for a launchable, real-time, fully featured platform. Each service has a clear paid upgrade path when you outgrow it — none of them require a rewrite.

### 0.2 What "Backend" Means Now

There is **one codebase, one deployment** — a Next.js app. The frontend plan and the API/server plan describe two layers of the **same Next.js application**:

- `app/(marketing|auth|dashboard|admin)/...` — UI (this document)
- `app/api/.../route.ts` — REST endpoints (Route Handlers, see backend plan)
- `lib/server/...` — business logic invoked by route handlers and server actions (see backend plan)

This eliminates CORS, auth-cookie complexity, and a second hosting account.

---

## 1. Design Philosophy

Team Gekko's website is not a generic dashboard template with green accents. It's a **living, breathing community surface**. Three principles drive every decision:

1. **Cinematic, not decorative.** 3D and motion exist to communicate something — presence, depth, status, identity. No animation for animation's sake.
2. **Smooth at every layer.** Smooth scroll, smooth route transitions, smooth optimistic updates. Latency is the enemy.
3. **Built for extension.** Every module is self-contained. Adding marketplace, voice rooms, tournaments means adding a folder, not refactoring the core.

### 1.1 Identity Pillars

- **Reptile-tech aesthetic** — bioluminescent green meets carbon fiber. Soft scales, sharp edges.
- **Deep space backdrop** — pitch-black canvas, neon edges, volumetric light.
- **Living surface** — subtle parallax, breathing gradients, ambient particles, real-time presence indicators.
- **Confident typography** — oversized headlines, monospace technical labels, generous spacing.

---

## 2. Tech Stack

| Area | Tool | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | RSC, route handlers, server actions, edge runtime |
| Language | **TypeScript (strict)** | Type safety across full stack |
| Styling | **Tailwind CSS v4** | Utility-first, design tokens via CSS variables |
| Components | **shadcn/ui + Radix** | Accessible primitives, fully customizable |
| 3D Engine | **Three.js + React Three Fiber + Drei** | Declarative 3D |
| 3D Effects | **@react-three/postprocessing** | Bloom, chromatic aberration, DOF |
| Shaders | custom GLSL + `lamina` | Holographic, liquid metal, scale shaders |
| Hosted scenes (optional) | **Spline** | When custom GLSL is overkill |
| Smooth scroll | **Lenis** | Buttery scroll, scroll-linked anims |
| Scroll anim | **GSAP + ScrollTrigger** | Pin, scrub, complex sequences |
| UI animation | **Framer Motion** | Layout anims, gestures, presence |
| Icons | **Lucide React** + custom SVGs | Consistent stroke set |
| Forms | **React Hook Form** | Performant, uncontrolled |
| Validation | **Zod** | Shared with server (same codebase) |
| Server state | **TanStack Query v5** | Caching, refetch, infinite, mutations |
| Real-time | **Pusher Channels** (`pusher-js`) | Free tier, serverless-friendly |
| Client state | **Zustand + immer** | Auth shell, UI shell |
| Auth | **Auth.js (NextAuth v5)** | Built for Next.js, free, OAuth + credentials |
| Theme | **next-themes** | Persisted, system-aware |
| Toasts | **Sonner** | Stacked, promise toasts |
| Tables | **TanStack Table v8** | Headless, server-side pagination |
| Charts | **Recharts** + **visx** for custom | Standard + bespoke vis |
| Editor | **Tiptap** | Extensible rich text |
| Date/time | **date-fns** + **luxon** for tz | Lightweight, modular |
| Command menu | **cmdk** | ⌘K palette |
| Drag & drop | **dnd-kit** | Kanban, gallery reorder |
| URL state | **nuqs** | Filters/pagination in query string |
| Image upload | direct → **Cloudinary** (signed) | Browser uploads bypass functions |
| i18n | **next-intl** | Multi-language ready |
| PWA | **@serwist/next** | Offline shell, install prompt |
| Testing | **Vitest** + **Playwright** + **Storybook** | Unit, e2e, visual |
| Lint | **Biome** | Fast, single tool |
| Deploy | **Vercel** | First-class Next.js |

---

## 3. Visual System

### 3.1 Color Tokens (CSS variables, dark-first)

```css
:root {
  --bg-void:        #03050A;
  --bg-deep:        #070B14;
  --bg-card:        #0C1320;
  --bg-elev-1:      #111A2B;
  --bg-elev-2:      #16223A;

  --glass-tint:     rgba(255,255,255,0.04);
  --glass-border:   rgba(120,255,180,0.08);
  --glass-strong:   rgba(0,255,140,0.18);

  --gekko-500:      #00FF88;
  --gekko-400:      #4DFFB0;
  --gekko-600:      #00C46A;
  --gekko-300:      #B6FFD9;

  --neon-cyan:      #22D3EE;
  --neon-violet:    #8B5CF6;
  --neon-pink:      #F472B6;
  --neon-amber:     #FBBF24;

  --text-primary:   #F4F7FB;
  --text-secondary: #9AA7B8;
  --text-muted:     #5E6B7D;

  --success:        #22C55E;
  --warning:        #F59E0B;
  --danger:         #EF4444;
  --info:           #3B82F6;

  --glow-gekko:     0 0 60px rgba(0,255,140,0.35);
  --glow-violet:    0 0 60px rgba(139,92,246,0.30);
}
```

### 3.2 Typography

| Use | Font |
|---|---|
| Display (hero) | **Clash Display** or **Geist Mega** (600–700) |
| Headings | **Space Grotesk** (500–700) |
| Body | **Inter** (400–500) |
| Mono | **JetBrains Mono** or **Geist Mono** |

Loaded via `next/font/local` (self-hosted, no Google Fonts request, free, fast).

### 3.3 Surface Treatments

- **Glass v2**: `backdrop-blur-2xl bg-glass-tint border border-glass-border` + inset highlight.
- **Neon edge cards**: 1px gradient border via `bg-clip-padding` + mask.
- **Scale texture**: SVG noise overlay at 4% opacity.
- **Holographic badges**: conic gradient + animated hue shift.
- **Mesh gradients**: large soft radial gradients as `fixed inset-0 -z-10`.
- **Animated grain**: canvas overlay at 3% opacity.

### 3.4 Motion Tokens

```ts
export const motion = {
  ease: {
    out:    [0.16, 1, 0.3, 1],
    inOut:  [0.85, 0, 0.15, 1],
    spring: { stiffness: 240, damping: 28 },
    bounce: [0.34, 1.56, 0.64, 1],
  },
  dur:  { fast: 0.18, base: 0.32, slow: 0.6, cinematic: 1.2 },
  dist: { sm: 8, md: 16, lg: 32, xl: 64 },
};
```

All animations respect `prefers-reduced-motion`. A `useReducedMotion()` hook gates expensive 3D scenes (falls back to static poster).

---

## 4. Project Structure (single Next.js app, full-stack)

```bash
team-gekko/
├── public/
│   ├── models/             # .glb 3D assets (Gekko mascot)
│   ├── textures/           # noise, scale patterns, HDR env
│   ├── shaders/            # standalone .glsl files
│   ├── images/
│   ├── logos/
│   └── og/                 # OG fallback images
│
├── src/
│   ├── app/
│   │   ├── (marketing)/    # public site
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── about/page.tsx
│   │   │   ├── gallery/page.tsx
│   │   │   ├── gallery/[id]/page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── projects/[slug]/page.tsx
│   │   │   ├── events/page.tsx
│   │   │   ├── events/[slug]/page.tsx
│   │   │   ├── leaderboard/page.tsx
│   │   │   ├── members/page.tsx
│   │   │   ├── members/[username]/page.tsx
│   │   │   ├── blog/page.tsx
│   │   │   ├── blog/[slug]/page.tsx
│   │   │   ├── changelog/page.tsx
│   │   │   ├── roadmap/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── support/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   └── privacy/page.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── layout.tsx          # split-screen 3D shell
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── reset-password/[token]/page.tsx
│   │   │   ├── verify-email/page.tsx
│   │   │   └── onboarding/page.tsx
│   │   │
│   │   ├── dashboard/              # protected: any authed user
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── projects/new/page.tsx
│   │   │   ├── projects/[id]/edit/page.tsx
│   │   │   ├── achievements/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── events/page.tsx
│   │   │   ├── settings/...
│   │   │   └── security/page.tsx
│   │   │
│   │   ├── admin/                  # protected: permission-gated
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── users/[...]
│   │   │   ├── roles/page.tsx
│   │   │   ├── content/posts/[...]
│   │   │   ├── gallery/page.tsx
│   │   │   ├── events/page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── announcements/page.tsx
│   │   │   ├── tickets/[...]
│   │   │   ├── analytics/page.tsx
│   │   │   ├── logs/page.tsx
│   │   │   ├── moderation/page.tsx
│   │   │   ├── system/page.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   ├── api/                    # ALL backend logic lives here
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── auth/register/route.ts
│   │   │   ├── auth/verify-email/route.ts
│   │   │   ├── auth/forgot-password/route.ts
│   │   │   ├── auth/reset-password/route.ts
│   │   │   ├── auth/me/route.ts
│   │   │   ├── users/[...]
│   │   │   ├── admin/[...]
│   │   │   ├── posts/[...]
│   │   │   ├── gallery/[...]
│   │   │   ├── projects/[...]
│   │   │   ├── events/[...]
│   │   │   ├── notifications/[...]
│   │   │   ├── announcements/[...]
│   │   │   ├── tickets/[...]
│   │   │   ├── leaderboard/route.ts
│   │   │   ├── badges/[...]
│   │   │   ├── analytics/[...]
│   │   │   ├── search/route.ts
│   │   │   ├── uploads/sign/route.ts
│   │   │   ├── uploads/complete/route.ts
│   │   │   ├── realtime/auth/route.ts  # Pusher private-channel auth
│   │   │   ├── cron/[task]/route.ts    # Vercel Cron handlers
│   │   │   ├── jobs/[handler]/route.ts # QStash webhook handlers
│   │   │   ├── webhooks/[provider]/route.ts
│   │   │   └── health/route.ts
│   │   │
│   │   ├── layout.tsx              # root: providers, fonts, theme
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── loading.tsx
│   │   ├── globals.css
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   ├── manifest.ts
│   │   └── opengraph-image.tsx
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn primitives
│   │   ├── shared/
│   │   ├── layout/
│   │   ├── three/                  # R3F: scenes, meshes, materials, effects
│   │   ├── motion/
│   │   ├── landing/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── admin/
│   │   ├── gallery/
│   │   ├── blog/
│   │   ├── events/
│   │   ├── projects/
│   │   ├── leaderboard/
│   │   ├── members/
│   │   ├── notifications/
│   │   ├── presence/
│   │   └── editor/
│   │
│   ├── server/                     # BACKEND LOGIC — see backend plan
│   │   ├── db/                     # Prisma client
│   │   ├── auth/                   # Auth.js config, session helpers
│   │   ├── modules/                # one folder per domain
│   │   ├── lib/                    # response, pagination, errors
│   │   ├── realtime/               # Pusher server
│   │   ├── jobs/                   # QStash producers, Vercel Cron handlers
│   │   ├── mail/                   # Resend client, React Email templates
│   │   └── storage/                # Cloudinary helpers
│   │
│   ├── lib/                        # client-side libs
│   │   ├── api.ts
│   │   ├── pusher.ts
│   │   ├── query-client.ts
│   │   ├── analytics.ts
│   │   ├── utils.ts
│   │   ├── format.ts
│   │   └── validators.ts           # Zod schemas shared with server
│   │
│   ├── services/                   # client → API wrappers
│   ├── hooks/
│   ├── store/
│   ├── types/
│   ├── data/                       # mock data for early-phase prototype
│   ├── config/
│   ├── styles/
│   ├── i18n/
│   └── middleware.ts               # Auth.js + route gates
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── tests/
├── .storybook/
├── biome.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. The 3D Layer

### 5.1 What's Actually 3D

3D is reserved for the moments that matter:

| Surface | 3D treatment |
|---|---|
| **Hero** | Interactive Gekko mascot mesh that drifts toward cursor. Volumetric fog, orb field. |
| **Auth pages** | Rotating low-poly Gekko on right pane, color-shifting environment. |
| **Mission cards** | Floating glass slabs with DOF on scroll-trigger. |
| **Project showcase** | 3D tilted preview cards, hover reveals back face. |
| **Achievement constellation** | Badges as navigable starfield. Camera flies between earned badges. |
| **Leaderboard podium** | Top 3 on a holographic 3D podium. |
| **404 / errors** | Lost Gekko floating in void. |
| **Loading screens** | Logo with WebGL liquid shader. |

### 5.2 Performance Budget (matters more on serverless — no SSR for canvases)

- All canvases **lazy-loaded** (`next/dynamic` with `ssr: false`) behind a poster.
- `useThreePerf()` hook detects GPU tier via `detect-gpu`; low-tier → static poster.
- Canvases pause on `visibilitychange` and `IntersectionObserver`.
- DPR clamped to `[1, 1.5]` on mobile, `[1, 2]` on desktop.
- Post-processing only on high-tier devices.
- Models ≤ 30k triangles total, textures ≤ 1024px (KTX2-compressed).
- `frameloop="demand"` for static scenes.
- Vercel's edge caching delivers .glb files via CDN automatically.

### 5.3 Canvas Wrapper Pattern

```tsx
'use client';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { useThreePerf } from '@/hooks/use-three-perf';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export function SafeCanvas({ children, poster, ...props }) {
  const tier = useThreePerf();
  const reduced = useReducedMotion();
  if (reduced || tier === 'low') return <img src={poster} alt="" />;

  return (
    <Canvas
      dpr={[1, tier === 'high' ? 2 : 1.5]}
      gl={{ antialias: tier === 'high', alpha: true, powerPreference: 'high-performance' }}
      frameloop="demand"
      {...props}
    >
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
```

---

## 6. Smooth Scroll

### 6.1 Lenis + GSAP setup

Lenis only on marketing routes (faster, dashboard uses native scroll).

```tsx
'use client';
import Lenis from 'lenis';
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function SmoothScrollProvider({ children }) {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    return () => lenis.destroy();
  }, []);
  return <>{children}</>;
}
```

### 6.2 Patterns

- Pin + scrub for feature reveals
- Magnetic CTAs
- Number counters when in viewport
- Section parallax (0.4× foreground)
- Horizontal scroll hijack on project showcase (desktop only)

---

## 7. Routes & Pages

### 7.1 Public (marketing)
```
/                       Landing
/about
/gallery, /gallery/[id]
/projects, /projects/[slug]
/events, /events/[slug]
/leaderboard
/members, /members/[username]
/blog, /blog/[slug]
/changelog, /roadmap
/contact, /support, /terms, /privacy
```

### 7.2 Auth
```
/login
/register
/forgot-password
/reset-password/[token]
/verify-email
/onboarding
```

### 7.3 User Dashboard
```
/dashboard
/dashboard/profile
/dashboard/projects, /new, /[id]/edit
/dashboard/achievements
/dashboard/notifications
/dashboard/events
/dashboard/settings (general, appearance, notifications, connections, danger)
/dashboard/security
```

### 7.4 Admin
```
/admin
/admin/users, /admin/users/[id]
/admin/roles
/admin/content/posts (+ /new, /[id])
/admin/content/pages
/admin/gallery
/admin/events
/admin/projects (moderation)
/admin/announcements
/admin/tickets, /admin/tickets/[id]
/admin/analytics
/admin/logs
/admin/moderation
/admin/system
/admin/settings
```

---

## 8. Landing Composition

```
01. Navbar (sticky glass)
02. Hero (R3F Gekko + headline + stats orbit)
03. Live Pulse strip (real-time counters via Pusher)
04. About / Mission (split, scroll-pinned cards)
05. Feature Bento Grid (animated tiles, ⌘K demo tile)
06. Project Showcase (horizontal hijack, 3D tilt cards)
07. Events Carousel (countdowns)
08. Leaderboard Snapshot (top 5 + 3D podium top 3)
09. Member Spotlight (hover-reveal cards)
10. Gallery Mosaic (masonry, parallax, lightbox)
11. Community Globe (3D rotating, member dots) — optional
12. Blog / Changelog Preview
13. Discord CTA (animated gradient border)
14. FAQ (accordion, searchable)
15. Newsletter CTA
16. Footer
```

### 8.1 Hero Detail

```
HeroSection
├── HeroCanvas (R3F)
│   ├── GekkoMascot (gltf, idle anim, mouse follow)
│   ├── OrbField (instanced particles)
│   ├── GroundGrid (custom shader, pulse on cursor)
│   ├── Postprocessing (bloom, vignette, chromatic)
│   └── EnvironmentLighting (3-point + HDR env)
├── HeroOverlay (DOM)
│   ├── EyebrowBadge
│   ├── HeadlineMagnetic (split-text reveal)
│   ├── SubcopyTypewriter
│   ├── CTAGroup
│   ├── StatsOrbit (4 floating cards w/ live numbers)
│   └── ScrollHint
```

```
COMMUNITY · DEVELOPERS · CREATORS

Where the team builds, plays, and ships together.

Team Gekko is a living community platform — projects, events,
leaderboards, and real-time presence. Built for people who make things.

[ Join Discord ]  [ Explore the Platform ]
```

### 8.2 Live Pulse Strip

Horizontal marquee beneath the hero. Subscribes to a public Pusher channel; each metric pulses on update. Falls back to a static snapshot when sockets aren't available.

---

## 9. Authentication

### 9.1 Auth.js (NextAuth v5)

Auth.js is the **default** for free-tier Next.js apps. It handles sessions, cookies, CSRF, and OAuth out of the box. We extend it with credentials (email/password), Discord, and GitHub providers.

```ts
// src/server/auth/config.ts
import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/server/db/prisma';

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Discord({ clientId: process.env.AUTH_DISCORD_ID!, clientSecret: process.env.AUTH_DISCORD_SECRET! }),
    GitHub({ clientId: process.env.AUTH_GITHUB_ID!, clientSecret: process.env.AUTH_GITHUB_SECRET! }),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => verifyCredentials(creds),
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.permissions = await loadPermissions(user.id);
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.sub!;
      session.user.permissions = token.permissions as string[];
      session.user.role = token.role as string;
      return session;
    },
  },
  pages: { signIn: '/login', error: '/login' },
});
```

### 9.2 Pages

- **Login** — email/username + password, password visibility toggle, "Remember me", forgot link, Discord + GitHub OAuth buttons.
- **Register** — username (live availability via API), email, password (strength meter), confirm, optional invite code, terms. Redirect → `/verify-email`.
- **Verify Email** — 6-digit OTP (auto-advance), resend countdown.
- **Forgot Password** — email input, rate-limited, generic success.
- **Reset Password** — token validated server-side, new password, redirect to login.
- **Onboarding** — 4-step flow after first login (avatar, interests, link Discord, first goal).

### 9.3 Layout

Two-column shell. Right pane is a persistent R3F scene that morphs as the user moves between login/register/forgot. Left pane forms transition via `<AnimatePresence>` with shared layout IDs.

### 9.4 Shared Zod Schemas

Same Zod schemas validate on client and server (literal same import).

```ts
// lib/validators.ts
export const passwordSchema = z.string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'One uppercase letter')
  .regex(/[a-z]/, 'One lowercase letter')
  .regex(/[0-9]/, 'One number')
  .regex(/[^A-Za-z0-9]/, 'One special character');

export const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: passwordSchema,
  confirmPassword: z.string(),
  inviteCode: z.string().optional(),
  acceptTerms: z.literal(true),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match", path: ['confirmPassword'],
});
```

---

## 10. RBAC on the Frontend

Auth.js session includes `user.permissions: string[]` (flattened from roles server-side). The UI never decides based on role name — only on permission strings. Adding a permission requires zero frontend refactor.

```tsx
// components/shared/Can.tsx
export function Can({ permission, fallback = null, children }) {
  const { data: session } = useSession();
  const perms = session?.user?.permissions ?? [];
  const allowed = Array.isArray(permission)
    ? permission.some((p) => perms.includes(p))
    : perms.includes(permission);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
```

`middleware.ts` reads the Auth.js cookie at the edge:
- Unauthed user on `/dashboard/*` or `/admin/*` → redirect to `/login`.
- Authed user on `/login` or `/register` → redirect to `/dashboard`.
- Non-admin on `/admin/*` → return 404 (don't reveal surface).

---

## 11. User Dashboard

### 11.1 Shell

```
DashboardLayout
├── DashboardSidebar (collapsible, keyboard-navigable, badges for counts)
├── DashboardTopbar (breadcrumbs, ⌘K search, notification bell, user menu)
├── PresenceIndicator (small green pulse, "12 friends active")
├── Main content
└── MobileDashboardNav (bottom tab bar)
```

### 11.2 Overview

Modular widget grid (`react-grid-layout`) so users can rearrange:

- Welcome / streak card
- Profile completion meter
- XP progress + next rank
- Recent activity feed
- Upcoming events
- Latest notifications
- Top community posts (personalized)
- Your projects (active 3)
- Achievement just unlocked
- Friends online (avatars + presence dots)

### 11.3 Profile

- Avatar uploader (drag-drop, crop, direct-to-Cloudinary signed)
- Cover image
- Display name, username (immutable for 30 days after change)
- Bio (markdown, 280 chars)
- Pronouns, location, timezone (auto-detected)
- Connected accounts (Discord, GitHub, Twitch)
- Social links
- Visibility (public / members-only / private)
- Live preview card

### 11.4 Achievements

- Grid view (classic, locked/unlocked)
- Constellation view (3D starfield, camera fly-to on click)

### 11.5 Notifications

- Tabs: All / Unread / Mentions / System
- Bulk actions (mark all, archive)
- Group similar ("5 people liked your project")
- Filter by source

### 11.6 Settings

- General: display name, language, timezone
- Appearance: theme (dark/light/system/oled), density, reduced motion, glass toggle, **3D effects master switch**
- Notifications: per-channel × per-event matrix (in-app, email, push)
- Connections: Discord/GitHub/Twitch
- Danger: export data (GDPR via QStash background job), delete account (typed confirmation)

### 11.7 Security

- Change password (re-auth required)
- 2FA setup (TOTP, QR code)
- Active sessions (device, IP, last active, revoke)
- Login history (90 days)
- API tokens (for power users — v2)

---

## 12. Admin Console

### 12.1 Shell

```
AdminLayout
├── AdminSidebar (groups: People / Content / Engagement / Operations)
├── AdminTopbar (env badge, ⌘K, notifications, impersonation banner if active)
├── AdminCommandMenu ("Find user…", "New post", "Open ticket #123")
├── Main content
└── AuditTrailDrawer (every action you take, logged)
```

### 12.2 Overview

Animated counters:
- Total users · DAU · WAU · MAU
- Active sessions (Pusher presence channel count)
- Posts published (7d)
- Open tickets · Avg response time
- New registrations (24h)
- API health (Vercel function p95, DB latency, error rate)

Charts (Recharts + visx):
- User growth (line, 30/90/365)
- Traffic by source (donut)
- Engagement heatmap (day × hour)
- Top content (sortable)

### 12.3 Users

- Server-side paginated, sortable, filterable table (TanStack Table + Query)
- Filters: role, status, verified, has Discord, date ranges
- Bulk: change role, ban, unban, verify, send email
- Row: view, edit, **impersonate** (audit-logged), ban, delete
- Detail page: profile, activity timeline, sessions, login history, content, audit trail

### 12.4 Roles & Permissions

Visual matrix: roles down, permissions across, checkbox grid. Drag to reorder. Custom roles supported.

### 12.5 Content (CMS)

- Posts: list with filters
- Tiptap editor with custom extensions (callouts, code blocks, embeds, image+caption, slash menu like Notion)
- Right sidebar: status, schedule, category, tags, SEO (title, description, OG picker), featured image
- Live preview pane
- Autosave (server action every 8s) + version history

### 12.6 Gallery

- Drag-drop bulk upload → direct to Cloudinary signed
- Moderation queue
- Tag/category managers
- Bulk re-categorize, bulk delete
- Detail: EXIF, uploader, views, likes, reports

### 12.7 Events

- Calendar + list toggle
- Editor: cover, banner, dates, capacity, type (workshop / tournament / meetup / stream), registration mode (open / approval / invite), prizes, schedule
- Participants table per event
- Tournament bracket builder (single-elim v1, double-elim v2)
- "Go live" button reveals event on homepage hero

### 12.8 Announcements

- Site-wide banner toggle
- Target by role
- Schedule (Vercel Cron picks up via published_at)
- Discord webhook fanout (toggle)
- Email broadcast (toggle, batched via QStash)
- Variants: info / success / warning / danger / event

### 12.9 Tickets

- Inbox UI (list left, conversation right)
- Statuses: open · pending_user · pending_agent · resolved · closed
- Priority: low / medium / high / urgent
- Assign, tag, internal notes, canned responses
- SLA timer per priority

### 12.10 Analytics

- Filters: date range, segment, device, country
- Funnels (registration → verify → first action → return d7)
- Cohort retention
- Top pages, referrers, exits
- Custom event tracking via PostHog dashboard embed (or our own pages)

### 12.11 Logs

- **Audit logs** — admin actions (who, what, when, diff)
- **Auth logs** — logins, failures, role changes
- **System logs** — errors + slow queries (tail from Sentry breadcrumbs + Neon logs)

Sortable, filterable, CSV/JSON export.

### 12.12 Moderation

- Reports queue
- Auto-flagged content (optional Hive or OpenAI moderation API hook)
- Quick actions: approve, hide, delete, warn, ban

### 12.13 System

- Health dashboard (uptime, p50/p95/p99, error rate, DB latency, QStash queue depth)
- Background jobs view (Upstash QStash dashboard embed or our wrapper)
- Feature flag manager
- Cache invalidation (Upstash Redis flush)

### 12.14 Settings

- Site: name, tagline, logo, favicon, social cards
- SEO defaults
- Branding (primary/accent — preview live)
- Email templates (subject + body editor, sends via Resend)
- Discord (bot token, guild ID, webhook URLs)
- Cloudinary, upload limits
- Registration: open / invite-only / closed
- Feature flags (module on/off)
- Maintenance mode (countdown banner option)

---

## 13. Real-Time Layer (Pusher, no Socket.io)

### 13.1 Why Pusher

Vercel serverless can't hold open WebSocket connections. **Pusher Channels** is a managed pub/sub service:

- Free tier: 200k messages/day, 100 concurrent connections, unlimited channels.
- Frontend connects directly to Pusher's edge.
- Backend (route handlers / cron jobs) **triggers events** via Pusher's REST API.

Alternatives: **Ably** (free: 3M messages/mo, 200 concurrent), **Supabase Realtime** (free with their Postgres). Pusher is recommended for simplicity.

### 13.2 Client Setup

```ts
// lib/pusher.ts
'use client';
import Pusher from 'pusher-js';

export const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  authEndpoint: '/api/realtime/auth', // signs private/presence channel subscribes
});
```

### 13.3 Channels Used

| Channel | Type | Purpose |
|---|---|---|
| `live-pulse` | public | Site-wide counters (members online, msgs today) |
| `announcements` | public | Site-wide announcement push |
| `presence-global` | presence | Active users on site (member dots, count) |
| `presence-event-{eventId}` | presence | Live attendance in an event |
| `private-user-{userId}` | private | Notifications, role changes, session invalidation |
| `private-admin` | private | Admin alerts, new tickets |

Private/presence channels require server-side auth at `/api/realtime/auth` (route handler verifies session and signs).

### 13.4 Events Consumed (client)

```
notification:new        → toast + invalidate Query
notification:read       → invalidate Query
announcement:new        → banner + bell ping
presence:update         → presence store
live:metrics            → live pulse strip
event:starting          → swap hero CTA
event:live              → show "watch live" badge
ticket:reply (admin)    → toast + sound
me:role-changed         → re-fetch session (Auth.js)
me:logged-out           → force sign-out
```

### 13.5 Hook

```ts
// hooks/use-channel.ts
'use client';
import { useEffect } from 'react';
import { pusher } from '@/lib/pusher';

export function useChannel(name: string, events: Record<string, (data: any) => void>) {
  useEffect(() => {
    const channel = pusher.subscribe(name);
    Object.entries(events).forEach(([ev, fn]) => channel.bind(ev, fn));
    return () => {
      Object.keys(events).forEach((ev) => channel.unbind(ev));
      pusher.unsubscribe(name);
    };
  }, [name]);
}
```

### 13.6 Optimistic UI

Every mutation that touches user-visible state uses TanStack Query's `onMutate` / `onError` rollback. Server confirms via Pusher event → cache invalidates. Latency feels zero.

---

## 14. Search (⌘K Command Menu)

Single palette accessible from any page (⌘K / Ctrl-K).

Categories: Pages · Users · Posts · Projects · Events · Recent · Actions.

Server-side search hits `/api/search?q=&type=` (Postgres full-text in v1). Frontend debounces 200ms.

---

## 15. Theme System

- Dark (default), Light, OLED, System.
- Color tokens via CSS variables — theme switch swaps `:root` values.
- `next-themes` for persistence + no-flash.
- Per-section accent override (events: violet, projects: cyan).

---

## 16. Mock Data → Real API

### 16.1 Phase A — Mock-First

Every service has a mock implementation gated by env flag:

```ts
// services/post.service.ts
import { mockPosts } from '@/data/posts.mock';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const postService = {
  list: USE_MOCK
    ? async (params) => paginate(mockPosts, params)
    : async (params) => api.get('/posts', { params }),
};
```

UI is fully working before the API exists.

### 16.2 Phase B — Switch on

Flip `NEXT_PUBLIC_USE_MOCK=false`. No component changes. The API is in the same codebase, so types are automatic.

---

## 17. State Strategy

| Concern | Tool |
|---|---|
| Server data | TanStack Query |
| Realtime push → cache invalidation | Pusher → `queryClient.invalidateQueries` |
| Auth (user, session) | Auth.js `useSession()` + Query for extended `me` |
| UI shell (sidebar, theme, ⌘K open) | Zustand |
| Form state | React Hook Form |
| URL state (filters, pagination) | `nuqs` |
| Ephemeral (toasts, dialogs) | Sonner / Radix |

Rule: server data lives in Query. Zustand is UI-only.

---

## 18. Accessibility

- WCAG 2.2 AA.
- Keyboard navigable everywhere, visible focus rings (`focus-visible:ring-2 ring-gekko-500`).
- ARIA on custom widgets (Radix handles most).
- Canvases have static fallbacks for screen readers + reduced-motion users.
- Color never sole status indicator (icon + text).
- Skip-to-content link.
- Live regions for toasts.
- Forms: labels + `aria-describedby` errors.
- Modals: focus trap, return on close, ESC.

---

## 19. SEO

- App-router `generateMetadata` per route.
- Dynamic OG images via `app/opengraph-image.tsx` + `app/api/og/[type]/route.tsx` (using `next/og`, free, fast on Edge).
- JSON-LD on blog posts (`Article`), events (`Event`), profiles (`Person`).
- `sitemap.ts`, `robots.ts` at root.
- Canonical URLs every page.

---

## 20. Performance Budget

| Metric | Target |
|---|---|
| LCP (mobile, 4G) | < 2.5s |
| INP | < 200ms |
| CLS | < 0.05 |
| Initial JS (marketing) | < 180 KB gz |
| Initial JS (dashboard) | < 250 KB gz |
| Lighthouse perf (mobile) | ≥ 85 |
| Lighthouse a11y | ≥ 95 |

Techniques:
- RSC for all non-interactive surfaces (drops shipped JS).
- `next/dynamic` `ssr: false` for all canvases.
- `next/image` everywhere (AVIF/WebP via Vercel).
- `next/font/local` (no Google Fonts request).
- Route-segment `loading.tsx` + Suspense.
- Edge runtime for fast-path routes (`/api/og`, `/api/realtime/auth`, `/api/leaderboard`).

---

## 21. PWA

- `app/manifest.ts` with icons, theme color, display=standalone.
- Service worker via `@serwist/next`: cache-first for assets, network-first for API.
- Install prompt in user menu.
- Web Push via VAPID (server has the keys, see backend plan).

---

## 22. Testing

- **Vitest** for `lib/`, `hooks/`, validators, services (mocked fetch).
- **Playwright** e2e for critical paths: register → verify → onboarding → first post; login → admin → ban user.
- **Storybook** for `components/ui/` and feature components.
- **axe-core** integration in Storybook + Playwright.

---

## 23. Environment Variables (frontend-visible only — full list in backend plan)

```env
# Public (NEXT_PUBLIC_* exposed to browser)
NEXT_PUBLIC_APP_NAME="Team Gekko"
NEXT_PUBLIC_APP_URL=https://teamgekko.vercel.app
NEXT_PUBLIC_USE_MOCK=true

NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=eu

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=gekko_signed

NEXT_PUBLIC_DISCORD_INVITE_URL=https://discord.gg/example

NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com

NEXT_PUBLIC_SENTRY_DSN=

NEXT_PUBLIC_FEATURE_3D=true
NEXT_PUBLIC_FEATURE_MESSAGES=false
```

---

## 24. Setup Commands

```bash
npx create-next-app@latest team-gekko --typescript --tailwind --eslint --app --src-dir
cd team-gekko

# UI core
npm i framer-motion lenis lucide-react next-themes sonner zustand immer
npm i @tanstack/react-query @tanstack/react-table @tanstack/react-query-devtools
npm i react-hook-form zod @hookform/resolvers
npm i clsx tailwind-merge class-variance-authority
npm i date-fns luxon nuqs cmdk
npm i @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image
npm i recharts @visx/visx
npm i next-intl

# Auth
npm i next-auth@beta @auth/prisma-adapter

# Realtime
npm i pusher-js
npm i pusher          # server SDK

# 3D
npm i three @react-three/fiber @react-three/drei @react-three/postprocessing
npm i detect-gpu
npm i -D @types/three

# Scroll + animation
npm i gsap

# DnD
npm i @dnd-kit/core @dnd-kit/sortable

# Database (Prisma + Neon serverless driver)
npm i prisma @prisma/client @neondatabase/serverless @prisma/adapter-neon

# Server-side helpers (used in app/api/*)
npm i argon2 jsonwebtoken otplib qrcode
npm i sanitize-html
npm i resend
npm i @react-email/components @react-email/render
npm i cloudinary
npm i @upstash/redis @upstash/ratelimit @upstash/qstash
npm i web-push

# shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button input textarea card dialog dropdown-menu sheet tabs badge avatar table form accordion alert checkbox switch select tooltip popover command separator skeleton progress radio-group toggle scroll-area

# PWA
npm i @serwist/next

# Dev
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event
npm i -D playwright @playwright/test
npm i -D storybook @storybook/nextjs @storybook/addon-essentials @storybook/addon-a11y
npm i -D @biomejs/biome
```

---

## 25. Roadmap (Phases)

### Phase 0 — Foundation (week 1)
- Next.js scaffold, Tailwind v4 tokens, shadcn init, fonts, Biome.
- Theme provider, root layout, route groups.
- Mock data system, TanStack Query provider.
- Connect Neon, Prisma schema, seed.
- Auth.js installed with credentials + Discord + GitHub providers.
- CI: Biome + tsc check + Prisma validate.
- Deploy hello-world to Vercel.

### Phase 1 — Marketing Surface (week 2–3)
- Navbar (glass, scroll-react), Footer, SmoothScroll provider.
- Hero with R3F GekkoMascot (placeholder geometry first, .glb second).
- Live Pulse strip wired to Pusher public channel.
- Bento, Project Showcase (horizontal hijack), Events, Leaderboard snapshot, Gallery mosaic, FAQ, Discord CTA, Newsletter.
- About, Contact, Support/FAQ, Terms, Privacy, Changelog, Roadmap.
- Blog list + post detail, Gallery list + detail, Events list + detail, Projects list + detail, Members directory + public profile, Leaderboard full.

### Phase 2 — Auth (week 4)
- Split-screen layout with right-pane R3F scene.
- Login, register (live username check via API), forgot, reset, verify-email, onboarding.
- Auth.js fully wired with HTTP-only cookies.
- Middleware route guards.

### Phase 3 — User Dashboard (week 5–6)
- Shell (sidebar, topbar, presence via Pusher presence channel, command menu).
- Overview with rearrangeable widget grid.
- Profile, projects (CRUD with autosave via server actions), achievements (grid + 3D constellation), notifications, events, settings (all sections), security (2FA).

### Phase 4 — Admin Console (week 7–8)
- Shell, audit trail drawer, overview with charts.
- Users (server-side table, bulk, impersonation).
- Roles (permission matrix).
- CMS (Tiptap editor, autosave server actions, versions, schedule).
- Gallery, Events (bracket builder), Announcements, Tickets (inbox), Moderation, Analytics, Logs, System, Settings.

### Phase 5 — Realtime + Jobs Polish (week 9)
- Pusher fully wired (notifications, presence, live metrics, live event).
- Vercel Cron handlers: scheduled publishing, event reminders, leaderboard rebuild, cleanup.
- QStash handlers: email broadcast, data export, badge evaluation, Discord fanout.
- Web Push subscription UI in Settings.

### Phase 6 — Optimization & Launch (week 10)
- Storybook, Playwright e2e, Lighthouse pass, SEO audit.
- OG image generation (Edge), sitemap, robots, structured data.
- Sentry, PostHog, error boundaries, not-found polish.
- Vercel deploy, custom domain via Cloudflare, env secrets locked in.

### Phase 7+ — Extensions (post-launch)
Each is a self-contained module that fits the architecture without core changes:
- DMs (Pusher private channels)
- Voice rooms (LiveKit free tier)
- Marketplace (Stripe — paid)
- Tournament live scoring
- Streamer overlay tools
- AI helper (OpenAI / Anthropic / Groq free tier)
- Mobile native shell (Capacitor wrapping the PWA)

---

## 26. Definition of Done (per feature)

Before merge, every feature has:

1. **Works** with mock data + against API.
2. **Loading state** (skeleton, not spinner where possible).
3. **Empty state** (illustration + CTA).
4. **Error state** (retry button).
5. **Permission gates** if applicable.
6. **Mobile layout** at 360, 768, 1024+.
7. **Keyboard navigable**, focus-visible, ARIA-correct.
8. **Reduced-motion fallback** if 3D/animation involved.
9. **Optimistic mutation** if user-facing write.
10. **Telemetry event** (PostHog).
11. **Storybook story** for new visual components.
12. **e2e covered** for new critical paths.

---

## 27. Naming & Conventions

- Files: kebab-case (`use-current-user.ts`, `hero-section.tsx`).
- Components: PascalCase exports.
- Hooks: `useX`, return objects (not tuples).
- Services: `xService.list()`, `.get()`, `.create()`, `.update()`, `.delete()`.
- Types: PascalCase, no `I` prefix.
- Mock data: `data/x.mock.ts` exports `mockXs`.
- Tests colocated `*.test.ts(x)` or `tests/` for e2e.

---

## 28. Final Recommendation

Build this as a **fully working product from day one** on Vercel's free tier:

- Every page renders real-looking UI on first commit (mock data).
- Every interactive element does something (mock mutations succeed).
- Every animation runs at 60fps or falls back gracefully.
- Every module is independent — the next feature is plug-and-play.

The stack — **Next.js 15 + Prisma + Neon + Auth.js + Pusher + Cloudinary + Resend + Upstash QStash + Vercel Cron + R3F + Lenis + GSAP + Framer + TanStack Query + Tailwind v4** — gives you a production platform with **$0/month** in infrastructure cost and a clean upgrade path when you outgrow any single piece.
