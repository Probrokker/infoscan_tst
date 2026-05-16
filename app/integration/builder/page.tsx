/**
 * Страница /integration/builder. Серверный компонент с метаданными.
 * Сама фича рендерится в BuilderClient ('use client') через dynamic с ssr:false.
 */
import type { Metadata } from 'next'
import BuilderClient from './BuilderClient'

export const metadata: Metadata = {
  title: 'Конструктор JS-шаблона',
  description:
    'Соберите JavaScript-шаблон для раздела «Алгоритмы» Личного кабинета устройства Инфоскан за 6 шагов. На выходе — готовый код плюс cURL для теста и Markdown с инструкциями для интегратора.',
}

export default function BuilderPage() {
  return <BuilderClient />
}
