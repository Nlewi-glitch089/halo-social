"use client"
import React, { useState } from 'react'

export default function Page() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState(null)
  const [error, setError] = useState(null)

  async function handleGenerate() {
    setError(null)
    if (!prompt || typeof prompt !== 'string') return setError('Prompt is required')
    setLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Generation failed')
      setImage(data.imageUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePublish() {
    if (!image) return
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: image, prompt })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Publish failed')
      alert('Published!')
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Halo — Generate Image</h1>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} cols={60} placeholder="Describe an image..." />
      <div style={{ marginTop: 8 }}>
        <button onClick={handleGenerate} disabled={loading}>{loading ? 'Generating...' : 'Generate'}</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {image && (
        <div style={{ marginTop: 16 }}>
          <h3>Generated</h3>
          <img src={image} alt="generated" style={{ maxWidth: 512 }} />
          <p>{prompt}</p>
          <button onClick={handlePublish}>Publish</button>
        </div>
      )}
    </main>
  )
}
