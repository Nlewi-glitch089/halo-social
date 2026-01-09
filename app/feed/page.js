"use client"
import React, { useEffect, useState } from 'react'

export default function FeedPage() {
  const [images, setImages] = useState([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  async function load(pageToLoad = 1) {
    setLoading(true)
    try {
      const res = await fetch(`/api/feed?page=${pageToLoad}&limit=${limit}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to load feed')
      if (pageToLoad === 1) setImages(data.images)
      else setImages((p) => [...p, ...data.images])
      setHasMore(pageToLoad < data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [])

  async function handleHeart(id, current) {
    const next = current + 1
    // optimistic
    setImages((list) => list.map(i => i.id === id ? { ...i, hearts: next } : i))
    try {
      const res = await fetch('/api/feed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, hearts: next })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Update failed')
    } catch (err) {
      console.error(err)
      // rollback
      setImages((list) => list.map(i => i.id === id ? { ...i, hearts: current } : i))
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Halo — Feed</h1>
      <div>
        {images.map(img => (
          <div key={img.id} style={{ marginBottom: 16 }}>
            <img src={img.imageUrl} alt={img.prompt} style={{ maxWidth: 320 }} />
            <p>{img.prompt}</p>
            <p>Hearts: {img.hearts}</p>
            <button onClick={() => handleHeart(img.id, img.hearts)}>♥</button>
            <small> {new Date(img.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </div>
      {hasMore && <button onClick={() => { setPage(p => { const np = p+1; load(np); return np }) }} disabled={loading}>{loading ? 'Loading...' : 'Load more'}</button>}
    </main>
  )
}
