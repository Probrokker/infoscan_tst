/**
 * Edge-safe часть конфига Auth.js v5.
 *
 * Этот файл используется в middleware (edge runtime) и не должен импортировать
 * ничего, что зависит от Node-only API (bcrypt, prisma и т.п.). Здесь — только
 * pages, базовые callbacks и пустой массив providers (он наполняется в auth.ts).
 */
import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
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
          return Response.redirect(new URL('/admin', nextUrl))
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
