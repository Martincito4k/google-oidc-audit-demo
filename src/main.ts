import {
  getUser,
  handleAuthCallback,
  logout,
  oauthLogin,
  onAuthChange,
} from '@netlify/identity'
import type { User } from '@netlify/identity'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
let currentUser: User | null = null
let busy = false
let notice = ''

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]!)
}

function displayName(user: User): string {
  const meta = user.userMetadata as Record<string, unknown> | undefined
  const name = meta?.full_name ?? meta?.name
  return typeof name === 'string' && name.trim() ? name : user.email ?? 'Usuario'
}

function render(): void {
  if (busy) {
    app.innerHTML = '<main class="shell"><section class="card loading"><span class="spinner"></span><p>Verificando sesión…</p></section></main>'
    return
  }

  if (currentUser) {
    const name = displayName(currentUser)
    const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase()
    const email = currentUser.email ?? 'Correo no disponible'
    app.innerHTML = `
      <main class="shell">
        <section class="card profile-card" aria-labelledby="welcome-title">
          <div class="brand-mark" aria-hidden="true">id</div>
          <p class="eyebrow">SESIÓN AUTENTICADA</p>
          <h1 id="welcome-title">Hola, ${escapeHtml(name)}</h1>
          <p class="intro">Tu identidad fue validada por Google y la sesión está administrada por Netlify Identity.</p>
          <div class="identity-panel">
            <div class="avatar" aria-hidden="true">${escapeHtml(initials || 'U')}</div>
            <div class="identity-details">
              <span class="detail-label">Nombre</span>
              <strong>${escapeHtml(name)}</strong>
              <span class="detail-label email-label">Correo de la cuenta</span>
              <strong>${escapeHtml(email)}</strong>
            </div>
          </div>
          <div class="id-row"><span>ID interno</span><code>${escapeHtml(currentUser.id)}</code></div>
          ${notice ? `<p class="notice" role="status">${escapeHtml(notice)}</p>` : ''}
          <button class="button button-secondary" id="logout-button" type="button">Cerrar sesión <span aria-hidden="true">↗</span></button>
          <p class="footnote">Cerrar sesión en esta demo no cierra tu cuenta de Google.</p>
        </section>
        <footer>DEMO EDUCATIVA · INICIO DE SESIÓN OIDC</footer>
      </main>`
    document.querySelector<HTMLButtonElement>('#logout-button')?.addEventListener('click', handleLogout)
    return
  }

  app.innerHTML = `
    <main class="shell">
      <section class="card login-card" aria-labelledby="login-title">
        <div class="brand-mark" aria-hidden="true">id</div>
        <p class="eyebrow">IDENTIDAD · DEMO OIDC</p>
        <h1 id="login-title">Una forma segura<br />de dar el primer paso.</h1>
        <p class="intro">Iniciá sesión con Google para acceder a tu espacio personal de prueba.</p>
        <div class="trust-note"><span class="shield" aria-hidden="true">✓</span><span>Solo solicitamos tu identidad básica: nombre y correo.</span></div>
        <button class="button button-google" id="google-button" type="button">
          <svg aria-hidden="true" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.75 7.18l7.73 6C44.43 38.06 46.98 31.9 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.75-4.59l-7.98-6.2A23.8 23.8 0 0 0 0 24c0 3.9.94 7.59 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.2C6.51 42.62 14.62 48 24 48Z"/></svg>
          <span>Continuar con Google</span>
        </button>
        ${notice ? `<p class="notice" role="alert">${escapeHtml(notice)}</p>` : ''}
        <p class="legal">Al continuar, Google confirma tu identidad. Esta demo no accede a tus otros servicios.</p>
      </section>
      <footer>DEMO EDUCATIVA · AUTENTICACIÓN Y TRAZABILIDAD</footer>
    </main>`
  document.querySelector<HTMLButtonElement>('#google-button')?.addEventListener('click', () => {
    notice = ''
    try {
      oauthLogin('google')
    } catch {
      notice = 'No se pudo iniciar el acceso. Verificá que Google esté habilitado en Netlify Identity.'
      render()
    }
  })
}

async function handleLogout(): Promise<void> {
  if (busy) return
  busy = true
  notice = ''
  render()
  try {
    // The function validates the Netlify Identity session before recording this event.
    const response = await fetch('/.netlify/functions/audit-logout', { method: 'POST', credentials: 'same-origin' })
    if (!response.ok) console.warn('Logout audit event was not recorded:', response.status)
  } catch {
    console.warn('Logout audit endpoint was unavailable; continuing with sign-out.')
  }

  try {
    await logout()
    currentUser = null
  } catch {
    notice = 'No pudimos completar el cierre de sesión. Intentá nuevamente.'
  } finally {
    busy = false
    render()
  }
}

async function start(): Promise<void> {
  try {
    const callback = await handleAuthCallback()
    if (callback?.type === 'oauth') notice = 'Inicio de sesión completado.'
    currentUser = await getUser()
  } catch {
    notice = 'No se pudo validar la sesión. Volvé a intentarlo.'
    currentUser = null
  }
  render()
}

onAuthChange((_event, user) => {
  currentUser = user
  render()
})

void start()
