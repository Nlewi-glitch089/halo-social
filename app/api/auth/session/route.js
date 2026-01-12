import { NextResponse } from 'next/server'
import { cookies as nextCookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = typeof nextCookies === 'function' ? nextCookies() : nextCookies
    let hasToken = false
    if (cookieStore) {
      if (typeof cookieStore.get === 'function') {
        hasToken = Boolean(cookieStore.get('halo_token')?.value)
      } else if (typeof cookieStore.getAll === 'function') {
        hasToken = Boolean(cookieStore.getAll().find(c => c.name === 'halo_token')?.value)
      } else {
        hasToken = Boolean(cookieStore['halo_token']?.value ?? cookieStore['halo_token'])
      }
    }
    // If a token exists, try to confirm it exists in the DB (if configured) or in-memory tokens
    if (hasToken) {
      const cookieVal = (typeof cookieStore.get === 'function') ? cookieStore.get('halo_token')?.value : (cookieStore['halo_token']?.value ?? cookieStore['halo_token'])
      if (cookieVal) {
        // Try DB validation first
        try {
          const { getPrisma } = await import('../../../../lib/prismaClient.mjs')
          const prisma = await getPrisma()
          const t = await prisma.token.findUnique({ where: { token: cookieVal } }).catch(()=>null)
          if (t) return NextResponse.json({ signedIn: true })
        } catch (e) {
          // ignore and try in-memory below
        }
        // Fallback: check in-memory tokens map (dev)
        try {
          const tokens = global.__halo_tokens ||= new Map()
          if (tokens.get(cookieVal)) return NextResponse.json({ signedIn: true })
        } catch (e) {}
      }
    }
    return NextResponse.json({ signedIn: false })
  } catch (err) {
    return NextResponse.json({ signedIn: false })
  }
}
