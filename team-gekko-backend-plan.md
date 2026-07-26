# Team Gekko — Server & API Plan (v3 · Vercel free-tier)

> Goal: a production-ready API + business logic layer that lives **inside the same Next.js app** as the frontend, runs entirely on Vercel's free Hobby tier, and uses only free-tier managed services. Every feature works end-to-end on $0/month, with a clear upgrade path when traffic grows.

---

## 1. The "Backend" on Free-Tier Vercel

There is **no separate backend server**. The API and all server-side business logic live inside the Next.js app:

- **Public REST endpoints** → `app/api/.../route.ts` (Route Handlers, Node runtime by default, Edge for fast-path).
- **Mutations triggered by the UI** → React Server Actions (great for forms, but we also expose REST equivalents so external clients can use them).
- **Auth, session, cookies** → Auth.js (NextAuth v5) inside the same app.
- **Scheduled tasks** → Vercel Cron (Hobby: 2 free crons; we plan around the limit, see §10.2).
- **Deferred / fan-out jobs** → Upstash QStash (HTTP-triggered webhooks back into our app).
- **Realtime push to clients** → Pusher Channels REST API (we publish; clients subscribe directly).
- **Database** → Neon Postgres via Prisma + Neon serverless driver (HTTP, no socket pool needed).
- **Cache / KV / rate-limit** → Upstash Redis REST API.
- **File storage** → direct browser → Cloudinary (signed). Backend only signs, never proxies bytes.
- **Email** → Resend API.

Everything is HTTP-driven and stateless — exactly what Vercel's serverless model expects.

---

## 2. Tech Stack

| Concern | Service / Tool | Free Tier |
|---|---|---|
| Runtime | **Vercel Functions** (Node + Edge) | 100 GB-hr/mo, unlimited deployments |
| Framework | **Next.js 15 Route Handlers + Server Actions** | — |
| Language | **TypeScript (strict)** | — |
| Database | **Neon Postgres** | 0.5 GB, autosuspend, branching |
| ORM | **Prisma 5** + `@prisma/adapter-neon` | — |
| Auth | **Auth.js (NextAuth v5)** | $0 |
| Password hash | **argon2** | — |
| 2FA | **otplib** (TOTP) + recovery codes | — |
| Validation | **Zod** (shared w/ frontend) | — |
| Realtime | **Pusher Channels** | 200k msgs/day, 100 concurrent |
| Cache / KV | **Upstash Redis** (HTTP) | 10k commands/day |
| Rate limit | **@upstash/ratelimit** | — |
| Deferred jobs | **Upstash QStash** | 500 messages/day |
| Cron | **Vercel Cron** | 2 cron jobs (Hobby) |
| Email | **Resend** + React Email | 3k/mo, 100/day |
| File storage | **Cloudinary** (signed upload) | 25 GB storage, 25 GB bandwidth |
| Web push | **web-push** (VAPID, self-hosted) | $0 |
| Search | **Postgres full-text** v1 → **Meilisearch Cloud** v2 ($10/mo) | — |
| Error tracking | **Sentry** | 5k errors/mo |
| Analytics | **Vercel Analytics** + **PostHog Cloud** | Vercel free; PostHog 1M events/mo |
| Logging | Vercel Logs + **Logtail** / **Axiom** free | — |
| API docs | **OpenAPI 3** via `zod-to-openapi` → typed client | — |
| Tests | **Vitest** + **Supertest** + **Playwright** | — |

**Cost: $0/month** until you outgrow a tier. Upgrade individual services as needed; nothing requires a rewrite.

---

## 3. Architecture

