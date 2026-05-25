import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查 Supabase auth cookie（不调用 Supabase API，避免国内网络超时）
  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token')
  )

  // 需要登录的路由
  const authRequired = ['/chat', '/order', '/profile', '/product/publish', '/product/edit', '/notification', '/merchant']
  const needsAuth = authRequired.some((p) => pathname.startsWith(p))

  if (needsAuth && !hasAuthCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // 管理后台 - 只检查是否登录，权限由页面组件验证
  if (pathname.startsWith('/admin') && !hasAuthCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 已登录用户访问登录页 → 重定向首页
  if (pathname === '/login' && hasAuthCookie) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
