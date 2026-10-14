import { describe, expect, it } from 'vitest';
import { formatSignalDate, withBase } from '../../src/utils/paths';

describe('ORBIT Path & Signal Date Utilities', () => {
  it('resolves relative paths against root and subpath BASE_URL values', () => {
    expect(withBase('images/talks/devfest-almaty.svg', '/')).toBe(
      '/images/talks/devfest-almaty.svg'
    );
    expect(withBase('images/talks/devfest-almaty.svg', '/devenes.github.io/')).toBe(
      '/devenes.github.io/images/talks/devfest-almaty.svg'
    );
    expect(withBase('/images/talks/devfest-almaty.svg', '/orbit')).toBe(
      '/orbit/images/talks/devfest-almaty.svg'
    );
  });

  it('formats YYYY-MM-DD dates into uppercase monospace signal format', () => {
    expect(formatSignalDate('2025-03-15')).toBe('MAR 15, 2025');
    expect(formatSignalDate('2025-02-08')).toBe('FEB 8, 2025');
    expect(formatSignalDate('2025-01-25')).toBe('JAN 25, 2025');
  });
});
