import { mockActivity } from '@/data/activity.mock';
import { mockMembersDirectory } from '@/data/members-directory.mock';
import type { ActivityEntry } from '@/types/activity';
import type { DirectoryMember } from '@/types/member';

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
  list: async (params: ListMembersParams = {}): Promise<DirectoryMember[]> => {
    return filterMembers(mockMembersDirectory, params);
  },

  all: async (): Promise<DirectoryMember[]> => mockMembersDirectory,

  get: async (username: string): Promise<DirectoryMember | null> => {
    return mockMembersDirectory.find((m) => m.username === username) ?? null;
  },

  listActivity: async (username: string, limit = 8): Promise<ActivityEntry[]> => {
    return mockActivity
      .filter((a) => a.username === username)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, limit);
  },
};
