"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpPage(){
  const router = useRouter()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pwStrength, setPwStrength] = useState({ score: 0, label: 'Too weak' })
  function assessPassword(pw){
    let score = 0
    if((pw||'').length >= 8) score++
    if(/[A-Z]/.test(pw)) score++
    if(/[0-9]/.test(pw)) score++
    if(/[^A-Za-z0-9]/.test(pw)) score++
    let label = 'Too weak'
    if(score >= 4) label = 'Strong'
    else if(score === 3) label = 'Good'
    else if(score === 2) label = 'Weak'
    return { score, label }
  }
  async function handleSubmit(e){
    e.preventDefault()
    setError('')
    if(!email || !password || !username){
      setError('Please fill required fields')
      return
    }
    setLoading(true)
    try{
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password }),
        credentials: 'include'
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'Sign up failed')
      }
      const data = await res.json()
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

      if (data?.token) {
        try {
          if (typeof document !== 'undefined' && !document.cookie.includes('halo_token=')) {
            document.cookie = `halo_token=${data.token}; path=/; max-age=${60*60*24*7}`
          }
        } catch (e) {}
        try { localStorage.setItem('halo_signed_in', '1') } catch (e) {}
        try { window.dispatchEvent(new CustomEvent('halo:auth', { detail: { signedIn: true } })) } catch (e) {}
        router.push('/feed')
        return
      }

      setError('Sign up succeeded but session cookie not set. Check dev cookies.')
    }catch(err){
      setError(err.message || 'Sign up failed')
    }finally{setLoading(false)}
  }

  return (
    <main>
      <div style={{textAlign:'center',paddingTop:40}}>
        <h1 style={{color:'var(--accent-b)',marginBottom:6}}>Halo</h1>
        <div style={{color:'var(--muted)'}}>Create AI-powered memories</div>
      </div>

      <div className="auth-card">
        <h3>Create Account</h3>
        <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="name">Name</label>
          <input id="name" type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="auth-field">
          <label htmlFor="username">Username</label>
          <input id="username" type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="@username" />
        </div>
        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={e=>{ setPassword(e.target.value); setPwStrength(assessPassword(e.target.value)) }} placeholder="••••••••" />
        </div>

        {error && <div style={{color:'#ffb3b3',marginBottom:8}}>{error}</div>}

        <div className="auth-actions">
          <button className="btn-primary" type="submit" style={{width:'100%',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8}} disabled={loading}>
            {loading ? <span className="spinner" aria-hidden /> : null}
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
          {password && (
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}>
              <div style={{flex:1,height:8,background:'rgba(255,255,255,0.06)',borderRadius:6,overflow:'hidden'}}>
                <div style={{height:8,width:`${(pwStrength.score/4)*100}%`,background: pwStrength.score>=3? 'linear-gradient(90deg,var(--accent-a),var(--accent-b))' : '#9b9b9b'}} />
              </div>
              <div style={{fontSize:12,color:'var(--muted)',minWidth:60,textAlign:'right'}}>{pwStrength.label}</div>
            </div>
          )}
        </div>
      </form>
          <div className="auth-footer">Already have an account? <a href="/signin" style={{color:'var(--accent-a)'}}>Sign in</a></div>
        </div>
    </main>
  )
}
