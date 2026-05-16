/**
 * Тесты генератора JS-кода шаблона. Главное — что выход парсится JS-движком
 * и что для модели Camera имя длины правильно заменяется на depthFormat.
 */
import { describe, it, expect } from 'vitest'
import { generateScript } from '@/features/builder/lib/generator'
import type { BuilderState } from '@/features/builder/model/schema'

const baseState: BuilderState = {
  step: 6,
  scriptKind: 'jsScriptFinishSend',
  targetModel: 'infoscan-3d-90',
  targetSystem: '1c',
  transport: 'http',
  bodyFormat: 'json',
  fields: [
    { targetField: 'Width', source: 'SENSOR.widthFormat' },
    { targetField: 'Length', source: 'SENSOR.lengthFormat' },
    { targetField: 'Weight', source: 'SENSOR.weightFormat' },
    { targetField: 'Barcode', source: 'BARCODE' },
  ],
  customBodyTemplate: '',
  endpointUrl: 'https://wms.example.ru/api',
  authKind: 'basic',
  authLogin: 'user',
  authPassword: 'pass',
  bearerToken: '',
  oauthUrl: '',
  oauthClientId: '',
  oauthClientSecret: '',
  customHeaders: [],
  successStatusField: 'status',
  successStatusValue: 'OK',
  errorMessage: 'Ошибка',
  successBanner: 'Готово',
}

describe('script generator', () => {
  it('для 3D 90 использует SENSOR.lengthFormat', () => {
    const script = generateScript(baseState)
    expect(script).toContain('SENSOR.lengthFormat')
    expect(script).not.toContain('SENSOR.depthFormat')
  })

  it('для Camera подменяет lengthFormat на depthFormat', () => {
    const cameraState: BuilderState = { ...baseState, targetModel: 'infoscan-camera' }
    const script = generateScript(cameraState)
    expect(script).toContain('SENSOR.depthFormat')
    expect(script).not.toContain('SENSOR.lengthFormat')
  })

  it('сгенерированный шаблон парсится JS-движком', () => {
    const script = generateScript(baseState)
    expect(() => new Function('SENSOR', 'BARCODE', 'HELPER_JS', script)).not.toThrow()
  })

  it('для XML формирует SOAP-стиль', () => {
    const xmlState: BuilderState = { ...baseState, bodyFormat: 'xml' }
    const script = generateScript(xmlState)
    expect(script).toContain('<Width>')
    expect(script).toContain('</Measurement>')
  })

  it('для Basic-auth вставляет HELPER_JS.toBase64', () => {
    const script = generateScript(baseState)
    expect(script).toContain('HELPER_JS.toBase64')
    expect(script).toContain('Basic')
  })

  it('для TCP-транспорта меняет http на tcp', () => {
    const tcpState: BuilderState = { ...baseState, transport: 'tcp' }
    const script = generateScript(tcpState)
    expect(script).toContain('tcp: function')
    expect(script).not.toContain('http: function')
  })
})
