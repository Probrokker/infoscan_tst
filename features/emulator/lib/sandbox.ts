/**
 * Исполнение JS-шаблона из конструктора в изолированной iframe-песочнице.
 * Никакого eval/Function в основном контексте — это нужно, чтобы оставить
 * CSP без unsafe-eval (см. CSP-исключение для /emulator в nginx.conf:
 * там разрешён `wasm-unsafe-eval`, но не unsafe-eval).
 *
 * Дизайн:
 * - Создаём iframe с sandbox="allow-scripts" (БЕЗ allow-same-origin),
 *   srcdoc — небольшой HTML, который слушает postMessage от родителя.
 * - В песочнице делаем безопасный wrapper: подменяем глобальные SENSOR/BARCODE/HELPER_JS
 *   стабами, оборачиваем код пользователя в new Function — здесь это допустимо,
 *   так как iframe изолирован.
 * - Результат отправляется обратно через postMessage. У песочницы нет network,
 *   нет доступа к родительскому DOM, нет localStorage.
 */

export interface SandboxContext {
  barcode: string
  additionalBarcodes: string[]
  devCode: string
  uniqueIndexHistory: number
  sensor: {
    widthFormat: string
    heightFormat: string
    lengthFormat: string
    depthFormat: string
    weightFormat: string
    volumeFormat: string
    widthUnit: string
    heightUnit: string
    lengthUnit: string
    depthUnit: string
    weightUnit: string
    volumeUnit: string
  }
}

export interface SandboxResult {
  ok: boolean
  /** Сериализованное тело запроса (то, что вернёт body()). */
  body?: string
  /** Цель отправки (url / address / pathDestination — что есть в шаблоне). */
  target?: string
  /** Метод транспорта, выявленный из объекта шаблона. */
  method?: string
  /** Ошибка исполнения. */
  error?: string
}

const SRC_DOC = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Infoscan Sandbox</title></head>
<body>
<script>
  // В этой среде мы изолированы от родителя (sandbox без allow-same-origin).
  // Отправляем результаты через postMessage(*, '*'), родитель проверяет source.

  function safeStringify(v) {
    try { return typeof v === 'string' ? v : JSON.stringify(v) } catch (e) { return String(v) }
  }

  function buildContext(ctx) {
    var SENSOR = {
      width: parseFloat(ctx.sensor.widthFormat) || 0,
      height: parseFloat(ctx.sensor.heightFormat) || 0,
      length: parseFloat(ctx.sensor.lengthFormat) || 0,
      widthFormat: ctx.sensor.widthFormat,
      heightFormat: ctx.sensor.heightFormat,
      lengthFormat: ctx.sensor.lengthFormat,
      depthFormat: ctx.sensor.depthFormat,
      weightFormat: ctx.sensor.weightFormat,
      volumeFormat: ctx.sensor.volumeFormat,
      widthUnit: ctx.sensor.widthUnit,
      heightUnit: ctx.sensor.heightUnit,
      lengthUnit: ctx.sensor.lengthUnit,
      depthUnit: ctx.sensor.depthUnit,
      weightUnit: ctx.sensor.weightUnit,
      volumeUnit: ctx.sensor.volumeUnit,
      ready: true
    };
    var HELPER_JS = {
      toBase64: function (s) { return btoa(unescape(encodeURIComponent(s))) },
      xmlToJson: function (xml) { return JSON.stringify({ _raw: xml }) },
      xmlXPath: function (xml, path) { return '' }
    };
    var GLOBAL_VAR = {
      _store: {},
      store: function () { return GLOBAL_VAR._store },
      storeGet: function (k) { return GLOBAL_VAR._store[k] },
      storePut: function (k, v) { GLOBAL_VAR._store[k] = v },
      storeRemove: function (k) { delete GLOBAL_VAR._store[k] },
      storeClearAll: function () { GLOBAL_VAR._store = {} }
    };
    return {
      SENSOR: SENSOR,
      BARCODE: ctx.barcode,
      ADDITIONAL_BARCODES: ctx.additionalBarcodes,
      DEV_CODE: ctx.devCode,
      UNIQUE_INDEX_HISTORY: ctx.uniqueIndexHistory,
      HELPER_JS: HELPER_JS,
      GLOBAL_VAR: GLOBAL_VAR
    };
  }

  function execute(code, ctx) {
    var c = buildContext(ctx);
    try {
      var fn = new Function('SENSOR', 'BARCODE', 'ADDITIONAL_BARCODES', 'DEV_CODE',
        'UNIQUE_INDEX_HISTORY', 'HELPER_JS', 'GLOBAL_VAR', code);
      var result = fn(c.SENSOR, c.BARCODE, c.ADDITIONAL_BARCODES, c.DEV_CODE,
        c.UNIQUE_INDEX_HISTORY, c.HELPER_JS, c.GLOBAL_VAR);
      if (!result || typeof result !== 'object') {
        return { ok: false, error: 'Шаблон должен возвращать объект с http/tcp/ftp/... ключами.' };
      }
      var methodKey = Object.keys(result).find(function (k) {
        return typeof result[k] === 'function';
      });
      if (!methodKey) {
        return { ok: false, error: 'Объект-результат не содержит транспортных функций.' };
      }
      var transport = result[methodKey]();
      var body = '';
      try {
        body = typeof transport.body === 'function' ? safeStringify(transport.body()) : '';
      } catch (e) {
        return { ok: false, error: 'Ошибка в body(): ' + e.message };
      }
      var target = transport.url || transport.address || transport.pathDestination || '';
      return { ok: true, method: methodKey, target: target, body: body };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.type !== 'INFOSCAN_RUN') return;
    var result = execute(data.code, data.context);
    window.parent.postMessage(
      { type: 'INFOSCAN_RESULT', requestId: data.requestId, result: result },
      '*'
    );
  });

  // Сигнал готовности
  window.parent.postMessage({ type: 'INFOSCAN_READY' }, '*');