```
src/
├── app/
│   └── api/                              # ALL HTTP endpoints
│       ├── auth/[...nextauth]/route.ts   # Auth.js (login, OAuth, session)
│       ├── auth/register/route.ts
│       ├── auth/verify-email/route.ts
│       ├── auth/resend-verification/route.ts
│       ├── auth/forgot-password/route.ts
│       ├── auth/reset-password/route.ts
│       ├── auth/2fa/setup/route.ts
│       ├── auth/2fa/verify/route.ts
│       ├── auth/2fa/disable/route.ts
│       ├── auth/me/route.ts
│       ├── auth/sessions/route.ts
│       ├── auth/sessions/[id]/route.ts
│       │
│       ├── users/[...]/route.ts
│       ├── users/me/route.ts
│       ├── users/me/avatar/route.ts
│       ├── users/me/export/route.ts
│       │
│       ├── admin/stats/route.ts
│       ├── admin/users/route.ts
│       ├── admin/users/[id]/route.ts
│       ├── admin/users/[id]/role/route.ts
│       ├── admin/users/[id]/status/route.ts
│       ├── admin/users/[id]/impersonate/route.ts
│       ├── admin/audit-logs/route.ts
│       ├── admin/feature-flags/route.ts
│       ├── admin/broadcasts/email/route.ts
│       ├── admin/broadcasts/notification/route.ts
│       ├── admin/system/[...]/route.ts
│       │
│       ├── posts/route.ts
│       ├── posts/[slug]/route.ts
│       ├── posts/[id]/publish/route.ts
│       ├── posts/[id]/versions/route.ts
│       ├── categories/route.ts
│       ├── tags/route.ts
│       │
│       ├── gallery/route.ts
│       ├── gallery/[id]/route.ts
│       ├── gallery/[id]/approve/route.ts
│       ├── gallery/[id]/like/route.ts
│       │
│       ├── projects/[...]/route.ts
│       ├── events/[...]/route.ts
│       ├── events/[id]/bracket/[...]/route.ts
│       │
│       ├── notifications/route.ts
│       ├── notifications/[id]/read/route.ts
│       ├── notifications/read-all/route.ts
│       ├── notifications/push/subscribe/route.ts
│       │
│       ├── announcements/[...]/route.ts
│       ├── tickets/[...]/route.ts
│       ├── leaderboard/route.ts
│       ├── badges/[...]/route.ts
│       ├── analytics/[...]/route.ts
│       ├── search/route.ts
│       │
│       ├── uploads/sign/route.ts            # Cloudinary signature
│       ├── uploads/complete/route.ts
│       │
│       ├── realtime/auth/route.ts           # Pusher private/presence auth
│       │
│       ├── cron/[task]/route.ts             # Vercel Cron entry points
│       ├── jobs/[handler]/route.ts          # QStash webhook handlers
│       ├── webhooks/[provider]/route.ts     # Cloudinary/Discord/GitHub webhooks
│       │
│       ├── og/[type]/route.tsx              # Dynamic OG images (Edge)
│       └── health/route.ts
│
├── server/                                  # Business logic — NEVER imported by client
│   ├── auth/
│   │   ├── config.ts                        # Auth.js config
│   │   ├── permissions.ts
│   │   ├── require.ts                       # requireAuth / requirePermission helpers
│   │   ├── credentials.ts                   # email/password verify
│   │   └── two-factor.ts
│   │
│   ├── db/
│   │   ├── prisma.ts                        # Prisma singleton (with Neon adapter)
│   │   └── transactions.ts
│   │
│   ├── modules/                             # one folder per domain
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.schemas.ts              # shared Zod
│   │   │   └── auth.events.ts
│   │   ├── users/
│   │   ├── admin/
│   │   ├── posts/
│   │   ├── gallery/
│   │   ├── projects/
│   │   ├── events/
│   │   ├── notifications/
│   │   ├── announcements/
│   │   ├── tickets/
│   │   ├── leaderboard/
│   │   ├── badges/
│   │   ├── analytics/
│   │   ├── search/
│   │   ├── audit/
│   │   └── discord/
│   │
│   ├── realtime/
│   │   ├── pusher.ts                        # Pusher server SDK singleton
│   │   ├── channels.ts                      # channel name builders
│   │   └── publish.ts                       # typed publish helpers
│   │
│   ├── jobs/
│   │   ├── qstash.ts                        # QStash client singleton
│   │   ├── enqueue.ts                       # producer helpers
│   │   ├── cron/                            # Vercel Cron handlers (logic)
│   │   │   ├── publish-scheduled.ts
│   │   │   ├── send-reminders.ts
│   │   │   ├── rebuild-leaderboard.ts
│   │   │   ├── cleanup.ts
│   │   │   ├── evaluate-badges.ts
│   │   │   └── aggregate-analytics.ts
│   │   └── handlers/                        # QStash webhook handlers (logic)
│   │       ├── send-email.ts
│   │       ├── broadcast-notification.ts
│   │       ├── broadcast-email.ts
│   │       ├── export-user-data.ts
│   │       ├── fanout-discord.ts
│   │       └── push-web-notification.ts
│   │
│   ├── mail/
│   │   ├── resend.ts
│   │   ├── send.ts
│   │   └── templates/                       # React Email components
│   │       ├── verify-email.tsx
│   │       ├── reset-password.tsx
│   │       ├── welcome.tsx
│   │       ├── new-device-login.tsx
│   │       ├── ticket-reply.tsx
│   │       ├── event-reminder-24h.tsx
│   │       ├── event-reminder-1h.tsx
│   │       ├── broadcast.tsx
│   │       └── weekly-digest.tsx
│   │
│   ├── storage/
│   │   ├── cloudinary.ts
│   │   └── signed-upload.ts
│   │
│   ├── cache/
│   │   ├── redis.ts                         # @upstash/redis singleton
│   │   └── ratelimit.ts                     # @upstash/ratelimit instances
│   │
│   ├── lib/
│   │   ├── response.ts                      # envelope helpers
│   │   ├── errors.ts
│   │   ├── pagination.ts
│   │   ├── slugify.ts
│   │   ├── hash.ts
│   │   ├── tokens.ts                        # short-lived signed tokens (email verify, reset)
│   │   ├── otp.ts
│   │   ├── ipinfo.ts
│   │   ├── sanitize.ts
│   │   └── audit.ts
│   │
│   └── config/
│       ├── env.ts                           # Zod-validated process.env
│       └── constants.ts
│
├── lib/validators.ts                        # Zod schemas SHARED w/ client
├── middleware.ts                            # Auth.js + route guards
└── ...

prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

### 3.1 Route Handler Anatomy

Every endpoint follows the same shape so adding one is mechanical:

```ts
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/server/auth/require';
import { postService } from '@/server/modules/posts/post.service';
import { paginate } from '@/server/lib/pagination';
import { handle } from '@/server/lib/response';
import { createPostSchema, listPostsSchema } from '@/server/modules/posts/post.schemas';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return handle(async () => {
    const params = listPostsSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    return postService.list(params);
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireAuth(req);
    await requirePermission(user, 'manage_posts');
    const body = createPostSchema.parse(await req.json());
    return postService.create(user, body);
  });
}
```

`handle()` wraps the function, catches `AppError` and Zod errors, returns the standard response envelope.

### 3.2 Why "modules/" inside server/

Each module is a self-contained vertical: schemas (Zod), service (business logic), events (handlers for things this module emits/listens to). Adding marketplace, voice rooms, tournaments → drop in a new module folder, expose route handlers in `app/api/`, done.

---

## 4. Modules

### 4.1 Auth

**Features**
- Register (email/password)
- Login (email-or-username + password) — Auth.js Credentials provider
- Email verification (6-digit OTP, 10-min TTL, 3 attempts)
- Forgot password → email with signed token
- Reset password (single-use token)
- Refresh handled by Auth.js JWT strategy (no manual rotation needed; sliding session)
- Logout (Auth.js `signOut()`)
- Logout-all (revoke all sessions via `Session` table)
- 2FA (TOTP) setup, verify, disable, recovery codes
- Discord OAuth + GitHub OAuth (Auth.js providers)
- Account lockout after 5 failed attempts (`@upstash/ratelimit` 15-min window)
- Suspicious-login email ("new device from city, X")

**Endpoints**
```
POST   /api/auth/register
GET/POST /api/auth/[...nextauth]              # Auth.js (login, OAuth, session, csrf)
POST   /api/auth/verify-email                 { otp }
POST   /api/auth/resend-verification
POST   /api/auth/forgot-password              { email }
POST   /api/auth/reset-password               { token, password }
GET    /api/auth/me
PATCH  /api/auth/me/password                  { currentPassword, newPassword }
POST   /api/auth/2fa/setup                    → { qrDataUrl, secret }
POST   /api/auth/2fa/verify                   { code } → returns recovery codes
POST   /api/auth/2fa/disable                  { code }
POST   /api/auth/2fa/recovery                 { recoveryCode }
GET    /api/auth/sessions
DELETE /api/auth/sessions/:id
POST   /api/auth/logout-all
```

**Token strategy**
- Auth.js with `session: { strategy: 'jwt' }`.
- JWT stored in HTTP-only, Secure, SameSite=Lax cookie (`__Secure-next-auth.session-token` in prod).
- 30-day sliding expiry, refreshed on activity.
- We mirror sessions in a `Session` table (for "active sessions" UI + revoke-all).
- For email verify / password reset tokens: signed with `JWT_VERIFY_SECRET`, 10–60min TTL, single-use (recorded in Redis to prevent reuse).

**Security**
- argon2id password hashing (memory 64MB, time 3, parallelism 1).
- Per-route rate limits via `@upstash/ratelimit` (login: 10/min/ip, register: 5/min/ip, forgot: 3/min/email).
- Generic error messages on auth failures.
- All auth mutations emit `AuditLog` rows.

---

### 4.2 Users

**Features**
- Public profile (respects privacy)
- Authed profile (full)
- Update profile, avatar, cover, bio, social links, preferences
- Privacy (public / members-only / private)
- Block user (hide their content from you)
- Follow/unfollow
- Activity timeline (posts, projects, events, badges earned)
- Account data export (GDPR — QStash background job → Cloudinary signed download link emailed)
- Account deletion (soft-delete, 30-day undo window)

**Endpoints**
```
GET    /api/users/me
PATCH  /api/users/me
PATCH  /api/users/me/avatar              { url }
PATCH  /api/users/me/cover               { url }
PATCH  /api/users/me/preferences
GET    /api/users/:username
GET    /api/users/:username/activity
GET    /api/users/:username/projects
GET    /api/users/:username/posts
POST   /api/users/:id/follow
DELETE /api/users/:id/follow
POST   /api/users/:id/block
DELETE /api/users/:id/block
GET    /api/users/me/blocks
GET    /api/users/me/followers
GET    /api/users/me/following
POST   /api/users/me/export              kicks off QStash job
DELETE /api/users/me                     soft delete
```

**Schema (Prisma)** — see §5.1.

---

### 4.3 RBAC

**Default roles** (seeded):
```
guest · member · verified_member · contributor · moderator · developer · admin · super_admin · owner
```

**Permissions** (strings, stored in DB, attached to roles):
```
view_admin
manage_users         · manage_roles
manage_posts         · publish_posts
manage_gallery       · moderate_gallery
manage_events        · manage_event_participants
manage_projects      · moderate_projects
manage_announcements · broadcast_announcements
manage_tickets       · assign_tickets
view_analytics       · view_audit_logs
manage_settings      · manage_feature_flags
manage_system        · impersonate_users
```

**Permission helpers**
```ts
// server/auth/require.ts
export async function requireAuth(req: NextRequest) {
  const session = await auth();
  if (!session?.user) throw new AppError('UNAUTHENTICATED', 401);
  return session.user;
}

