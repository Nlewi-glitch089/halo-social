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
    return NextResponse.json({ signedIn: Boolean(hasToken) })
  } catch (err) {
    return NextResponse.json({ signedIn: false })
  }
}
