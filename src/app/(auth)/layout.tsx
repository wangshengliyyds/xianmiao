export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">闲妙</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI驱动的二手闲置交易平台
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