export async function requirePermission(user: User, perm: Permission) {
  if (!user.permissions.includes(perm)) throw new AppError('UNAUTHORIZED', 403);
}
```

The session JWT includes `permissions: string[]` (flattened from roles) so checks are stateless.

---

### 4.4 Admin

**Features**
- Stats overview (DAU/MAU, growth, content counts, ticket SLA, function health)
- User management (list, search, filter, detail, update, role change, status, delete)
- Impersonation (view site as another user — every request audit-logged with `impersonatorId`)
- Bulk actions (change role, ban, verify, send email)
- Audit log access
- System (clear cache, requeue failed QStash jobs, toggle maintenance mode, toggle feature flags)
- Broadcasts (announcement, email — both enqueued via QStash)

**Endpoints**
```
GET    /api/admin/stats
GET    /api/admin/stats/growth?range=30d
GET    /api/admin/stats/engagement
GET    /api/admin/users                    ?q=&role=&status=&page=
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id
PATCH  /api/admin/users/:id/role
PATCH  /api/admin/users/:id/status
POST   /api/admin/users/:id/verify
DELETE /api/admin/users/:id                soft delete
POST   /api/admin/users/:id/impersonate
POST   /api/admin/impersonate/end
POST   /api/admin/users/bulk
GET    /api/admin/audit-logs
GET    /api/admin/system-health
POST   /api/admin/system/maintenance       { enabled, message }
POST   /api/admin/system/cache/flush
GET    /api/admin/feature-flags
PATCH  /api/admin/feature-flags/:key
POST   /api/admin/broadcasts/email         { subject, body, target } → QStash
POST   /api/admin/broadcasts/notification  { title, body, target } → QStash
```

---

### 4.5 CMS — Posts

**Features**
- Post CRUD (Tiptap JSON + plain projection for search)
- Status: draft / scheduled / published / archived
- Schedule via Vercel Cron (`/api/cron/publish-scheduled` finds posts where `status='scheduled' AND publishAt <= now()` and publishes)
- Categories, tags
- Featured image
- SEO (title, description, keywords, OG image override)
- Version history (last 10 versions)
- Soft delete + restore
- Likes, views (debounced server-side)
- Reports

**Endpoints**
```
GET    /api/posts                            ?category=&tag=&q=&status=&page=
GET    /api/posts/featured
GET    /api/posts/:slug
POST   /api/posts                            manage_posts
PATCH  /api/posts/:id
DELETE /api/posts/:id                        soft delete
POST   /api/posts/:id/publish
POST   /api/posts/:id/unpublish
POST   /api/posts/:id/schedule               { publishAt }
GET    /api/posts/:id/versions
POST   /api/posts/:id/restore/:versionId
POST   /api/posts/:id/like
POST   /api/posts/:id/view
POST   /api/posts/:id/report                 { reason }
GET    /api/categories
POST   /api/categories
GET    /api/tags
```

Postgres full-text index: `tsvector(title || ' ' || contentText)` with weighted ranking.

---

### 4.6 Gallery / Media

**Features**
- Direct browser → Cloudinary signed upload (backend signs only)
- Categories, tags
- Moderation queue
- Public listing with filters, detail page, likes, views

**Endpoints**
```
GET    /api/gallery                          ?category=&tag=&q=&page=
GET    /api/gallery/:id
POST   /api/gallery                          authed
PATCH  /api/gallery/:id                      owner or moderate_gallery
DELETE /api/gallery/:id
POST   /api/gallery/:id/like
POST   /api/gallery/:id/report
POST   /api/gallery/:id/approve              moderate_gallery
POST   /api/gallery/:id/reject               moderate_gallery
GET    /api/uploads/sign                     { folder, public_id? }
POST   /api/uploads/complete                 notify backend of upload completion
DELETE /api/uploads/:id
```

**Upload flow (free-tier-friendly: zero function bytes)**
```
1. Client → GET /api/uploads/sign?folder=gallery
   Server returns { cloudName, apiKey, signature, timestamp, folder, publicId }
2. Client → POST https://api.cloudinary.com/v1_1/{cloudName}/auto/upload
   (file goes directly to Cloudinary — never touches Vercel)
3. Client → POST /api/uploads/complete with Cloudinary response
   Server verifies signature, creates DB row, optionally enqueues moderation
