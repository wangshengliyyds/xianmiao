'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Navigation } from 'lucide-react'
import { SmartImage } from '@/components/ui/smart-image'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/empty-state'
import type { ProductWithImages } from '@/types'

let L: typeof import('leaflet') | null = null

const DEFAULT_LOC = { lat: 39.9042, lng: 116.4074 }

export default function MapPage() {
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(DEFAULT_LOC)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithImages | null>(null)

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      if (typeof window === 'undefined') return

      L = await import('leaflet')
      if (cancelled) return

      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = '/leaflet.css'
        document.head.appendChild(link)
      }

      // 获取定位，拿到后再初始化地图
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            setUserLocation(loc)
            initMap(loc)
          },
          () => {
            if (cancelled) return
            initMap(DEFAULT_LOC)
          },
          { enableHighAccuracy: true, timeout: 8000 }
        )
      } else {
        initMap(DEFAULT_LOC)
      }
    }

    boot()

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const initMap = (loc: { lat: number; lng: number }) => {
    if (!L || !mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current).setView([loc.lat, loc.lng], 13)

    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      subdomains: ['1', '2', '3', '4'],
      attribution: '&copy; 高德地图',
    }).addTo(map)

    mapInstanceRef.current = map

    // 添加用户位置标记
    L.circleMarker([loc.lat, loc.lng], {
      radius: 8,
      fillColor: '#3b82f6',
      fillOpacity: 1,
      color: '#fff',
      weight: 2,
    }).addTo(map)

    loadNearbyProducts()
  }

  const loadNearbyProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products?page=1&page_size=50')
      if (res.ok) {
        const { data } = await res.json()
        const withLoc = (data || []).filter((p: ProductWithImages) => p.lat && p.lng)
        setProducts(withLoc)

        if (L && mapInstanceRef.current) {
          // 清除旧标记
          markersRef.current.forEach((m) => m.remove())
          markersRef.current = []

          withLoc.forEach((product: ProductWithImages) => {
            if (product.lat && product.lng) {
              const marker = L!.marker([product.lat, product.lng])
                .addTo(mapInstanceRef.current!)
                .on('click', () => setSelectedProduct(product))
              markersRef.current.push(marker)

              const coverImage = product.images?.find((img) => img.is_cover)?.url
              const escapedTitle = product.title.replace(/[<>"'&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' }[c] || c))
              const escapedUrl = (coverImage || '/placeholder.svg').replace(/[<>"'&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' }[c] || c))
              marker.bindPopup(`
                <div style="min-width: 150px;">
                  <img src="${escapedUrl}" style="width:100%;height:80px;object-fit:cover;border-radius:4px;" />
                  <p style="margin:4px 0;font-size:12px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapedTitle}</p>
                  <p style="margin:0;color:#e11d48;font-weight:bold;font-size:14px;">${formatPrice(product.price)}</p>
                </div>
              `)
            }
          })
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const centerToUser = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15)
    }
  }

  return (
    <div className="relative h-[calc(100vh-120px)]">
      <div ref={mapRef} className="h-full w-full" />

      <Button
        onClick={centerToUser}
        size="icon"
        className="absolute right-4 top-4 z-[1000] rounded-full shadow-lg"
      >
        <Navigation className="h-5 w-5" />
      </Button>

      <div className="absolute left-4 top-4 z-[1000] rounded-full bg-background/90 px-3 py-1.5 text-sm backdrop-blur-sm">
        <MapPin className="mr-1 inline h-4 w-4" />
        附近 {products.length} 件商品
      </div>

      {selectedProduct && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] rounded-xl bg-background p-4 shadow-lg">
          <div className="flex gap-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
              {selectedProduct.images?.[0]?.url && (
                <SmartImage
                  src={selectedProduct.images[0].url}
                  alt={selectedProduct.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="line-clamp-2 font-medium">{selectedProduct.title}</h3>
              <p className="mt-1 text-lg font-bold text-primary">
                {formatPrice(selectedProduct.price)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedProduct(null)}>
              关闭
            </Button>
            <Button size="sm" className="flex-1" onClick={() => router.push(`/product/${selectedProduct.id}`)}>
              查看详情
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/50">
          <p className="text-sm text-muted-foreground">加载地图中...</p>
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center">
          <div className="rounded-xl bg-background p-6 shadow-lg">
            <EmptyState
              icon={<MapPin className="h-8 w-8 stroke-[1.5] text-muted-foreground/40" />}
              title="暂无附近商品"
              description="当前区域还没有卖家发布带位置的商品"
            />
          </div>
        </div>
      )}
    </div>
  )
}
