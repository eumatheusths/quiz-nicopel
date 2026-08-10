import type { MetadataRoute } from 'next';
import { siteUrl } from '@/content/site-content';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/privacidade'],
      // Painel, APIs, status e páginas de resultado ficam fora dos buscadores.
      disallow: ['/admin', '/api/', '/status', '/resultado/'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
