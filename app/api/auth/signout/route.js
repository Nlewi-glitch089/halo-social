import { NextResponse } from 'next/server'

export async function POST() {
  // Clear the httpOnly halo_token cookie by setting Max-Age=0
  const res = NextResponse.json({ ok: true })
  res.cookies.set('halo_token', '', { path: '/', maxAge: 0 })
  return res
}
