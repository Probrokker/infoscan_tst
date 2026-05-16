import type { Metadata } from 'next'
import EmulatorClient from './EmulatorClient'

export const metadata: Metadata = {
  title: 'Эмулятор устройства',
  description:
    'Симуляция экранов и измерений Инфоскана. Проверяет JS-шаблон из конструктора в изолированной песочнице — реальная отправка в сеть отключена.',
}

export default function EmulatorPage() {
  return <EmulatorClient />
}
