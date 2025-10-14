import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const msg = searchParams.get('msg') ?? 'pong'
  return Response.json({ ok: true, method: 'GET', msg })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  return Response.json({ ok: true, method: 'POST', body })
}