```

---

### 4.7 Projects

**Features**
- Members submit projects (`pending` until moderator approves)
- Multi-contributor (each with role: lead, dev, design, content)
- Status: planning / in_dev / testing / released / archived
- Tech tags, repo URL, demo URL, screenshots, video
- Featured flag (admin)
- Likes, views

**Endpoints**
```
GET    /api/projects                         ?status=&tag=&featured=&q=
GET    /api/projects/featured
GET    /api/projects/:slug
POST   /api/projects
PATCH  /api/projects/:id                     owner or moderate_projects
DELETE /api/projects/:id
POST   /api/projects/:id/feature
POST   /api/projects/:id/contributors        { userId, role }
DELETE /api/projects/:id/contributors/:userId
POST   /api/projects/:id/like
POST   /api/projects/:id/report
```

---

### 4.8 Events / Tournaments

**Features**
- Create event (workshop / meetup / tournament / stream)
- Timezone-aware schedule, capacity
- Registration modes: open / approval / invite
- Participant lifecycle: registered → confirmed → attended / no-show
- Tournament bracket (single-elim v1)
- Live mode (Pusher push to `event-{id}` channel, hero CTA changes on landing)
- Reminders 24h + 1h before (single Vercel Cron scans events, enqueues via QStash)
- Prizes (description + optional badge)

**Endpoints**
```
GET    /api/events
GET    /api/events/upcoming
GET    /api/events/:slug
POST   /api/events
PATCH  /api/events/:id
DELETE /api/events/:id
POST   /api/events/:id/register
DELETE /api/events/:id/register
POST   /api/events/:id/approve/:userId
POST   /api/events/:id/check-in/:userId
GET    /api/events/:id/participants
POST   /api/events/:id/go-live
POST   /api/events/:id/end

GET    /api/events/:id/bracket
POST   /api/events/:id/bracket/generate
PATCH  /api/events/:id/bracket/matches/:matchId
```

---

### 4.9 Announcements

**Features**
- Site-wide banner (toggleable, scheduleable)
- Target by role
- Publish action enqueues a QStash job that:
  - Creates a `Notification` row per targeted user
  - Pushes to `announcements` Pusher channel
  - Sends Discord webhook (if enabled)
  - Sends email broadcast (if enabled, batched 50/request to stay within Resend's 100/day on a paid send, or trickle via Cron over a day on free tier)

**Endpoints**
```
GET    /api/announcements                       public, active only
GET    /api/announcements/all                   manage_announcements
POST   /api/announcements
PATCH  /api/announcements/:id
DELETE /api/announcements/:id
POST   /api/announcements/:id/publish           kicks off fanout job
POST   /api/announcements/:id/unpublish
```

---

### 4.10 Notifications

**Features**
- Per-user rows in DB
- Types: system, announcement, mention, reply, follow, badge_unlocked, event_reminder, role_changed, ticket_update, project_approved
- Read/unread, archived
- Bulk mark-all-read, archive
- Realtime push via Pusher (`private-user-{id}` channel)
- Web Push (browser) via `web-push` library + VAPID
- Email digest (daily/weekly, opt-in, Cron-triggered)

**Endpoints**
```
GET    /api/notifications                       ?unreadOnly=&type=&page=
GET    /api/notifications/unread-count
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
PATCH  /api/notifications/:id/archive
DELETE /api/notifications/:id
POST   /api/notifications/push/subscribe        { endpoint, keys }   web-push
DELETE /api/notifications/push/unsubscribe
```

---

### 4.11 Tickets / Contact

**Features**
- Contact form (public — captcha via Cloudflare Turnstile free)
- Authed users get full ticket center
- Statuses: open · pending_user · pending_agent · resolved · closed
- Priority: low / medium / high / urgent
- Assign to admin
- Internal notes (admin-only)
- Threaded replies, tags, SLA timer per priority

**Endpoints**
```
POST   /api/contact                                  public, captcha
GET    /api/support/tickets
POST   /api/support/tickets
GET    /api/support/tickets/:id
PATCH  /api/support/tickets/:id
POST   /api/support/tickets/:id/replies
POST   /api/support/tickets/:id/notes                assign_tickets
POST   /api/support/tickets/:id/assign
PATCH  /api/support/tickets/:id/status
PATCH  /api/support/tickets/:id/priority
POST   /api/support/tickets/:id/close
```

---

### 4.12 Badges & Achievements

**Features**
- Admin defines badges (name, image, criteria type)
- Criteria types: manual_award · xp_threshold · post_count · event_attended · project_published · streak · contest_winner
- Single Vercel Cron evaluates all auto-criteria every 10 minutes (or whatever fits in our 2-cron budget — see §10.2)
- Awarding → notification + XP credit

**Endpoints**
```
GET    /api/badges                                   public catalog
GET    /api/badges/me
POST   /api/badges                                   manage_badges
PATCH  /api/badges/:id
DELETE /api/badges/:id
POST   /api/users/:id/badges/:badgeId                manual award
DELETE /api/users/:id/badges/:badgeId
```

---

### 4.13 Leaderboard

**Features**
- Aggregated XP leaderboard
- Periods: all-time / this month / this week / by role
- Cached in Upstash Redis as ZSETs; rebuilt by a single Vercel Cron every 5 minutes (free) or recalculated on-the-fly with Postgres window functions if cron budget is exhausted

**Endpoints**
```
GET    /api/leaderboard                              ?period=&category=&limit=
GET    /api/leaderboard/around-me                    rank ±10
```

**XP rules** (configurable):
```
Post published     +50 XP
Project published  +100 XP
Event attended     +25 XP
Daily login        +5 XP
Receive like       +1 XP
Badge unlocked     +variable
```

---

### 4.14 Analytics

**Free-tier strategy**: defer the heavy lifting to **PostHog Cloud** (1M events/mo free). Our endpoints only expose **admin-facing aggregates** from precomputed `DailyMetric` rows.

```
POST   /api/analytics/page-view                   anonymous OK (or skip; PostHog handles it)
POST   /api/analytics/event                       admin-defined funnel events
GET    /api/analytics/overview                    view_analytics
GET    /api/analytics/users                       ?range=
GET    /api/analytics/traffic                     ?range=
GET    /api/analytics/content                     ?range=
```

A nightly Cron aggregates DAU/MAU, top content, retention into `DailyMetric`.

---

### 4.15 Discord Integration

**Features**
- Discord OAuth login (Auth.js provider)
- Link Discord to existing account
- Sync Discord roles ↔ site roles (configurable map)
- Webhook fanout (announcements, event start, new featured post) — fire-and-forget via QStash

**Endpoints**
```
POST   /api/integrations/discord/link                authed
DELETE /api/integrations/discord/unlink
GET    /api/integrations/discord/me
POST   /api/integrations/discord/webhooks/test       admin
POST   /api/integrations/discord/sync-roles          admin
```

---

### 4.16 Search

**Phase A**: Postgres full-text on Post, Project, Gallery, User. Single endpoint with type filter.

```
GET    /api/search?q=&type=&page=
       type ∈ all | users | posts | projects | gallery | events
