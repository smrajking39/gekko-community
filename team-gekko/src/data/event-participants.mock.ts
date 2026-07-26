import { mockMembersDirectory } from '@/data/members-directory.mock';
import type { DirectoryMember } from '@/types/member';

/**
 * Maps event slug → list of participant usernames. We resolve to full
 * `DirectoryMember` records at use site to keep the data thin and avoid
 * duplicating member info. If a slug isn't in the map, the event treats
 * it as "no participants list yet" (workshops, streams).
 */
const PARTICIPANTS_BY_EVENT: Record<string, string[]> = {
  'valorant-cup-round-2': [
    'astra',
    'kael',
    'jules',
    'mae',
    'sky',
    'ren',
    'priya',
    'oren',
    'tobi',
    'mira',
    'kazu',
    'amari',
    'tess',
    'jules',
    'nyra',
  ],
  'fifa-community-cup': [
    'priya',
    'tobi',
    'astra',
    'ren',
    'mira',
    'cyrus',
    'iris',
    'pax',
    'finn',
    'caz',
    'kael',
    'echo',
  ],
  'spring-rocket-league-cup': [
    'sky',
    'cyrus',
    'tobi',
    'arlo',
    'theo',
    'pol',
    'ren',
    'astra',
    'oren',
    'liv',
  ],
  'gekko-meetup-tokyo': ['sky', 'astra', 'kazu', 'priya', 'tobi', 'mira', 'cyrus', 'iris'],
  'gekko-meetup-berlin': ['kael', 'sava', 'zee', 'rune', 'sana', 'kit'],
  'apex-role-coaching': ['ren', 'echo', 'wren', 'tara', 'omari', 'astra', 'jules'],
  'how-to-climb-in-cs2': ['kael', 'sava', 'sana', 'rune', 'gus', 'cyrus', 'oren', 'zee'],
  'intro-to-ranked-valorant': ['astra', 'mira', 'amari', 'kazu', 'isla'],
  'fifa-tactic-board-night': ['priya', 'tobi', 'iris', 'pax', 'caz', 'finn'],
};

export function getEventParticipants(eventSlug: string): DirectoryMember[] {
  const usernames = PARTICIPANTS_BY_EVENT[eventSlug];
  if (!usernames) return [];
  const seen = new Set<string>();
  const out: DirectoryMember[] = [];
  for (const u of usernames) {
    if (seen.has(u)) continue;
    seen.add(u);
    const m = mockMembersDirectory.find((x) => x.username === u);
    if (m) out.push(m);
  }
  return out;
}
