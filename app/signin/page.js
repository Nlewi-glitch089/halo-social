"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignInPage(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e){
    e.preventDefault()
    setError('')
    if(!email || !password){
      setError('Please enter email and password')
      return
    }
    setLoading(true)
    try{
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'Sign in failed')
      }
      const data = await res.json()
      // If server didn't set an httpOnly cookie (dev), fall back to client-side cookie set so UI can update.
      try {
        const s = await fetch('/api/auth/session', { credentials: 'include' })
        const sj = await s.json().catch(()=>({ signedIn: false }))
        if (sj.signedIn) {
          try { localStorage.setItem('halo_signed_in', '1') } catch (e) {}
          try { window.dispatchEvent(new CustomEvent('halo:auth', { detail: { signedIn: true } })) } catch (e) {}
          router.push('/feed')
          return
        }
      } catch (e) {}

      // Server didn't set cookie or session probe failed — use token from response (dev fallback)
      if (data?.token) {
        try {
          if (typeof document !== 'undefined' && !document.cookie.includes('halo_token=')) {
            // set a non-httpOnly cookie for dev so header detection works
            document.cookie = `halo_token=${data.token}; path=/; max-age=${60*60*24*7}`
          }
        } catch (e) {}
        try { localStorage.setItem('halo_signed_in', '1') } catch (e) {}
        try { window.dispatchEvent(new CustomEvent('halo:auth', { detail: { signedIn: true } })) } catch (e) {}
        router.push('/feed')
        return
      }

      setError('Sign in succeeded but session cookie not set. Check dev cookies.')
    }catch(err){
      setError(err.message || 'Sign in failed')
    }finally{setLoading(false)}
  }

  return (
    <main>
      <div style={{textAlign:'center',paddingTop:40}}>
        <h1 style={{color:'var(--accent-b)',marginBottom:6}}>Halo</h1>
        <div style={{color:'var(--muted)'}}>Create AI-powered memories</div>
      </div>

      <div className="auth-card">
        <h3>Welcome Back</h3>
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <div style={{color:'#ffb3b3',marginBottom:8}}>{error}</div>}

          <div className="auth-actions">
            <button className="btn-primary" type="submit" style={{width:'100%',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8}} disabled={loading}>
              {loading ? <span className="spinner" aria-hidden /> : null}
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            <div style={{fontSize:13,color:'var(--muted)'}} className="auth-footer">Don't have an account? <Link href="/signup">Sign up</Link></div>
          </div>
        </form>
      </div>
    </main>
  )
}
