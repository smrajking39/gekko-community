/**
 * Mock-or-real event service. Mirrors the `gameService` pattern.
 */
import { mockBrackets } from '@/data/event-brackets.mock';
import { getEventParticipants } from '@/data/event-participants.mock';
import { mockEvents } from '@/data/events.mock';
import { api } from '@/lib/api';
import { sleep } from '@/lib/utils';
import type { Bracket } from '@/types/bracket';
import type { CommunityEvent, EventStatus, EventType } from '@/types/event';
import type { DirectoryMember } from '@/types/member';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export type ListEventsParams = {
  q?: string;
  type?: EventType | 'all';
  status?: EventStatus | 'all';
};

function filterEvents(events: CommunityEvent[], params: ListEventsParams): CommunityEvent[] {
  const q = params.q?.trim().toLowerCase();
  return events.filter((e) => {
    if (params.type && params.type !== 'all' && e.type !== params.type) return false;
    if (params.status && params.status !== 'all' && e.status !== params.status) return false;
    if (q) {
      const haystack = `${e.title} ${e.description} ${e.location}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export const eventService = {
  list: USE_MOCK
    ? async (params: ListEventsParams = {}): Promise<CommunityEvent[]> => {
        await sleep(50);
        return filterEvents(mockEvents, params);
      }
    : async (params: ListEventsParams = {}) => api.get<CommunityEvent[]>('/events', { params }),

  all: USE_MOCK
    ? async (): Promise<CommunityEvent[]> => mockEvents
    : async () => api.get<CommunityEvent[]>('/events'),

  get: USE_MOCK
    ? async (slug: string): Promise<CommunityEvent | null> => {
        await sleep(40);
        return mockEvents.find((e) => e.slug === slug) ?? null;
      }
    : async (slug: string) => api.get<CommunityEvent>(`/events/${slug}`),

  listParticipants: USE_MOCK
    ? async (slug: string): Promise<DirectoryMember[]> => {
        await sleep(40);
        return getEventParticipants(slug);
      }
    : async (slug: string) => api.get<DirectoryMember[]>(`/events/${slug}/participants`),

  getBracket: USE_MOCK
    ? async (slug: string): Promise<Bracket | null> => {
        await sleep(40);
        return mockBrackets.find((b) => b.eventSlug === slug) ?? null;
      }
    : async (slug: string) => api.get<Bracket>(`/events/${slug}/bracket`),
};
