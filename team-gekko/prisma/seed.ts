/**
 * Phase 0 seed — roles, permissions, an owner user.
 * Extend in later phases (posts, gallery, events, projects, etc).
 *
 * Run: npm run db:seed
 */
import { existsSync, readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// `tsx` does not auto-load env files. Load .env.local (preferred) then .env so
// DATABASE_URL + OWNER_* are available regardless of how the seed is invoked.
function loadEnv(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    const key = m?.[1];
    if (!key) continue;
    let val = (m?.[2] ?? '').trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadEnv('.env.local');
loadEnv('.env');

const prisma = new PrismaClient();

const ROLES = [
  { name: 'guest', description: 'Not logged in', sortOrder: 0 },
  { name: 'member', description: 'Standard logged-in user', sortOrder: 10 },
  { name: 'verified_member', description: 'Email-verified member', sortOrder: 20 },
  { name: 'contributor', description: 'Active contributor', sortOrder: 30 },
  { name: 'moderator', description: 'Community moderator', sortOrder: 40 },
  { name: 'developer', description: 'Internal developer', sortOrder: 50 },
  { name: 'admin', description: 'Administrator', sortOrder: 60 },
  { name: 'super_admin', description: 'Super administrator', sortOrder: 70 },
  { name: 'owner', description: 'Platform owner', sortOrder: 80 },
];

const PERMISSIONS = [
  ['view_admin', 'Access admin console'],
  ['manage_users', 'Create, edit, ban users'],
  ['manage_roles', 'Edit role permission matrix'],
  ['manage_posts', 'CRUD blog posts'],
  ['publish_posts', 'Publish posts'],
  ['manage_gallery', 'Manage gallery'],
  ['moderate_gallery', 'Approve / reject uploads'],
  ['manage_events', 'CRUD events'],
  ['manage_event_participants', 'Manage event registrations'],
  ['manage_games', 'CRUD games'],
  ['moderate_games', 'Approve / reject game submissions'],
  ['manage_announcements', 'CRUD announcements'],
  ['broadcast_announcements', 'Publish announcements'],
  ['manage_tickets', 'Triage tickets'],
  ['assign_tickets', 'Assign tickets to staff'],
  ['view_analytics', 'View analytics dashboard'],
  ['view_audit_logs', 'View audit logs'],
  ['manage_settings', 'Edit site settings'],
  ['manage_feature_flags', 'Toggle feature flags'],
  ['manage_system', 'System operations'],
  ['impersonate_users', 'View site as another user'],
] as const;

// Role → permissions mapping
const ROLE_PERMS: Record<string, string[]> = {
  moderator: ['view_admin', 'moderate_gallery', 'moderate_games', 'manage_tickets'],
  developer: ['view_admin', 'view_analytics', 'view_audit_logs'],
  admin: [
    'view_admin',
    'manage_users',
    'manage_posts',
    'publish_posts',
    'manage_gallery',
    'moderate_gallery',
    'manage_events',
    'manage_event_participants',
    'manage_games',
    'moderate_games',
    'manage_announcements',
    'broadcast_announcements',
    'manage_tickets',
    'assign_tickets',
    'view_analytics',
    'view_audit_logs',
    'manage_settings',
  ],
  super_admin: [], // gets owner perms minus a few — filled below
  owner: [], // all perms — filled below
};

async function main() {
  console.log('Seeding roles + permissions…');

  // Permissions first
  for (const [key, description] of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
  }

  // Roles
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description, sortOrder: role.sortOrder, isSystem: true },
      create: { ...role, isSystem: true },
    });
  }

  // Fill super_admin = all except manage_feature_flags
  ROLE_PERMS.super_admin = PERMISSIONS.map(([k]) => k).filter((k) => k !== 'manage_feature_flags');
  // Owner = everything
  ROLE_PERMS.owner = PERMISSIONS.map(([k]) => k);

  // Connect role → permission links
  for (const [roleName, keys] of Object.entries(ROLE_PERMS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;
    const perms = await prisma.permission.findMany({ where: { key: { in: keys } } });
    await prisma.role.update({
      where: { id: role.id },
      data: { permissions: { set: perms.map((p) => ({ id: p.id })) } },
    });
  }

  console.log(`Roles + permissions seeded (${ROLES.length} roles, ${PERMISSIONS.length} perms).`);

  // ---- Optional user reset ---------------------------------------------------
  // Destructive: wipes ALL users (sessions/accounts/role links cascade; audit
  // actor refs null out). Guarded behind SEED_RESET_USERS=1 so a normal seed
  // never deletes data.
  if (process.env.SEED_RESET_USERS === '1') {
    const removed = await prisma.user.deleteMany({});
    console.log(`Reset: deleted ${removed.count} existing user(s).`);
  }

  // ---- Owner bootstrap -------------------------------------------------------
  // Idempotently ensure an owner account exists so there is always at least one
  // admin who can sign in (the site is in admins-only mode).
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const ownerPassword = process.env.OWNER_PASSWORD;
  if (ownerEmail && ownerPassword) {
    const ownerRole = await prisma.role.findUnique({ where: { name: 'owner' } });
    if (!ownerRole) throw new Error('owner role missing — role seed did not run');

    const passwordHash = await bcrypt.hash(ownerPassword, 11);
    const username = (ownerEmail.split('@')[0] ?? 'owner').replace(/[^a-z0-9_]/g, '') || 'owner';

    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: { passwordHash, status: 'active', emailVerifiedAt: new Date() },
      create: {
        email: ownerEmail,
        username,
        passwordHash,
        displayName: 'Owner',
        status: 'active',
        emailVerifiedAt: new Date(),
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: owner.id, roleId: ownerRole.id } },
      update: {},
      create: { userId: owner.id, roleId: ownerRole.id },
    });

    console.log(`Owner account ensured: ${ownerEmail} (role: owner).`);
  } else {
    console.log('OWNER_EMAIL / OWNER_PASSWORD not set — skipping owner bootstrap.');
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
