'use client'

/**
 * BuilderApp — корневой компонент мастера. Связывает индикатор шагов,
 * сами шаги, навигацию и блок результата.
 */
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { useBuilderStore } from '../model/store'
import { StepIndicator } from './StepIndicator'
import { StepKind, StepTargetSystem, StepTransport, StepFields, StepAuth, StepResp } from './steps'
import { Result } from './Result'
import { Button } from '@/components/ui/button'
import { TOTAL_STEPS } from '../model/schema'

export function BuilderApp() {
  const { step, next, prev, setStep, reset } = useBuilderStore()

  const stepComponent = (() => {
    switch (step) {
      case 1:
        return <StepKind />
      case 2:
        return <StepTargetSystem />
      case 3:
        return <StepTransport />
      case 4:
        return <StepFields />
      case 5:
        return <StepAuth />
      case 6:
        return <StepResp />
      default:
        return <StepKind />
    }
  })()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Конструктор JS-шаблона</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Соберите шаблон для раздела «Алгоритмы» Личного кабинета устройства за 6 шагов.
        </p>
      </div>

      <div className="mb-8">
        <StepIndicator current={step} onJump={setStep} />
      </div>

      <section aria-live="polite" aria-atomic="false" className="mb-8">
        {stepComponent}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={reset} aria-label="Сбросить весь мастер">
          <RotateCcw className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Сбросить
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={prev} disabled={step === 1}>
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Назад
          </Button>
          {step < TOTAL_STEPS ? (
            <Button onClick={next}>
              Далее <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </Button>
          ) : (
            <Button asChild>
              <a href="#result">К результату</a>
            </Button>
          )}
        </div>
      </div>

      <div id="result" className="scroll-mt-20">
        <Result />
      </div>
    </div>
  )
}
