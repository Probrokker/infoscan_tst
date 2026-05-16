'use client'

/**
 * Провайдер темы. Управляет атрибутом data-theme на <html>.
 * По умолчанию — system (системная тема).
 */
import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={['light', 'dark', 'system']}
    >
      {children}
    </NextThemesProvider>
  )
}
