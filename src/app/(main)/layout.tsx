import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { DevTools } from '@/components/dev/dev-tools'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <BottomNav />
      <DevTools />
    </div>
  )
}
