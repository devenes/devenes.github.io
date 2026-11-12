import { describe, expect, it } from 'vitest';
import {
  formatProposalCopyPayload,
  SESSION_PROPOSALS,
  SESSION_TRACKS,
} from '../../src/data/sessionCatalog';

describe('Conference Session Proposals Catalog', () => {
  it('maintains unique slugs, valid tracks, and complete abstracts across all 13 proposals', () => {
    expect(SESSION_PROPOSALS).toHaveLength(13);

    const ids = new Set<string>();
    const titles = new Set<string>();
    const validTracks = new Set(SESSION_TRACKS.map((t) => t.id));

    for (const session of SESSION_PROPOSALS) {
      expect(session.id).toMatch(/^[a-z0-9-]+$/);
      expect(ids.has(session.id)).toBe(false);
      ids.add(session.id);

      expect(titles.has(session.title)).toBe(false);
      titles.add(session.title);

      expect(validTracks.has(session.trackId)).toBe(true);
      expect(session.formats.length).toBeGreaterThanOrEqual(1);
      expect(session.abstract.length).toBeGreaterThanOrEqual(2);
      expect(session.keyTakeaways.length).toBeGreaterThanOrEqual(3);
      expect(session.whoShouldAttend.length).toBeGreaterThanOrEqual(1);
      expect(session.topics.length).toBeGreaterThanOrEqual(5);
    }

    const workshops = SESSION_PROPOSALS.filter((s) => s.formats.includes('Workshop'));
    expect(workshops).toHaveLength(3);
  });

  it('formats CFP copy payloads cleanly with title, abstract, takeaways, audience, and topics', () => {
    const sample = SESSION_PROPOSALS[0];
    const payload = formatProposalCopyPayload(sample);

    expect(payload).toContain(`Session Title: ${sample.title}`);
    expect(payload).toContain('Session Abstract:');
    expect(payload).toContain('Key Takeaways:');
    expect(payload).toContain('Who Should Attend:');
    expect(payload).toContain(`Topics: ${sample.topics.join(', ')}`);
  });
});
