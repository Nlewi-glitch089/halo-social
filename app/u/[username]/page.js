"use client"
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function PublicProfilePage(){
  const { username } = useParams()
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [isFriend, setIsFriend] = useState(false)
  const [profile, setProfile] = useState(null)
  const [counts, setCounts] = useState({ posts: 0, likes: 0, friends: 0 })

  useEffect(()=>{
    if(!username) return
    setLoading(true)
    // fetch user's posts
    fetch(`/api/feed?username=${encodeURIComponent(username)}`)
      .then(r=>r.json())
      .then(j=>{
        setPosts(j.images || [])
        if((j.images||[]).length>0){
          setProfile(j.images[0].author)
        } else {
          setProfile({ name: username.replace(/[_\-]/g,' '), username })
        }
      })
      .catch(()=>{})
      .finally(()=>setLoading(false))

    // fetch profile metadata (counts + friend status)
    fetch(`/api/users/${encodeURIComponent(username)}`, { credentials: 'include' })
      .then(async (r) => {
        const j = await r.json().catch(()=>({}))
        if (!r.ok) return
        if (j.profile) {
          setIsFriend(Boolean(j.profile.isFriend))
          setCounts({ posts: j.profile.posts || 0, likes: j.profile.likes || 0, friends: j.profile.friends || 0 })
          setProfile(p => ({ ...(p||{}), bio: j.profile.bio || p?.bio, name: j.profile.name || p?.name }))
        }
      }).catch(()=>{})
  },[username])

  async function toggleFriend(){
    try{
      const res = await fetch('/api/friends/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }), credentials: 'include' })
      const j = await res.json().catch(()=>({}))
      if (res.status === 401) {
        // Not authenticated — redirect to signin
        router.push('/signin')
        return
      }
      if (res.ok) {
        setIsFriend(Boolean(j.added))
        // update friends count locally
        setCounts(c => ({ ...c, friends: j.friends ? j.friends.length : (c.friends + (j.added ? 1 : -1)) }))
      }
    }catch(e){}
  }

  return (
    <main style={{padding:28}}>
      <div style={{maxWidth:980,margin:'12px auto'}}>
        <div style={{padding:22,borderRadius:12,background:'rgba(12,12,14,0.9)',border:'1px solid rgba(255,255,255,0.03)'}}>
          <div style={{display:'flex',gap:24,alignItems:'center'}}>
            <div style={{width:112,height:112,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{width:112,height:112,borderRadius:999,padding:6,background:'linear-gradient(90deg,#a4508b,#f7368e)'}}>
                <div style={{width:'100%',height:'100%',borderRadius:999,background:'rgba(10,10,10,0.95)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:40,fontWeight:700}}>{(profile?.name||profile?.username||'G').slice(0,1)}</div>
              </div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:22,fontWeight:800}}>{profile?.name || username}</div>
              <div style={{color:'var(--muted)',marginTop:6}}>@{username}</div>
              <div style={{display:'flex',gap:32,marginTop:14,color:'var(--muted)'}}>
                <div style={{textAlign:'center'}}><div style={{fontWeight:800}}>{counts.posts || posts.length}</div><div style={{fontSize:12}}>Posts</div></div>
                <div style={{textAlign:'center'}}><div style={{fontWeight:800}}>{counts.likes}</div><div style={{fontSize:12}}>Likes</div></div>
                <div style={{textAlign:'center'}}><div style={{fontWeight:800}}>{counts.friends}</div><div style={{fontSize:12}}>Friends</div></div>
              </div>
              <div style={{marginTop:14}}>
                <button onClick={toggleFriend} style={{padding:'8px 14px',borderRadius:10,background:isFriend? 'linear-gradient(90deg,#06d6a0,#00c6ff)' : 'linear-gradient(90deg,#a4508b,#f7368e)',border:'none',color:'#fff'}}>
                  {isFriend ? 'Friends' : 'Add Friend'}
                </button>
                <button onClick={()=>router.back()} style={{marginLeft:12,padding:'8px 14px',borderRadius:10,background:'transparent',border:'1px solid rgba(255,255,255,0.06)',color:'#fff'}}>Back to Feed</button>
              </div>
            </div>
          </div>
        </div>

        <div style={{marginTop:22,borderTop:'1px solid rgba(255,255,255,0.03)',paddingTop:18}}>
          <div style={{display:'flex',gap:28,alignItems:'center'}}>
            <div style={{paddingBottom:8,borderBottom:'3px solid #a4508b',fontWeight:600}}>Posts</div>
            <div style={{color:'var(--muted)'}}>Saved</div>
          </div>

          <div style={{marginTop:18,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
            {loading ? (
              <div>Loading…</div>
            ) : posts.length === 0 ? (
              <div style={{gridColumn:'1/-1',textAlign:'center',padding:48,color:'var(--muted)'}}>No posts yet</div>
            ) : posts.map(p => (
              <div key={p.id} style={{background:'rgba(255,255,255,0.02)',borderRadius:10,overflow:'hidden',border:'1px solid rgba(255,255,255,0.03)'}}>
                <img src={p.imageUrl} alt={p.prompt} style={{width:'100%',display:'block'}} />
                <div style={{padding:12}}>
                  <div style={{fontSize:13,color:'var(--muted)'}}>@{p.author?.username} {p.prompt}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
