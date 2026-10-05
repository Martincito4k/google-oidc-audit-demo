import { getUser, verifyRequestOrigin } from '@netlify/identity'
import type { Context } from '@netlify/functions'

export default async (request: Request, _context: Context) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } })
  }

  try {
    verifyRequestOrigin(request)
  } catch {
    return new Response('Forbidden', { status: 403 })
  }

  const user = await getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  console.info(JSON.stringify({
    event: 'logout',
    occurred_at: new Date().toISOString(),
    event_id: crypto.randomUUID(),
    user_id: user.id,
    email: user.email,
    outcome: 'requested',
  }))

  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
