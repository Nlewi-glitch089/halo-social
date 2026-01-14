"use client"
import React from 'react'
import MaskedText from './components/MaskedText'
import Link from 'next/link'

function Section({ children, className, style }) {
  return <section className={`section-block container ${className || ''}`} style={style}>{children}</section>
}

export default function Page() {
  return (
    <main>
      <Section className="hero fade-up" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <h1 className="hero-title">
          <MaskedText text="Halo" className="brand-name" size={60} />
          <span className="hero-sub" style={{ display: 'block', fontSize: 18, fontWeight: 600 }}>Create & Share Your AI Memories</span>
        </h1>
        <p className="sub">
          Generate personalized images of you and your favorite people using privacy-first AI — share moments that spark real connection.
        </p>
        <p className="small-muted">No credit card required • Free to start</p>
        <img src="/hero-illustration.svg" alt="Halo illustration" className="hero-illustration" />
      </Section>

      {/* Stats removed per user request to free up space for CTA */}

      <Section className="fade-up final-cta" style={{ textAlign: 'center', paddingTop: 12, paddingBottom: 12 }}>
        <div className="final-cta-inner">
          <h2 style={{ fontSize: 44, marginBottom: 10 }}>Ready to Create Your First AI Memory?</h2>
          <p style={{ color: '#b9c3d8', marginBottom: 14 }}>Join thousands of creators sharing personalized AI moments with the people they love. Start for free, no credit card required.</p>
          <div className="cta"><Link href="/signup" className="btn-primary" style={{display:'inline-block',padding:'12px 20px',borderRadius:12,color:'#fff',textDecoration:'none'}}>Create Your Free Account →</Link></div>
        </div>
      </Section>
    </main>
  )
}

function Stat({ value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function FeatureCard({ title, body, iconColor = '#ff6ec7' }) {
  return (
    <div className="card">
      <div className="card-row">
        <div className="icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M12 2l2.39 4.85L19 9l-4 3.9L16.78 18 12 15.27 7.22 18 9 12.9 5 9l4.61-2.15L12 2z" fill="rgba(255,255,255,0.95)"/>
          </svg>
        </div>
        <div>
          <div className="card-title">{title}</div>
          <div className="card-body">{body}</div>
        </div>
      </div>
    </div>
  )
}

function Step({ number, title, body }) {
  return (
    <div className="step">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="num">{number}</div>
        <div>
          <div className="step-title">{title}</div>
          <div className="card-body" style={{ marginTop: 6 }}>{body}</div>
        </div>
      </div>
    </div>
  )
}
