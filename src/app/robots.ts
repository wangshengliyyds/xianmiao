import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://xianmiao.com'
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/search', '/product/', '/circle'],
        disallow: ['/admin', '/api', '/chat', '/order', '/profile', '/login'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
