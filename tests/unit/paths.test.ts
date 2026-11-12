import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../../src/scripts/atlasController';
import { formatCoordinates, formatSignalDate, withBase } from '../../src/utils/paths';

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

  it('formats geographic coordinates with accurate N/S and E/W hemisphere labels', () => {
    expect(formatCoordinates(41.0082, 28.9784, 2)).toBe('41.01°N, 28.98°E');
    expect(formatCoordinates(30.4278, -9.5981, 2)).toBe('30.43°N, 9.60°W');
    expect(formatCoordinates(30.4278, -9.5981, 1, ' ')).toBe('30.4°N 9.6°W');
  });

  it('escapes HTML special characters in dynamic strings', () => {
    expect(escapeHtml(`A & B <script>"alert('x')"</script>`)).toBe(
      'A &amp; B &lt;script&gt;&quot;alert(&#39;x&#39;)&quot;&lt;/script&gt;'
    );
  });
});

