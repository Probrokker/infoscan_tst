/**
 * Генератор JS-кода jsScriptFinishSend по состоянию конструктора.
 * На выходе — строка с готовым JS, которую можно скопировать в раздел
 * «Алгоритмы» Личного кабинета устройства.
 *
 * Дизайн-решение: генерируем код шаблонами на основе строк (а не AST),
 * потому что выход — на конкретный движок устройства, со своими соглашениями
 * (return-объект с http/tcp/ftp функциями). Шаблоны заточены под примеры из
 * `Инструкция_подключения_и_интеграции_шаблонов_основная.pdf`.
 */
import { MODELS } from '@/lib/constants'
import type {
  BuilderState,
  Transport,
  BodyFormat,
  FieldMapping,
  TargetModel,
} from '../model/schema'

const INDENT = '  '
const NL = '\n'

// ---- Helpers ----

function indent(text: string, level: number): string {
  const pad = INDENT.repeat(level)
  return text
    .split(NL)
    .map((line) => (line.length > 0 ? pad + line : line))
    .join(NL)
}

function jsString(value: string): string {
  return JSON.stringify(value)
}

/**
 * Возвращает правильное имя длины для целевой модели.
 * 3D 60 / 3D 90 → SENSOR.lengthFormat; Camera → SENSOR.depthFormat.
 */
export function lengthVariableFor(model: TargetModel): string {
  const m = MODELS.find((x) => x.id === model)
  return m?.lengthVariable ?? 'SENSOR.lengthFormat'
}

/**
 * Подставляет в source-выражение реальное имя длины (lengthFormat/depthFormat).
 * Внутри конструктора пользователь оперирует абстракцией SENSOR.lengthFormat;
 * при генерации для Camera она автоматически заменяется на SENSOR.depthFormat.
 */
function normalizeSource(source: string, model: TargetModel): string {
  if (model === 'infoscan-camera') {
    return source.replace(/SENSOR\.lengthFormat/g, 'SENSOR.depthFormat')
  }
  return source
}

// ---- Body builders ----

function buildJsonBody(fields: FieldMapping[], model: TargetModel): string {
  if (fields.length === 0) {
    return `return '{}'`
  }
  const parts = fields.map((f) => {
    const src = normalizeSource(f.source, model)
    return `'"${f.targetField}":"' + ${src} + '"'`
  })
  return `return '{' + ${parts.join(' + ",", ')} + '}'`.replace(/ \+ ",", /g, " + ',' + ")
}

function buildXmlBody(fields: FieldMapping[], model: TargetModel, root = 'Measurement'): string {
  if (fields.length === 0) {
    return `return '<${root}/>'`
  }
  const parts = fields.map((f) => {
    const src = normalizeSource(f.source, model)
    return `'<${f.targetField}>' + ${src} + '</${f.targetField}>'`
  })
  return `return '<${root}>' + ${parts.join(' + ')} + '</${root}>'`
}

function buildCsvBody(fields: FieldMapping[], model: TargetModel): string {
  if (fields.length === 0) {
    return `return ''`
  }
  const parts = fields.map((f) => normalizeSource(f.source, model))
  return `return ${parts.join(" + ';' + ")} + '\\n'`
}

function buildCustomBody(template: string): string {
  const trimmed = template.trim()
  if (!trimmed) return `return ''`
  if (trimmed.startsWith('return')) return trimmed
  return `return ${trimmed}`
}

function buildBody(state: BuilderState): string {
  switch (state.bodyFormat) {
    case 'json':
      return buildJsonBody(state.fields, state.targetModel)
    case 'xml':
      return buildXmlBody(state.fields, state.targetModel)
    case 'csv':
      return buildCsvBody(state.fields, state.targetModel)
    case 'custom':
      return buildCustomBody(state.customBodyTemplate)
  }
}

function contentTypeFor(format: BodyFormat): string {
  switch (format) {
    case 'json':
      return 'application/json'
    case 'xml':
      return 'application/xml'
    case 'csv':
      return 'text/csv'
    case 'custom':
      return 'text/plain'
  }
}

