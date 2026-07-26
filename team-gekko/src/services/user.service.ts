/**
 * Example service following the mock-or-real pattern.
 * When NEXT_PUBLIC_USE_MOCK=true, returns mock data with simulated latency.
 * Otherwise hits the real API.
 *
 * Use this pattern for every domain service (posts, gallery, events, etc).
 */
import { mockUsers } from '@/data/users.mock';
import { api } from '@/lib/api';
import { sleep } from '@/lib/utils';
import type { Pagination } from '@/types/api';
import type { PublicUser } from '@/types/user';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export type ListUsersParams = {
  q?: string;
  page?: number;
  limit?: number;
};

export type ListUsersResult = {
  items: PublicUser[];
  pagination: Pagination;
};

export const userService = {
  list: USE_MOCK
    ? async (params: ListUsersParams = {}): Promise<ListUsersResult> => {
        await sleep(120);
        const page = params.page ?? 1;
        const limit = params.limit ?? 20;
        const filtered = params.q
          ? mockUsers.filter((u) =>
              [u.username, u.displayName ?? '']
                .join(' ')
                .toLowerCase()
                .includes((params.q ?? '').toLowerCase()),
            )
          : mockUsers;
        const start = (page - 1) * limit;
        return {
          items: filtered.slice(start, start + limit),
          pagination: {
            page,
            limit,
            total: filtered.length,
            totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
          },
        };
      }
    : async (params: ListUsersParams = {}) => api.get<ListUsersResult>('/users', { params }),

  get: USE_MOCK
    ? async (username: string): Promise<PublicUser | null> => {
        await sleep(80);
        return mockUsers.find((u) => u.username === username) ?? null;
      }
    : async (username: string) => api.get<PublicUser>(`/users/${username}`),
};