```

**Phase B** (when needed): swap to Meilisearch Cloud ($10/mo) without API contract change.

---

### 4.17 Webhooks (incoming)

```
POST   /api/webhooks/cloudinary                  upload moderation callbacks
POST   /api/webhooks/discord                     bot events (if bot deployed)
POST   /api/webhooks/github                      OAuth, repo activity
```

All verify signatures before processing.

---

### 4.18 System

```
GET    /api/health                               public, lightweight
GET    /api/health/deep                          manage_system — DB, Redis, QStash
GET    /api/system/info                          manage_system — versions, env
GET    /api/system/queues                        manage_system — QStash dashboard data
```

---

## 5. Data Layer

### 5.1 Prisma Schema (top-level models)

```
User · Role · Permission · UserRole
Session                              (Auth.js sessions + our extended fields)
Account                              (OAuth provider links)
VerificationToken                    (email verify, password reset)
Post · PostVersion · Category · Tag
GalleryItem
Project · ProjectContributor
Event · EventRegistration · TournamentMatch
Announcement
Notification · PushSubscription
Ticket · TicketReply · TicketNote
Badge · UserBadge
Follow · Block · Report
AuditLog
PageView · DailyMetric
FeatureFlag · SystemSetting
Upload                               (Cloudinary metadata)
```

### 5.2 Neon + Prisma Setup

```ts
// server/db/prisma.ts
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

The Neon serverless adapter uses HTTP instead of TCP — no connection pool warmup, no idle-connection issues on serverless cold starts.

### 5.3 Migrations

- Local: `prisma migrate dev`.
- CI: `prisma migrate deploy` runs after build, before promotion.
- Neon **branches**: each PR can spin up an isolated DB branch automatically (free).
- Never `prisma db push` against production.

### 5.4 Seed

`prisma/seed.ts` runs once per environment:
- All roles + permissions
- Owner admin user from `OWNER_EMAIL` / `OWNER_PASSWORD`
- 50 demo users · 30 posts · 60 gallery items · 8 events · 20 projects · 12 badges · 200 notifications · 90d of analytics

Frontend has a realistic platform to consume on day one.

---

## 6. Response Envelope

```ts
// success
{ "success": true, "data": <T>, "meta"?: { "page": 1, "limit": 20, "total": 137 } }

// failure
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [{ "path": "email", "message": "Required" }],
    "requestId": "req_01HKZ..."
  }
}
```

Every response carries `X-Request-Id` (NanoID). Errors include the same `requestId` so user-reported issues trace back through Sentry + Vercel Logs.

---

## 7. Error Handling

```ts
// server/lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public status: number,
    message?: string,
    public details?: unknown,
  ) { super(message ?? code); }
}
```

```ts
// server/lib/response.ts
export async function handle<T>(fn: () => Promise<T>) {
  const requestId = nanoid();
  try {
    const data = await fn();
    return NextResponse.json({ success: true, data }, { headers: { 'X-Request-Id': requestId } });
  } catch (err) {
    if (err instanceof ZodError) return jsonError('VALIDATION_ERROR', 400, err.errors, requestId);
    if (err instanceof AppError) return jsonError(err.code, err.status, err.details, requestId, err.message);
    captureException(err, { requestId });
    return jsonError('INTERNAL', 500, undefined, requestId);
  }
}
```

Codes: `VALIDATION_ERROR · UNAUTHENTICATED · UNAUTHORIZED · NOT_FOUND · CONFLICT · PRECONDITION_FAILED · PAYLOAD_TOO_LARGE · RATE_LIMITED · INTERNAL · BAD_GATEWAY · UNAVAILABLE`.

---

## 8. Security

### 8.1 Required

- Auth.js (HTTP-only Secure SameSite=Lax cookies, CSRF built-in for sign-in/out)
- argon2id password hashing
- Per-route rate limiting via `@upstash/ratelimit` (sliding window, per IP + per user)
- Zod validation on every route (body + params + query)
- Input sanitization for any HTML/Tiptap content (`sanitize-html` server-side before persist)
- Helmet-equivalent headers via `next.config.ts` (CSP, X-Frame-Options, HSTS, Referrer-Policy)
- CORS not needed (same-origin)
- File upload signature verification (only allow your Cloudinary cloud, verify signature)
- File MIME validation (small files routed through backend) / Cloudinary content-type checks
- Permission gates on every admin route
- Audit log on every privileged action
- Generic error messages on auth failure
- Lockout after repeated failures (Upstash rate limit)
- Logging strips passwords, tokens, cookies, Authorization headers
- Secrets only in Vercel env (encrypted), validated at boot

### 8.2 Recommended

- 2FA enforced for moderator+ (middleware on `/admin/*`)
- IP allowlist for super_admin (env-driven)
- Cloudflare Turnstile on contact form, register form
- Periodic dependency audit (`npm audit` in CI)

### 8.3 CSP example

```ts
// next.config.ts → headers()
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://*.pusher.com https://app.posthog.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "connect-src 'self' wss://*.pusher.com https://*.pusher.com https://*.upstash.io https://api.cloudinary.com https://*.posthog.com https://*.sentry.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
  ].join('; '),
}
```

---

## 9. Real-Time (Pusher)

### 9.1 Server SDK

```ts
// server/realtime/pusher.ts
import Pusher from 'pusher';

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});
```

### 9.2 Channel Auth

```ts
// app/api/realtime/auth/route.ts
import { auth } from '@/server/auth/config';
import { pusher } from '@/server/realtime/pusher';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const form = await req.formData();
  const socketId = form.get('socket_id') as string;
  const channel = form.get('channel_name') as string;

  // Validate user can subscribe to this channel
  if (channel.startsWith('private-user-') && channel !== `private-user-${session.user.id}`) {
    return new Response('Forbidden', { status: 403 });
  }
  if (channel === 'private-admin' && !session.user.permissions.includes('view_admin')) {
    return new Response('Forbidden', { status: 403 });
  }

  const auth = channel.startsWith('presence-')
    ? pusher.authorizeChannel(socketId, channel, { user_id: session.user.id, user_info: { name: session.user.name, avatar: session.user.image } })
    : pusher.authorizeChannel(socketId, channel);

  return Response.json(auth);
}
```

