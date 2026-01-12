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
    // optimistic toggle like for current user
    setImages((list) => list.map(i => i.id === id ? { ...i, hearts: i.hearts + 1, likedByCurrent: true } : i))
    try {
      const res = await fetch(`/api/feed/${encodeURIComponent(id)}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Like failed')
      // reconcile with server response
      setImages((list) => list.map(i => i.id === id ? { ...data.item, likedByCurrent: !!data.liked } : i))
    } catch (err) {
      console.error(err)
      // rollback decrement if error
      setImages((list) => list.map(i => i.id === id ? { ...i, hearts: Math.max(0, i.hearts - 1), likedByCurrent: false } : i))
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',maxWidth:1100,margin:'0 auto'}}>
        <div>
          <h2 style={{margin:0}}>Feed</h2>
          <div style={{color:'var(--muted)',fontSize:13}}>See posts from the community</div>
        </div>
        <div>
          {/* Create link removed — page already has Create actions elsewhere */}
        </div>
      </div>

      <div style={{maxWidth:1100,margin:'18px auto',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:18}}>
        {images.length === 0 && !loading ? (
          <div style={{gridColumn:'1/-1',textAlign:'center',padding:48,color:'var(--muted)'}}>
            No posts yet — be the first to create something or check back later.
          </div>
        ) : images.map(img => (
          <div key={img.id} style={{background:'rgba(255,255,255,0.02)',borderRadius:10,overflow:'hidden',border:'1px solid rgba(255,255,255,0.03)'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,padding:10,background:'rgba(0,0,0,0.35)'}}>
              <a href={`/u/${img.author?.username || 'guest'}`} style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none',color:'inherit'}}>
                <div style={{width:40,height:40,borderRadius:999,padding:4,background:'linear-gradient(90deg,#a4508b,#f7368e)'}}>
                  <div style={{width:'100%',height:'100%',borderRadius:999,background:'rgba(10,10,10,0.95)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>{(img.author?.name||img.author?.username||'G').slice(0,1)}</div>
                </div>
                <div style={{display:'flex',flexDirection:'column'}}>
                  <div style={{fontSize:14,fontWeight:700}}>{img.author?.name || img.author?.username}</div>
                  <div style={{fontSize:12,color:'var(--muted)'}}>@{img.author?.username}</div>
                </div>
              </a>
              <div style={{marginLeft:'auto',fontSize:12,color:'var(--muted)'}}>{new Date(img.createdAt).toLocaleString()}</div>
            </div>
            <img src={img.imageUrl} alt={img.prompt} style={{width:'100%',display:'block'}} />
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:12}}>
              <div style={{color:'var(--muted)',fontSize:13}}>@{img.author?.username} {img.prompt}</div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <button className="btn-ghost" onClick={()=>handleHeart(img.id,img.hearts)}>♥ {img.hearts}</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div style={{textAlign:'center',marginTop:18}}>
          <button onClick={() => { setPage(p => { const np = p+1; load(np); return np }) }} disabled={loading} className="btn-ghost">{loading ? 'Loading...' : 'Load more'}</button>
        </div>
      )}
    </main>
  )
}
