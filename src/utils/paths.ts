/**
 * Resolves a relative asset path against Astro's BASE_URL so assets work
 * seamlessly on both root domain (https://devenes.github.io/) and project
 * subpath deployments (https://username.github.io/repo/).
 */
export function withBase(relativePath: string, customBase?: string): string {
  if (/^(https?:)?\/\//i.test(relativePath) || relativePath.startsWith('data:')) {
    return relativePath;
  }

  const rawBase =
    customBase !== undefined
      ? customBase
      : typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL
        ? import.meta.env.BASE_URL
        : '/';

  const normalizedBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  const cleanRelative = (relativePath ?? '').replace(/^\/+/, '');
  return `${normalizedBase}${cleanRelative}`;
}

const MONTHS_SHORT = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

/**
 * Formats an ISO YYYY-MM-DD date string into uppercase monospace signal format
 * e.g., "2025-03-15" -> "MAR 15, 2025", "2025-02-08" -> "FEB 8, 2025"
 */
export function formatSignalDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return isoDate.toUpperCase();
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  const monthLabel = MONTHS_SHORT[monthIdx] ?? 'JAN';
  return `${monthLabel} ${day}, ${year}`;
}

/**
 * Formats geographic latitude and longitude with accurate N/S and E/W hemisphere suffixes
 * (e.g., Agadir 30.4278, -9.5981 -> "30.43°N, 9.60°W" instead of "-9.60°E").
 */
export function formatCoordinates(
  lat: number,
  lon: number,
  decimals = 2,
  separator = ', '
): string {
  const latHemisphere = lat >= 0 ? 'N' : 'S';
  const lonHemisphere = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(decimals)}°${latHemisphere}${separator}${Math.abs(lon).toFixed(decimals)}°${lonHemisphere}`;
}