### 9.3 Publish Helpers

```ts
// server/realtime/publish.ts
export const realtime = {
  notifyUser: (userId: string, event: string, data: unknown) =>
    pusher.trigger(`private-user-${userId}`, event, data),

  announce: (data: AnnouncementPayload) =>
    pusher.trigger('announcements', 'new', data),

  livePulse: (metrics: LiveMetrics) =>
    pusher.trigger('live-pulse', 'update', metrics),

  eventStarting: (eventId: string, data: unknown) =>
    pusher.trigger(`event-${eventId}`, 'starting', data),

  adminAlert: (data: AdminAlertPayload) =>
    pusher.trigger('private-admin', 'alert', data),
};
```

### 9.4 Free-tier limits to watch

- 200k msgs/day → don't trigger Pusher on every analytics event. Batch live-pulse updates to once every 5–10s.
- 100 concurrent connections → fine until you hit ~100 simultaneous live users on the site. If you exceed, upgrade to $49/mo or swap to Ably (which has 200 concurrent free).

---

## 10. Background Work (Vercel Cron + Upstash QStash)

### 10.1 Vercel Cron

Vercel Hobby gives **2 cron schedules**. We use them as the heartbeat.

**Cron 1 — every 5 minutes** (`vercel.json`):
```json
{
  "crons": [
    { "path": "/api/cron/tick-5m", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/tick-1d", "schedule": "0 3 * * *" }
  ]
}
```

`/api/cron/tick-5m` runs a multiplexer:
- Publish any scheduled posts whose time has arrived
- Find events starting in next 24h that haven't been notified → enqueue reminders via QStash
- Find events starting in next 1h → enqueue 1h reminders
- Rebuild leaderboard ZSETs in Upstash Redis
- Evaluate badge criteria (only "fast" ones; "slow" full pass runs in daily cron)

`/api/cron/tick-1d` runs nightly (03:00 UTC):
- Aggregate `DailyMetric`
- Cleanup expired sessions, soft-deleted records older than 30 days
- Full badge evaluation pass
- Weekly digest email enqueue (only on Mondays)

**Auth**: Vercel sends `Authorization: Bearer <CRON_SECRET>` (env). Route checks the header and 401s otherwise.

### 10.2 Why a multiplexer

Hobby tier caps at 2 crons but doesn't cap what they do. We funnel every recurring task through these two endpoints and dispatch internally. If a task gets heavy, we offload its work to QStash and just *enqueue* from the cron — the cron itself stays under the 60s function timeout.

Paid tiers lift the cron count limit to dozens — at that point split tasks back into independent crons for cleaner ops.

### 10.3 Upstash QStash (deferred jobs / fan-out)

QStash is HTTP-based deferred message delivery. Free tier: 500 messages/day.

```ts
// server/jobs/qstash.ts
import { Client } from '@upstash/qstash';
export const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

// enqueue
await qstash.publishJSON({
  url: `${process.env.APP_URL}/api/jobs/send-email`,
  body: { to, template, data },
  delay: 30,            // optional seconds
});
```

```ts
// app/api/jobs/[handler]/route.ts
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { handlers } from '@/server/jobs/handlers';

export const POST = verifySignatureAppRouter(async (req, ctx) => {
  const handler = handlers[ctx.params.handler];
  if (!handler) return new Response('Not found', { status: 404 });
  const body = await req.json();
  await handler(body);
  return new Response('ok');
});
```

QStash auto-retries on non-2xx (exponential backoff, configurable max retries). Failed jobs visible in Upstash dashboard.

### 10.4 What goes through QStash

| Job | Reason for deferring |
|---|---|
| Send email (verify, reset, broadcast) | Don't block user-facing request |
| Broadcast notification fan-out | One announcement → 10k user rows → too slow inline |
| Broadcast email batch | Stay within Resend per-second limits |
| Export user data (GDPR) | Long-running |
| Web push fan-out | One announcement → many subscriptions |
| Discord webhook fanout | External HTTP, slow |
| Badge award fan-out | Multiple side effects |

### 10.5 Free-tier sustainability

- 500 QStash messages/day = ~21/hour. Plenty for a small community (a 100-user broadcast = 1 fan-out + N user notifications via Pusher, not via QStash — Pusher handles that).
- If you outgrow this, paid is $10/mo for 100k msgs/day, or self-host BullMQ on a $5 Hetzner box (still cheaper than Vercel paid).

---

## 11. Email (Resend)

### 11.1 Templates

React Email components (`@react-email/components`):
```
verify-email · reset-password · new-device-login · welcome
ticket-reply · event-reminder-24h · event-reminder-1h · event-cancelled
broadcast · weekly-digest · account-deleted
```

### 11.2 Sender

```ts
// server/mail/send.ts
import { Resend } from 'resend';
import { render } from '@react-email/render';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail({ to, subject, template, props }) {
  const html = await render(template(props));
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to, subject, html,
  });
}
```

### 11.3 Free-tier limits

- 3,000/mo, 100/day, 1 domain
- Plan around it: transactional emails (verify, reset, ticket) are first-class. Broadcasts and digests are trickled (one batch/hour via cron, opt-in only).
- Local dev: use **Mailpit** (Docker) or Resend's dev sandbox.

---

## 12. File Uploads (Cloudinary, direct-to-CDN)

### 12.1 Rules

| Type | Max | Formats | Folder |
|---|---:|---|---|
| Avatar | 2 MB | jpg, png, webp | `gekko/avatars/{userId}` |
| Cover | 4 MB | jpg, png, webp | `gekko/covers/{userId}` |
| Gallery | 8 MB | jpg, png, webp, gif | `gekko/gallery/{userId}` |
| Post cover | 4 MB | jpg, png, webp | `gekko/posts/{postId}` |
| Event banner | 4 MB | jpg, png, webp | `gekko/events/{eventId}` |
| Project asset | 8 MB | jpg, png, webp, mp4 | `gekko/projects/{projectId}` |
| Ticket attachment | 10 MB | jpg, png, pdf, txt, log | `gekko/tickets/{ticketId}` |

### 12.2 Sign endpoint

```ts
// app/api/uploads/sign/route.ts
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth } from '@/server/auth/require';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  const user = await requireAuth(req);
  const { folder, publicId } = await req.json();
  // Validate folder against allow-list per user/permission
  if (!isFolderAllowed(folder, user)) throw new AppError('UNAUTHORIZED', 403);

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder, public_id: publicId, upload_preset: 'gekko_signed' };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!);

  return Response.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp, signature, folder, publicId, uploadPreset: 'gekko_signed',
  });
}
```

