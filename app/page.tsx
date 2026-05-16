/**
 * Главная страница. Hero-блок + три карточки-входа по ролям + блок «что внутри».
 */
import Link from 'next/link'
import { ArrowRight, Wrench, Server, Code, BookOpen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AUDIENCES, SECTIONS, MODELS } from '@/lib/constants'

const audienceIcons = {
  operator: Wrench,
  admin: Server,
  developer: Code,
} as const

export default function HomePage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      {/* Hero */}
      <section className="mb-16 text-center lg:mb-24">
        <Badge variant="outline" className="mb-6">
          <Sparkles className="h-3 w-3" strokeWidth={1.5} aria-hidden />
          База знаний для клиентов и партнёров «Инфотех»
        </Badge>
        <h1 className="mx-auto max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Документация по устройствам Инфоскан
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--muted-foreground)]">
          Автоматическое измерение габаритов и веса груза за 1–2 секунды. Три модели —
          3D&nbsp;60, 3D&nbsp;90, Camera — в версиях LITE и PRO. Здесь — всё для сборки,
          настройки и интеграции с вашей WMS.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/01-start/what-is-infoscan">
              С чего начать <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/integration/builder">Конструктор JS-шаблона</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/emulator">Эмулятор устройства</Link>
          </Button>
        </div>
      </section>

      {/* Карточки по ролям */}
      <section className="mb-16 lg:mb-24" aria-labelledby="audience-heading">
        <h2 id="audience-heading" className="mb-2 text-2xl font-bold tracking-tight">
          Выберите свою роль
        </h2>
        <p className="mb-8 text-[var(--muted-foreground)]">
          Каждая дорожка ведёт через нужный набор статей в правильном порядке.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {AUDIENCES.map((a) => {
            const Icon = audienceIcons[a.id]
            return (
              <Card key={a.id} className="group h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[var(--radius-btn)] bg-[var(--color-yellow-brand)] text-[var(--color-black-brand)]">
                    <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                  </div>
                  <CardTitle>Я {a.label.toLowerCase()}</CardTitle>
                  <CardDescription>{a.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
                    {a.id === 'operator' && (
                      <>
                        <li>Запуск устройства за 5 минут</li>
                        <li>Измерение объекта за 3 шага</li>
                        <li>Что делать при ошибке</li>
                      </>
                    )}
                    {a.id === 'admin' && (
                      <>
                        <li>Сборка и подключение к сети</li>
                        <li>Калибровка ЛД и весового датчика</li>
                        <li>Настройка через веб-интерфейс устройства</li>
                      </>
                    )}
                    {a.id === 'developer' && (
                      <>
                        <li>Все 8 типов JS-шаблонов</li>
                        <li>10 транспортов передачи</li>
                        <li>Конструктор + эмулятор для отладки</li>
                      </>
                    )}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/learning-paths/${a.id}`}>
                      Открыть маршрут{' '}
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Модели */}
      <section className="mb-16 lg:mb-24" aria-labelledby="models-heading">
        <h2 id="models-heading" className="mb-2 text-2xl font-bold tracking-tight">
          Модельный ряд
        </h2>
        <p className="mb-8 text-[var(--muted-foreground)]">
          Три модели под разные сценарии. Каждая — в версиях LITE и PRO.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {MODELS.map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <CardTitle>{m.fullName}</CardTitle>
                <CardDescription>
                  {m.technology === 'laser' ? 'Три лазерных датчика' : '3D-камера'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[var(--muted-foreground)]">Диапазон ВГХ</dt>
                    <dd className="text-right">
                      {m.dimensionRange.width[0]}–{m.dimensionRange.height[1]} мм
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--muted-foreground)]">Точность</dt>
                    <dd>{m.dimensionAccuracy}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--muted-foreground)]">Масса груза</dt>
                    <dd>
                      {m.weightRange[0]}–{m.weightRange[1]} кг
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--muted-foreground)]">Скорость</dt>
                    <dd>{m.measurementSpeed}</dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter>
                <Button asChild variant="link" className="px-0">
                  <Link href={`/01-start/compare-models#${m.id}`}>
                    Подробнее <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Разделы документации */}
      <section aria-labelledby="sections-heading">
        <h2 id="sections-heading" className="mb-2 text-2xl font-bold tracking-tight">
          <BookOpen className="mr-2 inline h-6 w-6" strokeWidth={1.5} aria-hidden />
          Разделы документации
        </h2>
        <p className="mb-8 text-[var(--muted-foreground)]">
          От первого включения до тонкой настройки интеграции с WMS.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Link
              key={s.id}
              href={`/${s.id}`}
              className="group flex items-center justify-between rounded-[var(--radius-card)] border bg-[var(--card)] p-4 transition-colors hover:bg-[var(--accent)]"
            >
              <div>
                <div className="text-xs text-[var(--muted-foreground)]">{s.order}</div>
                <div className="font-medium">{s.title}</div>
              </div>
              <ArrowRight
                className="h-5 w-5 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5"
                strokeWidth={1.5}
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
