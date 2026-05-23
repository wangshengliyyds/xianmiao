'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useProducts } from '@/lib/hooks/use-products'
import { ProductCard } from '@/components/product/product-card'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin } from 'lucide-react'

// Leaflet 只能客户端加载
const ProductMap = dynamic(
  () => import('@/components/map/product-map').then((mod) => mod.ProductMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[50vh] items-center justify-center bg-muted">
        <Skeleton className="h-full w-full" />
      </div>
    ),
  }
)

// 默认坐标（北京）
const DEFAULT_CENTER: [number, number] = [39.9042, 116.4074]

export default function MapPage() {
  const { data: products, isLoading } = useProducts({ limit: 50 })
  const [userLocation, setUserLocation] = useState(DEFAULT_CENTER)

  useEffect(() => {
    // 尝试获取用户位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude])
        },
        () => {
          // 定位失败，使用默认坐标
        }
      )
    }
  }, [])

  const productsWithLocation =
    products?.filter((p) => p.lat && p.lng) || []

  return (
    <div className="mx-auto max-w-2xl">
      <div className="sticky top-14 z-40 border-b bg-background px-4 py-3">
        <h1 className="flex items-center gap-1 text-lg font-semibold">
          <MapPin className="h-5 w-5 text-primary" />
          同城发现
        </h1>
      </div>

      {/* 地图区域 */}
      <div className="h-[45vh]">
        <ProductMap
          center={userLocation}
          products={productsWithLocation}
          zoom={13}
        />
      </div>

      {/* 附近商品列表 */}
      <div className="px-4 py-4">
        <h3 className="mb-3 text-sm font-medium">
          附近商品 ({productsWithLocation.length})
        </h3>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border">
                <Skeleton className="aspect-square" />
                <div className="p-2.5">
                  <Skeleton className="mb-1 h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : productsWithLocation.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {productsWithLocation.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">
            附近暂无商品
          </div>
        )}
      </div>
    </div>
  )
}
