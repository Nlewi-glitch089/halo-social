"use client"
import React from 'react'

const vars = {
  bg: 'linear-gradient(180deg, #0b0710 0%, #1b0f26 40%, #0d1b1a 100%)',
  heroGradient: 'linear-gradient(90deg,#ff6ec7 0%,#9b7cff 40%,#56f1d3 100%)',
  cardGradient: 'linear-gradient(135deg,#6f2bdc 0%,#ff6ec7 50%,#ff9a63 100%)',
  accent: '#ff6ec7',
  muted: '#9aa1b2',
}

function Section({ children, className, style }) {
  return <section className={`container ${className || ''}`} style={style}>{children}</section>
}

export default function Page() {
  return (
    <main>
      <Section className="hero" style={{ paddingTop: 96 }}>
        <h1>
          <span>Create & Share</span>
          <span className="gradient-text">Your AI Memories</span>
        </h1>
        <p className="sub">
          Generate stunning, personalized images of yourself with friends, family, and dream experiences using AI. Share authentic moments that spark real connections.
        </p>
        <p className="small-muted">No credit card required • Free to start</p>
      </Section>

      <Section style={{ paddingTop: 24 }}>
        <div className="mosaic">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="tile">
              <div className="thumb" />
            </div>
          ))}
        </div>
      </Section>

      <Section style={{ borderTop: '1px solid rgba(255,255,255,0.02)', background: 'transparent' }}>
        <div className="stats">
          <Stat value="10K+" label="AI Images Created" />
          <Stat value="5K+" label="Active Users" />
          <Stat value="99%" label="Satisfaction Rate" />
          <Stat value="100%" label="Free Forever" />
        </div>
      </Section>

      <Section>
        <h2 style={{ textAlign: 'center', fontSize: 36, marginBottom: 18 }}><span>Why </span><span style={{ background: vars.heroGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Halo</span> is Different</h2>
        <p style={{ textAlign: 'center', color: '#b9c3d8', maxWidth: 820, margin: '0 auto 32px' }}>Unlike generic AI art generators or traditional social media, Halo creates personalized images featuring you and your loved ones.</p>

        <div className="features">
          <FeatureCard title="Personal AI Generation" body="Upload your photo once, then create unlimited personalized images. No more generic AI art—these images feature YOU." iconColor="#d47eff" />
          <FeatureCard title="Made for Sharing" body="Built for connection. Share your AI-generated memories with friends and family in a beautiful, distraction-free feed." iconColor="#ff8a6a" />
          <FeatureCard title="Instant Results" body="See yourself on a tropical beach, at the Eiffel Tower, or in your dream wedding in seconds." iconColor="#4ee1f0" />
          <FeatureCard title="Privacy First" body="Your photos, your control. No ads, no data selling, no creepy tracking." iconColor="#8f7bff" />
          <FeatureCard title="Real Connections" body="Move beyond perfect poses and filters. Create moments that spark genuine conversations and laughter." iconColor="#ff6ec7" />
          <FeatureCard title="Endless Creativity" body="From recreating childhood memories to visualizing future dreams, explore infinite possibilities with AI." iconColor="#2ee59b" />
        </div>
      </Section>

      <Section style={{ textAlign: 'center', paddingTop: 32 }}>
        <h2 style={{ fontSize: 36, marginBottom: 8 }}>Get Started in <span style={{ background: vars.heroGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>3 Simple Steps</span></h2>
        <p style={{ color: '#b9c3d8' }}>No technical skills required. Anyone can create stunning AI memories.</p>

        <div className="steps">
          <Step number={1} title="Upload Your Photo" body="Share a photo of yourself or your loved ones. Our AI learns your features to create personalized generations." />
          <Step number={2} title="Describe Your Vision" body="Type what you want to see — be creative!" />
          <Step number={3} title="Share & Connect" body="Post your AI creation to your feed. Watch friends react, comment, and create their own memories." />
        </div>
      </Section>

      <Section style={{ textAlign: 'center', paddingBottom: 96 }}>
        <h2 style={{ fontSize: 44, marginBottom: 12 }}>Ready to Create Your First <span style={{ background: vars.heroGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>AI Memory?</span></h2>
        <p style={{ color: '#b9c3d8', marginBottom: 28 }}>Join thousands of creators sharing personalized AI moments with the people they love. Start for free, no credit card required.</p>
        <div className="cta"><button className="btn-primary">Create Your Free Account →</button></div>
      </Section>
    </main>
  )
}

function Stat({ value, label }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 120 }}>
      <div style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(90deg,#ff6ec7,#9b7cff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{value}</div>
      <div style={{ color: '#9fb0d0', fontSize: 13 }}>{label}</div>
    </div>
  )
}

function FeatureCard({ title, body, iconColor = '#ff6ec7' }) {
  return (
    <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.02)', boxShadow: '0 6px 30px rgba(3,6,15,0.6)', minHeight: 140 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: `linear-gradient(135deg, ${iconColor}, rgba(255,255,255,0.06))` }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
          <div style={{ color: '#9fb0d0', marginTop: 8 }}>{body}</div>
        </div>
      </div>
    </div>
  )
}

function Step({ number, title, body }) {
  return (
    <div style={{ width: 260, padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(90deg,#ff6ec7,#ff9a63)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>{number}</div>
        <div>
          <div style={{ fontWeight: 800 }}>{title}</div>
          <div style={{ color: '#9fb0d0', marginTop: 6 }}>{body}</div>
        </div>
      </div>
    </div>
  )
}
