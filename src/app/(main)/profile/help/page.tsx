'use client'

import { useState } from 'react'
import { ChevronRight, BookOpen, MessageCircle, Mail, FileQuestion, ChevronDown, Package, CreditCard, Truck, ShieldCheck } from 'lucide-react'
import { BackHeader } from '@/components/common/back-header'
import { Separator } from '@/components/ui/separator'

const faqItems = [
  { q: '如何发布商品？', a: '点击首页底部的「+」按钮，填写商品信息后即可发布。' },
  { q: '交易安全吗？', a: '闲妙支持担保交易，买家确认收货后卖家才会收到款项。' },
  { q: '如何联系卖家？', a: '在商品详情页点击「联系卖家」即可发起聊天。' },
  { q: '如何退款？', a: '在订单详情页点击「申请退款」，填写退款原因即可提交。' },
]

const guideSteps = [
  { icon: Package, title: '发布闲置', desc: '拍照上传你的闲置物品，设置价格和交易方式' },
  { icon: CreditCard, title: '担保交易', desc: '买家付款后资金由平台托管，安全有保障' },
  { icon: Truck, title: '发货收货', desc: '支持自提和快递，买家确认收货后完成交易' },
  { icon: ShieldCheck, title: '售后保障', desc: '交易纠纷可申请平台介入，保障双方权益' },
]

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [showGuide, setShowGuide] = useState(false)

  return (
    <div>
      <BackHeader title="帮助与反馈" />

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* 常见问题 */}
        <div>
          <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">常见问题</p>
          <div className="rounded-2xl border bg-card">
            {faqItems.map((item, i) => (
              <div key={item.q}>
                {i > 0 && <Separator />}
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-muted/60">
                    <FileQuestion className="h-[18px] w-[18px] stroke-[1.8] text-foreground/65" />
                  </div>
                  <span className="flex-1 text-sm font-medium">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 stroke-[2] text-muted-foreground/40 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {expandedFaq === i && (
                  <div className="px-4 pb-3.5 pl-[60px]">
                    <p className="text-sm text-muted-foreground">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 联系我们 */}
        <div>
          <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">联系我们</p>
          <div className="rounded-2xl border bg-card">
            <a
              href="mailto:help@xianmiao.com?subject=在线客服咨询"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 rounded-t-2xl"
            >
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-muted/60">
                <MessageCircle className="h-[18px] w-[18px] stroke-[1.8] text-foreground/65" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">在线客服</p>
                <p className="text-xs text-muted-foreground">发送邮件联系我们</p>
              </div>
              <ChevronRight className="h-4 w-4 stroke-[2] text-muted-foreground/40" />
            </a>
            <Separator />
            <a
              href="mailto:help@xianmiao.com?subject=意见反馈"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 rounded-b-2xl"
            >
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-muted/60">
                <Mail className="h-[18px] w-[18px] stroke-[1.8] text-foreground/65" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">意见反馈</p>
                <p className="text-xs text-muted-foreground">help@xianmiao.com</p>
              </div>
              <ChevronRight className="h-4 w-4 stroke-[2] text-muted-foreground/40" />
            </a>
          </div>
        </div>

        {/* 使用指南 */}
        <div>
          <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">使用指南</p>
          <div className="rounded-2xl border bg-card">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 rounded-2xl"
            >
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-muted/60">
                <BookOpen className="h-[18px] w-[18px] stroke-[1.8] text-foreground/65" />
              </div>
              <span className="flex-1 text-sm font-medium">新手指南</span>
              <ChevronDown className={`h-4 w-4 stroke-[2] text-muted-foreground/40 transition-transform ${showGuide ? 'rotate-180' : ''}`} />
            </button>
            {showGuide && (
              <div className="px-4 pb-4 space-y-3">
                {guideSteps.map((step, i) => {
                  const Icon = step.icon
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4 stroke-[2]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="text-xs text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
