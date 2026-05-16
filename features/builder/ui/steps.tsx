'use client'

/**
 * Все 6 шагов мастера. Каждый шаг — отдельный компонент, делящий состояние
 * через Zustand-store. Поток ItemType/HttpHandler и др. шаблонов в MVP
 * редуцирован до FinishSend — для остальных мастер показывает плашку
 * «Эта ветка в разработке» и предлагает писать руками по справочнику.
 */
import * as React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useBuilderStore } from '../model/store'
import {
  TRANSPORTS,
  SCRIPT_TEMPLATES,
  MODELS,
  TEMPLATE_VARIABLES,
  type TransportId,
} from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Callout } from '@/components/docs/Callout'
import type { TargetSystem, AuthKind, BodyFormat } from '../model/schema'

// ---- Шаг 1: тип шаблона ----

export function StepKind() {
  const { scriptKind, targetModel, update } = useBuilderStore()
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Тип шаблона</h2>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Какой шаблон в разделе «Алгоритмы» вы хотите собрать.
        </p>
      </div>

      <div>
        <Label className="mb-2 block">Целевая модель устройства</Label>
        <Select
          value={targetModel}
          onValueChange={(v) => update({ targetModel: v as typeof targetModel })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите модель" />
          </SelectTrigger>
          <SelectContent>
            {MODELS.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          Для Camera используется <code className="font-mono">SENSOR.depthFormat</code>, для 3D 60 /
          3D 90 — <code className="font-mono">SENSOR.lengthFormat</code>. Конструктор подставит
          правильное имя автоматически.
        </p>
      </div>

      <RadioGroup
        value={scriptKind}
        onValueChange={(v) => update({ scriptKind: v as typeof scriptKind })}
        className="grid gap-3 sm:grid-cols-2"
      >
        {SCRIPT_TEMPLATES.map((t) => (
          <label
            key={t.id}
            htmlFor={`kind-${t.id}`}
            className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border p-4 transition-colors hover:bg-[var(--accent)] has-[:checked]:border-[var(--color-yellow-brand)] has-[:checked]:bg-[var(--accent)]"
          >
            <RadioGroupItem id={`kind-${t.id}`} value={t.id} className="mt-1" />
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-sm text-[var(--muted-foreground)]">{t.purpose}</div>
            </div>
          </label>
        ))}
      </RadioGroup>

      {scriptKind !== 'jsScriptFinishSend' && (
        <Callout kind="info" title="Мастер для этого шаблона — в работе">
          В MVP конструктор полностью покрывает <code>jsScriptFinishSend</code>. Для других шаблонов
          посмотрите справочник в разделе «Интеграция» — там полный синтаксис с примерами.
        </Callout>
      )}
    </div>
  )
}

// ---- Шаг 2: целевая система ----

const TARGET_SYSTEMS: Array<{ id: TargetSystem; name: string; note: string }> = [
  {
    id: '1c',
    name: '1С (УТ / ERP / УПП)',
    note: 'Обычно HTTP-сервис на стороне 1С или Apache+PHP-прослойка.',
  },
  {
    id: 'solvo',
    name: 'Solvo WMS',
    note: 'Поддерживает REST API и SOAP. Уточняйте у Solvo формат для версии.',
  },
  { id: 'axelot', name: 'AXELOT', note: 'HTTP с JSON-телом, аутентификация по токену.' },
  { id: 'manhattan', name: 'Manhattan WMS', note: 'SOAP / XML или REST в зависимости от версии.' },
  {
    id: 'magnit',
    name: 'Магнит (внутренний WMS)',
    note: 'SOAP с заголовками X-Tander-* (есть пример).',
  },
  { id: 'jetloader', name: 'JetLoader', note: 'Партнёрское ПО для загрузки ТС. REST.' },
  { id: 'bpm', name: 'BPM Online', note: 'REST с OAuth 2.0.' },
  { id: 'custom', name: 'Самописная система', note: 'Любой REST/SOAP/TCP.' },
  { id: 'other', name: 'Другое', note: 'Опишите детали в шаге Аутентификация.' },
]

export function StepTargetSystem() {
  const { targetSystem, update } = useBuilderStore()
  const selected = TARGET_SYSTEMS.find((s) => s.id === targetSystem)
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Целевая система</h2>
        <p className="mt-1 text-[var(--muted-foreground)]">Куда отправляем результаты измерений.</p>
      </div>

      <Select
        value={targetSystem}
        onValueChange={(v) => update({ targetSystem: v as TargetSystem })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Выберите систему" />
        </SelectTrigger>
        <SelectContent>
          {TARGET_SYSTEMS.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>{selected.name}</CardTitle>
            <CardDescription>{selected.note}</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}

// ---- Шаг 3: транспорт ----

export function StepTransport() {
  const { transport, update } = useBuilderStore()
  const grouped: Record<string, typeof TRANSPORTS> = {
    http: TRANSPORTS.filter((t) => t.group === 'http'),
    tcp: TRANSPORTS.filter((t) => t.group === 'tcp'),
    file: TRANSPORTS.filter((t) => t.group === 'file'),
    screen: TRANSPORTS.filter((t) => t.group === 'screen'),
    capture: TRANSPORTS.filter((t) => t.group === 'capture'),
  }
  const labels: Record<string, string> = {
    http: 'HTTP',
    tcp: 'TCP',
    file: 'Файловые',
    screen: 'Только экран',
    capture: 'С кадром камеры',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Транспорт</h2>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Как именно устройство передаст результаты измерений.
        </p>
      </div>

      <RadioGroup
        value={transport}
        onValueChange={(v) => update({ transport: v as TransportId })}
        className="space-y-6"
      >
        {Object.entries(grouped).map(([groupKey, group]) => (
          <div key={groupKey}>
            <div className="mb-2 text-xs font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
              {labels[groupKey]}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.map((t) => (
                <label
                  key={t.id}
                  htmlFor={`tr-${t.id}`}
                  className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border p-3 transition-colors hover:bg-[var(--accent)] has-[:checked]:border-[var(--color-yellow-brand)] has-[:checked]:bg-[var(--accent)]"
                >
                  <RadioGroupItem id={`tr-${t.id}`} value={t.id} className="mt-1" />
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-medium">{t.id}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{t.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

// ---- Шаг 4: поля и тело ----

export function StepFields() {
  const { fields, bodyFormat, customBodyTemplate, addField, removeField, updateField, update } =
    useBuilderStore()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Поля и формат тела</h2>
        <p className="mt-1 text-[var(--muted-foreground)]">Что именно отправляем и в каком виде.</p>
      </div>

      <div>
        <Label className="mb-2 block">Формат тела</Label>
        <RadioGroup
          value={bodyFormat}
          onValueChange={(v) => update({ bodyFormat: v as BodyFormat })}
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {(['json', 'xml', 'csv', 'custom'] as const).map((f) => (
            <label
              key={f}
              htmlFor={`fmt-${f}`}
              className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-btn)] border p-2 has-[:checked]:border-[var(--color-yellow-brand)] has-[:checked]:bg-[var(--accent)]"
            >
              <RadioGroupItem id={`fmt-${f}`} value={f} />
              <span className="font-mono text-sm uppercase">{f}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {bodyFormat === 'custom' ? (
        <div>
          <Label htmlFor="custom-body" className="mb-2 block">
            Произвольное тело (JS-выражение для return)
          </Label>
          <Textarea
            id="custom-body"
            value={customBodyTemplate}
            onChange={(e) => update({ customBodyTemplate: e.target.value })}
            placeholder="'Barcode: ' + BARCODE + ', W: ' + SENSOR.widthFormat"
            rows={4}
          />
        </div>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Маппинг полей</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addField({ targetField: '', source: '' })}
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Добавить
            </Button>
          </div>
          {fields.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)]">
              Пока пусто. Добавьте поля, которые хотите передать в WMS.
            </p>
          )}
          <ul className="space-y-2">
            {fields.map((f, i) => (
              <li key={i} className="flex gap-2">
                <Input
                  value={f.targetField}
                  onChange={(e) => updateField(i, { ...f, targetField: e.target.value })}
                  placeholder="Имя поля в WMS, например Width"
                  aria-label={`Имя поля №${i + 1} в WMS`}
                />
                <Select value={f.source} onValueChange={(v) => updateField(i, { ...f, source: v })}>
                  <SelectTrigger className="min-w-[280px]">
                    <SelectValue placeholder="Источник в Инфоскане" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_VARIABLES.filter((v) => v.scope !== 'dynamic').map((v) => (
                      <SelectItem key={v.name} value={v.name}>
                        <span className="font-mono text-xs">{v.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeField(i)}
                  aria-label={`Удалить поле ${f.targetField || i + 1}`}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ---- Шаг 5: аутентификация ----

export function StepAuth() {
  const {
    endpointUrl,
    authKind,
    authLogin,
    authPassword,
    bearerToken,
    oauthUrl,
    oauthClientId,
    oauthClientSecret,
    customHeaders,
    update,
  } = useBuilderStore()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Аутентификация и эндпоинт</h2>
        <p className="mt-1 text-[var(--muted-foreground)]">
          URL/адрес целевого сервиса и тип авторизации.
        </p>
      </div>

      <div>
        <Label htmlFor="endpoint" className="mb-2 block">
          URL / адрес:порт
        </Label>
        <Input
          id="endpoint"
          value={endpointUrl}
          onChange={(e) => update({ endpointUrl: e.target.value })}
          placeholder="https://api.example.ru/measurements"
        />
      </div>

      <div>
        <Label className="mb-2 block">Тип авторизации</Label>
        <RadioGroup
          value={authKind}
          onValueChange={(v) => update({ authKind: v as AuthKind })}
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {(['none', 'basic', 'bearer', 'oauth2'] as const).map((k) => (
            <label
              key={k}
              htmlFor={`auth-${k}`}
              className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-btn)] border p-2 has-[:checked]:border-[var(--color-yellow-brand)] has-[:checked]:bg-[var(--accent)]"
            >
              <RadioGroupItem id={`auth-${k}`} value={k} />
              <span className="text-sm">{k.toUpperCase()}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {authKind === 'basic' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="auth-login" className="mb-2 block">
              Логин
            </Label>
            <Input
              id="auth-login"
              value={authLogin}
              onChange={(e) => update({ authLogin: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="auth-password" className="mb-2 block">
              Пароль
            </Label>
            <Input
              id="auth-password"
              type="password"
              value={authPassword}
              onChange={(e) => update({ authPassword: e.target.value })}
            />
          </div>
        </div>
      )}

      {authKind === 'bearer' && (
        <div>
          <Label htmlFor="bearer" className="mb-2 block">
            Bearer-токен (для теста; в продакшене подставляется через HELPER_JS)
          </Label>
          <Input
            id="bearer"
            value={bearerToken}
            onChange={(e) => update({ bearerToken: e.target.value })}
            placeholder="eyJhbGciOi..."
          />
        </div>
      )}

      {authKind === 'oauth2' && (
        <div className="grid gap-3">
          <div>
            <Label htmlFor="oauth-url" className="mb-2 block">
              URL получения токена
            </Label>
            <Input
              id="oauth-url"
              value={oauthUrl}
              onChange={(e) => update({ oauthUrl: e.target.value })}
              placeholder="https://api.example.ru/oauth/token"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="oauth-id" className="mb-2 block">
                Client ID
              </Label>
              <Input
                id="oauth-id"
                value={oauthClientId}
                onChange={(e) => update({ oauthClientId: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="oauth-secret" className="mb-2 block">
                Client Secret
              </Label>
              <Input
                id="oauth-secret"
                type="password"
                value={oauthClientSecret}
                onChange={(e) => update({ oauthClientSecret: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Кастомные заголовки</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => update({ customHeaders: [...customHeaders, { key: '', value: '' }] })}
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Добавить
          </Button>
        </div>
        {customHeaders.map((h, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <Input
              value={h.key}
              placeholder="X-Header-Name"
              onChange={(e) => {
                const next = [...customHeaders]
                const current = next[i]
                if (!current) return
                next[i] = { key: e.target.value, value: current.value }
                update({ customHeaders: next })
              }}
            />
            <Input
              value={h.value}
              placeholder="value"
              onChange={(e) => {
                const next = [...customHeaders]
                const current = next[i]
                if (!current) return
                next[i] = { key: current.key, value: e.target.value }
                update({ customHeaders: next })
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => update({ customHeaders: customHeaders.filter((_, idx) => idx !== i) })}
              aria-label="Удалить заголовок"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </Button>
          </div>
        ))}
      </div>

      <Callout kind="warning" title="Секреты — только в .env">
        Этот конструктор хранит введённые значения только в вашем браузере (localStorage). Не
        вставляйте сюда боевые токены — используйте подмену через переменные окружения и шаблон{' '}
        <code className="font-mono">Authorization: &apos;Bearer &apos; + HELPER_JS...</code>.
      </Callout>
    </div>
  )
}

// ---- Шаг 6: обработка ответа ----

export function StepResp() {
  const { successStatusField, successStatusValue, errorMessage, successBanner, update } =
    useBuilderStore()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Обработка ответа</h2>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Как шаблон проверит ответ сервиса и что покажет оператору.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="status-field" className="mb-2 block">
            Имя поля статуса в ответе
          </Label>
          <Input
            id="status-field"
            value={successStatusField}
            onChange={(e) => update({ successStatusField: e.target.value })}
            placeholder="status"
          />
        </div>
        <div>
          <Label htmlFor="status-value" className="mb-2 block">
            Успешное значение
          </Label>
          <Input
            id="status-value"
            value={successStatusValue}
            onChange={(e) => update({ successStatusValue: e.target.value })}
            placeholder="OK"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="success-banner" className="mb-2 block">
          Баннер успеха (показывается на экране устройства)
        </Label>
        <Input
          id="success-banner"
          value={successBanner}
          onChange={(e) => update({ successBanner: e.target.value })}
          placeholder="Успешно записано"
        />
      </div>

      <div>
        <Label htmlFor="error-msg" className="mb-2 block">
          Текст ошибки
        </Label>
        <Input
          id="error-msg"
          value={errorMessage}
          onChange={(e) => update({ errorMessage: e.target.value })}
          placeholder="Ошибка отправки данных"
        />
      </div>
    </div>
  )
}