// ---- Headers builder ----

function buildHeaders(state: BuilderState): string {
  const lines: string[] = []
  lines.push(`'Accept': ${jsString(contentTypeFor(state.bodyFormat))}`)
  lines.push(`'Content-Type': ${jsString(contentTypeFor(state.bodyFormat))}`)

  if (state.authKind === 'basic' && state.authLogin) {
    const creds = `${state.authLogin}:${state.authPassword}`
    lines.push(`'Authorization': 'Basic ' + HELPER_JS.toBase64(${jsString(creds)})`)
  } else if (state.authKind === 'bearer' && state.bearerToken) {
    lines.push(`'Authorization': 'Bearer ' + ${jsString(state.bearerToken)}`)
  }

  for (const h of state.customHeaders) {
    if (h.key.trim()) {
      lines.push(`${jsString(h.key)}: ${jsString(h.value)}`)
    }
  }

  return `{${NL}${indent(lines.join(',' + NL), 1)}${NL}}`
}

// ---- Resp builder ----

function buildRespForHttp(state: BuilderState): string {
  const statusField = state.successStatusField || 'status'
  const successValue = state.successStatusValue || 'OK'
  const errorMsg = state.errorMessage || 'Ошибка отправки данных'
  const successMsg = state.successBanner || 'Успешно записано'

  const parserLines: string[] = []
  if (state.bodyFormat === 'xml') {
    parserLines.push(`var json = JSON.parse(HELPER_JS.xmlToJson(resp))`)
  } else {
    parserLines.push(`var json = JSON.parse(resp)`)
  }
  parserLines.push(`if (httpCode !== 200) {`)
  parserLines.push(`${INDENT}throw Error('HTTP ' + httpCode + ': ' + ${jsString(errorMsg)})`)
  parserLines.push(`}`)
  parserLines.push(`if (json.${statusField} !== ${jsString(successValue)}) {`)
  parserLines.push(`${INDENT}throw Error(${jsString(errorMsg)} + ' (' + json.${statusField} + ')')`)
  parserLines.push(`}`)
  parserLines.push(`return {`)
  parserLines.push(`${INDENT}banner: BARCODE + ' — ${successMsg}',`)
  parserLines.push(`${INDENT}bannerColor: '#22C55E',`)
  parserLines.push(`${INDENT}comment: ''`)
  parserLines.push(`}`)

  return `function (resp, httpCode) {${NL}${indent(parserLines.join(NL), 1)}${NL}}`
}

function buildRespForTcp(state: BuilderState): string {
  const successMsg = state.successBanner || 'Успешно записано'
  return [
    `function (resp) {`,
    `${INDENT}return {`,
    `${INDENT}${INDENT}banner: BARCODE + ' — ${successMsg}',`,
    `${INDENT}${INDENT}comment: ''`,
    `${INDENT}}`,
    `}`,
  ].join(NL)
}

function buildRespSimple(state: BuilderState): string {
  const successMsg = state.successBanner || 'Готово'
  return [
    `function () {`,
    `${INDENT}return {`,
    `${INDENT}${INDENT}banner: ${jsString(successMsg)},`,
    `${INDENT}${INDENT}comment: ''`,
    `${INDENT}}`,
    `}`,
  ].join(NL)
}

// ---- Transport builders ----

function genHttp(state: BuilderState): string {
  const body = buildBody(state)
  const headers = buildHeaders(state)
  const resp = buildRespForHttp(state)
  return [
    `http: function () {`,
    `${INDENT}return {`,
    `${INDENT}${INDENT}url: ${jsString(state.endpointUrl || 'http://IP-АДРЕС/путь')},`,
    `${INDENT}${INDENT}headers: ${indent(headers, 2).trimStart()},`,
    `${INDENT}${INDENT}body: function () {`,
    `${INDENT}${INDENT}${INDENT}${body}`,
    `${INDENT}${INDENT}},`,
    `${INDENT}${INDENT}resp: ${indent(resp, 2).trimStart()}`,
    `${INDENT}}`,
    `}`,
  ].join(NL)
}

