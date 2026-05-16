import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Интеграция',
  description: 'JS-шаблоны, транспорты, аутентификация, примеры с 1С / SOAP / самописным API',
}

const ARTICLES = [{'slug': 'action', 'title': 'Шаблоны jsScriptAction и InfoscanPage', 'desc': 'Кастомные кнопки на главном экране и конфигурация главного экрана'}, {'slug': 'architecture', 'title': 'Архитектура интеграции', 'desc': 'Как Инфоскан общается с WMS — модель JS-шаблонов и переменных среды'}, {'slug': 'auth', 'title': 'Аутентификация', 'desc': 'Basic, Bearer, OAuth 2.0 — какие способы авторизации поддерживает Инфоскан и как их подключить'}, {'slug': 'auth-mode', 'title': 'Шаблон jsScriptAuthMode', 'desc': 'Режимы авторизации сотрудника — по ШК, через HTTP, по RFID'}, {'slug': 'error-handling', 'title': 'Обработка ошибок (resp)', 'desc': 'Как корректно обрабатывать ответы WMS, показывать ошибки оператору и не терять измерения'}, {'slug': 'example-1c', 'title': 'Пример интеграции с 1С', 'desc': 'Шаблон отправки измерений в 1С: УТ через HTTP-сервис с Basic-авторизацией'}, {'slug': 'example-custom', 'title': 'Пример: интеграция с самописным API', 'desc': 'Полный сценарий — Item Type + FinishSend + ScriptScheduler с очередью отложенной отправки'}, {'slug': 'example-magnit', 'title': 'Пример SOAP/XML интеграции', 'desc': 'Шаблон отправки в системы с SOAP-интерфейсом — на примере крупного ретейлера'}, {'slug': 'finish-send', 'title': 'Шаблон jsScriptFinishSend', 'desc': 'Полный разбор главного шаблона интеграции — отправка результатов после измерения'}, {'slug': 'history-sensor', 'title': 'Шаблон jsScriptHistorySensor', 'desc': 'Структурирование данных истории измерений на устройстве'}, {'slug': 'http-handler', 'title': 'Шаблон jsScriptHttpHandler', 'desc': 'HTTP-обработчик для вспомогательных запросов — получение справочников, проверка ШК, аутентификация'}, {'slug': 'item-type', 'title': 'Шаблон jsScriptItemType', 'desc': 'Дополнительные экраны до измерения — выбор типа упаковки, ввод количества, доп. сканирование, подтверждение'}, {'slug': 'runtime', 'title': 'Среда выполнения JS-шаблонов', 'desc': 'Полный справочник переменных и хелперов, доступных внутри jsScript-шаблонов'}, {'slug': 'script-scheduler', 'title': 'Шаблон ScriptScheduler', 'desc': 'Запуск скриптов по расписанию — синхронизация справочников, отложенная отправка, ночные задачи'}, {'slug': 'transports', 'title': 'Транспорты передачи', 'desc': 'Все 15 транспортов Finish Send — http, tcp, ftp/ftps/ftpes/sftp, file, qr, simple и capture-варианты'}]

export default function SectionIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          <BookOpen className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Раздел
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Интеграция</h1>
        <p className="mt-3 text-lg text-[var(--muted-foreground)]">JS-шаблоны, транспорты, аутентификация, примеры с 1С / SOAP / самописным API</p>
      </header>
      <ol className="space-y-3">
        {ARTICLES.map((a) => (
          <li key={a.slug} className="rounded-[var(--radius-card)] border transition-colors hover:bg-[var(--accent)]">
            <Link href={`/06-integration/${a.slug}`} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <h2 className="font-medium">{a.title}</h2>
                {a.desc && <p className="mt-1 text-sm text-[var(--muted-foreground)]">{a.desc}</p>}
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--muted-foreground)]" strokeWidth={1.5} aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
