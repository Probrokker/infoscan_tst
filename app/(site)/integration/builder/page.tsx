/**
 * Страница /integration/builder.
 * Метаданные — на сервере; тяжёлый UI подключается в BuilderClient через dynamic(ssr: false).
 */
import type { Metadata } from 'next'

import { BuilderClient } from './BuilderClient'

export const metadata: Metadata = {
  title: 'Конструктор JS-шаблона',
  description:
    'Соберите JavaScript-шаблон для раздела «Алгоритмы» Личного кабинета устройства Инфоскан за 6 шагов. На выходе — готовый код плюс cURL для теста и Markdown с инструкциями для интегратора.',
}

export default function BuilderPage() {
  return <BuilderClient />
}