### 12.3 Complete endpoint

`POST /api/uploads/complete` verifies the Cloudinary response signature (`api_sign_request`), creates an `Upload` row, and links it to the parent entity (avatar set on user, gallery item created, etc).

### 12.4 Free-tier budget

- 25 GB storage, 25 GB bandwidth, 25 credits/mo (transformations)
- Plenty for a community site of a few thousand active users
- Set Cloudinary auto-format + auto-quality on the upload preset → smaller files automatically

---

## 13. Logging & Observability

| Concern | Tool | Free |
|---|---|---|
| Function logs | Vercel Logs (built-in) | yes (limited retention) |
| Long-retention logs | **Logtail** / **Axiom** | both have free tiers |
| Errors + replays | **Sentry** | 5k errors/mo, 50 replays |
| Performance + UX | **Vercel Speed Insights** | yes |
| Product analytics | **PostHog Cloud** | 1M events/mo |
| Uptime | **UptimeRobot** | 50 monitors, 5min |

Track:
- Auth events (login, logout, 2fa, password change)
- Admin actions (every write under `/api/admin/*`)
- Role changes
- Content delete/restore
- Permission-denied responses (signal of probing)
- Function p50/p95/p99 (Vercel Analytics)
- 5xx rate
- QStash failures (Upstash dashboard alerts)

---

## 14. Backup & Recovery

- **Neon**: PITR (point-in-time recovery) over the last 7 days on free tier. Snapshots free.
- **Cloudinary**: enable backup mode (replicates).
- **Application**: redeployable from Git at any commit.

Quarterly drill: spin up a new Neon branch from a 7-day-ago snapshot, deploy the app pointing at it, verify auth + content. Target RTO: 1h. RPO: 5min.

---

## 15. Environment Variables

```env
NODE_ENV=development                      # set by Vercel automatically in prod
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgres://...neon.tech/gekko?sslmode=require

# Auth.js
AUTH_SECRET=                              # `openssl rand -base64 32`
AUTH_URL=http://localhost:3000
AUTH_DISCORD_ID=
AUTH_DISCORD_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# Short-lived signed token secret (email verify, password reset)
JWT_VERIFY_SECRET=

# argon2
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=1

# Seed
OWNER_EMAIL=owner@teamgekko.com
OWNER_PASSWORD=                           # used once; rotate immediately

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=gekko_signed

# Email
RESEND_API_KEY=
EMAIL_FROM="Team Gekko <no-reply@teamgekko.com>"

# Realtime
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Cache / KV / Rate-limit
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Jobs
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# Cron auth
CRON_SECRET=

# Web Push
WEB_PUSH_PUBLIC_KEY=
WEB_PUSH_PRIVATE_KEY=
WEB_PUSH_CONTACT=mailto:admin@teamgekko.com

# Discord (integration, beyond OAuth)
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_WEBHOOK_ANNOUNCEMENTS=

# Observability
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
POSTHOG_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com

# Rate limits (per minute)
RATE_LIMIT_GLOBAL=120
RATE_LIMIT_AUTH=10

# Feature flags
FEATURE_DMS=false
FEATURE_VOICE=false
FEATURE_TOURNAMENTS=true
```

`server/config/env.ts` validates everything with Zod at boot — **production deploy fails fast** if anything is missing.

---

## 16. API Documentation

- OpenAPI 3 generated from Zod via `zod-to-openapi`.
- Served at `/api/docs` (Swagger UI, only in non-prod or behind admin) and `/api/openapi.json`.
- Every endpoint documents auth requirement, required permission, request schema, response schema, error codes, examples.
- Typed TS client auto-generated for the frontend via `openapi-typescript-codegen`.

---

## 17. Testing

| Layer | Tool |
|---|---|
| Pure logic (validators, helpers) | Vitest |
| Services (with DB) | Vitest + Neon branch DB per test run |
| Route handlers (integration) | Supertest-style HTTP calls to `next dev` instance |
| E2E (full user flow) | Playwright (frontend plan) |

### 17.1 Tests to always have

- Register → Verify → Login → Logout
- Reset password flow (token validity, single-use, expiry)
- 2FA setup, verify, login with 2FA, recovery code
- RBAC: every protected route returns 403 without permission
- Rate limiting blocks at threshold
- Audit log written on every admin mutation
- Soft delete + restore on Post, GalleryItem, User
- Tournament bracket generation (4, 8, 16, 32 — odd numbers with byes)
- Cloudinary signature flow (mock Cloudinary)
- QStash signature verification on `/api/jobs/[handler]`
- Cron secret check on `/api/cron/[task]`

### 17.2 Test database

- Neon `neonctl branches create --name test-$RUN_ID` per CI run.
- Migrate + seed.
- Drop branch at end. Free.

---

## 18. CI / CD

GitHub Actions on push to `main`:

```yaml
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node@v4
      - npm ci
      - biome ci
      - npx prisma generate
      - npm run test                       # uses Neon test branch
      - npm audit --audit-level=high

  deploy:
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - checkout
      - vercel deploy --prod (via Vercel CLI + token)
      - npx prisma migrate deploy           # against production Neon
      - curl ${APP_URL}/api/health          # smoke test
```

Vercel also auto-deploys every PR to a preview URL with its own Neon branch — full-stack preview environments, free.

---

## 19. Roadmap (Phases)

### Phase 0 — Foundation (week 1)
- Next.js scaffold, TS strict, Biome
- Prisma + Neon: schema, migrations, seed
- Auth.js: Credentials + Discord + GitHub providers
- Upstash Redis + ratelimit primitives
- Env validation (Zod), error handler, response envelope
- `/api/health`, `/api/auth/me`
- Vercel deploy connected, env secrets

### Phase 1 — Auth (week 2)
- Register, verify-email, forgot/reset password (Auth.js + custom endpoints)
- Sessions table mirror, `/api/auth/sessions`, revoke single + all
- 2FA setup, verify, disable, recovery codes
- Suspicious-login email
- Rate limits in place on auth routes
- Audit logs writing

### Phase 2 — RBAC + Users (week 3)
- Roles, permissions, user-role linking, seeded
- `requirePermission` helper used on every protected route
- User profile endpoints, preferences, privacy
- Follow / block
- Public profile + activity timeline

### Phase 3 — Content (week 4)
- Posts (Tiptap JSON + plain projection), categories, tags
- Featured posts, scheduled publishing (Cron `tick-5m`)
- Version history
- Likes, views (debounced)
- Reports

