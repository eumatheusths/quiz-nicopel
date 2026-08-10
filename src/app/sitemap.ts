import type { MetadataRoute } from 'next';
import { siteUrl } from '@/content/site-content';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/privacidade`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
