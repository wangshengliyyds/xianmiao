import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://xianmiao.com'

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/map`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/circle`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ]

  try {
    const supabase = await createClient()
    const { data: products } = await supabase
      .from('products')
      .select('id, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1000)

    const productPages: MetadataRoute.Sitemap = (products || []).map((p) => ({
      url: `${baseUrl}/product/${p.id}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...productPages]
  } catch {
    return staticPages
  }
}
