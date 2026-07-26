'use client';

import { Button } from '@/components/ui/button';
import { ROLES } from '@/config/roles.config';
import { ApiError, api } from '@/lib/api';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, Copy, Eye, EyeOff, Loader2, RefreshCw, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

function rank(role: string): number {
  const i = ROLES.indexOf(role as (typeof ROLES)[number]);
  return i < 0 ? 0 : i;
}

function generatePassword(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  const out: string[] = [];
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  for (let i = 0; i < length; i++) out.push(chars[(buf[i] ?? 0) % chars.length] ?? 'x');
  return out.join('');
}

const inputClass =
  'block w-full rounded-xl border border-(--glass-border) bg-(--color-bg-deep)/40 px-3 py-2.5 text-sm text-(--color-text-primary) outline-none transition placeholder:text-(--color-text-muted) focus:border-(--color-gekko-500)';

export function CreateUserButton({ actorRole }: { actorRole: string }) {
  const router = useRouter();
  const actorRank = rank(actorRole);
  const assignableRoles = useMemo(() => ROLES.filter((r) => rank(r) < actorRank), [actorRank]);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [copied, setCopied] = useState(false);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState(
    assignableRoles.includes('member') ? 'member' : (assignableRoles[0] ?? ''),
  );
  const [password, setPassword] = useState('');

  const reset = () => {
    setEmail('');
    setUsername('');
    setDisplayName('');
    setRole(assignableRoles.includes('member') ? 'member' : (assignableRoles[0] ?? ''));
    setPassword('');
    setShowPw(false);
    setCopied(false);
  };

  const copyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy to clipboard.');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post('/admin/users', {
        email: email.trim(),
        username: username.trim(),
        displayName: displayName.trim() || undefined,
        role,
        password,
      });
      toast.success(`Created ${username.trim()}.`);
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not create the user.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <Dialog.Trigger asChild>
        <Button size="lg" className="w-full sm:w-auto">
          <UserPlus className="size-4" /> New user
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[94vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-(--glass-border) bg-(--color-bg-deep) p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] focus:outline-none">
          <Dialog.Title className="font-(family-name:--font-heading) text-lg font-bold tracking-tight">
            Create a user
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-(--color-text-secondary)">
            The account is active and pre-verified. Share the password securely — they can change it
            later.
          </Dialog.Description>

          <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
            <Field label="Email" htmlFor="cu-email">
              <input
                id="cu-email"
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="player@example.com"
              />
            </Field>
            <Field label="Username" htmlFor="cu-username">
              <input
                id="cu-username"
                type="text"
                required
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                placeholder="player1"
              />
            </Field>
            <Field label="Display name (optional)" htmlFor="cu-display">
              <input
                id="cu-display"
                type="text"
                autoComplete="off"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
                placeholder="Player One"
              />
            </Field>
            <Field label="Role" htmlFor="cu-role">
              <select
                id="cu-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputClass}
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Password" htmlFor="cu-password">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="cu-password"
                    type={showPw ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-10`}
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-(--color-text-muted) hover:text-(--color-text-primary)"
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="glass"
                  size="default"
                  onClick={() => {
                    setPassword(generatePassword());
                    setShowPw(true);
                  }}
                  title="Generate a strong password"
                >
                  <RefreshCw className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="glass"
                  size="default"
                  onClick={copyPassword}
                  disabled={!password}
                  title="Copy password"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <Button type="button" variant="glass" size="sm" disabled={submitting}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Create user
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.3em] text-(--color-text-muted)">
        {label}
      </span>
      {children}
    </label>
  );
}
