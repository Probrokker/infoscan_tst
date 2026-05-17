/**
 * Sub-layout для /admin/login.
 * Перекрывает родительский AdminShell — на странице логина нет смысла
 * показывать админскую шапку и навигацию.
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