</script>
</body>
</html>`

/**
 * Класс-обёртка над iframe. Принимает код шаблона, контекст SENSOR и т.п.,
 * возвращает обещание с результатом.
 */
export class TemplateSandbox {
  private iframe: HTMLIFrameElement | null = null
  private readyPromise: Promise<void>
  private readyResolve: (() => void) | null = null
  private pending = new Map<string, (result: SandboxResult) => void>()
  private destroyed = false

  constructor(container: HTMLElement) {
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve
    })

    const iframe = document.createElement('iframe')
    iframe.setAttribute('sandbox', 'allow-scripts')
    iframe.setAttribute('referrerpolicy', 'no-referrer')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.style.position = 'absolute'
    iframe.style.visibility = 'hidden'
    iframe.srcdoc = SRC_DOC
    container.appendChild(iframe)
    this.iframe = iframe

    window.addEventListener('message', this.onMessage)
  }

  private onMessage = (event: MessageEvent) => {
    if (this.destroyed) return
    if (event.source !== this.iframe?.contentWindow) return
    const data = event.data as { type: string; requestId?: string; result?: SandboxResult }
    if (data.type === 'INFOSCAN_READY') {
      this.readyResolve?.()
      return
    }
    if (data.type === 'INFOSCAN_RESULT' && data.requestId) {
      const resolver = this.pending.get(data.requestId)
      if (resolver && data.result) {
        this.pending.delete(data.requestId)
        resolver(data.result)
      }
    }
  }

  async run(code: string, context: SandboxContext): Promise<SandboxResult> {
    if (this.destroyed) {
      return { ok: false, error: 'Песочница уничтожена' }
    }
    await this.readyPromise
    if (!this.iframe?.contentWindow) {
      return { ok: false, error: 'iframe недоступен' }
    }
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const promise = new Promise<SandboxResult>((resolve) => {
      this.pending.set(requestId, resolve)
    })
    this.iframe.contentWindow.postMessage({ type: 'INFOSCAN_RUN', requestId, code, context }, '*')

    // Таймаут на исполнение (защита от бесконечного цикла в шаблоне).
    return Promise.race([
      promise,
      new Promise<SandboxResult>((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: false,
              error: 'Таймаут исполнения шаблона (5 сек). Проверьте циклы и сетевые вызовы.',
            }),
          5000,
        ),
      ),
    ])
  }

  destroy() {
    this.destroyed = true
    window.removeEventListener('message', this.onMessage)
    this.iframe?.remove()
    this.iframe = null
    this.pending.clear()
  }
}