function genHttpOauth(state: BuilderState): string {
  const body = buildBody(state)
  const resp = buildRespForHttp(state)
  return [
    `httpOauth: function () {`,
    `${INDENT}return {`,
    `${INDENT}${INDENT}url: ${jsString(state.endpointUrl || 'http://IP-АДРЕС/путь')},`,
    `${INDENT}${INDENT}auth: {`,
    `${INDENT}${INDENT}${INDENT}url: ${jsString(state.oauthUrl || 'http://IP-АДРЕС/oauth/token')},`,
    `${INDENT}${INDENT}${INDENT}headers: { 'Content-Type': 'application/json' },`,
    `${INDENT}${INDENT}${INDENT}body: function () {`,
    `${INDENT}${INDENT}${INDENT}${INDENT}return {`,
    `${INDENT}${INDENT}${INDENT}${INDENT}${INDENT}client_id: ${jsString(state.oauthClientId)},`,
    `${INDENT}${INDENT}${INDENT}${INDENT}${INDENT}client_secret: ${jsString(state.oauthClientSecret)},`,
    `${INDENT}${INDENT}${INDENT}${INDENT}${INDENT}grant_type: 'client_credentials'`,
    `${INDENT}${INDENT}${INDENT}${INDENT}}`,
    `${INDENT}${INDENT}${INDENT}},`,
    `${INDENT}${INDENT}${INDENT}resp: function (resp) { return resp }`,
    `${INDENT}${INDENT}},`,
    `${INDENT}${INDENT}body: function () {`,
    `${INDENT}${INDENT}${INDENT}${body}`,
    `${INDENT}${INDENT}},`,
    `${INDENT}${INDENT}resp: ${indent(resp, 2).trimStart()}`,
    `${INDENT}}`,
    `}`,
  ].join(NL)
}

function genTcp(state: BuilderState): string {
  const body = buildBody(state)
  const resp = buildRespForTcp(state)
  return [
    `tcp: function () {`,
    `${INDENT}return {`,
    `${INDENT}${INDENT}address: ${jsString(state.endpointUrl || '127.0.0.1:5454')},`,
    `${INDENT}${INDENT}body: function () {`,
    `${INDENT}${INDENT}${INDENT}${body}`,
    `${INDENT}${INDENT}},`,
    `${INDENT}${INDENT}resp: ${indent(resp, 2).trimStart()}`,
    `${INDENT}}`,
    `}`,
  ].join(NL)
}

function genFtpLike(state: BuilderState, key: Transport): string {
  const body = buildBody(state)
  const resp = buildRespSimple(state)
  return [
    `${key}: function () {`,
    `${INDENT}return {`,
    `${INDENT}${INDENT}address: ${jsString(state.endpointUrl || '127.0.0.1:5555')},`,
    `${INDENT}${INDENT}username: ${jsString(state.authLogin)},`,
    `${INDENT}${INDENT}password: ${jsString(state.authPassword)},`,
    `${INDENT}${INDENT}pathDestination: ${jsString('/upload/' + (state.successStatusField || 'measurement') + '.dat')},`,
    `${INDENT}${INDENT}body: function () {`,
    `${INDENT}${INDENT}${INDENT}${body}`,
    `${INDENT}${INDENT}},`,
    `${INDENT}${INDENT}resp: ${indent(resp, 2).trimStart()}`,
    `${INDENT}}`,
    `}`,
  ].join(NL)
}

function genFile(state: BuilderState): string {
  const body = buildBody(state)
  const resp = buildRespSimple(state)
  return [
    `file: function () {`,
    `${INDENT}return {`,
    `${INDENT}${INDENT}pathDestination: '/var/log/infoscan/measurements.log',`,
    `${INDENT}${INDENT}append: true,`,
    `${INDENT}${INDENT}body: function () {`,
    `${INDENT}${INDENT}${INDENT}${body}`,
    `${INDENT}${INDENT}},`,
    `${INDENT}${INDENT}resp: ${indent(resp, 2).trimStart()}`,
    `${INDENT}}`,
    `}`,
  ].join(NL)
}

