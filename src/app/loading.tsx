export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <div className="splash-logo flex flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-primary/30">
          <span className="text-3xl font-bold text-primary-foreground">闲</span>
        </div>
        <h1 className="text-2xl font-bold tracking-wider">闲妙</h1>
      </div>
      <p className="splash-tagline mt-3 text-sm text-muted-foreground">
        AI驱动的二手闲置交易平台
      </p>
    </div>
  )
}
