export function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (Number.isNaN(num)) return '¥0.00'
  return `¥${num.toFixed(2)}`
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '未知日期'
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '未知时间'
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const absDiff = Math.abs(diff)
  const minutes = Math.floor(absDiff / 60000)
  const hours = Math.floor(absDiff / 3600000)
  const days = Math.floor(absDiff / 86400000)

  const suffix = diff < 0 ? '后' : '前'
  if (minutes < 1) return diff < 0 ? '即将' : '刚刚'
  if (minutes < 60) return `${minutes}分钟${suffix}`
  if (hours < 24) return `${hours}小时${suffix}`
  if (days < 7) return `${days}天${suffix}`
  return formatDate(date)
}

export function formatCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toString()
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone || phone.length < 7) return '未绑定'
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}
