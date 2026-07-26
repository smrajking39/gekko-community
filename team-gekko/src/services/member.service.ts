/**
 * Mock-or-real member directory service. Mirrors the `userService` pattern.
 */
import { mockActivity } from '@/data/activity.mock';
import { mockMembersDirectory } from '@/data/members-directory.mock';
import { api } from '@/lib/api';
import { sleep } from '@/lib/utils';
import type { ActivityEntry } from '@/types/activity';
import type { DirectoryMember } from '@/types/member';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export type ListMembersParams = {
  q?: string;
  role?: string;
  /** Filter by main game slug — "valorant", "pubg", etc. "all" or undefined returns everyone. */
  game?: string;
};

function filterMembers(members: DirectoryMember[], params: ListMembersParams): DirectoryMember[] {
  const q = params.q?.trim().toLowerCase();
  return members.filter((m) => {
    if (params.role && params.role !== 'all' && m.role !== params.role) return false;
    if (
      params.game &&
      params.game !== 'all' &&
      !m.mainGames.some((g) => g.gameSlug === params.game)
    )
      return false;
    if (q) {
      const haystack = `${m.displayName} ${m.username} ${m.bio} ${m.location ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export const memberService = {
  list: USE_MOCK
    ? async (params: ListMembersParams = {}): Promise<DirectoryMember[]> => {
        await sleep(60);
        return filterMembers(mockMembersDirectory, params);
      }
    : async (params: ListMembersParams = {}) => api.get<DirectoryMember[]>('/members', { params }),

  all: USE_MOCK
    ? async (): Promise<DirectoryMember[]> => mockMembersDirectory
    : async () => api.get<DirectoryMember[]>('/members'),

  get: USE_MOCK
    ? async (username: string): Promise<DirectoryMember | null> => {
        await sleep(40);
        return mockMembersDirectory.find((m) => m.username === username) ?? null;
      }
    : async (username: string) => api.get<DirectoryMember>(`/members/${username}`),

  listActivity: USE_MOCK
    ? async (username: string, limit = 8): Promise<ActivityEntry[]> => {
        await sleep(40);
        return mockActivity
          .filter((a) => a.username === username)
          .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
          .slice(0, limit);
      }
    : async (username: string, limit = 8) =>
        api.get<ActivityEntry[]>(`/members/${username}/activity`, { params: { limit } }),
};
