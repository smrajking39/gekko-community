import { CreateUserButton } from '@/components/admin/create-user-button';
import { UsersTable } from '@/components/admin/users-table';
import { adminUserListSchema } from '@/lib/validators';
import { listUsers } from '@/server/admin/users';
import { getCurrentUser } from '@/server/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Admin · Users' };
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentUser();
  if (!admin) redirect('/login?callbackUrl=/admin/users');

  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined);

  // Tolerate junk in the URL — fall back to defaults rather than 500.
  const parsed = adminUserListSchema.safeParse({
    q: pick('q'),
    role: pick('role'),
    status: pick('status'),
    page: pick('page'),
  });
  const params = parsed.success ? parsed.data : { page: 1 };

  const data = await listUsers(params);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-neon-violet)">
            People
          </p>
          <h1 className="mt-2 font-(family-name:--font-heading) text-4xl font-bold tracking-tight">
            Users
          </h1>
          <p className="mt-2 text-(--color-text-secondary)">
            Search, filter, and manage member roles and account status.
          </p>
        </div>
        <CreateUserButton actorRole={admin.role} />
      </header>

      <UsersTable data={data} actorId={admin.id} actorRole={admin.role} />
    </div>
  );
}
