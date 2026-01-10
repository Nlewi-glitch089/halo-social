"use client"
import React, { useState } from 'react'

export default function ProfilePage(){
  const [tab, setTab] = useState('posts')
  return (
    <main style={{padding:28}}>
      <div style={{maxWidth:980,margin:'12px auto'}}>
        <div style={{padding:22,borderRadius:12,background:'rgba(12,12,14,0.9)',border:'1px solid rgba(255,255,255,0.03)'}}>
          <div style={{display:'flex',gap:24,alignItems:'center'}}>
            <div style={{width:112,height:112,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{width:112,height:112,borderRadius:999,padding:6,background:'linear-gradient(90deg,#a4508b,#f7368e)'}}>
                <div style={{width:'100%',height:'100%',borderRadius:999,background:'rgba(10,10,10,0.95)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:40,fontWeight:700}}>N</div>
              </div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:22,fontWeight:800}}>Nakerra Lewis</div>
              <div style={{color:'var(--muted)',marginTop:6}}>@Nikki</div>
              <div style={{display:'flex',gap:32,marginTop:14,color:'var(--muted)'}}>
                <div style={{textAlign:'center'}}><div style={{fontWeight:800}}>0</div><div style={{fontSize:12}}>Posts</div></div>
                <div style={{textAlign:'center'}}><div style={{fontWeight:800}}>0</div><div style={{fontSize:12}}>Likes</div></div>
                <div style={{textAlign:'center'}}><div style={{fontWeight:800}}>0</div><div style={{fontSize:12}}>Following</div></div>
              </div>
              <div style={{marginTop:14}}><button style={{padding:'8px 14px',borderRadius:10,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.04)',color:'#fff',display:'inline-flex',alignItems:'center',gap:8}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Edit Profile</button></div>
            </div>
          </div>
        </div>

        <div style={{marginTop:22,borderTop:'1px solid rgba(255,255,255,0.03)',paddingTop:18}}>
          <div style={{display:'flex',gap:28,alignItems:'center'}}>
            <button onClick={()=>setTab('posts')} style={{background:'none',border:'none',padding:8,cursor:'pointer',fontWeight:600,borderBottom: tab==='posts' ? '3px solid #a4508b' : '3px solid transparent'}}>Posts</button>
            <button onClick={()=>setTab('saved')} style={{background:'none',border:'none',padding:8,cursor:'pointer',color: tab==='saved' ? '#fff' : 'var(--muted)',borderBottom: tab==='saved' ? '3px solid #a4508b' : '3px solid transparent'}}>Saved</button>
          </div>

          {tab === 'posts' ? (
            <div style={{textAlign:'center',paddingTop:48,color:'var(--muted)'}}>
              <div style={{fontSize:48,opacity:0.18}}>◻︎</div>
              <div style={{marginTop:8}}>No posts yet</div>
              <div style={{marginTop:6,color:'var(--muted)'}}>Create your first AI-powered memory!</div>
            </div>
          ) : (
            <div style={{textAlign:'center',paddingTop:54,color:'var(--muted)'}}>
              <div style={{fontSize:56,opacity:0.14}}>
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 3h12a2 2 0 0 1 2 2v14l-4-4H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{marginTop:10,fontSize:16}}>No saved posts yet</div>
              <div style={{marginTop:8,color:'var(--muted)'}}>Save posts you love to view them later</div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
