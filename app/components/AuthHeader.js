"use client"
import React, { useEffect, useState } from 'react'
import SharedGradient from './SharedGradient'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function AuthHeader({ initialSignedIn = false }){
  const pathname = usePathname()
  const isAuthRoute = pathname && (pathname.startsWith('/signup') || pathname.startsWith('/signin'))
  const isHome = pathname === '/' || pathname === '' || pathname == null
  const isIntroPage = isHome || pathname?.startsWith('/why') || pathname?.startsWith('/features') || pathname?.startsWith('/about') || pathname?.startsWith('/docs')
  // Use the server-provided `initialSignedIn` value for the initial state so
  // server-rendered HTML matches the client on first paint. Client-side
  // effects will reconcile `localStorage`/cookie state after hydration.
  const [signedIn, setSignedIn] = useState(initialSignedIn ? true : null)
  const router = useRouter()
  const [serverSession, setServerSession] = useState(null)

  useEffect(()=>{
    try {
      const fromStorage = Boolean(localStorage.getItem('halo_signed_in'))
      if (fromStorage) {
        // reflect the client-side hint immediately to avoid UI flicker,
        // but do NOT short-circuit the server session probe — we must
        // validate the cookie/token with the server so the UI and server
        // stay consistent (prevents 401s when the token is expired/cleared).
        setSignedIn(true)
      }
      // quick client-side cookie check fallback (helps in some dev envs)
      try {
        if (typeof document !== 'undefined' && document.cookie && document.cookie.includes('halo_token=')) {
          try { localStorage.setItem('halo_signed_in', '1') } catch(e){}
          setSignedIn(true)
          return
        }
      } catch (e) {}
      // If localStorage doesn't indicate signed-in, probe server session cookie
      async function checkSession(){
        try {
          const res = await fetch('/api/auth/session', { credentials: 'include' })
          if (res.ok) {
            const j = await res.json()
            if (j?.signedIn) {
              try { localStorage.setItem('halo_signed_in', '1') } catch(e){}
              setSignedIn(true)
              setServerSession(true)
              return
            }
          }
        } catch (e) {}
        // server does not consider this client signed in — clear client hint
        try { localStorage.removeItem('halo_signed_in') } catch(e) {}
        setServerSession(false)
        setSignedIn(false)
      }
      checkSession()
    } catch(e) { setSignedIn(Boolean(initialSignedIn)) }
    function onStorage(e){ if(e.key === 'halo_signed_in') setSignedIn(Boolean(e.newValue)) }
    function onAuthEvent(e){
      try { const v = e?.detail?.signedIn; setSignedIn(Boolean(v)) } catch (err) { setSignedIn(true) }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('halo:auth', onAuthEvent)
    return ()=>{
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('halo:auth', onAuthEvent)
    }
  },[])

  if(isAuthRoute) return null

  async function handleSignOut(e){
    e.preventDefault()
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch (err) {}
    try { localStorage.removeItem('halo_signed_in') } catch(e) {}
    setSignedIn(false)
    router.push('/signin')
  }

  return (
    <>
      <SharedGradient />
      <header className="nav">
        <div className="container nav-inner">
          <div className="logo">Halo</div>
          <nav style={{display:'flex',gap:18,alignItems:'center'}}>
            {/* Left-side nav: hide during unknown (null) to avoid flicker. */}
            {signedIn === null ? null : signedIn ? (
              <div className="nav-links">
                <Link href="/feed">Feed</Link>
                <Link href="/create">Create</Link>
                <Link href="/profile">Profile</Link>
              </div>
            ) : (
              <div className="nav-links">
                <Link href="/">Home</Link>
                <Link href="/why">Why</Link>
                <Link href="/features">Features</Link>
                <Link href="/about">About</Link>
              </div>
            )}

            <div style={{marginLeft:12,display:'flex',gap:12,alignItems:'center'}}>
              {signedIn === null ? (
                // unknown yet during hydration — render nothing for actions to avoid flicker
                null
              ) : signedIn ? (
                // Signed in: show sign out action on the right
                <>
                  <a href="#" onClick={handleSignOut} className="nav-link" style={{color:'var(--muted)'}}>Sign out</a>
                </>
              ) : (
                // Not signed in: show Sign in / Sign up actions on the right
                // Hide auth actions on intro pages because the CTA there already links to signup.
                isIntroPage ? null : (
                  <>
                    <Link href="/signin" className="nav-link">Sign in</Link>
                    <Link href="/signup" className="btn btn-sm nav-cta" style={{background:'linear-gradient(90deg,#a4508b,#f7368e)',color:'#fff'}}>Sign up</Link>
                  </>
                )
              )}
            </div>
            {/* debug badges removed for production-like UI */}
          </nav>
        </div>
      </header>
    </>
  )
}
