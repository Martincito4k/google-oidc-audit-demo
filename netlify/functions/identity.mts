type IdentityUser = {
  id: string
  email?: string
  appMetadata?: Record<string, unknown>
  userMetadata?: Record<string, unknown>
}

type IdentityEvent = { user: IdentityUser }

function audit(eventName: 'login_success' | 'signup_completed', event: IdentityEvent): void {
  const user = event.user
  const userMetadata = user.userMetadata ?? {}
  const fullName = typeof userMetadata.full_name === 'string'
    ? userMetadata.full_name
    : typeof userMetadata.name === 'string' ? userMetadata.name : undefined
  const provider = user.appMetadata?.provider ?? 'unknown'

  // Structured operational audit record. Never include credentials, tokens, or session cookies.
  console.info(JSON.stringify({
    event: eventName,
    occurred_at: new Date().toISOString(),
    event_id: crypto.randomUUID(),
    user_id: user.id,
    email: user.email,
    full_name: fullName,
    provider,
    outcome: 'success',
  }))
}

export default {
  userLogin(event: IdentityEvent) {
    audit('login_success', event)
  },
  userSignup(event: IdentityEvent) {
    audit('signup_completed', event)
  },
}
