import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import rawArchive from '../../src/data/talks.json';
import { OrbitArchiveSchema, TalkSchema } from '../../src/schemas/talkSchema';
import { validateArchive } from '../../src/utils/metrics';

describe('ORBIT Archive Schema & Asset Integrity', () => {
  it('validates src/data/talks.json against OrbitArchiveSchema with 36+ talks across 18+ countries', () => {
    const parsed = validateArchive(rawArchive);
    expect(parsed.clusters).toHaveLength(4);
    expect(parsed.talks.length).toBeGreaterThanOrEqual(36);

    const uniqueCountries = new Set(parsed.talks.map((t) => t.countryCode.toUpperCase()));
    const uniqueCities = new Set(
      parsed.talks.map((t) => `${t.countryCode.toUpperCase()}:${t.city.toLowerCase()}`)
    );
    expect(uniqueCountries.size).toBeGreaterThanOrEqual(18);
    expect(uniqueCities.size).toBeGreaterThanOrEqual(24);
  });

  it('enforces strictly unique talk.id values across the entire archive', () => {
    const parsed = OrbitArchiveSchema.parse(rawArchive);
    const ids = parsed.talks.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    // Verify duplicate IDs throw when passed to validateArchive
    const duplicated = {
      ...rawArchive,
      talks: [rawArchive.talks[0], rawArchive.talks[0]],
    };
    expect(() => validateArchive(duplicated)).toThrow(/Duplicate talk id/);
  });

  it('verifies all talk image paths are relative and exist on disk under public/', () => {
    const parsed = OrbitArchiveSchema.parse(rawArchive);
    const publicDir = path.resolve(process.cwd(), 'public');

    for (const talk of parsed.talks) {
      expect(talk.image.startsWith('/')).toBe(false);
      const fullPath = path.join(publicDir, talk.image);
      expect(
        fs.existsSync(fullPath),
        `Expected stage image to exist at ${fullPath} for talk ${talk.id}`
      ).toBe(true);
    }
  });

  it('rejects invalid mock talk records (bad date format, leading slash in image, invalid cluster ID)', () => {
    const validBase = rawArchive.talks[0];

    const badDate = { ...validBase, date: '15-03-2025' };
    expect(TalkSchema.safeParse(badDate).success).toBe(false);

    const leadingSlashImage = { ...validBase, image: '/images/talks/devfest-almaty.svg' };
    const slashResult = TalkSchema.safeParse(leadingSlashImage);
    expect(slashResult.success).toBe(false);

    const badCluster = { ...validBase, primaryCluster: 'blockchain' };
    expect(TalkSchema.safeParse(badCluster).success).toBe(false);
  });
});