### Phase 4 — Gallery + Uploads (week 5)
- Cloudinary signed upload flow
- Moderation queue
- Categories, tags, likes, views

### Phase 5 — Projects + Events (week 6)
- Project CRUD, multi-contributor
- Events CRUD, registration, capacity, approval flow
- Event reminders (Cron `tick-5m` → QStash → email)
- Tournament bracket (single-elim)

### Phase 6 — Announcements + Notifications (week 7)
- Notification model + endpoints
- Web Push subscriptions
- Announcement fanout job (QStash)
- Discord webhook fanout

### Phase 7 — Realtime (week 7–8)
- Pusher channels: live-pulse, announcements, presence-global, private-user, private-admin
- Channel auth endpoint
- Server-side publish helpers
- Live event push, presence updates, notification push

### Phase 8 — Admin (week 8–9)
- Stats endpoints (precomputed in nightly cron)
- User mgmt (list, detail, role, status, bulk, delete)
- Impersonation
- Tickets (assign, reply, notes)
- Moderation reports queue
- Feature flags, maintenance mode
- Audit log endpoints
- QStash queue inspection

### Phase 9 — Polish & Launch (week 10)
- OpenAPI doc complete with examples
- Sentry + PostHog wired, source maps uploaded
- Logtail/Axiom shipping
- Load test (k6 via free Grafana Cloud — 200 RPS on read endpoints)
- Backup verified
- Production deploy + custom domain through Cloudflare

### Phase 10+ — Extensions
Each lands as a new module folder + new endpoints, no core changes:
- DMs / chat (Pusher private channels)
- Voice rooms (LiveKit free tier)
- Marketplace (Stripe — paid only when needed)
- AI assistant (OpenAI/Anthropic/Groq — Groq has a free tier)
- Mobile push (FCM)
- Public REST API + API keys for third parties
- External webhook subscriptions

---

## 20. Free-tier Capacity Estimates

Rough numbers to know when each tier breaks:

| Service | Limit | Translates to |
|---|---|---|
| Vercel functions | 100 GB-hr/mo | ~3M function invocations at 50ms each |
| Neon Postgres | 0.5 GB · autosuspend | ~50k users w/ posts/projects; suspend = 1–2s cold start |
| Upstash Redis | 10k cmds/day | Plenty for rate-limit + small cache; **not** for high-volume counters |
| Upstash QStash | 500 msgs/day | ~21/hour deferred jobs |
| Pusher Channels | 200k msgs/day · 100 concurrent | ~2k active users at typical interaction rates |
| Cloudinary | 25 GB store · 25 GB BW | A few thousand active uploaders |
| Resend | 3k/mo · 100/day | Transactional fine; broadcasts must trickle |
| Sentry | 5k errors/mo | Plenty for a healthy app |
| PostHog | 1M events/mo | ~33k DAUs at 30 events each |

When you exceed one of these, the upgrade is targeted and usually $10–25/mo. None of them require an architectural change.

---

## 21. Production Readiness Checklist

**Infra**
- [ ] Vercel project linked to Git, prod branch protected
- [ ] Custom domain + Cloudflare proxy, HTTPS enforced
- [ ] Env vars set in Vercel (prod + preview), secrets unique
- [ ] Neon prod DB pointed correctly, branching strategy documented
- [ ] Cloudinary upload preset = signed-only, allowed folders configured
- [ ] Pusher production app keys
- [ ] Upstash Redis + QStash production tokens
- [ ] Resend domain verified, SPF/DKIM set
- [ ] VAPID keys generated, web push tested

**App**
- [ ] `prisma migrate deploy` runs on every prod deploy
- [ ] Seed run once; owner password rotated; 2FA enabled on owner
- [ ] CORS not needed (same-origin) — verified
- [ ] CSP locked down to allowed origins
- [ ] Cookies Secure + HttpOnly + SameSite=Lax + correct domain
- [ ] Rate limits hit `@upstash/ratelimit` on auth routes
- [ ] File upload signature verification active
- [ ] All admin routes behind `requirePermission`
- [ ] Audit log writes verified

**Observability**
- [ ] Sentry DSN active, source maps uploaded
- [ ] PostHog ingestion working
- [ ] Vercel Speed Insights enabled
- [ ] UptimeRobot monitor on `/api/health`
- [ ] Cron health: alert when `/api/cron/tick-5m` fails 2x in a row

**Quality**
- [ ] CI green: lint + tests + audit
- [ ] OpenAPI exposed + typed client generated
- [ ] Smoke tests pass against staging on every deploy
- [ ] Backup/restore drill done in last 90 days

---

## 22. Health Endpoint

```
GET /api/health
→ 200
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "1.4.2",
    "uptimeSec": 19384,
    "checks": {
      "db":       { "status": "ok", "latencyMs": 3 },
      "redis":    { "status": "ok", "latencyMs": 1 },
      "pusher":   { "status": "ok" },
      "storage":  { "status": "ok" }
    }
  }
}
```

`/api/health/deep` (auth: manage_system) reports QStash queue, slow queries, p95 latency.

---

## 23. Frontend Contract

Single codebase, single deploy → seamless contract:

- **Zod schemas** in `lib/validators.ts` validate on both sides (literally the same import).
- **OpenAPI spec** generated from server Zod → typed TS client for the frontend.
- **Types** from `@prisma/client` are available to the client where useful (server-only fields excluded).

No CORS, no second auth flow, no API key shuffling.

---

## 24. Final Stack — All Free

```
Next.js 15 (App Router, RSC, Route Handlers, Server Actions)  →  Vercel Hobby
Prisma 5 + @prisma/adapter-neon                                →  Neon Postgres
Auth.js (NextAuth v5) + argon2 + otplib                        →  $0
Zod (shared client/server) + sanitize-html                     →  $0
Pusher Channels (server SDK + pusher-js)                       →  Pusher free
Upstash Redis (REST) + @upstash/ratelimit                      →  Upstash free
Upstash QStash (HTTP deferred + retried)                       →  Upstash free
Vercel Cron (2 schedules → internal multiplexer)               →  Vercel free
Resend + React Email                                            →  Resend free
Cloudinary (direct signed upload, never proxies bytes)         →  Cloudinary free
web-push (VAPID, self-hosted)                                   →  $0
Sentry + PostHog Cloud + Vercel Analytics + UptimeRobot        →  All free tiers
```

**Total: $0/month**, fully real-time, fully featured, with clean upgrade paths everywhere when traffic justifies it.
