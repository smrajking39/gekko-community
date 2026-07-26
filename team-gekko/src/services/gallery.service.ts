/**
 * Mock-or-real gallery service.
 */
import { mockGallery } from '@/data/gallery.mock';
import { api } from '@/lib/api';
import { sleep } from '@/lib/utils';
import type { GalleryCategory, GalleryItem } from '@/types/gallery';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export type ListGalleryParams = {
  q?: string;
  category?: GalleryCategory | 'all';
  game?: string;
};

function filterGallery(items: GalleryItem[], params: ListGalleryParams): GalleryItem[] {
  const q = params.q?.trim().toLowerCase();
  return items.filter((g) => {
    if (params.category && params.category !== 'all' && g.category !== params.category)
      return false;
    if (params.game && params.game !== 'all' && g.gameSlug !== params.game) return false;
    if (q) {
      const haystack = `${g.title} ${g.caption} ${g.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export const galleryService = {
  list: USE_MOCK
    ? async (params: ListGalleryParams = {}): Promise<GalleryItem[]> => {
        await sleep(50);
        return filterGallery(mockGallery, params);
      }
    : async (params: ListGalleryParams = {}) => api.get<GalleryItem[]>('/gallery', { params }),

  all: USE_MOCK
    ? async (): Promise<GalleryItem[]> => mockGallery
    : async () => api.get<GalleryItem[]>('/gallery'),

  get: USE_MOCK
    ? async (id: string): Promise<GalleryItem | null> => {
        await sleep(40);
        return mockGallery.find((g) => g.slug === id || g.id === id) ?? null;
      }
    : async (id: string) => api.get<GalleryItem>(`/gallery/${id}`),
};
