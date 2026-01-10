"use client"
import React, { useState } from 'react'

export default function CreatePage(){
  const [filePreview, setFilePreview] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [generated, setGenerated] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleFile(e){
    const f = e.target.files && e.target.files[0]
    if(!f) return setFilePreview(null)
    const url = URL.createObjectURL(f)
    setFilePreview(url)
  }

  async function handleGenerate(){
    setLoading(true)
    // placeholder: simulate generation
    await new Promise(r=>setTimeout(r,900))
    setGenerated(filePreview || '/placeholder-image.jpg')
    setLoading(false)
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
            {filePreview && <div style={{marginTop:12}}><img src={filePreview} alt="preview" style={{maxWidth:240,borderRadius:8}} /></div>}
          </div>
        </div>

        <div style={{marginTop:16}}>
          <label style={{display:'block',marginBottom:8,fontSize:13,color:'var(--muted)'}}>Describe the scene</label>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Me and my friends at a beach party during sunset, laughing and having fun..." style={{width:'100%',height:140,padding:14,borderRadius:12,background:'rgba(0,0,0,0.45)',border:'1px solid rgba(255,255,255,0.03)',color:'#fff',resize:'vertical'}} />
        </div>

        <div style={{marginTop:18,display:'flex',justifyContent:'center'}}>
          <button onClick={handleGenerate} disabled={loading} style={{padding:'14px 36px',borderRadius:14,background:'linear-gradient(90deg,#a4508b,#f7368e)',color:'#fff',border:'none',fontWeight:700,boxShadow:'0 6px 18px rgba(164,80,139,0.12)'}}>
            {loading ? 'Generating…' : 'Generate Image'}
          </button>
        </div>

        {generated && (
          <div style={{marginTop:20,background:'rgba(255,255,255,0.02)',padding:12,borderRadius:10,border:'1px solid rgba(255,255,255,0.03)'}}>
            <img src={generated} alt="generated" style={{width:'100%',borderRadius:8}} />
            <div style={{display:'flex',gap:12,marginTop:10}}>
              <button className="btn-ghost">Regenerate</button>
              <button className="btn" style={{background:'linear-gradient(90deg,#06d6a0,#00c6ff)',color:'#fff'}}>Post to Feed</button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
