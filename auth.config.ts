/**
 * Edge-safe часть конфига Auth.js v5.
 *
 * Этот файл используется в middleware (edge runtime) и не должен импортировать
 * ничего, что зависит от Node-only API (bcrypt, prisma и т.п.). Здесь — только
 * pages, базовые callbacks и пустой массив providers (он наполняется в auth.ts).
 */
import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  providers: [],
  callbacks: {
    /**
     * Запускается на каждом запросе через middleware.
     * Возвращает true → доступ разрешён,
     *           false → редирект на pages.signIn,
     *           Response → произвольный ответ (например, кастомный редирект).
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLogin = nextUrl.pathname === '/admin/login'
      const isOnAdmin = nextUrl.pathname.startsWith('/admin')

      if (isOnLogin) {
        if (isLoggedIn) {
          // Используем nextUrl.clone() чтобы basePath сохранился в redirect-URL.
          const url = nextUrl.clone()
          url.pathname = '/admin'
          return Response.redirect(url)
        }
        return true
      }

      if (isOnAdmin) {
        return isLoggedIn
      }

      return true
    },
  },
} satisfies NextAuthConfig