function genQr(state: BuilderState): string {
  const body = buildBody(state)
  const resp = buildRespSimple(state)
  return [
    `qr: function () {`,
    `${INDENT}return {`,
    `${INDENT}${INDENT}body: function () {`,
    `${INDENT}${INDENT}${INDENT}${body}`,
    `${INDENT}${INDENT}},`,
    `${INDENT}${INDENT}resp: ${indent(resp, 2).trimStart()}`,
    `${INDENT}}`,
    `}`,
  ].join(NL)
}

function genSimple(state: BuilderState): string {
  const resp = buildRespSimple(state)
  return [
    `simple: function () {`,
    `${INDENT}return {`,
    `${INDENT}${INDENT}resp: ${indent(resp, 2).trimStart()}`,
    `${INDENT}}`,
    `}`,
  ].join(NL)
}

function genCapture(state: BuilderState, key: Transport): string {
  const resp = buildRespSimple(state)
  const isFile = key === 'fileCapture'
  const lines: string[] = [`${key}: function () {`, `${INDENT}return {`]
  if (!isFile) {
    lines.push(`${INDENT}${INDENT}address: ${jsString(state.endpointUrl || '127.0.0.1:5555')},`)
    lines.push(`${INDENT}${INDENT}username: ${jsString(state.authLogin)},`)
    lines.push(`${INDENT}${INDENT}password: ${jsString(state.authPassword)},`)
  }
  lines.push(
    `${INDENT}${INDENT}pathDestination: ${jsString('/upload/capture-' + Date.now() + '.jpg')},`,
  )
  lines.push(
    `${INDENT}${INDENT}label: { text: 'BARCODE: ' + BARCODE, pointSize: 20, color: '#FFCE00' },`,
  )
  lines.push(`${INDENT}${INDENT}resp: ${indent(resp, 2).trimStart()}`)
  lines.push(`${INDENT}}`)
  lines.push(`}`)
  return lines.join(NL)
}

// ---- Главный генератор ----

export function generateScript(state: BuilderState): string {
  const header = [
    `/**`,
    ` * jsScript${state.scriptKind === 'jsScriptFinishSend' ? 'FinishSend' : state.scriptKind}`,
    ` * Сгенерирован конструктором Базы знаний Инфоскан.`,
    ` * Целевая модель: ${state.targetModel}`,
    ` * Целевая система: ${state.targetSystem}`,
    ` * Транспорт: ${state.transport}`,
    ` * Формат тела: ${state.bodyFormat}`,
    ` *`,
    ` * Скопируй и вставь в раздел «Алгоритмы» Личного кабинета устройства.`,
    ` */`,
  ].join(NL)

  // Подготовка: если есть SENSOR.lengthFormat, ставим защиту от null.
  const guard = `var num = ${lengthVariableFor(state.targetModel)};${NL}if (num == null) { num = 0 }${NL}`

  let transportBlock: string
  switch (state.transport) {
    case 'http':
      transportBlock = genHttp(state)
      break
    case 'httpOauth':
      transportBlock = genHttpOauth(state)
      break
    case 'tcp':
      transportBlock = genTcp(state)
      break
    case 'ftp':
    case 'ftps':
    case 'ftpes':
    case 'sftp':
      transportBlock = genFtpLike(state, state.transport)
      break
    case 'file':
      transportBlock = genFile(state)
      break
    case 'qr':
      transportBlock = genQr(state)
      break
    case 'simple':
      transportBlock = genSimple(state)
      break
    case 'ftpCapture':
    case 'fileCapture':
    case 'ftpsCapture':
    case 'ftpesCapture':
    case 'sftpCapture':
      transportBlock = genCapture(state, state.transport)
      break
  }

  return [header, '', guard, `return {`, indent(transportBlock, 1), `}`, ''].join(NL)
}

