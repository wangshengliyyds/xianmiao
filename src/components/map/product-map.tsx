'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Product } from '@/types/product'
import { formatPriceShort } from '@/lib/format'

interface ProductMapProps {
  center: [number, number]
  products: Product[]
  zoom?: number
}

export function ProductMap({ center, products, zoom = 13 }: ProductMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // 初始化地图
    const map = L.map(mapRef.current).setView(center, zoom)

    // 添加 OpenStreetMap 图层
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  // 更新中心点
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setView(center, zoom)
    }
  }, [center, zoom])

  // 添加商品标记
  useEffect(() => {
    if (!mapInstance.current) return

    // 清除旧标记
    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstance.current!.removeLayer(layer)
      }
    })

    // 添加新标记
    products.forEach((product) => {
      if (!product.lat || !product.lng || !mapInstance.current) return

      const marker = L.marker([product.lat, product.lng]).addTo(mapInstance.current)

      // 自定义弹窗
      const coverImage = product.images?.find((img) => img.is_cover) || product.images?.[0]
      const popupContent = `
        <div style="min-width: 180px; padding: 4px;">
          ${coverImage ? `<img src="${coverImage.url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />` : ''}
          <div style="font-size: 13px; font-weight: 500; line-height: 1.3; margin-bottom: 4px;">
            ${product.title}
          </div>
          <div style="font-size: 16px; font-weight: bold; color: #10b981;">
            ${formatPriceShort(product.price)}
          </div>
          <a href="/product/${product.id}" style="display: block; text-align: center; margin-top: 8px; padding: 6px; background: #10b981; color: white; border-radius: 6px; text-decoration: none; font-size: 12px;">
            查看详情
          </a>
        </div>
      `

      marker.bindPopup(popupContent, {
        maxWidth: 220,
        className: 'product-popup',
      })
    })
  }, [products])

  return (
    <div ref={mapRef} className="h-full w-full" />
  )
}
