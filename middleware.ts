/**
 * Middleware: защищает /admin/* — пускает только авторизованных.
 * Использует edge-safe authConfig (без bcrypt/prisma).
 */
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export default NextAuth(authConfig).auth

export const config = {
  matcher: ['/admin/:path*'],
}
