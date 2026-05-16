/**
 * Глобальная подкладка кастомных компонентов в MDX.
 * https://nextjs.org/docs/app/building-your-application/configuring/mdx
 *
 * Тут регистрируются <Callout>, <Steps>, <Step>, <CodeTabs>, <Mermaid> —
 * чтобы внутри .mdx можно было писать просто <Callout kind="warning">…</Callout>.
 */
import type { MDXComponents } from 'mdx/types'
import { Callout } from '@/components/docs/Callout'
import { Steps, Step } from '@/components/docs/Steps'
import { CodeTabs } from '@/components/docs/CodeTabs'
import { Mermaid } from '@/components/docs/Mermaid'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    Steps,
    Step,
    CodeTabs,
    Mermaid,
    // Tailwind-Typography берёт на себя базовую разметку (h1-h6, p, ul, ol, blockquote, table).
    ...components,
  }
}
