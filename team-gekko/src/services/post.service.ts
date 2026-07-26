/**
 * Mock-or-real blog post service.
 */
import { mockPosts } from '@/data/posts.mock';
import { api } from '@/lib/api';
import { sleep } from '@/lib/utils';
import type { Post, PostCategory } from '@/types/post';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export type ListPostsParams = {
  q?: string;
  category?: PostCategory | 'all';
};

function filterPosts(posts: Post[], params: ListPostsParams): Post[] {
  const q = params.q?.trim().toLowerCase();
  return posts.filter((p) => {
    if (params.category && params.category !== 'all' && p.category !== params.category)
      return false;
    if (q) {
      const haystack = `${p.title} ${p.excerpt} ${(p.tags ?? []).join(' ')}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export const postService = {
  list: USE_MOCK
    ? async (params: ListPostsParams = {}): Promise<Post[]> => {
        await sleep(50);
        return filterPosts(mockPosts, params);
      }
    : async (params: ListPostsParams = {}) => api.get<Post[]>('/posts', { params }),

  all: USE_MOCK ? async (): Promise<Post[]> => mockPosts : async () => api.get<Post[]>('/posts'),

  get: USE_MOCK
    ? async (slug: string): Promise<Post | null> => {
        await sleep(40);
        return mockPosts.find((p) => p.slug === slug) ?? null;
      }
    : async (slug: string) => api.get<Post>(`/posts/${slug}`),
};
