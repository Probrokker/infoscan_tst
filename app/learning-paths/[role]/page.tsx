/**
 * Страница учебной дорожки. Три статичных маршрута: оператор / админ / разработчик.
 * Все статьи берутся из реального content/ — если статья ещё не написана,
 * показываем её как «скоро», без перехода.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { AUDIENCES, type Audience } from '@/lib/constants'
import { getPageBySlug } from '@/lib/content'

interface RoutePoint {
  slug: string
  title: string
  description: string
}

const ROUTES: Record<Audience, { intro: string; estimated: string; points: RoutePoint[] }> = {
  operator: {
    intro: 'За 15 минут вы научитесь измерять груз на Инфоскане и решать частые ошибки.',
    estimated: '15 минут',
    points: [
      { slug: '01-start/what-is-infoscan', title: 'Что такое Инфоскан', description: 'Зачем нужно устройство и кто его использует.' },
      { slug: '04-operation/startup', title: 'Включение и проверка', description: 'Первое включение и проверка датчиков.' },
      { slug: '04-operation/measure-regular', title: 'Измерение за 3 шага', description: 'Кладёте коробку — получаете ВГХ.' },
      { slug: '04-operation/barcode-and-qr', title: 'ШК и QR-вывод', description: 'Как сканировать и куда уходит результат.' },
      { slug: '04-operation/history', title: 'История измерений', description: 'Где смотреть прошлые замеры.' },
      { slug: '04-operation/errors', title: 'Что делать при ошибке', description: 'Повтор измерения, неправильная форма.' },
    ],
  },
  admin: {
    intro: 'За 2 часа вы соберёте, подключите, откалибруете устройство и настроите Личный кабинет.',
    estimated: '2 часа',
    points: [
      { slug: '02-assembly/unpacking', title: 'Распаковка и комплектация', description: 'Что внутри коробки и как проверить.' },
      { slug: '02-assembly/stand', title: 'Сборка стойки и платформы', description: 'Пошаговая сборка.' },
      { slug: '03-network/wired', title: 'Проводное подключение', description: 'DHCP или статический IP.' },
      { slug: '03-network/personal-cabinet', title: 'Доступ к Личному кабинету устройства', description: 'http://[IP]/, admin/admin.' },
      { slug: '05-configuration/calibration-laser', title: 'Калибровка ЛД', description: 'Кубик 20×20×20 мм, винты H1.5.' },
      { slug: '05-configuration/calibration-weight', title: 'Калибровка ВД', description: 'Гиря 20–40 кг.' },
      { slug: '05-configuration/settings', title: 'Раздел «Настройки»', description: 'Язык, единицы, PIN, опции.' },
      { slug: '07-service/maintenance', title: 'Регламент обслуживания', description: 'Что и когда делать.' },
    ],
  },
  developer: {
    intro: 'За день вы соберёте полный шаблон интеграции с WMS и проверите его на эмуляторе.',
    estimated: '1 день',
    points: [
      { slug: '06-integration/architecture', title: 'Архитектура шаблонов', description: 'Как Инфоскан общается с WMS.' },
      { slug: '06-integration/runtime', title: 'Среда выполнения JS', description: 'SENSOR, BARCODE, HELPER_JS, GLOBAL_VAR.' },
      { slug: '06-integration/transports', title: 'Транспорты', description: 'http/tcp/ftp/file/qr и capture-варианты.' },
      { slug: '06-integration/auth', title: 'Аутентификация', description: 'Basic, Bearer, OAuth 2.0.' },
      { slug: '06-integration/finish-send', title: 'Шаблон jsScriptFinishSend', description: 'Подробный разбор.' },
      { slug: 'integration/builder', title: 'Конструктор JS-шаблона', description: 'Соберите шаблон за 6 шагов.', },
      { slug: 'emulator', title: 'Эмулятор устройства', description: 'Проверьте шаблон в песочнице.' },
      { slug: '06-integration/error-handling', title: 'Обработка ошибок', description: 'resp, throw Error, баннеры.' },
    ],
  },
}

export function generateStaticParams() {
  return AUDIENCES.map((a) => ({ role: a.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string }>
}): Promise<Metadata> {
  const { role } = await params
  const audience = AUDIENCES.find((a) => a.id === role)
  if (!audience) return {}
  return {
    title: `Маршрут «${audience.label}»`,
    description: `Учебная дорожка для роли «${audience.label}». ${audience.description}`,
  }
}

export default async function LearningPathPage({
  params,
}: {
  params: Promise<{ role: string }>
}) {
  const { role } = await params
  const audience = AUDIENCES.find((a) => a.id === role) as { id: Audience; label: string; description: string } | undefined
  if (!audience) {
    notFound()
  }
  const route = ROUTES[audience.id]

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Учебная дорожка
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Для роли «{audience.label}»
        </h1>
        <p className="mt-3 text-lg text-[var(--muted-foreground)]">{route.intro}</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Оценка времени: <strong>{route.estimated}</strong>
        </p>
      </header>

      <ol className="space-y-3">
        {route.points.map((p, i) => {
          // Для статических роутов вроде integration/builder — статья «есть»
          // по умолчанию; для контента из content/ — проверяем существование.
          const isStatic = p.slug.startsWith('integration/') || p.slug.startsWith('emulator')
          const exists = isStatic || getPageBySlug(p.slug.split('/')) != null
          const href = exists ? `/${p.slug}` : null

          const inner = (
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-yellow-brand)] font-mono text-sm font-semibold text-[var(--color-black-brand)]">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-medium">{p.title}</h2>
                  {exists ? (
                    <CheckCircle2
                      className="h-4 w-4 text-[var(--color-success)]"
                      strokeWidth={1.5}
                      aria-label="Готово"
                    />
                  ) : (
                    <Circle
                      className="h-4 w-4 text-[var(--muted-foreground)]"
                      strokeWidth={1.5}
                      aria-label="Скоро"
                    />
                  )}
                </div>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{p.description}</p>
                {!exists && (
                  <p className="mt-1 text-xs italic text-[var(--muted-foreground)]">
                    Статья ещё пишется.
                  </p>
                )}
              </div>
              {href && (
                <ArrowRight
                  className="mt-2 h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.5}
                  aria-hidden
                />
              )}
            </div>
          )

          return (
            <li
              key={p.slug}
              className="rounded-[var(--radius-card)] border transition-colors hover:bg-[var(--accent)]"
            >
              {href ? (
                <Link href={href} className="group block p-4">
                  {inner}
                </Link>
              ) : (
                <div className="p-4 opacity-60">{inner}</div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
