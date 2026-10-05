import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

type IdentityUser = {
  id: string
  email?: string
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const { user } = JSON.parse(event.body || '{}') as { user: IdentityUser }

  console.info(JSON.stringify({
    event: 'login_success',
    occurred_at: new Date().toISOString(),
    event_id: crypto.randomUUID(),
    user_id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name,
    provider: user.app_metadata?.provider ?? 'unknown',
    outcome: 'success',
  }))

  return { statusCode: 200, body: '' }
}

export { handler }
