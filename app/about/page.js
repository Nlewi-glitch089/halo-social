import React from 'react'
import MaskedText from '../components/MaskedText'

export default function AboutPage(){
  return (
    <main>
      <section className="section-block container about-hero" style={{paddingTop:72, paddingBottom:72, textAlign:'center'}}>
        <h1 style={{margin:0, fontSize:42}}><MaskedText text="What We Do" size={42} weight={900} /></h1>
        <p style={{color:'#d0d7e6', marginTop:12, fontSize:16, maxWidth:820, marginLeft:'auto', marginRight:'auto'}}>Halo makes it easy to create beautiful, personal AI images while keeping your data private.</p>
      </section>
      
      <section className="section-block container" style={{paddingTop:36}}>
        <div className="feature-grid">
          <div className="feature-card card">
            <div className="card-title">Privacy First</div>
            <div className="card-body">Your photos never leave your control. We minimize retention and keep models sandboxed per-user.</div>
          </div>
          <div className="feature-card card">
            <div className="card-title">Simple Tools</div>
            <div className="card-body">Intuitive prompts, guided templates, and safe defaults mean great results with minimal effort.</div>
          </div>
          <div className="feature-card card">
            <div className="card-title">Community</div>
            <div className="card-body">Share creations, get feedback, and discover others' work in a welcoming space.</div>
          </div>
          <div className="feature-card card">
            <div className="card-title">Responsible AI</div>
            <div className="card-body">We continuously audit outputs and provide opt-outs and moderation controls.</div>
          </div>
        </div>
      </section>
    </main>
  )
}
