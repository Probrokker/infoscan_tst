// Health endpoint для Docker healthcheck и nginx upstream-check.
// Возвращает простой JSON. Подключение к БД проверяется отдельным флагом
// (на шаге 1 ещё нет Prisma — будет добавлено на шаге 2).

export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json(
    {
      status: 'ok',
      service: 'infoscan-docs',
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
