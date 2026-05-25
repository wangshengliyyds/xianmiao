import { Badge } from '@/components/ui/badge'
import type { ProductCondition } from '@/types'

interface ConditionBadgeProps {
  condition: ProductCondition
}

const conditionConfig: Record<ProductCondition, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  new: { label: '全新', variant: 'default' },
  like_new: { label: '几乎全新', variant: 'secondary' },
  good: { label: '成色较好', variant: 'secondary' },
  fair: { label: '有使用痕迹', variant: 'outline' },
  poor: { label: '明显瑕疵', variant: 'outline' },
}

export function ConditionBadge({ condition }: ConditionBadgeProps) {
  const config = conditionConfig[condition] || { label: condition, variant: 'outline' as const }

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  )
}