// ---- cURL для теста ----

export function generateCurl(state: BuilderState): string {
  if (state.transport !== 'http' && state.transport !== 'httpOauth') {
    return '# Тестовый запрос вручную: cURL доступен только для http / httpOauth транспортов.'
  }
  const url = state.endpointUrl || 'http://IP-АДРЕС/путь'
  const ct = contentTypeFor(state.bodyFormat)

  const headers: string[] = [`-H "Content-Type: ${ct}"`, `-H "Accept: ${ct}"`]
  if (state.authKind === 'basic' && state.authLogin) {
    headers.push(`-u "${state.authLogin}:${state.authPassword}"`)
  }
  if (state.authKind === 'bearer' && state.bearerToken) {
    headers.push(`-H "Authorization: Bearer ${state.bearerToken}"`)
  }
  for (const h of state.customHeaders) {
    if (h.key.trim()) headers.push(`-H "${h.key}: ${h.value}"`)
  }

  // Пример тела с подставленными значениями
  let body: string
  if (state.bodyFormat === 'json') {
    const obj = Object.fromEntries(
      state.fields.map((f) => [f.targetField, exampleValueFor(f.source)]),
    )
    body = JSON.stringify(obj)
  } else if (state.bodyFormat === 'xml') {
    body =
      '<Measurement>' +
      state.fields
        .map((f) => `<${f.targetField}>${exampleValueFor(f.source)}</${f.targetField}>`)
        .join('') +
      '</Measurement>'
  } else if (state.bodyFormat === 'csv') {
    body = state.fields.map((f) => exampleValueFor(f.source)).join(';')
  } else {
    body = state.customBodyTemplate || ''
  }

  return [
    `# Тестовый запрос (значения SENSOR.* — пример)`,
    `curl -X POST \\`,
    headers.map((h) => `  ${h} \\`).join('\n'),
    `  -d '${body}' \\`,
    `  "${url}"`,
  ].join('\n')
}

function exampleValueFor(source: string): string {
  if (source.includes('weight')) return '12.345'
  if (source.includes('width')) return '400'
  if (source.includes('height')) return '300'
  if (source.includes('length') || source.includes('depth')) return '500'
  if (source.includes('volume')) return '0.060'
  if (source === 'BARCODE') return '4607062470015'
  if (source === 'DEV_CODE') return 'INF-3D90-00042'
  return 'value'
}

// ---- Документация для интегратора ----

export function generateDocumentation(state: BuilderState): string {
  const lines: string[] = []
  lines.push(`# Документация для интегратора`)
  lines.push('')
  lines.push(`## Маппинг полей`)
  lines.push('')
  lines.push(`| Поле в системе | Источник в Инфоскане |`)
  lines.push(`|---|---|`)
  for (const f of state.fields) {
    lines.push(`| \`${f.targetField}\` | \`${normalizeSource(f.source, state.targetModel)}\` |`)
  }
  lines.push('')
  lines.push(`## Эндпоинт`)
  lines.push('')
  lines.push(`- **URL/адрес**: \`${state.endpointUrl}\``)
  lines.push(`- **Транспорт**: \`${state.transport}\``)
  lines.push(`- **Формат тела**: ${state.bodyFormat.toUpperCase()}`)
  if (state.authKind !== 'none') {
    lines.push(`- **Авторизация**: ${state.authKind}`)
  }
  lines.push('')
  lines.push(`## Что должен возвращать сервис`)
  lines.push('')
  lines.push(
    `Поле \`${state.successStatusField}\` со значением \`"${state.successStatusValue}"\` — успех. Иначе шаблон бросит Error.`,
  )
  lines.push('')
  lines.push(`Пример успешного ответа:`)
  lines.push('')
  lines.push('```json')
  lines.push(JSON.stringify({ [state.successStatusField]: state.successStatusValue }, null, 2))
  lines.push('```')
  return lines.join('\n')
}
