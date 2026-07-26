/**
 * Mock-or-real game service. Mirrors the pattern in `user.service.ts`.
 * Server components and client components can both call into this since
 * `process.env.NEXT_PUBLIC_USE_MOCK` is available in both runtimes.
 */
import { mockGames } from '@/data/games.mock';
import { mockMatches } from '@/data/matches.mock';
import { mockSquads } from '@/data/squads.mock';
import { api } from '@/lib/api';
import { sleep } from '@/lib/utils';
import type { Game, GameGenre, GameStatus } from '@/types/game';
import type { Match } from '@/types/match';
import type { Squad } from '@/types/squad';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export type ListGamesParams = {
  q?: string;
  genre?: GameGenre | 'all';
  status?: GameStatus | 'all';
};

function filterGames(games: Game[], params: ListGamesParams): Game[] {
  const q = params.q?.trim().toLowerCase();
  return games.filter((g) => {
    if (params.genre && params.genre !== 'all' && g.genre !== params.genre) return false;
    if (params.status && params.status !== 'all' && g.status !== params.status) return false;
    if (q) {
      const haystack = `${g.name} ${g.publisher} ${g.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export const gameService = {
  list: USE_MOCK
    ? async (params: ListGamesParams = {}): Promise<Game[]> => {
        await sleep(60);
        return filterGames(mockGames, params);
      }
    : async (params: ListGamesParams = {}) => api.get<Game[]>('/games', { params }),

  /** Returns every game without filters — handy for static generation. */
  all: USE_MOCK ? async (): Promise<Game[]> => mockGames : async () => api.get<Game[]>('/games'),

  get: USE_MOCK
    ? async (slug: string): Promise<Game | null> => {
        await sleep(40);
        return mockGames.find((g) => g.slug === slug) ?? null;
      }
    : async (slug: string) => api.get<Game>(`/games/${slug}`),

  listSquads: USE_MOCK
    ? async (gameSlug: string): Promise<Squad[]> => {
        await sleep(40);
        return mockSquads.filter((s) => s.gameSlug === gameSlug);
      }
    : async (gameSlug: string) => api.get<Squad[]>(`/games/${gameSlug}/squads`),

  listMatches: USE_MOCK
    ? async (gameSlug: string, limit = 6): Promise<Match[]> => {
        await sleep(40);
        return mockMatches.filter((m) => m.gameSlug === gameSlug).slice(0, limit);
      }
    : async (gameSlug: string, limit = 6) =>
        api.get<Match[]>(`/games/${gameSlug}/matches`, { params: { limit } }),
};
