"use client"
import React from 'react'

export default function Toast({ message, onClose }){
  if (!message) return null
  return (
    <div style={{position:'fixed',top:16,right:16,zIndex:9999,maxWidth:320}}>
      <div style={{background:'rgba(0,0,0,0.8)',color:'#fff',padding:'10px 14px',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.4)',display:'flex',alignItems:'center',gap:12}} onClick={onClose}>
        <div style={{flex:1,fontSize:13,lineHeight:'1.2'}}>{message}</div>
        <button aria-label="Close" style={{background:'transparent',border:'none',color:'#fff',fontSize:18,opacity:0.85}}>×</button>
      </div>
    </div>
  )
}
