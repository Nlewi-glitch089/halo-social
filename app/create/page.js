"use client"
import React, { useState, useEffect } from 'react'
import Toast from '../components/Toast'

export default function CreatePage(){
  const [filePreview, setFilePreview] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [generated, setGenerated] = useState(null)
  const [loading, setLoading] = useState(false)
  const [consent, setConsent] = useState(false)
  const [message, setMessage] = useState(null)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [cooldownSec, setCooldownSec] = useState(0)
  useCooldownTimer(cooldownUntil, setCooldownSec)

  function handleFile(e){
    const f = e.target.files && e.target.files[0]
    if(!f) return setFilePreview(null)
    const url = URL.createObjectURL(f)
    setFilePreview({ url, file: f })
  }

  async function handleGenerate(){
    setMessage(null)
    if (!consent) return setMessage('Please confirm consent to generate images from photos.')
    setLoading(true)
    try{
      // convert file to base64 data URL if provided
      let imageBase64 = null
      if (filePreview && filePreview.file) {
        imageBase64 = await new Promise((res, rej) => {
          const fr = new FileReader()
          fr.onload = () => res(fr.result)
          fr.onerror = rej
          fr.readAsDataURL(filePreview.file)
        })
      }

      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, prompt, consent: true })
      })
      const genJson = await genRes.json()
      if (!genRes.ok) {
        if (genRes.status === 429) {
          const retryAfter = Number(genJson?.retryAfter) || 60000
          const until = Date.now() + retryAfter
          setCooldownUntil(until)
          setMessage('Rate limit exceeded — try again in a moment.')
        } else {
          setMessage(genJson?.message || 'Generation failed')
        }
        setLoading(false)
        return
      }

      const imageUrl = genJson.imageUrl
      setGenerated(imageUrl)

      // Auto-publish to feed
      const pubRes = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, prompt })
      })
      const pubJson = await pubRes.json()
      if (!pubRes.ok) {
        setMessage(pubJson?.message || 'Publish failed')
      } else {
        setMessage('Published to feed')
      }
    }catch(err){
      console.error(err)
      setMessage(String(err))
    }finally{
      setLoading(false)
    }
  }

  // Auto-hide non-persistent messages after a short delay
  useEffect(() => {
    if (!message) return
    const id = setTimeout(() => setMessage(null), 4500)
    return () => clearTimeout(id)
  }, [message])

  function Spinner({ size = 16 }){
    return (
      <svg width={size} height={size} viewBox="0 0 50 50" style={{display:'inline-block',verticalAlign:'middle'}}>
        <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 31.4">
          <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
        </circle>
      </svg>
    )
  }

  return (
    <main style={{padding:28}}>
      <div style={{textAlign:'center',paddingTop:12}}>
        <h1 style={{color:'var(--accent-b)',marginBottom:6}}>Create with Halo</h1>
        <div style={{color:'var(--muted)'}}>Generate AI-powered photos of yourself and your experiences</div>
      </div>

      <div style={{maxWidth:900,margin:'28px auto'}}>
        <label style={{display:'block',marginBottom:8,fontSize:13,color:'var(--muted)'}}>Upload a photo of yourself (optional)</label>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',border:'1px dashed rgba(255,255,255,0.06)',padding:18,borderRadius:12,background:'rgba(255,255,255,0.02)'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:18,marginBottom:6,color:'var(--muted)'}}>Drag & drop or</div>
            <label style={{display:'inline-block',padding:'8px 14px',borderRadius:8,background:'rgba(255,255,255,0.03)',cursor:'pointer'}}>
              Upload a photo
              <input type="file" accept="image/*" onChange={handleFile} style={{display:'none'}} />
            </label>
            {filePreview && <div style={{marginTop:12}}><img src={filePreview.url} alt="preview" style={{maxWidth:240,borderRadius:8}} /></div>}
          </div>
        </div>

        <div style={{marginTop:16}}>
          <label style={{display:'block',marginBottom:8,fontSize:13,color:'var(--muted)'}}>Describe the scene</label>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Me and my friends at a beach party during sunset, laughing and having fun..." style={{width:'100%',height:140,padding:14,borderRadius:12,background:'rgba(0,0,0,0.45)',border:'1px solid rgba(255,255,255,0.03)',color:'#fff',resize:'vertical'}} />
        </div>

        <div style={{marginTop:12,display:'flex',alignItems:'center',gap:12}}>
          <input id="consent" type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />
          <label htmlFor="consent" style={{fontSize:13,color:'var(--muted)'}}>I consent to uploading photos of myself and using them to generate images (required)</label>
        </div>

        <div style={{marginTop:18,display:'flex',justifyContent:'center'}}>
          <button onClick={handleGenerate} disabled={loading || Date.now() < cooldownUntil} style={{padding:'12px 34px',borderRadius:12,background:'linear-gradient(90deg,#a4508b,#f7368e)',color:'#fff',border:'none',fontWeight:700,boxShadow:'0 8px 28px rgba(167,67,140,0.18)',opacity: (loading || Date.now() < cooldownUntil) ? 0.6 : 1,display:'inline-flex',gap:10,alignItems:'center'}}>
            {loading ? <><Spinner size={18}/> <span style={{marginLeft:4}}>Generating…</span></> : (Date.now() < cooldownUntil ? `Try again in ${cooldownSec}s` : 'Generate Image')}
          </button>
        </div>

        {message && <div style={{marginTop:12,color:'var(--muted)',textAlign:'center'}}>{message}</div>}
        <Toast message={message} onClose={()=>setMessage(null)} />

        {generated && (
          <div style={{marginTop:20,background:'rgba(255,255,255,0.02)',padding:12,borderRadius:10,border:'1px solid rgba(255,255,255,0.03)'}}>
            <img src={generated} alt="generated" style={{width:'100%',borderRadius:8}} />
            <div style={{display:'flex',gap:12,marginTop:10}}>
              <button className="btn-ghost" onClick={()=>{ setGenerated(null); setMessage(null) }}>Regenerate</button>
              <button className="btn" style={{background:'linear-gradient(90deg,#06d6a0,#00c6ff)',color:'#fff'}} onClick={async()=>{
                if (!generated) return
                try{
                  const res = await fetch('/api/publish', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ imageUrl: generated, prompt }) })
                  const j = await res.json()
                  if (!res.ok) setMessage(j?.message || 'Publish failed')
                  else setMessage('Published to feed')
                }catch(e){ setMessage(String(e)) }
              }}>Post to Feed</button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

// manage cooldown countdown timer
function useCooldownTimer(cooldownUntil, setCooldownSec) {
  useEffect(() => {
    if (!cooldownUntil || Date.now() >= cooldownUntil) {
      setCooldownSec(0)
      return
    }
    const tick = () => {
      const rem = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
      setCooldownSec(rem)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [cooldownUntil, setCooldownSec])
}

