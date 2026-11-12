import type { APIRoute } from 'astro';
import rawEvents from '../../data/events.json';
import { withBase } from '../utils/paths';

export const GET: APIRoute = ({ site }) => {
  const origin = site?.toString().replace(/\/$/, '') || 'https://devenes.github.io';
  const latestEventDate = rawEvents[0]?.date || '2026-10-10';

  const pages = [
    { path: withBase(''), priority: '1.0', changefreq: 'monthly', lastmod: latestEventDate },
    { path: withBase('speaker/'), priority: '0.9', changefreq: 'monthly', lastmod: latestEventDate },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${new URL(p.path, `${origin}/`).toString()}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
